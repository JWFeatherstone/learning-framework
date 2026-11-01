import type { LabEntry } from "../lab"
import { useState } from "react"
import { NavList, type NavGroup } from "./NavList"
import styles from "./molecules.lab.module.css"

const GROUPS: NavGroup[] = [
  {
    label: "This topic",
    items: [
      { value: "outline", label: "Outline", count: 12 },
      { value: "references", label: "References", count: 5 },
      { value: "sessions", label: "Sessions", count: 3 },
    ],
  },
  {
    label: "Plan",
    items: [
      { value: "revisions", label: "Revisions", count: 1 },
      { value: "history", label: "History", count: 2 },
    ],
  },
]

// Live: click a section.
function Sections() {
  const [value, setValue] = useState("outline")
  return (
    <div className={`${styles.sheet} ${styles.sheetNarrow}`}>
      <NavList label="Topic sections" groups={GROUPS} value={value} onValueChange={setValue} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "NavList",
  level: "molecule",
  states: { Sections },
}
