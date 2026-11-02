import { describe, expect, it } from "vitest"
import { outline, parseInline, parseMarkdown } from "./markdown"

describe("markdown", () => {
  it("reads headings, paragraphs, lists, quotes, code and rules", () => {
    const blocks = parseMarkdown("## Framing\n\nOne line\nand the next.\n\n- a\n- b\n\n1. first\n\n> quoted\n\n```yaml\nx: 1\n```\n\n---\n")
    expect(blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "list", "list", "quote", "code", "rule"])
    expect(blocks[1]).toEqual({ type: "paragraph", children: [{ type: "text", text: "One line and the next." }] })
    expect(blocks[2]).toMatchObject({ ordered: false })
    expect(blocks[3]).toMatchObject({ ordered: true })
    expect(blocks[5]).toEqual({ type: "code", lang: "yaml", text: "x: 1" })
  })

  it("reads inline forms and references", () => {
    expect(parseInline("a **b** *c* `d` [e](http://f) [[ref:g-h]]")).toEqual([
      { type: "text", text: "a " },
      { type: "strong", children: [{ type: "text", text: "b" }] },
      { type: "text", text: " " },
      { type: "em", children: [{ type: "text", text: "c" }] },
      { type: "text", text: " " },
      { type: "code", text: "d" },
      { type: "text", text: " " },
      { type: "link", href: "http://f", children: [{ type: "text", text: "e" }] },
      { type: "text", text: " " },
      { type: "ref", kind: "ref", id: "g-h" },
    ])
  })

  it("reads a table with its alignment", () => {
    const [table] = parseMarkdown("| Class | Steps |\n|---|---:|\n| O(1) | 1 |\n| O(n) | 10⁶ |\n\nAfter.")
    expect(table).toMatchObject({ type: "table", align: ["left", "right"] })
    expect(table?.type === "table" && table.rows.length).toBe(2)
  })

  it("reads the fenced blocks, their titles and their contents", () => {
    const blocks = parseMarkdown(":::check Why resize early?\nBecause probes climb.\n\n- one\n:::\n\n:::key\nKeep it sparse.\n:::")
    expect(blocks.map((block) => block.type === "block" && block.name)).toEqual(["check", "key"])
    expect(blocks[0]).toMatchObject({ title: [{ type: "text", text: "Why resize early?" }] })
    expect(blocks[0]?.type === "block" && blocks[0].children.map((child) => child.type)).toEqual(["paragraph", "list"])
  })

  it("reads an unknown block as plain content", () => {
    expect(parseMarkdown(":::poem\nA line.\n:::").map((block) => block.type)).toEqual(["paragraph"])
  })

  it("outlines sections and subsections, adding the glossary when terms are defined", () => {
    const entries = outline("Lead.\n\n## Turning keys into places\n\n### Load, factor!\n\n:::term Load factor\nα.\n:::", "Key terms")
    expect(entries).toEqual([
      { id: "turning-keys-into-places", title: "Turning keys into places", level: 2 },
      { id: "load-factor", title: "Load, factor!", level: 3 },
      { id: "key-terms", title: "Key terms", level: 2 },
    ])
  })
})
