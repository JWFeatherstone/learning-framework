import type { LabEntry } from "../lab"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Panel } from "./Panel"
import styles from "./molecules.lab.module.css"

const close = () => undefined

function Contents({ height }: { height: number }) {
  return (
    <div className={styles.placeholder} style={{ height }}>
      Contents, {height}px
    </div>
  )
}

function Short() {
  return (
    <TooltipProvider>
      <div className={styles.page}>
        <Panel
          label="Reference"
          title="Iriye, The Origins of the Second World War in Asia"
          detail="Book · verified"
          onClose={close}
        >
          <Contents height={160} />
        </Panel>
      </div>
    </TooltipProvider>
  )
}

function Long() {
  return (
    <TooltipProvider>
      <div className={styles.page}>
        <Panel
          label="Session"
          title="Seminar: was the League's failure inevitable?"
          detail="Dialogue · 14 turns"
          closeLabel="Close the session"
          onClose={close}
        >
          <Contents height={720} />
        </Panel>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Panel",
  level: "molecule",
  states: {
    "Short contents": Short,
    "Long contents scroll under the header": Long,
  },
}
