import type { LabEntry } from "../lab"
import type { TypeRole } from "../tokens/foundation"
import { Text } from "./Text"
import styles from "./atoms.lab.module.css"

const ORDER: [TypeRole, string][] = [
  ["display", "The Second World War"],
  ["heading", "Manchuria, 1931"],
  ["title", "Origins 1919–1939"],
  ["prose-lead", "The crisis began with an explosion on a railway line."],
  [
    "prose",
    "The Kwantung Army acted first and Tokyo followed, which is the order the Lytton report struggled to establish.",
  ],
  ["value-large", "0.74"],
  ["value", "4 of 6"],
  ["strong", "Generate reading"],
  ["body", "Two objectives at analyse, one at evaluate"],
  ["label", "Mastery"],
  ["code", "p1.c1.u1"],
  ["unit", "min"],
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
          <Text tone={tone}>Last studied three days ago</Text>
        </div>
      ))}
    </div>
  )
}

function Wrapping() {
  return (
    <div className={`${styles.stack} ${styles.narrow}`}>
      <Text variant="title" as="h3">
        Was the League of Nations' failure over Manchuria inevitable, or a choice its members made?
      </Text>
      <Text as="p" tone="muted">
        The seminar pushes on this question from the Japanese, Chinese and British positions in turn, and asks
        you to state each case without endorsing it.
      </Text>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Text",
  level: "atom",
  states: { Variants, Tones, Wrapping },
}
