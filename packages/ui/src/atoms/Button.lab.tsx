import type { LabEntry } from "../lab"
import type { ReactNode } from "react"
import { Button } from "./Button"
import { IconButton } from "./IconButton"
import { TooltipProvider } from "./TooltipProvider"
import styles from "./atoms.lab.module.css"

const VARIANTS = ["primary", "secondary", "ghost"] as const
const LABELS = { primary: "Export", secondary: "Save selection", ghost: "Copy link" }
const STATES = ["rest", "hover", "pressed", "focus", "disabled", "unavailable", "loading"] as const

function Variants() {
  return (
    <div className={`${styles.surface} ${styles.stack}`}>
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className={styles.row}>
          <span className={styles.caption}>{size === "md" ? "32px" : "24px"}</span>
          <Button variant="primary" size={size} icon="download">
            Export
          </Button>
          <Button variant="secondary" size={size}>
            Save selection
          </Button>
          <Button variant="ghost" size={size} icon="copyLink">
            Copy link
          </Button>
        </div>
      ))}
    </div>
  )
}

function States() {
  return (
    <div className={styles.surface}>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th />
            {STATES.map((state) => (
              <th key={state}>{state}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((variant) => (
            <tr key={variant}>
              <th>{variant}</th>
              {STATES.map((state) => (
                <td key={state}>
                  <Button
                    variant={variant}
                    data-lab-state={state}
                    disabled={state === "disabled"}
                    disabledReason={state === "unavailable" ? "Sign in to export" : undefined}
                    loading={state === "loading"}
                  >
                    {LABELS[variant]}
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.caption}>
        Unavailable looks like disabled but stays focusable, and its tooltip says why. Hover it to see.
      </p>
    </div>
  )
}

function IconOnly() {
  return (
    <div className={`${styles.surface} ${styles.stack}`}>
      <div className={styles.row}>
        <span className={styles.caption}>Map toolbar, active tool on</span>
        <div className={styles.toolbar}>
          <IconButton icon="select" label="Inspect a cell" shortcut={["V"]} aria-pressed="true" />
          <IconButton icon="drawPolygon" label="Draw a polygon" shortcut={["P"]} aria-pressed="false" />
          <IconButton icon="drawRectangle" label="Draw a rectangle" shortcut={["R"]} aria-pressed="false" />
          <IconButton icon="drawCircle" label="Draw a circle" shortcut={["C"]} aria-pressed="false" />
          <IconButton icon="zoomIn" label="Zoom in" shortcut={["+"]} />
          <IconButton icon="zoomOut" label="Zoom out" shortcut={["−"]} />
          <IconButton icon="center" label="Centre on the selection" />
        </div>
      </div>
      <div className={styles.row}>
        <span className={styles.caption}>Rest, hover, pressed, focus, disabled</span>
        {STATES.slice(0, 5).map((state) => (
          <IconButton
            key={state}
            icon="close"
            label="Close"
            size="sm"
            data-lab-state={state}
            disabled={state === "disabled"}
          />
        ))}
      </div>
      <div className={styles.row}>
        <span className={styles.caption}>Secondary and primary</span>
        <IconButton icon="copyLink" label="Copy link" variant="secondary" />
        <IconButton icon="download" label="Export" variant="primary" />
      </div>
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
  name: "Button",
  level: "atom",
  layout: "stacked",
  states: {
    Variants: withTooltips(Variants),
    States: withTooltips(States),
    "Icon only": withTooltips(IconOnly),
  },
}
