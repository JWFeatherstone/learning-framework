import type { LabEntry } from "../lab"
import { StateMark, type MarkState } from "./StateMark"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

const STATES: MarkState[] = ["planned", "generating", "generated", "stale", "in-progress", "complete", "assessed"]

function All() {
  return (
    <div className={styles.pairs}>
      {STATES.map((state) => (
        <div key={state} style={{ display: "contents" }}>
          <Text variant="label" tone="muted">
            {state}
          </Text>
          <span className={styles.inline}>
            <StateMark state={state} />
            <Text>Manchuria, 1931</Text>
          </span>
        </div>
      ))}
    </div>
  )
}

export const lab: LabEntry = {
  name: "StateMark",
  level: "atom",
  states: { All },
}
