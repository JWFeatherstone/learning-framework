import type { LabEntry } from "../lab"
import type { ReactNode } from "react"
import { Button } from "./Button"
import { IconButton } from "./IconButton"
import { Tooltip } from "./Tooltip"
import { TooltipProvider } from "./TooltipProvider"
import styles from "./atoms.lab.module.css"

function OverTheMap() {
  return (
    <div className={`${styles.stage} ${styles.mapStage}`}>
      <div className={styles.toolbar}>
        <IconButton icon="select" label="Inspect a cell" shortcut={["V"]} aria-pressed="true" />
        <IconButton icon="drawPolygon" label="Draw a polygon" shortcut={["P"]} tooltipOpen />
        <IconButton icon="drawRectangle" label="Draw a rectangle" shortcut={["R"]} />
        <IconButton icon="drawCircle" label="Draw a circle" shortcut={["C"]} />
        <IconButton icon="zoomIn" label="Zoom in" shortcut={["+"]} />
        <IconButton icon="zoomOut" label="Zoom out" shortcut={["−"]} />
      </div>
      <Tooltip label="Search places" shortcut={["⌘", "K"]} open>
        <Button variant="secondary" icon="search">
          Search places
        </Button>
      </Tooltip>
    </div>
  )
}

function OnAPanel() {
  return (
    <div className={`${styles.stage} ${styles.panelStage}`}>
      <Button
        variant="primary"
        icon="download"
        disabledReason="Exports include proprietary layers, so they need you to sign in."
        tooltipOpen
      >
        Export
      </Button>
      <IconButton icon="table" label="Show figures as a table" size="sm" tooltipOpen />
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
    "Over the map": withTooltips(OverTheMap),
    "On a panel, with a reason a button can't act": withTooltips(OnAPanel),
  },
}
