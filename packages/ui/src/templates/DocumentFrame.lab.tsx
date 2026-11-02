import type { LabEntry } from "../lab"
import { useId, type ReactNode } from "react"
import { Text } from "../atoms/Text"
import { ObjectiveList } from "../molecules/ObjectiveList"
import { outline, Prose } from "../molecules/Prose"
import { SAMPLE_BLOCKS } from "../molecules/Prose.lab"
import { ReadingProgress } from "../molecules/ReadingProgress"
import { DocumentFrame } from "./DocumentFrame"
import styles from "./templates.lab.module.css"

// The course page in miniature: a stage that scrolls, with the page's padding, so the frame can reach
// past it the way it does in the app.
function Stage({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div className={styles.docStage} style={{ width }}>
      <div className={styles.docColumn}>{children}</div>
    </div>
  )
}

function Reading({ width }: { width: number }) {
  const id = useId()
  return (
    <Stage width={width}>
      <DocumentFrame sideLabel="Sections" side={<ReadingProgress target={id} sections={outline(SAMPLE_BLOCKS, "Key terms")} minutes={25} />}>
        <article id={id} style={{ maxWidth: "calc(var(--measure-prose) + var(--space-16))" }}>
          <Prose markdown={SAMPLE_BLOCKS} lead glossary="Key terms" />
        </article>
      </DocumentFrame>
    </Stage>
  )
}

function Brief({ width }: { width: number }) {
  return (
    <Stage width={width}>
      <DocumentFrame
        sideLabel="Objectives"
        side={
          <>
            <Text variant="strong" as="h2">
              What the tutor will probe
            </Text>
            <ObjectiveList
              objectives={[
                { id: "obj.a", text: "Use Big-O notation to compare the time and space cost of common operations.", level: "explain" },
                { id: "obj.b", text: "Explain how hash tables achieve average O(1) lookups.", level: "explain", mastery: 0.6 },
              ]}
            />
          </>
        }
      >
        <article style={{ maxWidth: "calc(var(--measure-prose) + var(--space-16))" }}>
          <Prose markdown={"In this seminar you talk through the two ideas from the reading with a tutor. The tutor won't lecture: they will ask you to explain things in your own words and defend your choices.\n\nTo prepare, finish the reading, then pick one place in your own work where you look things up by key."} lead />
        </article>
      </DocumentFrame>
    </Stage>
  )
}

export const lab: LabEntry = {
  name: "DocumentFrame",
  level: "template",
  layout: "stacked",
  states: {
    "A reading, wide": () => <Reading width={1200} />,
    "A brief, wide": () => <Brief width={1200} />,
    "A brief, narrow": () => <Brief width={760} />,
  },
}
