import type { LabEntry } from "../lab"
import { useState } from "react"
import { IconButton } from "../atoms/IconButton"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { DrawMenu } from "./Menu.lab"
import { Toolbar, ToolbarSeparator } from "./Toolbar"
import styles from "./molecules.lab.module.css"

// Live: pick a tool, or a shape from the draw menu, and turn the place names on and off. Tab once to reach
// the toolbar, then use the arrow keys, Home and End; Enter or the down arrow opens a menu.
function InTheBar() {
  const [tool, setTool] = useState<"select" | "draw">("select")
  const [names, setNames] = useState(true)
  return (
    <TooltipProvider>
      <div className={styles.barStage}>
        <div className={styles.bar}>
          <Toolbar label="Map tools">
            <IconButton
              icon="select"
              label="Pick a cell"
              shortcut={["V"]}
              aria-pressed={tool === "select"}
              onClick={() => setTool("select")}
            />
            <DrawMenu pressed={tool === "draw"} onDraw={() => setTool("draw")} />
            <ToolbarSeparator />
            <IconButton icon="catalog" label="Data" shortcut={["L"]} />
            <IconButton
              icon="placeNames"
              label="Place names"
              aria-pressed={names}
              onClick={() => setNames(!names)}
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
