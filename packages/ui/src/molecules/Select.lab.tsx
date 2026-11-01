import type { LabEntry } from "../lab"
import { useState } from "react"
import { Button } from "../atoms/Button"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Panel } from "./Panel"
import { Select, type SelectGroup } from "./Select"
import labStyles from "../atoms/atoms.lab.module.css"
import styles from "./molecules.lab.module.css"

// One topic needs sign-in, to show a disabled option.
const TOPICS: SelectGroup[] = [
  { label: "Demographics", options: ["Population", "Age", "Race and ethnicity", "Households"] },
  { label: "Economy", options: ["Income", "Jobs", "Poverty"] },
  { label: "Housing", options: ["Homes", "Housing costs"] },
  { label: "Mobility", options: ["Commuting", "Transit"] },
  { label: "Safety", options: ["Crashes"] },
].map(({ label, options }) => ({
  label,
  options: options.map((topic) => ({ value: topic, label: topic, locked: topic === "Housing costs" })),
}))

const STATES = ["rest", "hover", "open", "focus"] as const

// Live: open the menu and press Esc. The menu closes; the panel stays. Esc again closes the panel.
function InAPanel() {
  const [topic, setTopic] = useState("Population")
  const [open, setOpen] = useState(true)
  return (
    <TooltipProvider>
      <div className={styles.map}>
        {open ? (
          <Panel
            label="Selected cell"
            title={<Select label="Topic" value={topic} onValueChange={setTopic} groups={TOPICS} />}
            detail="Cell · 0.74 km²"
            closeLabel="Clear selection"
            onClose={() => setOpen(false)}
          >
            <div className={styles.placeholder} style={{ height: 200 }}>
              {topic} figures
            </div>
          </Panel>
        ) : (
          <Button onClick={() => setOpen(true)}>Show the panel again</Button>
        )}
      </div>
    </TooltipProvider>
  )
}

function States() {
  return (
    <div className={labStyles.surface}>
      <table className={labStyles.grid}>
        <tbody>
          {STATES.map((state) => (
            <tr key={state}>
              <th>{state}</th>
              <td>
                <Select
                  label="Topic"
                  value="Population"
                  onValueChange={() => undefined}
                  groups={TOPICS}
                  data-lab-state={state}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Select",
  level: "molecule",
  states: {
    "In a panel header": InAPanel,
    States,
  },
}
