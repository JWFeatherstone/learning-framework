import type { LabEntry } from "../lab"
import { useState } from "react"
import { Button } from "../atoms/Button"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Panel } from "./Panel"
import { Select, type SelectGroup } from "./Select"
import labStyles from "../atoms/atoms.lab.module.css"
import styles from "./molecules.lab.module.css"

// One approach is not available yet, to show a disabled option.
const TOPICS: SelectGroup[] = [
  { label: "Reading", options: ["Perspectives", "Narrative", "Summary", "Source study"] },
  { label: "Exercise", options: ["Seminar", "Debate", "Task"] },
  { label: "Test", options: ["Mixed paper", "Essay", "Oral"] },
].map(({ label, options }) => ({
  label,
  options: options.map((topic) => ({ value: topic, label: topic, locked: topic === "Oral" })),
}))

const STATES = ["rest", "hover", "open", "focus"] as const

// Live: open the menu and press Esc. The menu closes; the panel stays. Esc again closes the panel.
function InAPanel() {
  const [topic, setTopic] = useState("Perspectives")
  const [open, setOpen] = useState(true)
  return (
    <TooltipProvider>
      <div className={styles.page}>
        {open ? (
          <Panel
            label="Module"
            title={<Select label="Approach" value={topic} onValueChange={setTopic} groups={TOPICS} />}
            detail="p1.c1.u1 · reading"
            closeLabel="Close"
            onClose={() => setOpen(false)}
          >
            <div className={styles.placeholder} style={{ height: 200 }}>
              {topic} brief
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
