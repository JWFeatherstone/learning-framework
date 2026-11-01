import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { ModuleRow } from "./ModuleRow"
import styles from "./molecules.lab.module.css"

function AUnit() {
  return (
    <TooltipProvider>
      <div className={styles.column} style={{ gap: 0 }}>
        <ModuleRow
          kind="reading"
          state="complete"
          approach="perspectives"
          detail="50 min · finished"
          action={<Button>Read again</Button>}
        />
        <ModuleRow
          kind="exercise"
          state="generated"
          approach="seminar"
          detail="A dialogue with a tutor"
          action={
            <Button variant="primary" icon="exercise">
              Start
            </Button>
          }
        />
        <ModuleRow
          kind="test"
          state="planned"
          detail="Not generated yet"
          action={
            <Button variant="primary" icon="generate" disabledReason="Finish the exercise first">
              Generate
            </Button>
          }
        />
      </div>
    </TooltipProvider>
  )
}

function OtherStates() {
  return (
    <TooltipProvider>
      <div className={styles.column} style={{ gap: 0 }}>
        <ModuleRow kind="reading" state="generating" detail="Generating…" action={<Button loading>Generate</Button>} />
        <ModuleRow
          kind="exercise"
          state="stale"
          approach="seminar"
          detail="Written against plan v1; the plan is v2"
          action={
            <Button variant="primary" icon="generate">
              Regenerate
            </Button>
          }
        />
        <ModuleRow
          kind="test"
          state="assessed"
          approach="mixed paper"
          detail="6 items · graded"
          action={<Button>Review</Button>}
        />
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "ModuleRow",
  level: "molecule",
  layout: "stacked",
  states: { "A unit's three modules": AUnit, "Generating, stale, assessed": OtherStates },
}
