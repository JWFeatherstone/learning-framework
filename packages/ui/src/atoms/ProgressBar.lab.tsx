import type { LabEntry } from "../lab"
import { ProgressBar } from "./ProgressBar"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

function Values() {
  return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      {[0, 0.33, 0.67, 1].map((value) => (
        <div key={value} className={styles.stack}>
          <Text variant="label" tone="muted">
            {Math.round(value * 100)}%
          </Text>
          <ProgressBar value={value} label={`${value} of the chapter`} />
        </div>
      ))}
      <Text variant="label" tone="muted">
        Small, under a navigation row
      </Text>
      <ProgressBar value={0.67} label="2 of 3 modules" size="sm" />
    </div>
  )
}

export const lab: LabEntry = {
  name: "ProgressBar",
  level: "atom",
  states: { Values },
}
