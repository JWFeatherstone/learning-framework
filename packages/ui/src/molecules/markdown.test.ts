import { describe, expect, it } from "vitest"
import { parseInline, parseMarkdown } from "./markdown"

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
})
