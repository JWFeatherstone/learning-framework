import type {
  Attempt,
  Intake,
  IntakeAnswer,
  IntakeQuestion,
  Issue,
  ModuleFrontmatter,
  Outcome,
  Plan,
  PlanOutput,
  Progress,
  ReferenceFrontmatter,
  Revision,
  Session,
  Topic,
} from "@lf/contracts"
import { useCallback, useEffect, useState } from "react"

export interface TopicSummary {
  id: string
  title: string
  created: string
  units: number
}

export interface TopicDetail {
  topic: Topic
  plan: Plan
  progress: Progress
  references: ReferenceFrontmatter[]
  revisions: { id: string; revision: Revision }[]
  sessions: Session[]
  issues: Issue[]
}

export interface Module {
  frontmatter: ModuleFrontmatter
  body: string
}

export interface Turn {
  role: "tutor" | "learner"
  text: string
}

export interface LoadedSession {
  session: Session
  turns: Turn[]
  attempt?: Attempt
  outcome?: Outcome
}

export interface Health {
  provider: string
  model: string
}

export interface ProposedRevision {
  id: string
  revision: Revision
}

/** Something read from the server: not asked for, on its way, there, or failed. */
export type Resource<T> =
  | { state: "loading" }
  | { state: "ready"; value: T; reload: () => void }
  | { state: "error"; error: Error; retry: () => void }

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export const getJson = <T>(path: string) => fetch(`/api${path}`).then((response) => parse<T>(response))

export const postJson = <T>(path: string, body?: unknown) =>
  fetch(`/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((response) => parse<T>(response))

/** Posts, then yields the text deltas of a server-sent stream until the server says done. */
export async function* postStream(path: string, body: unknown): AsyncGenerator<string> {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok || !response.body) throw new Error((await response.text()) || response.statusText)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) return
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf("\n\n")
    while (boundary >= 0) {
      const event = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
      if (data) {
        const parsed = JSON.parse(data) as { delta?: string; error?: string; done?: boolean }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.delta) yield parsed.delta
        if (parsed.done) return
      }
      boundary = buffer.indexOf("\n\n")
    }
  }
}

/** One fetch per path; the hook owns loading, errors, retry and reload after a write. */
export function useApi<T>(path: string): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({ state: "loading" })
  const [attempt, setAttempt] = useState(0)
  const again = useCallback(() => setAttempt((n) => n + 1), [])
  useEffect(() => {
    let cancelled = false
    setResource((now) => (now.state === "ready" ? now : { state: "loading" }))
    getJson<T>(path)
      .then((value) => !cancelled && setResource({ state: "ready", value, reload: again }))
      .catch((error: Error) => {
        console.error(error)
        if (!cancelled) setResource({ state: "error", error, retry: again })
      })
    return () => {
      cancelled = true
    }
  }, [path, attempt, again])
  return resource
}

export const api = {
  questions: (intake: Intake) => postJson<{ questions: IntakeQuestion[] }>("/wizard/questions", { intake }),
  propose: (intake: Intake, answers: IntakeAnswer[], previous?: PlanOutput, comments?: string) =>
    postJson<{ plan: PlanOutput }>("/wizard/propose", { intake, answers, previous, comments }),
  createTopic: (intake: Intake, answers: IntakeAnswer[], plan: PlanOutput) =>
    postJson<{ id: string }>("/topics", { intake, answers, plan }),
  generate: (slug: string, unit: string, kind: string) =>
    postJson<{ module: Module; issues: Issue[] }>(`/topics/${slug}/modules/${unit}/${kind}/generate`),
  markComplete: (slug: string, unit: string, module: string) =>
    postJson<Progress>(`/topics/${slug}/progress`, { unit, module, state: "complete" }),
  startSession: (slug: string, unit: string) => postJson<LoadedSession>(`/topics/${slug}/units/${unit}/sessions`),
  turn: (slug: string, sessionId: string, text: string) => postStream(`/topics/${slug}/sessions/${sessionId}/turns`, { text }),
  endSession: (slug: string, sessionId: string) =>
    postJson<{ outcome: Outcome; revision: ProposedRevision | null }>(`/topics/${slug}/sessions/${sessionId}/end`),
  attempt: (slug: string, unit: string, answers: Record<string, string>) =>
    postJson<{ session: Session; outcome: Outcome; revision: ProposedRevision | null }>(`/topics/${slug}/units/${unit}/attempts`, {
      answers,
    }),
  revise: (slug: string) => postJson<{ revision: ProposedRevision | null; reason?: string }>(`/topics/${slug}/revise`),
  acceptRevision: (slug: string, id: string) => postJson<{ plan: Plan }>(`/topics/${slug}/revisions/${id}/accept`),
  rejectRevision: (slug: string, id: string) => postJson<{ ok: true }>(`/topics/${slug}/revisions/${id}/reject`),
  verifyReference: (slug: string, id: string, state: "verified" | "unverified" | "failed") =>
    postJson<{ ok: true }>(`/topics/${slug}/references/${id}/verification`, { state }),
}
