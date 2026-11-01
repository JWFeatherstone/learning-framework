import type { LabEntry } from "../lab"
import { Spinner } from "./Spinner"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

export const lab: LabEntry = {
  name: "Spinner",
  level: "atom",
  states: {
    Sizes: () => (
      <div className={styles.row}>
        <Spinner size="sm" />
        <Spinner size="md" />
      </div>
    ),
    "In a note": () => (
      <span className={styles.note}>
        <Spinner />
        <Text variant="label">Loading population for this cell</Text>
      </span>
    ),
  },
}
