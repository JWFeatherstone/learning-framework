import type { Plan, Progress, Topic } from "@lf/contracts"
import { useEffect, useState } from "react"

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
}

/** Something read from the server: not asked for, on its way, there, or failed. */
export type Resource<T> =
  { state: "loading" } | { state: "ready"; value: T } | { state: "error"; error: Error; retry: () => void }

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

/** One fetch per path; the hook owns loading, errors and retry. */
export function useApi<T>(path: string): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({ state: "loading" })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    setResource({ state: "loading" })
    getJson<T>(path)
      .then((value) => !cancelled && setResource({ state: "ready", value }))
      .catch((error: Error) => {
        console.error(error)
        if (!cancelled) setResource({ state: "error", error, retry: () => setAttempt((n) => n + 1) })
      })
    return () => {
      cancelled = true
    }
  }, [path, attempt])
  return resource
}
