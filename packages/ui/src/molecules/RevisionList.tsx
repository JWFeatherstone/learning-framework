import type { ReactNode } from "react"
import { Tag } from "../atoms/Tag"
import { Text } from "../atoms/Text"
import styles from "./RevisionList.module.css"

export interface RevisionRow {
  /** One line saying what the op does, in words: "Insert a unit after p1.c1.u1: British and French…". */
  change: string
  reason?: string
}

interface Props {
  summary: string
  trigger: string
  basedOn: number
  state: "proposed" | "accepted" | "rejected"
  rows: RevisionRow[]
  /** Accept and reject, while proposed. */
  actions?: ReactNode
}

// A proposed change to the plan, read like a pull request: what and why, op by op, then a decision.
export function RevisionList({ summary, trigger, basedOn, state, rows, actions }: Props) {
  return (
    <section className={styles.revision} data-state={state}>
      <header className={styles.head}>
        <div className={styles.titles}>
          <Text variant="title" as="h3">
            {summary}
          </Text>
          <Text variant="label" tone="muted">
            {trigger} · based on plan v{basedOn}
          </Text>
        </div>
        <Tag>{state}</Tag>
      </header>
      <ol className={styles.ops}>
        {rows.map((row, index) => (
          <li key={index} className={styles.op}>
            <Text as="p">{row.change}</Text>
            {row.reason && (
              <Text as="p" tone="muted">
                {row.reason}
              </Text>
            )}
          </li>
        ))}
      </ol>
      {actions && state === "proposed" && <div className={styles.actions}>{actions}</div>}
    </section>
  )
}
