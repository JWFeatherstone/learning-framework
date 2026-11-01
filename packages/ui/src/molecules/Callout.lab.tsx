import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { Callout } from "./Callout"
import styles from "./molecules.lab.module.css"

function Tones() {
  return (
    <div className={styles.column}>
      <Callout
        tone="info"
        title="Revision proposed"
        actions={
          <>
            <Button variant="primary" size="sm">
              Review
            </Button>
            <Button size="sm">Later</Button>
          </>
        }
      >
        After your test the planner suggests one new unit on British and French constraints in East Asia.
      </Callout>
      <Callout tone="warning">This reading cites mitter-war, which is not verified yet.</Callout>
      <Callout tone="danger" title="Generation failed">
        The model's reading did not pass check after one retry: missing section "## Perspectives".
      </Callout>
      <Callout tone="progress">Reading finished. The exercise is next.</Callout>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Callout",
  level: "molecule",
  layout: "stacked",
  states: { Tones },
}
