import type { LabEntry } from "../lab"
import { useState } from "react"
import { Text } from "../atoms/Text"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { PlanOutline, type OutlinePart } from "./PlanOutline"
import styles from "./molecules.lab.module.css"

const objective = (id: string, level: string, text: string) => ({ id, level, text })

export const FIXTURE_OUTLINE: OutlinePart[] = [
  {
    id: "p1",
    title: "Foundations",
    chapters: [
      {
        id: "p1.c1",
        title: "Data structures refresher",
        units: [
          {
            id: "p1.c1.u1",
            title: "Complexity, arrays, linked lists and hash tables",
            estimate: "2.5h",
            objectives: [
              objective("o1", "explain", "Use Big-O notation to compare the time and space cost of common operations."),
              objective("o2", "explain", "Explain how hash tables achieve average O(1) lookups, and what happens on collisions and resizing."),
            ],
          },
          {
            id: "p1.c1.u2",
            title: "Trees, heaps and tries",
            estimate: "2.5h",
            objectives: [objective("o3", "explain", "Describe binary search trees, balanced trees and B-trees, and explain why B-trees suit disk storage.")],
          },
          {
            id: "p1.c1.u3",
            title: "Graphs, queues, skip lists and Bloom filters",
            estimate: "2h",
            objectives: [objective("o4", "explain", "Explain how Bloom filters trade a small false-positive rate for big space savings.")],
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    title: "Deep dive: data-intensive systems",
    chapters: [
      {
        id: "p2.c1",
        title: "Storage and retrieval",
        units: [
          {
            id: "p2.c1.u1",
            title: "Storage engines: logs, LSM trees and B-trees",
            estimate: "3h",
            objectives: [
              objective("o5", "explain", "Explain how hash indexes, SSTables and LSM trees handle writes, reads and compaction."),
              objective("o6", "analyse", "Compare LSM trees and B-trees on read amplification, write amplification and space."),
            ],
          },
          { id: "p2.c1.u2", title: "Column storage and analytics", estimate: "90 min", objectives: [objective("o7", "explain", "Explain why column stores compress well.")] },
        ],
      },
    ],
  },
]

const withStates: OutlinePart[] = FIXTURE_OUTLINE.map((part, p) => ({
  ...part,
  chapters: part.chapters.map((chapter) => ({
    ...chapter,
    units: chapter.units.map((unit, u) => ({ ...unit, state: p === 0 ? (u === 0 ? "assessed" : u === 1 ? "in-progress" : "generated") : "planned" })),
  })),
}))

const revised: OutlinePart[] = FIXTURE_OUTLINE.map((part, p) => ({
  ...part,
  chapters: part.chapters.map((chapter) => ({
    ...chapter,
    units: chapter.units.map((unit, u) => (p === 1 ? { ...unit, change: u === 0 ? "changed" : "new" } : unit)),
  })),
}))

function Proposed() {
  const [quoted, setQuoted] = useState("")
  return (
    <TooltipProvider>
      <div className={styles.column}>
        <PlanOutline parts={FIXTURE_OUTLINE} onComment={(title) => setQuoted(title)} />
        <Text variant="label" tone="muted">
          {quoted ? `Would quote: On “${quoted}”:` : "Hover a chapter or a unit to comment on it."}
        </Text>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "PlanOutline",
  level: "molecule",
  states: {
    "A proposal": Proposed,
    "After a revision": () => (
      <TooltipProvider>
        <div className={styles.column}>
          <PlanOutline parts={revised} onComment={() => undefined} />
        </div>
      </TooltipProvider>
    ),
    "A course, with states": () => (
      <div className={styles.column}>
        <PlanOutline parts={withStates} onSelect={() => undefined} />
      </div>
    ),
  },
}
