import { parse } from "yaml"

/** A Markdown document split into its YAML frontmatter (parsed) and body. */
export function splitFrontmatter(text: string): { frontmatter: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!match) throw new Error("No frontmatter: the file must start with a --- block")
  return { frontmatter: parse(match[1] ?? ""), body: match[2] ?? "" }
}

/** Level-2 headings, in order, as the section names `check` compares against. */
export function sections(body: string): string[] {
  return [...body.matchAll(/^## +(.+?)\s*$/gm)].map((match) => match[1] ?? "")
}

/** Every [[kind:id]] link in a body, including image links ![[media:...]]. */
export function links(body: string): { kind: string; id: string }[] {
  return [...body.matchAll(/!?\[\[([a-z]+):([^\]\s]+)\]\]/g)].map((match) => ({
    kind: match[1] ?? "",
    id: match[2] ?? "",
  }))
}

/** The fenced blocks in a body, with what is wrong with any: an unknown name, a block opened inside
    another, or one never closed. Code fences are skipped. */
export function blockProblems(body: string, known: readonly string[]): string[] {
  const problems: string[] = []
  let open: string | undefined
  let code = false
  body.split(/\r?\n/).forEach((line, index) => {
    if (/^```/.test(line)) code = !code
    if (code) return
    const start = /^:::([a-z]*)/.exec(line)
    if (!start) return
    const name = start[1] ?? ""
    if (!name) {
      if (!open) problems.push(`line ${index + 1}: ":::" closes no block`)
      open = undefined
    } else if (open) problems.push(`line ${index + 1}: ":::${name}" opens inside ":::${open}"; blocks don't nest`)
    else if (!known.includes(name)) problems.push(`line ${index + 1}: unknown block ":::${name}"; use ${known.join(", ")}`)
    else open = name
  })
  if (open) problems.push(`":::${open}" is never closed`)
  return problems
}
