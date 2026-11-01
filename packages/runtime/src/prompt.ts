import { readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import type { Message } from "./provider"

export const JOBS = [
  "plan.questions",
  "plan.propose",
  "plan.revise",
  "generate.reading",
  "generate.exercise",
  "generate.test",
  "tutor",
  "grade",
] as const
export type Job = (typeof JOBS)[number]

const PROMPTS = join(import.meta.dirname, "../prompts")
const cache = new Map<Job, { text: string; version: number }>()

function load(job: Job) {
  let entry = cache.get(job)
  if (!entry) {
    const text = readFileSync(join(PROMPTS, `${job}.md`), "utf8")
    entry = { text, version: text.split("\n").length }
    cache.set(job, entry)
  }
  return entry
}

export interface Rendered {
  system: string
  user: string
  /** For provenance: "<job>@<version>". */
  prompt: string
}

const fence = (value: unknown) => "```json\n" + JSON.stringify(value, null, 2) + "\n```"

/** A job's system text, and a user message carrying its name, inputs and (for JSON jobs) the output schema. */
export function render(job: Job, inputs: unknown, schema?: z.ZodType): Rendered {
  const { text, version } = load(job)
  const parts = [`# job: ${job}`, "## Inputs", fence(inputs)]
  if (schema) parts.push("## Output schema", fence(z.toJSONSchema(schema)))
  return { system: text, user: parts.join("\n\n"), prompt: `${job}@${version}` }
}

export const asMessages = (rendered: Rendered, history: Message[] = []): Message[] => [
  { role: "system", content: rendered.system },
  { role: "user", content: rendered.user },
  ...history,
]

/** The job and inputs back out of a rendered user message; the fake provider reads them. */
export function parseUserMessage(content: string): { job: Job; inputs: unknown } {
  const job = /^# job: (\S+)/m.exec(content)?.[1] as Job | undefined
  const block = /## Inputs\n\n```json\n([\s\S]*?)\n```/.exec(content)?.[1]
  if (!job || block === undefined) throw new Error("not a rendered job message")
  return { job, inputs: JSON.parse(block) }
}

/** The first JSON object or array in a model reply, fenced or bare. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(text)?.[1]
  const candidate = fenced ?? text.slice(Math.min(...[text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0)))
  try {
    return JSON.parse(candidate)
  } catch (cause) {
    throw new Error(`The model did not return JSON: ${(cause as Error).message}\n${text.slice(0, 300)}`)
  }
}
