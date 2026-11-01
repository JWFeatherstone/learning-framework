import type { LabEntry } from "../lab"
import type { TypeRole } from "../tokens/foundation"
import { Skeleton } from "./Skeleton"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

const ROWS: [TypeRole, string, string][] = [
  ["value-large", "61,250", "6ch"],
  ["value", "1,849", "5ch"],
  ["body", "Mixed residential", "16ch"],
  ["label", "Population", "10ch"],
]

// Each skeleton sits beside the text it stands in for; the two should be the same height.
function BesideItsText() {
  return (
    <div className={styles.twoColumns}>
      {ROWS.map(([variant, sample, width]) => (
        <div key={variant} style={{ display: "contents" }}>
          <Skeleton variant={variant} width={width} />
          <Text variant={variant}>{sample}</Text>
        </div>
      ))}
    </div>
  )
}

export const lab: LabEntry = {
  name: "Skeleton",
  level: "atom",
  states: { "Beside the text it stands in for": BesideItsText },
}
