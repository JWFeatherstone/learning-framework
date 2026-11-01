import type { LabEntry } from "../lab"
import { useState } from "react"
import { Text } from "../atoms/Text"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Select, type SelectGroup } from "./Select"
import labStyles from "../atoms/atoms.lab.module.css"

// One approach is not available yet, to show a disabled option.
const APPROACHES: SelectGroup[] = [
  { label: "Reading", options: ["Perspectives", "Narrative", "Summary", "Source study"] },
  { label: "Exercise", options: ["Seminar", "Debate", "Task"] },
  { label: "Test", options: ["Mixed paper", "Essay", "Oral"] },
].map(({ label, options }) => ({
  label,
  options: options.map((approach) => ({ value: approach, label: approach, locked: approach === "Oral" })),
}))

const STATES = ["rest", "hover", "open", "focus"] as const

// Live: the select sits in a module's heading row, on the page, where the approach is chosen before
// regenerating.
function InAHeading() {
  const [approach, setApproach] = useState("Perspectives")
  return (
    <TooltipProvider>
      <div className={labStyles.row}>
        <Text variant="title" as="h3">
          Reading
        </Text>
        <Select label="Approach" value={approach} onValueChange={setApproach} groups={APPROACHES} />
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
                  label="Approach"
                  value="Seminar"
                  onValueChange={() => undefined}
                  groups={APPROACHES}
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
    "In a module heading": InAHeading,
    States,
  },
}
