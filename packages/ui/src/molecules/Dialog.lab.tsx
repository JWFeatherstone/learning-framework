import type { LabEntry } from "../lab"
import { Button } from "../atoms/Button"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Dialog } from "./Dialog"
import styles from "./molecules.lab.module.css"

// Live: open it, then close with the button, Esc or a click on the dimmed screen.
function Opened() {
  return (
    <TooltipProvider>
      <Dialog title="Data" trigger={<Button>Open the dialog</Button>}>
        <div className={styles.dialogBody}>Contents</div>
      </Dialog>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Dialog",
  level: "molecule",
  states: { "Opened from a button": Opened },
}
