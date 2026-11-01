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
      <div className={styles.map}>
        <Panel label="Selected cell" title="Population" detail="Cell · 0.74 km²" onClose={close}>
          <Contents height={160} />
        </Panel>
      </div>
    </TooltipProvider>
  )
}

function Long() {
  return (
    <TooltipProvider>
      <div className={styles.map}>
        <Panel
          label="Selected area"
          title="Population"
          detail="Drawn area · 24 cells · 3.2 km²"
          closeLabel="Clear selection"
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
