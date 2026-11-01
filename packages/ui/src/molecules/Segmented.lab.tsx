import type { LabEntry } from "../lab"
import { useState } from "react"
import { Segmented } from "./Segmented"
import styles from "../atoms/atoms.lab.module.css"

// Live: click a segment, or Tab to the group and use the arrow keys.
function Choices({ options }: { options: string[] }) {
  const [value, setValue] = useState(options[0] ?? "")
  return (
    <div className={styles.surface}>
      <Segmented
        label="Choice"
        options={options.map((option) => ({ value: option, label: option }))}
        value={value}
        onValueChange={setValue}
      />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Segmented",
  level: "molecule",
  states: {
    Two: () => <Choices options={["Cells", "Tracts"]} />,
    Three: () => <Choices options={["Cells", "Tracts", "Counties"]} />,
  },
}
