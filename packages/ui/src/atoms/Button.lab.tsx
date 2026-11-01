import type { LabEntry } from "../lab"
import type { ReactNode } from "react"
import { Button } from "./Button"
import { IconButton } from "./IconButton"
import { TooltipProvider } from "./TooltipProvider"
import styles from "./atoms.lab.module.css"

const VARIANTS = ["primary", "secondary", "ghost"] as const
const LABELS = { primary: "Generate reading", secondary: "Open outline", ghost: "Comment" }
const STATES = ["rest", "hover", "pressed", "focus", "disabled", "unavailable", "loading"] as const

function Variants() {
  return (
    <div className={`${styles.surface} ${styles.stack}`}>
      {(["md", "sm"] as const).map((size) => (
        <div key={size} className={styles.row}>
          <span className={styles.caption}>{size === "md" ? "32px" : "24px"}</span>
          <Button variant="primary" size={size} icon="generate">
            Generate reading
          </Button>
          <Button variant="secondary" size={size}>
            Open outline
          </Button>
          <Button variant="ghost" size={size} icon="comment">
            Comment
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
                    disabledReason={state === "unavailable" ? "Finish the reading first" : undefined}
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
        <span className={styles.caption}>In the bar, current module on</span>
        <div className={styles.iconButtons}>
          <IconButton icon="reading" label="Reading" shortcut={["1"]} aria-pressed="true" />
          <IconButton icon="exercise" label="Exercise" shortcut={["2"]} aria-pressed="false" />
          <IconButton icon="test" label="Test" shortcut={["3"]} aria-pressed="false" />
          <IconButton icon="nav" label="Hide the navigation" shortcut={["["]} />
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
        <IconButton icon="comment" label="Comment" variant="secondary" />
        <IconButton icon="send" label="Send" variant="primary" />
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
