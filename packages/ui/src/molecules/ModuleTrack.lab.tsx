import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { ModuleTrack, type TrackStep } from "./ModuleTrack"
import styles from "./molecules.lab.module.css"

const UNDERWAY: TrackStep[] = [
  { kind: "reading", state: "done", approach: "perspectives", detail: "Finished", action: <Button>Read again</Button> },
  {
    kind: "exercise",
    state: "next",
    approach: "seminar",
    detail: "A dialogue with a tutor",
    action: (
      <Button variant="primary" icon="exercise">
        Start
      </Button>
    ),
  },
  { kind: "test", state: "ready", approach: "short answers", detail: "Graded against the objectives", action: <Button>Open</Button> },
]

const UNWRITTEN: TrackStep[] = [
  { kind: "reading", state: "unwritten", detail: "Not written yet" },
  { kind: "exercise", state: "unwritten", detail: "Not written yet" },
  { kind: "test", state: "unwritten", detail: "Not written yet" },
]

const WRITING: TrackStep[] = [
  { kind: "reading", state: "ready", approach: "worked example", detail: "Written" },
  { kind: "exercise", state: "writing", detail: "Being written" },
  { kind: "test", state: "unwritten", detail: "Waiting its turn" },
]

const FINISHED: TrackStep[] = [
  { kind: "reading", state: "done", approach: "perspectives", detail: "Finished", action: <Button>Read again</Button> },
  { kind: "exercise", state: "done", approach: "seminar", detail: "Finished", action: <Button>Open again</Button> },
  { kind: "test", state: "done", approach: "short answers", detail: "Graded", action: <Button>Review</Button> },
]

const IN_PROGRESS: TrackStep[] = [
  { kind: "reading", state: "in-progress", approach: "perspectives", detail: "Halfway", action: <Button variant="primary" icon="reading">Continue</Button> },
  { kind: "exercise", state: "ready", approach: "seminar", detail: "A dialogue with a tutor", action: <Button>Start</Button> },
  { kind: "test", state: "ready", approach: "short answers", detail: "Graded against the objectives", action: <Button>Open</Button> },
]

const frame = (steps: TrackStep[], width: number) => () => (
  <TooltipProvider>
    <div className={styles.column} style={{ maxWidth: width }}>
      <ModuleTrack steps={steps} label="Steps in this unit" />
    </div>
  </TooltipProvider>
)

export const lab: LabEntry = {
  name: "ModuleTrack",
  level: "molecule",
  layout: "stacked",
  states: {
    "Underway": frame(UNDERWAY, 900),
    "Started a reading": frame(IN_PROGRESS, 900),
    "Not written": frame(UNWRITTEN, 900),
    "Being written": frame(WRITING, 900),
    Finished: frame(FINISHED, 900),
    "Underway, narrow": frame(UNDERWAY, 420),
  },
}
