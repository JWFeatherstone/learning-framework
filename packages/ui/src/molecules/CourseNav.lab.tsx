import type { LabEntry } from "../lab"
import { useState } from "react"
import { CourseNav, type NavPart } from "./CourseNav"
import styles from "./molecules.lab.module.css"

export const FIXTURE_PARTS: NavPart[] = [
  {
    id: "p1",
    title: "Origins 1919–1939",
    chapters: [
      {
        id: "p1.c1",
        title: "Asia",
        units: [
          { id: "p1.c1.u1", title: "Manchuria, 1931", state: "assessed", done: 3 },
          { id: "p1.c1.u2", title: "From Manchuria to Marco Polo Bridge", state: "in-progress", done: 1 },
          { id: "p1.c1.u3", title: "The war in China, 1937–1941", state: "planned", done: 0 },
        ],
      },
      {
        id: "p1.c2",
        title: "Europe",
        units: [
          { id: "p1.c2.u1", title: "Versailles and its critics", state: "planned", done: 0 },
          { id: "p1.c2.u2", title: "Appeasement as policy", state: "stale", done: 0 },
        ],
      },
    ],
  },
  {
    id: "p2",
    title: "Expansion 1939–1942",
    chapters: [
      {
        id: "p2.c1",
        title: "Europe and the Atlantic",
        units: [{ id: "p2.c1.u1", title: "Poland and the phoney war", state: "planned", done: 0 }],
      },
    ],
  },
]

const NO_PARTS: NavPart[] = [{ id: "root", chapters: FIXTURE_PARTS[0]?.chapters ?? [] }]

// Live: open chapters, pick a unit.
function WithParts() {
  const [current, setCurrent] = useState("p1.c1.u2")
  return (
    <div className={styles.rail}>
      <CourseNav parts={FIXTURE_PARTS} currentId={current} onSelect={setCurrent} />
    </div>
  )
}

function ChaptersOnly() {
  const [current, setCurrent] = useState("p1.c1.u1")
  return (
    <div className={styles.rail}>
      <CourseNav parts={NO_PARTS} currentId={current} onSelect={setCurrent} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "CourseNav",
  level: "molecule",
  states: { "With parts": WithParts, "Chapters only": ChaptersOnly },
}
