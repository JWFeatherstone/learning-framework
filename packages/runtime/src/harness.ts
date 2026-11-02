import { spawn } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { createInterface } from "node:readline"
import { z } from "zod"
import type { Completion, Message, Provider } from "./provider"

// Agent harnesses run headless as the provider for the writing jobs. They read the learner's sources
// and the web with their own tools, read-only, and reply with text the runtime validates and writes,
// so the runtime stays the only writer. Claude Code and Cursor share most of their event stream.

/** What the harness has not seen: the whole conversation on a fresh run; on a resumed one, only what
    follows its last reply. */
export function promptFor(messages: Message[], session?: string): string {
  const from = session ? messages.findLastIndex((message) => message.role === "assistant") + 1 : 0
  return messages
    .slice(from)
    .map((message) => message.content)
    .join("\n\n")
}

/** The directories among the sources, `~` expanded. A site reaches the harness through the prompt. */
export function directories(sources: string[] = []): string[] {
  return sources
    .map((source) => source.trim().replace(/^~(?=\/|$)/, homedir()))
    .filter((path) => existsSync(path) && statSync(path).isDirectory())
}

const Fields = z.record(z.string(), z.unknown())

const Init = z.object({
  type: z.literal("system"),
  subtype: z.literal("init"),
  session_id: z.string(),
  model: z.string().optional(),
})

// Claude Code reports a tool call as a tool_use block in an assistant message.
const Assistant = z.object({
  type: z.literal("assistant"),
  message: z.object({
    content: z.array(z.object({ type: z.string(), name: z.string().optional(), input: Fields.optional() })),
  }),
})

// Cursor reports one as its own event, keyed by the tool ({ readToolCall: { args } }) beside bookkeeping
// fields. Its lookups of a tool's schema (getMcpToolsToolCall) are not progress.
const ToolCall = z.object({ type: z.literal("tool_call"), subtype: z.literal("started"), tool_call: Fields })
const CursorTool = z.object({ args: Fields.optional() })

// Each harness counts tokens in its own shape; an unknown one costs the count, not the reply.
const ClaudeUsage = z
  .object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    cache_creation_input_tokens: z.number().default(0),
    cache_read_input_tokens: z.number().default(0),
  })
  .transform((usage) => ({
    inputTokens: usage.input_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens,
    outputTokens: usage.output_tokens,
  }))
const CursorUsage = z
  .object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    cacheReadTokens: z.number().default(0),
    cacheWriteTokens: z.number().default(0),
  })
  .transform((usage) => ({
    inputTokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
    outputTokens: usage.outputTokens,
  }))

const Result = z.object({
  type: z.literal("result"),
  is_error: z.boolean(),
  result: z.string().default(""),
  session_id: z.string(),
  usage: z.union([ClaudeUsage, CursorUsage]).optional().catch(undefined),
})

export type HarnessEvent =
  | { kind: "start"; session: string; model?: string }
  | { kind: "progress"; line: string }
  | { kind: "result"; ok: boolean; text: string; session: string; usage?: Completion["usage"] }

// The most telling argument first: what a search looked for, then where a read looked.
const DETAIL = ["pattern", "globPattern", "searchTerm", "query", "url", "command", "file_path", "path"]

const describe = (tool: string, args: Record<string, unknown> = {}) => {
  const detail = DETAIL.map((key) => args[key]).find((value) => typeof value === "string")
  return typeof detail === "string" ? `${tool} ${detail.slice(0, 120)}` : tool
}

/** One line of stream-json output as the events the runtime uses; any other line is none. */
export function readEvent(line: string): HarnessEvent[] {
  let data: unknown
  try {
    data = JSON.parse(line)
  } catch {
    return []
  }
  const init = Init.safeParse(data)
  if (init.success) return [{ kind: "start", session: init.data.session_id, model: init.data.model }]
  const assistant = Assistant.safeParse(data)
  if (assistant.success) {
    return assistant.data.message.content.flatMap((block) =>
      block.type === "tool_use" && block.name ? [{ kind: "progress" as const, line: describe(block.name, block.input) }] : [],
    )
  }
  const call = ToolCall.safeParse(data)
  if (call.success) {
    return Object.entries(call.data.tool_call).flatMap(([key, value]) => {
      const tool = CursorTool.safeParse(value)
      if (!key.endsWith("ToolCall") || key === "getMcpToolsToolCall" || !tool.success) return []
      return [{ kind: "progress" as const, line: describe(key.replace(/ToolCall$/, ""), tool.data.args) }]
    })
  }
  const result = Result.safeParse(data)
  if (result.success) {
    const { is_error, result: text, session_id, usage } = result.data
    return [{ kind: "result", ok: !is_error, text, session: session_id, usage }]
  }
  return []
}

