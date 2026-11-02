import type { LabEntry } from "../lab"
import { useId } from "react"
import { outline, Prose } from "./Prose"
import { SAMPLE_BLOCKS } from "./Prose.lab"
import { ReadingProgress } from "./ReadingProgress"
import styles from "./molecules.lab.module.css"

// A reading in a short scrolling frame, so the rail and the bar have somewhere to go.
function Frame({ variant }: { variant: "map" | "bar" }) {
  const id = useId()
  const sections = outline(SAMPLE_BLOCKS, "Key terms")
  return (
    <div className={styles.readingFrame} data-variant={variant}>
      {variant === "bar" && <ReadingProgress target={id} sections={sections} variant="bar" />}
      <div className={styles.readingGrid}>
        <div id={id}>
          <Prose markdown={SAMPLE_BLOCKS} lead glossary="Key terms" />
        </div>
        {variant === "map" && (
          <div className={styles.readingRail}>
            <ReadingProgress target={id} sections={sections} minutes={25} />
          </div>
        )}
      </div>
    </div>
  )
}

export const lab: LabEntry = {
  name: "ReadingProgress",
  level: "molecule",
  layout: "stacked",
  states: {
    "A map beside the text": () => <Frame variant="map" />,
    "Across the top, narrow": () => <Frame variant="bar" />,
  },
}
