import type { ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import type { IconName } from "../atoms/icons"
import { Spinner } from "../atoms/Spinner"
import { Tag } from "../atoms/Tag"
import { Text } from "../atoms/Text"
import type { ModuleKindName } from "./ModuleRow"
import styles from "./ModuleTrack.module.css"

/** Where a step stands: not written, being written, written, the one to do now, started, or finished. */
export type TrackState = "unwritten" | "writing" | "ready" | "next" | "in-progress" | "done"

export interface TrackStep {
  kind: ModuleKindName
  state: TrackState
  /** The generator's short name for how the module goes about its job, once written. */
  approach?: string
  /** One line under the name: what it asks, or why it cannot be opened yet. */
  detail: string
  /** The one thing to do with it now. Only the next step's is primary. */
  action?: ReactNode
}

const LABEL: Record<ModuleKindName, string> = { reading: "Reading", exercise: "Exercise", test: "Test" }

const SPOKEN: Record<TrackState, string> = {
  unwritten: "not written yet",
  writing: "being written",
  ready: "ready",
  next: "next",
  "in-progress": "in progress",
  done: "finished",
}

interface Props {
  steps: TrackStep[]
  /** Names the track for assistive technology, such as "Steps in this unit". */
  label: string
}

// A unit's modules as the steps they are: nodes on a line that fills in the progress colour as each is
// finished, so moving through a unit shows. Across the page when there is room, down it when narrow.
export function ModuleTrack({ steps, label }: Props) {
  return (
    <div className={styles.wrap}>
      <ol className={styles.track} aria-label={label}>
        {steps.map((step) => (
          <li key={step.kind} className={styles.step} data-state={step.state}>
            <div className={styles.rail} aria-hidden="true">
              <span className={styles.node}>
                {step.state === "done" && <Icon name="chosen" size="sm" />}
                {step.state === "writing" && <Spinner />}
              </span>
              <span className={styles.line} />
            </div>
            <div className={styles.body}>
              <div className={styles.head}>
                <Icon name={step.kind as IconName} size="md" />
                <Text variant="title" as="h3">
                  {LABEL[step.kind]}
                  <span className={styles.hidden}>, {SPOKEN[step.state]}</span>
                </Text>
                {step.approach && <Tag>{step.approach}</Tag>}
              </div>
              <Text variant="label" tone="muted">
                {step.detail}
              </Text>
              {step.action && <div className={styles.action}>{step.action}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
