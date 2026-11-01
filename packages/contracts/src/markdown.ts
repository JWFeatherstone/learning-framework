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
