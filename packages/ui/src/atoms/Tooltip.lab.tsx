import type { LabEntry } from "../lab"
import type { ReactNode } from "react"
import { Button } from "./Button"
import { IconButton } from "./IconButton"
import { Tooltip } from "./Tooltip"
import { TooltipProvider } from "./TooltipProvider"
import styles from "./atoms.lab.module.css"

function OnThePage() {
  return (
    <div className={styles.stage}>
      <div className={styles.iconButtons}>
        <IconButton icon="nav" label="Hide the navigation" shortcut={["["]} aria-pressed="true" />
        <IconButton icon="reading" label="Reading" shortcut={["1"]} tooltipOpen />
        <IconButton icon="exercise" label="Exercise" shortcut={["2"]} />
        <IconButton icon="test" label="Test" shortcut={["3"]} />
      </div>
      <Tooltip label="Search this topic" shortcut={["⌘", "K"]} open>
        <Button variant="secondary" icon="search">
          Search
        </Button>
      </Tooltip>
    </div>
  )
}

function OnASurface() {
  return (
    <div className={`${styles.stage} ${styles.surfaceStage}`}>
      <Button
        variant="primary"
        icon="generate"
        disabledReason="The reading is still being generated; the exercise comes after it."
        tooltipOpen
      >
        Generate exercise
      </Button>
      <IconButton icon="plan" label="Show the plan" size="sm" tooltipOpen />
    </div>
  )
}

const withTooltips = (Specimen: () => ReactNode) =>
  function Wrapped() {
    return (
      <TooltipProvider>
        <Specimen />
      </TooltipProvider>
    )
  }

export const lab: LabEntry = {
  name: "Tooltip",
  level: "atom",
  states: {
    "On the page": withTooltips(OnThePage),
    "On a surface, with a reason a button can't act": withTooltips(OnASurface),
  },
}
