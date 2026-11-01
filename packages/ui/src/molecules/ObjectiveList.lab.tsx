import type { LabEntry } from "../lab"
import { ObjectiveList } from "./ObjectiveList"
import styles from "./molecules.lab.module.css"

const OBJECTIVES = [
  {
    id: "obj.manchuria.causes",
    text: "Explain why the Kwantung Army acted in September 1931 and why Tokyo followed.",
    level: "analyse",
    mastery: 0.8,
  },
  {
    id: "obj.manchuria.league",
    text: "Evaluate whether the League's failure over Manchuria was inevitable.",
    level: "evaluate",
    mastery: 0.4,
  },
  { id: "obj.manchuria.china", text: "Describe Nanjing's options in 1931 and the one it chose.", level: "explain" },
]

function Mixed() {
  return (
    <div className={styles.column}>
      <ObjectiveList objectives={OBJECTIVES} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "ObjectiveList",
  level: "molecule",
  layout: "stacked",
  states: { "Assessed and not": Mixed },
}
