import { Icon } from "./Icon"
import { Spinner } from "./Spinner"
import styles from "./StateMark.module.css"

export type MarkState = "planned" | "generating" | "generated" | "stale" | "in-progress" | "complete" | "assessed"

const LABELS: Record<MarkState, string> = {
  planned: "Not generated yet",
  generating: "Generating",
  generated: "Ready",
  stale: "Out of date with the plan",
  "in-progress": "In progress",
  complete: "Finished",
  assessed: "Assessed",
}

interface Props {
  state: MarkState
  /** Overrides the default label for screen readers. */
  label?: string
}

// One small glyph for a module's or unit's state, in the navigation and on module rows. Content states
// (planned, generating, generated, stale) and learner states (in progress, complete, assessed) share the
// slot because a row shows one or the other, never both.
export function StateMark({ state, label = LABELS[state] }: Props) {
  if (state === "generating") return <Spinner />
  if (state === "complete" || state === "assessed") {
    return (
      <span className={`${styles.mark} ${styles.done}`} role="img" aria-label={label}>
        <Icon name="complete" size="sm" />
      </span>
    )
  }
  if (state === "stale") {
    return (
      <span className={`${styles.mark} ${styles.stale}`} role="img" aria-label={label}>
        <Icon name="warning" size="sm" />
      </span>
    )
  }
  return <span className={`${styles.mark} ${styles.dot} ${styles[state]}`} role="img" aria-label={label} />
}
