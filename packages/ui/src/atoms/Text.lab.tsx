import type { LabEntry } from "../lab"
import type { TypeRole } from "../tokens/foundation"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

const ORDER: [TypeRole, string][] = [
  ["display", "Old Town North"],
  ["title", "Median household income"],
  ["value-large", "61,250"],
  ["value", "0.74"],
  ["strong", "Export selection"],
  ["body", "Cells within 800 m of a stop"],
  ["label", "Population"],
  ["unit", "per km²"],
]

function Variants() {
  return (
    <div className={styles.pairs}>
      {ORDER.map(([variant, sample]) => (
        <div key={variant} style={{ display: "contents" }}>
          <Text variant="label" tone="muted">
            {variant}
          </Text>
          <Text variant={variant}>{sample}</Text>
        </div>
      ))}
    </div>
  )
}

function Tones() {
  return (
    <div className={styles.pairs}>
      {(["default", "muted", "faint"] as const).map((tone) => (
        <div key={tone} style={{ display: "contents" }}>
          <Text variant="label" tone="muted">
            {tone}
          </Text>
          <Text tone={tone}>Split by area from 3 tracts</Text>
        </div>
      ))}
    </div>
  )
}

function Wrapping() {
  return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      <Text variant="title" as="h3">
        Share of residents within 15 minutes of a grocery store by transit
      </Text>
      <Text as="p" tone="muted">
        Counts are summed across the selection; income is weighted by population, and the four cells on the
        edge count in part.
      </Text>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Text",
  level: "atom",
  states: { Variants, Tones, Wrapping },
}