/** Runs a harness to its result, reporting each tool call. The prompt goes on stdin when `input` is given. */
async function run(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  input: string | undefined,
  onProgress: ((line: string) => void) | undefined,
): Promise<Completion> {
  const child = spawn(command, args, { cwd, env })
  const exited = new Promise<{ code: number | null; error?: Error }>((resolve) => {
    child.on("error", (error) => resolve({ code: null, error }))
    child.on("close", (code) => resolve({ code }))
  })
  let stderr = ""
  child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()))
  // A harness that exits before reading its prompt breaks the pipe; its exit reports why.
  child.stdin.on("error", () => {})
  child.stdin.end(input)

  let model: string | undefined
  let result: Extract<HarnessEvent, { kind: "result" }> | undefined
  for await (const line of createInterface({ input: child.stdout })) {
    for (const event of readEvent(line)) {
      if (event.kind === "start") model = event.model
      else if (event.kind === "progress") onProgress?.(event.line.replace(`${cwd}/`, ""))
      else result = event
    }
  }
  const { code, error } = await exited
  if (error) throw (error as NodeJS.ErrnoException).code === "ENOENT" ? new Error(`${command} is not on the PATH`) : error
  if (!result?.ok) throw new Error(`${command} failed (exit ${code}): ${(result?.text || stderr).trim().slice(0, 400)}`)
  return { text: result.text, session: result.session, model, usage: result.usage }
}

type Launch = (
  prompt: string,
  dirs: string[],
  session: string | undefined,
  onProgress: ((line: string) => void) | undefined,
) => Promise<Completion>

function harness(name: string, model: string | undefined, launch: Launch): Provider {
  const complete: Provider["complete"] = ({ messages, sources, session, onProgress }) =>
    launch(promptFor(messages, session), directories(sources), session, onProgress)
  return {
    name,
    // Unset, the harness's own default; each reply names the model that answered.
    model: model ?? "default",
    complete,
    async *stream(options) {
      yield (await complete(options)).text
    },
  }
}

const READ_ONLY = "Read,Grep,Glob,WebSearch,WebFetch"

/** Claude Code, signed in as the user. Only the built-in tools that read files and the web; no MCP
    servers or skills, which also keeps its context small. */
export function claudeCodeProvider(model?: string): Provider {
  return harness("claude-code", model, (prompt, [cwd = tmpdir(), ...more], session, onProgress) => {
    const args = [
      ...["-p", "--output-format", "stream-json", "--verbose"],
      ...["--tools", READ_ONLY, "--allowedTools", READ_ONLY, "--permission-mode", "dontAsk"],
      ...["--strict-mcp-config", "--disable-slash-commands"],
      ...(model ? ["--model", model] : []),
      ...more.flatMap((dir) => ["--add-dir", dir]),
      ...(session ? ["--resume", session] : []),
    ]
    // Without the key in its environment it uses the signed-in Claude account, not the API key.
    const env = { ...process.env }
    delete env.ANTHROPIC_API_KEY
    return run("claude", args, cwd, env, prompt, onProgress)
  })
}

/** Cursor's agent, signed in as the user, in ask mode: no edit tools, and it declines writes, but it
    runs shell commands it judges read-only (find, rg, head), outside the workspace too. No --force, so
    anything it would ask about is refused, web search included unless the user's Cursor CLI config sets
    autoAcceptWebSearch. Claude Code's tool list is the stricter guarantee. */
export function cursorProvider(model?: string): Provider {
  return harness("cursor", model, (prompt, [workspace = tmpdir(), ...more], session, onProgress) => {
    const args = [
      ...["-p", "--output-format", "stream-json", "--mode", "ask", "--trust", "--workspace", workspace],
      ...more.flatMap((dir) => ["--add-dir", dir]),
      ...(model ? ["--model", model] : []),
      ...(session ? ["--resume", session] : []),
      prompt,
    ]
    return run("cursor-agent", args, workspace, process.env, undefined, onProgress)
  })
}
