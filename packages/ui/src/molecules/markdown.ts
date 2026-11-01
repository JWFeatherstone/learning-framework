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
