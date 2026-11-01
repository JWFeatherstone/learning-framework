import type { LabEntry } from "../lab"
import { useState } from "react"
import { NavList, type NavGroup } from "./NavList"
import styles from "./molecules.lab.module.css"

const GROUPS: NavGroup[] = [
  {
    label: "Data layers",
    items: [
      { value: "demographics", label: "Demographics", count: 10 },
      { value: "economy", label: "Economy", count: 5 },
      { value: "housing", label: "Housing", count: 5 },
    ],
  },
  {
    label: "Overlays",
    items: [
      { value: "transit", label: "Transit", count: 2 },
      { value: "places", label: "Places", count: 3 },
    ],
  },
]

// Live: click a section.
function Sections() {
  const [value, setValue] = useState("demographics")
  return (
    <div className={`${styles.sheet} ${styles.sheetNarrow}`}>
      <NavList label="Catalog sections" groups={GROUPS} value={value} onValueChange={setValue} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "NavList",
  level: "molecule",
  states: { Sections },
}
