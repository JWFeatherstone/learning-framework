import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"
import { directories, promptFor, readEvent } from "./harness"

// Lines trimmed from real Claude Code and Cursor runs.
const claude = {
  hook: `{"type":"system","subtype":"hook_started","hook_id":"h1","session_id":"s1"}`,
  init: `{"type":"system","subtype":"init","cwd":"/repo","session_id":"s1","tools":["Glob","Grep","Read"],"model":"claude-opus-5-5","permissionMode":"dontAsk","apiKeySource":"none"}`,
  tool: `{"type":"assistant","message":{"model":"claude-opus-5-5","content":[{"type":"thinking","thinking":""},{"type":"tool_use","id":"t1","name":"Read","input":{"file_path":"/repo/README.md"}}]},"session_id":"s1"}`,
  text: `{"type":"assistant","message":{"content":[{"type":"text","text":"# Flux"}]},"session_id":"s1"}`,
  result: `{"type":"result","subtype":"success","is_error":false,"result":"# Flux","session_id":"s1","usage":{"input_tokens":4,"cache_creation_input_tokens":4552,"cache_read_input_tokens":12799,"output_tokens":20}}`,
}
const cursor = {
  init: `{"type":"system","subtype":"init","apiKeySource":"login","cwd":"/repo","session_id":"c6","model":"Auto","permissionMode":"default"}`,
  thinking: `{"type":"thinking","subtype":"delta","text":"I need to read README","session_id":"c6","timestamp_ms":1793580549953}`,
  read: `{"type":"tool_call","subtype":"started","call_id":"t1","tool_call":{"readToolCall":{"args":{"path":"/repo/README.md","limit":20}},"hookAdditionalContexts":[],"toolCallId":"t1","startedAtMs":"1793580550000"},"session_id":"c6"}`,
  lookup: `{"type":"tool_call","subtype":"started","call_id":"t2","tool_call":{"getMcpToolsToolCall":{"args":{"server":"cursor","toolName":"WebSearch","toolCallId":"t2"}},"hookAdditionalContexts":[],"toolCallId":"t2"},"session_id":"c6"}`,
  grep: `{"type":"tool_call","subtype":"started","call_id":"t3","tool_call":{"grepToolCall":{"args":{"pattern":"def ","path":"/repo/src/kernels.py","outputMode":"count","toolCallId":"t3"}},"toolCallId":"t3"},"session_id":"c6"}`,
  search: `{"type":"tool_call","subtype":"started","call_id":"t4","tool_call":{"webSearchToolCall":{"args":{"searchTerm":"Train discrete choice publisher","toolCallId":"t4"}},"toolCallId":"t4"},"session_id":"c6"}`,
  completed: `{"type":"tool_call","subtype":"completed","call_id":"t1","tool_call":{"readToolCall":{"args":{"path":"/repo/README.md"},"result":{"success":{"content":"# Flux"}}}},"session_id":"c6"}`,
  shell: `{"type":"tool_call","subtype":"started","call_id":"t5","tool_call":{"shellToolCall":{"args":{"command":"cd /repo && ls docs"}},"toolCallId":"t5"},"session_id":"c6"}`,
  result: `{"type":"result","subtype":"success","duration_ms":8724,"duration_api_ms":8724,"is_error":false,"result":"Flux","session_id":"c6","request_id":"r1","usage":{"inputTokens":20,"outputTokens":4918,"cacheReadTokens":368657,"cacheWriteTokens":19396}}`,
  oddUsage: `{"type":"result","subtype":"success","is_error":false,"result":"Flux","session_id":"c6","usage":{"tokens":5}}`,
}

describe("readEvent", () => {
  it("reads Claude Code's start, tool calls and result, and ignores the rest", () => {
    expect(readEvent(claude.hook)).toEqual([])
    expect(readEvent(claude.init)).toEqual([{ kind: "start", session: "s1", model: "claude-opus-5-5" }])
    expect(readEvent(claude.tool)).toEqual([{ kind: "progress", line: "Read /repo/README.md" }])
    expect(readEvent(claude.text)).toEqual([])
    expect(readEvent(claude.result)).toEqual([
      { kind: "result", ok: true, text: "# Flux", session: "s1", usage: { inputTokens: 17355, outputTokens: 20 } },
    ])
  })

  it("reads Cursor's start, tool calls and result, and skips its schema lookups and thinking", () => {
    expect(readEvent(cursor.init)).toEqual([{ kind: "start", session: "c6", model: "Auto" }])
    expect(readEvent(cursor.thinking)).toEqual([])
    expect(readEvent(cursor.read)).toEqual([{ kind: "progress", line: "read /repo/README.md" }])
    expect(readEvent(cursor.lookup)).toEqual([])
    expect(readEvent(cursor.grep)).toEqual([{ kind: "progress", line: "grep def " }])
    expect(readEvent(cursor.search)).toEqual([{ kind: "progress", line: "webSearch Train discrete choice publisher" }])
    expect(readEvent(cursor.shell)).toEqual([{ kind: "progress", line: "shell cd /repo && ls docs" }])
    expect(readEvent(cursor.completed)).toEqual([])
    expect(readEvent(cursor.result)).toEqual([
      { kind: "result", ok: true, text: "Flux", session: "c6", usage: { inputTokens: 388073, outputTokens: 4918 } },
    ])
  })

  it("keeps a reply whose token count it cannot read", () => {
    expect(readEvent(cursor.oddUsage)).toEqual([{ kind: "result", ok: true, text: "Flux", session: "c6", usage: undefined }])
  })

  it("treats a line that is not JSON as nothing", () => {
    expect(readEvent("Warning: something on stdout")).toEqual([])
  })
})

describe("promptFor", () => {
  const messages = [
    { role: "system" as const, content: "Instructions" },
    { role: "user" as const, content: "Inputs" },
    { role: "assistant" as const, content: "Not JSON" },
    { role: "user" as const, content: "That did not validate" },
  ]

  it("sends the whole conversation on a fresh run", () => {
    expect(promptFor(messages.slice(0, 2))).toBe("Instructions\n\nInputs")
  })

  it("sends only what follows the harness's last reply when resuming", () => {
    expect(promptFor(messages, "s1")).toBe("That did not validate")
    expect(promptFor(messages.slice(0, 2), "s1")).toBe("Instructions\n\nInputs")
  })
})

describe("directories", () => {
  const dir = mkdtempSync(join(tmpdir(), "lf-harness-"))
  writeFileSync(join(dir, "file.txt"), "")
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it("keeps the sources that are directories on this machine", () => {
    expect(directories([dir, join(dir, "file.txt"), join(dir, "missing"), "https://example.org"])).toEqual([dir])
    expect(directories(undefined)).toEqual([])
  })
})
