import type { LabEntry } from "../lab"
import { Textarea } from "./Textarea"
import styles from "./atoms.lab.module.css"

const STATES = ["rest", "hover", "focus"] as const

function States() {
  return (
    <div className={`${styles.stack} ${styles.fields}`}>
      {STATES.map((state) => (
        <Textarea
          key={state}
          label={`Your answer (${state})`}
          data-lab-state={state}
          defaultValue="The League treated Japan as one actor, but Tokyo and the Kwantung Army were pulling apart."
          rows={3}
        />
      ))}
      <Textarea label="With a hint" hint="Two or three sentences are enough." rows={2} />
      <Textarea label="Invalid" error="An answer is needed before grading." rows={2} />
      <Textarea label="Disabled" disabled defaultValue="Graded." rows={2} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Textarea",
  level: "atom",
  states: { States },
}
