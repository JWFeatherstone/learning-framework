import { Fragment, type ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import { parseMarkdown, plainText, slugify, type Block, type BlockName, type Inline } from "./markdown"
import styles from "./Prose.module.css"

export { outline, type OutlineEntry } from "./markdown"

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
  /** Gathers every term block into a closing section with this heading, for review. */
  glossary?: string
}

const LABEL: Partial<Record<BlockName, string>> = { pitfall: "Pitfall", example: "Worked example", check: "Check yourself", aside: "Aside" }

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
        <Tag key={index} id={slugify(plainText(block.children))} className={styles[`h${block.level}`]}>
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
    case "table":
      return (
        <div key={index} className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} style={{ textAlign: block.align[i] ?? "left" }}>
                    {renderInline(cell, resolveRef)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} style={{ textAlign: block.align[i] ?? "left" }}>
                      {renderInline(cell, resolveRef)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "block":
      return renderNamed(block, index, resolveRef)
  }
}

const renderBlocks = (blocks: Block[], resolveRef: Props["resolveRef"]) =>
  blocks.map((block, index) => renderBlock(block, index, resolveRef, false))

// The fenced blocks: each sits on the page with a rule or a fold, never in a box.
function renderNamed(block: Extract<Block, { type: "block" }>, index: number, resolveRef: Props["resolveRef"]): ReactNode {
  const title = block.title.length > 0 ? renderInline(block.title, resolveRef) : null
  const body = <div className={styles.blockBody}>{renderBlocks(block.children, resolveRef)}</div>
  switch (block.name) {
    case "key":
      return (
        <aside key={index} className={styles.key}>
          {title && <p className={styles.keyTitle}>{title}</p>}
          {body}
        </aside>
      )
    case "term":
      return (
        <div key={index} className={styles.term}>
          <dfn className={styles.dfn}>{title}</dfn>
          {body}
        </div>
      )
    case "check":
    case "aside":
      return (
        <details key={index} className={styles[block.name]}>
          <summary className={styles.summary}>
            <Icon name="closed" size="sm" />
            <span className={styles.summaryText}>
              <span className={styles.label}>{LABEL[block.name]}</span>
              {title && <span className={styles.summaryTitle}>{title}</span>}
            </span>
          </summary>
          {body}
        </details>
      )
    case "pitfall":
    case "example":
      return (
        <section key={index} className={styles[block.name]}>
          <p className={styles.blockHead}>
            <span className={styles.label}>{LABEL[block.name]}</span>
            {title && <span className={styles.blockTitle}>{title}</span>}
          </p>
          {body}
        </section>
      )
  }
}

// Running text at the prose measure, set in the reading roles, woven with a small set of blocks: a key
// idea, a pitfall, a worked example, a question to check yourself, a term, an aside; and tables.
export function Prose({ markdown, resolveRef, lead = false, glossary }: Props) {
  const blocks = parseMarkdown(markdown)
  const firstParagraph = blocks.findIndex((block) => block.type === "paragraph")
  const terms = glossary ? termsIn(blocks) : []
  return (
    <div className={styles.prose}>
      {blocks.map((block, index) => renderBlock(block, index, resolveRef, lead && index === firstParagraph))}
      {glossary && terms.length > 0 && (
        <>
          <h2 id={slugify(glossary)} className={styles.h2}>
            {glossary}
          </h2>
          <dl className={styles.glossary}>
            {terms.map((term, index) => (
              <div key={index}>
                <dt>{renderInline(term.title, resolveRef)}</dt>
                <dd>{renderBlocks(term.children, resolveRef)}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}

/** Every term block, however deep, in reading order. */
function termsIn(blocks: Block[]): Extract<Block, { type: "block" }>[] {
  return blocks.flatMap((block) =>
    block.type !== "block" ? [] : block.name === "term" ? [block] : termsIn(block.children),
  )
}
