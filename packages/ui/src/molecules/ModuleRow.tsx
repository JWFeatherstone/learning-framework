import type { ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import type { IconName } from "../atoms/icons"
import { StateMark, type MarkState } from "../atoms/StateMark"
import { Tag } from "../atoms/Tag"
import { Text } from "../atoms/Text"
import styles from "./ModuleRow.module.css"

export type ModuleKindName = "reading" | "exercise" | "test"

const LABEL: Record<ModuleKindName, string> = { reading: "Reading", exercise: "Exercise", test: "Test" }

interface Props {
  kind: ModuleKindName
  /** The content state, or the learner's state once the module exists and has been started. */
  state: MarkState
  /** The generator's short name for how the module goes about its job, once generated. */
  approach?: string
  /** One line under the title: an estimate, a form, an item count. */
  detail?: string
  /** The one thing to do with it now: Generate, Open, Continue, Review. */
  action: ReactNode
}

// One of a unit's three modules as a row in the page, hairline above: what it is, where it stands,
// what to do with it. Rows, not cards; the unit page reads as a document.
export function ModuleRow({ kind, state, approach, detail, action }: Props) {
  return (
    <div className={styles.row} data-state={state}>
      <span className={styles.icon}>
        <Icon name={kind as IconName} size="md" />
      </span>
      <div className={styles.text}>
        <div className={styles.head}>
          <Text variant="title" as="h3">
            {LABEL[kind]}
          </Text>
          <StateMark state={state} />
          {approach && <Tag>{approach}</Tag>}
        </div>
        {detail && (
          <Text variant="label" tone="muted">
            {detail}
          </Text>
        )}
      </div>
      <div className={styles.action}>{action}</div>
    </div>
  )
}
