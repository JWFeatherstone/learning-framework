import type { LabEntry } from "../lab"
import { useState } from "react"
import { IconButton } from "../atoms/IconButton"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { ModuleMenu } from "./Menu.lab"
import { Toolbar, ToolbarSeparator } from "./Toolbar"
import styles from "./molecules.lab.module.css"

// Live: show or hide the navigation, pick a module from the menu, toggle the plan table. Tab once to reach
// the toolbar, then use the arrow keys, Home and End; Enter or the down arrow opens a menu.
function InTheBar() {
  const [nav, setNav] = useState(true)
  const [table, setTable] = useState(false)
  return (
    <TooltipProvider>
      <div className={styles.barStage}>
        <div className={styles.bar}>
          <Toolbar label="Course tools">
            <IconButton
              icon="nav"
              label="Navigation"
              shortcut={["["]}
              aria-pressed={nav}
              onClick={() => setNav(!nav)}
            />
            <ModuleMenu />
            <ToolbarSeparator />
            <IconButton
              icon="table"
              label="Plan as a table"
              shortcut={["T"]}
              aria-pressed={table}
              onClick={() => setTable(!table)}
            />
          </Toolbar>
        </div>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Toolbar",
  level: "molecule",
  states: { "In the top bar": InTheBar },
}
