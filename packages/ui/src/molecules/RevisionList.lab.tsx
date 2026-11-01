import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { RevisionList } from "./RevisionList"
import styles from "./molecules.lab.module.css"

const ROWS = [
  {
    change: "Insert a unit after p1.c1.u1: British and French constraints in East Asia, 1931–33.",
    reason: "Your test treated the League as one actor; the gap is in what its strongest members could do.",
  },
  {
    change: "Mark p1.c1.u1's exercise stale.",
    reason: "The seminar should push on the new unit's material too.",
  },
]

function Proposed() {
  return (
    <div className={styles.column}>
      <RevisionList
        summary="Add a unit on the League's members"
        trigger="After the test for p1.c1.u1"
        basedOn={1}
        state="proposed"
        rows={ROWS}
        actions={
          <>
            <Button variant="primary">Accept</Button>
            <Button>Reject</Button>
          </>
        }
      />
    </div>
  )
}

function Accepted() {
  return (
    <div className={styles.column}>
      <RevisionList
        summary="Add a unit on the League's members"
        trigger="After the test for p1.c1.u1"
        basedOn={1}
        state="accepted"
        rows={ROWS}
      />
    </div>
  )
}

export const lab: LabEntry = {
  name: "RevisionList",
  level: "molecule",
  layout: "stacked",
  states: { Proposed, Accepted },
}
