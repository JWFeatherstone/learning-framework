import type { LabEntry } from "../lab"
import { useState } from "react"
import { Text } from "../atoms/Text"
import { ChoiceGroup } from "./ChoiceGroup"
import styles from "./molecules.lab.module.css"

const OPTIONS = [
  "It recognised Manchukuo and lifted sanctions.",
  "It found Japan's actions were not self-defence and proposed an autonomous Manchuria under Chinese sovereignty.",
  "It expelled Japan from the League.",
  "It referred the dispute to the Permanent Court.",
]

function Live() {
  const [value, setValue] = useState<string | undefined>(OPTIONS[1])
  return (
    <div className={styles.column}>
      <Text as="p" variant="strong" style={{ marginBottom: 12 }}>
        What did the Lytton Commission recommend?
      </Text>
      <ChoiceGroup label="What did the Lytton Commission recommend?" options={OPTIONS} value={value} onChange={setValue} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "ChoiceGroup",
  level: "molecule",
  layout: "stacked",
  states: { Live },
}
