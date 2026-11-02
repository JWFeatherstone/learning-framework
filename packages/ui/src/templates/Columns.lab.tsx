import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { Text } from "../atoms/Text"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { ModuleRow } from "../molecules/ModuleRow"
import { ObjectiveList } from "../molecules/ObjectiveList"
import { Columns } from "./Columns"
import styles from "./templates.lab.module.css"

const unit = (
  <>
    <div className={styles.stack}>
      <Text variant="heading" as="h1">
        Storage engines: logs, LSM trees and B-trees
      </Text>
    </div>
    <div>
      <ModuleRow kind="reading" state="generated" approach="walkthrough" detail="Read, then mark it finished" action={<Button variant="primary" icon="reading">Read</Button>} />
      <ModuleRow kind="exercise" state="generated" approach="seminar" detail="A dialogue with a tutor" action={<Button variant="primary" icon="exercise">Start</Button>} />
      <ModuleRow kind="test" state="planned" detail="Not generated yet" action={<Button icon="generate">Generate</Button>} />
    </div>
  </>
)

const objectives = (
  <>
    <Text variant="title" as="h2">
      Objectives
    </Text>
    <ObjectiveList
      objectives={[
        { id: "o1", text: "Explain how hash indexes, SSTables and LSM trees handle writes, reads and compaction.", level: "explain" },
        { id: "o2", text: "Compare LSM trees and B-trees on read amplification, write amplification and space.", level: "analyse", mastery: 0.6 },
      ]}
    />
  </>
)

// The page's width decides: the frames show a wide page and a narrow one.
function At({ width }: { width: number }) {
  return (
    <TooltipProvider>
      <div className={styles.frame} style={{ containerType: "inline-size", maxWidth: width, overflowY: "auto", padding: 32 }}>
        <Columns aside={objectives} asideLabel="Objectives">
          {unit}
        </Columns>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Columns",
  level: "template",
  layout: "stacked",
  states: { "Wide page": () => <At width={1200} />, "Narrow page": () => <At width={720} /> },
}
