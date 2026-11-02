import type { LabEntry } from "../lab"
import { useState } from "react"
import { Working } from "./Working"
import styles from "./molecules.lab.module.css"

function Started() {
  const [since] = useState(() => Date.now())
  return (
    <div className={styles.column}>
      <Working label="Reading your sources" since={since} />
    </div>
  )
}

function Reading() {
  const [since] = useState(() => Date.now() - 24_000)
  return (
    <div className={styles.column}>
      <Working label="Proposing a plan" line="Read flux-sim/src/flux_sim/choice/destination/kernels.py" since={since} />
    </div>
  )
}

function LongLine() {
  const [since] = useState(() => Date.now() - 83_000)
  return (
    <div className={styles.column} style={{ maxWidth: 320 }}>
      <Working
        label="Writing chapter 2 · 4 of 9"
        line="Grep def fit_kernel|class DestinationChoice in flux-sim/src/flux_sim/choice/destination"
        since={since}
      />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Working",
  level: "molecule",
  states: { "Just started": Started, "Reporting a read": Reading, "A long line, narrow": LongLine },
}
