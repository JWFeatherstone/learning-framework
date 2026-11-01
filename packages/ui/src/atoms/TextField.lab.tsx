import type { LabEntry } from "../lab"
import { useState } from "react"
import { TextField } from "./TextField"
import { TooltipProvider } from "./TooltipProvider"
import styles from "./atoms.lab.module.css"

const STATES = ["rest", "hover", "focus", "filled", "disabled", "invalid"] as const

function Search() {
  const [query, setQuery] = useState("Boulder")
  return (
    <TextField
      label="Search places"
      hideLabel
      type="search"
      icon="search"
      placeholder="Search places"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      onClear={() => setQuery("")}
    />
  )
}

function Uses() {
  return (
    <TooltipProvider>
      <div className={`${styles.surface} ${styles.fields}`}>
        <Search />
        <TextField
          label="Selection name"
          placeholder="Untitled selection"
          hint="Used as the export's file name."
          defaultValue=""
        />
        <TextField
          label="Email"
          type="email"
          defaultValue="john@terracity"
          error="Enter an address like name@example.com."
        />
      </div>
    </TooltipProvider>
  )
}

function States() {
  return (
    <TooltipProvider>
      <div className={styles.surface}>
        <table className={styles.grid}>
          <tbody>
            {STATES.map((state) => (
              <tr key={state}>
                <th>{state}</th>
                <td className={styles.fieldCell}>
                  <TextField
                    label="Search places"
                    hideLabel
                    icon="search"
                    placeholder="Search places"
                    data-lab-state={state}
                    disabled={state === "disabled"}
                    error={state === "invalid" ? "No place by that name." : undefined}
                    value={state === "filled" || state === "invalid" ? "Boulderr" : ""}
                    onChange={() => undefined}
                    onClear={() => undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.caption}>
          The search field is live: type, then clear it with the button. Focus shows for any focus in a text
          field, mouse or keyboard.
        </p>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "TextField",
  level: "atom",
  states: { Uses, States },
}
