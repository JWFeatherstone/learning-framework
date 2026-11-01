import type { ResolvedRef } from "@lf/ui/molecules/Prose"
import type { TopicDetail } from "@data/api"

// How [[kind:id]] in a module body resolves against the topic: references by citation, units by title.
export function refResolver(slug: string, detail: TopicDetail) {
  return (kind: string, id: string): ResolvedRef | undefined => {
    if (kind === "ref") {
      const reference = detail.references.find((entry) => entry.id === id)
      if (!reference) return undefined
      const unavailable =
        reference.verification.state === "verified" ? undefined : `Not verified yet (${reference.verification.state})`
      return { label: reference.citation, ...(reference.url ? { href: reference.url } : {}), ...(unavailable ? { unavailable } : {}) }
    }
    if (kind === "unit") {
      const unit = detail.plan.nodes
        .flatMap((node) => (node.kind === "part" ? node.children : [node]))
        .flatMap((chapter) => chapter.children)
        .find((entry) => entry.id === id)
      return unit ? { label: unit.title, href: `/t/${slug}/u/${unit.id}` } : undefined
    }
    return undefined
  }
}

/** The body under one `## heading`, without the heading; the whole body if the heading is missing. */
export function section(body: string, heading: string): string {
  const lines = body.split("\n")
  const start = lines.findIndex((line) => line.replace(/^##\s+/, "").trim() === heading && line.startsWith("## "))
  if (start < 0) return body
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith("## "))
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim()
}
