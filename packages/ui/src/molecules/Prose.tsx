import { Fragment, type ReactNode } from "react"
import { parseMarkdown, type Block, type Inline } from "./markdown"
import styles from "./Prose.module.css"

export interface ResolvedRef {
  label: string
  href?: string
  /** Shown faint, with a title, when the reference exists but should not be followed yet. */
  unavailable?: string
}

interface Props {
  markdown: string
  /** Turns [[kind:id]] into a label and a link; unresolved references render as their id. */
  resolveRef?: (kind: string, id: string) => ResolvedRef | undefined
  /** Lead: the first paragraph set larger, for a reading's framing. */
  lead?: boolean
}

function renderInline(nodes: Inline[], resolveRef: Props["resolveRef"]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return <Fragment key={index}>{node.text}</Fragment>
      case "strong":
        return <strong key={index}>{renderInline(node.children, resolveRef)}</strong>
      case "em":
        return <em key={index}>{renderInline(node.children, resolveRef)}</em>
      case "code":
        return (
          <code key={index} className={styles.code}>
            {node.text}
          </code>
        )
      case "link":
        return (
          <a key={index} href={node.href} className={styles.link} target="_blank" rel="noreferrer">
            {renderInline(node.children, resolveRef)}
          </a>
        )
      case "ref": {
        const resolved = resolveRef?.(node.kind, node.id)
        if (!resolved) {
          return (
            <span key={index} className={styles.refMissing} title={`No ${node.kind} ${node.id}`}>
              {node.id}
            </span>
          )
        }
        if (resolved.unavailable || !resolved.href) {
          return (
            <span key={index} className={styles.ref} title={resolved.unavailable}>
              {resolved.label}
            </span>
          )
        }
        return (
          <a key={index} href={resolved.href} className={styles.link}>
            {resolved.label}
          </a>
        )
      }
    }
  })
}

function renderBlock(block: Block, index: number, resolveRef: Props["resolveRef"], lead: boolean): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as const
      return (
        <Tag key={index} className={styles[`h${block.level}`]}>
          {renderInline(block.children, resolveRef)}
        </Tag>
      )
    }
    case "paragraph":
      return (
        <p key={index} className={lead ? styles.lead : styles.p}>
          {renderInline(block.children, resolveRef)}
        </p>
      )
    case "list": {
      const Tag = block.ordered ? "ol" : "ul"
      return (
        <Tag key={index} className={styles.list}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item, resolveRef)}</li>
          ))}
        </Tag>
      )
    }
    case "quote":
      return (
        <blockquote key={index} className={styles.quote}>
          {renderInline(block.children, resolveRef)}
        </blockquote>
      )
    case "code":
      return (
        <pre key={index} className={styles.pre} data-lang={block.lang || undefined}>
          <code>{block.text}</code>
        </pre>
      )
    case "rule":
      return <hr key={index} className={styles.rule} />
  }
}

// Running text at the prose measure, set in the reading roles. Headings carry the module's sections.
export function Prose({ markdown, resolveRef, lead = false }: Props) {
  const blocks = parseMarkdown(markdown)
  const firstParagraph = blocks.findIndex((block) => block.type === "paragraph")
  return (
    <div className={styles.prose}>
      {blocks.map((block, index) => renderBlock(block, index, resolveRef, lead && index === firstParagraph))}
    </div>
  )
}
