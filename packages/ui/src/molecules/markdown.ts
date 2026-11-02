// A small Markdown reader for the subset generated modules use: headings, paragraphs, lists, quotes,
// fenced code, rules; bold, italic, code, links and [[kind:id]] references inline. It is not a general
// parser; a module that needs more gets a real one.

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "ref"; kind: string; id: string }

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  | { type: "code"; lang: string; text: string }
  | { type: "rule" }
  | { type: "table"; align: Align[]; head: Inline[][]; rows: Inline[][][] }
  | { type: "block"; name: BlockName; title: Inline[]; children: Block[] }

export type Align = "left" | "center" | "right"

/** The fenced blocks a module may use, as `:::name Title` … `:::`. Anything else is read as plain text. */
export const BLOCK_NAMES = ["key", "pitfall", "example", "check", "term", "aside"] as const
export type BlockName = (typeof BLOCK_NAMES)[number]
const isBlockName = (name: string): name is BlockName => (BLOCK_NAMES as readonly string[]).includes(name)

/** A table row's cells, without the outer pipes. */
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())

const DIVIDER = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/

const INLINE = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[\[([a-z]+):([^\]\s]+)\]\])|(\[([^\]]+)\]\(([^)\s]+)\))/

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let rest = text
  while (rest.length > 0) {
    const match = INLINE.exec(rest)
    if (!match || match.index === undefined) {
      out.push({ type: "text", text: rest })
      break
    }
    if (match.index > 0) out.push({ type: "text", text: rest.slice(0, match.index) })
    if (match[2] !== undefined) out.push({ type: "strong", children: parseInline(match[2]) })
    else if (match[4] !== undefined) out.push({ type: "em", children: parseInline(match[4]) })
    else if (match[6] !== undefined) out.push({ type: "code", text: match[6] })
    else if (match[8] !== undefined) out.push({ type: "ref", kind: match[8], id: match[9] ?? "" })
    else if (match[11] !== undefined) out.push({ type: "link", href: match[12] ?? "", children: parseInline(match[11]) })
    rest = rest.slice(match.index + match[0].length)
  }
  return out
}

export function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) })
    paragraph = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const fence = /^```(\w*)\s*$/.exec(line)
    if (fence) {
      flush()
      const code: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) code.push(lines[i] ?? ""), i++
      blocks.push({ type: "code", lang: fence[1] ?? "", text: code.join("\n") })
      continue
    }
    const open = /^:::([a-z]+)(?: +(.*?))?\s*$/.exec(line)
    if (open) {
      flush()
      const inner: string[] = []
      i++
      while (i < lines.length && !/^:::\s*$/.test(lines[i] ?? "")) inner.push(lines[i] ?? ""), i++
      const name = open[1] ?? ""
      const children = parseMarkdown(inner.join("\n"))
      if (isBlockName(name)) blocks.push({ type: "block", name, title: parseInline(open[2] ?? ""), children })
      else blocks.push(...children)
      continue
    }
    if (line.trimStart().startsWith("|") && DIVIDER.test(lines[i + 1] ?? "")) {
      flush()
      const align = cells(lines[i + 1] ?? "").map((cell): Align =>
        cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "left",
      )
      const head = cells(line).map(parseInline)
      const rows: Inline[][][] = []
      i += 2
      while (i < lines.length && (lines[i] ?? "").trimStart().startsWith("|")) rows.push(cells(lines[i] ?? "").map(parseInline)), i++
      i--
      blocks.push({ type: "table", align, head, rows })
      continue
    }
    const heading = /^(#{1,4}) +(.+?)\s*$/.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: "heading", level: heading[1]?.length as 1 | 2 | 3 | 4, children: parseInline(heading[2] ?? "") })
      continue
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flush()
      blocks.push({ type: "rule" })
      continue
    }
    const quote = /^> ?(.*)$/.exec(line)
    if (quote) {
      flush()
      const last = blocks[blocks.length - 1]
      if (last?.type === "quote") last.children.push({ type: "text", text: " " }, ...parseInline(quote[1] ?? ""))
      else blocks.push({ type: "quote", children: parseInline(quote[1] ?? "") })
      continue
    }
    const item = /^(\s*)([-*]|\d+[.)]) +(.+)$/.exec(line)
    if (item) {
      flush()
      const ordered = /\d/.test(item[2] ?? "")
      const last = blocks[blocks.length - 1]
      if (last?.type === "list" && last.ordered === ordered) last.items.push(parseInline(item[3] ?? ""))
      else blocks.push({ type: "list", ordered, items: [parseInline(item[3] ?? "")] })
      continue
    }
    if (line.trim() === "") {
      flush()
      continue
    }
    paragraph.push(line.trim())
  }
  flush()
  return blocks
}

/** The text of inline nodes, without their marks. */
export function plainText(nodes: Inline[]): string {
  return nodes
    .map((node) => ("children" in node ? plainText(node.children) : node.type === "ref" ? node.id : node.text))
    .join("")
}

/** A heading's anchor: its text, lower-cased, words joined by hyphens. */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export interface OutlineEntry {
  id: string
  title: string
  level: 2 | 3
}

/** The sections and subsections of a document, for a contents rail; with the glossary Prose adds when
    the document defines terms. */
export function outline(markdown: string, glossary?: string): OutlineEntry[] {
  const entries = parseMarkdown(markdown).flatMap((block): OutlineEntry[] =>
    block.type === "heading" && (block.level === 2 || block.level === 3)
      ? [{ id: slugify(plainText(block.children)), title: plainText(block.children), level: block.level }]
      : [],
  )
  if (glossary && /^:::term\b/m.test(markdown)) entries.push({ id: slugify(glossary), title: glossary, level: 2 })
  return entries
}
