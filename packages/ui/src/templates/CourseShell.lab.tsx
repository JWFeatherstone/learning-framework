import type { LabEntry } from "../lab"
import { useState } from "react"
import { Button } from "../atoms/Button"
import { IconButton } from "../atoms/IconButton"
import { Tag } from "../atoms/Tag"
import { Text } from "../atoms/Text"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { CourseNav } from "../molecules/CourseNav"
import { FIXTURE_PARTS } from "../molecules/CourseNav.lab"
import { ModuleRow } from "../molecules/ModuleRow"
import { ObjectiveList } from "../molecules/ObjectiveList"
import { Prose } from "../molecules/Prose"
import { SAMPLE_READING } from "../molecules/Prose.lab"
import { TopBar } from "../molecules/TopBar"
import { CourseShell } from "./CourseShell"
import styles from "./templates.lab.module.css"

const CHAPTERS = [
  { id: "c1", title: "Origins 1919–1939", done: 3, of: 3 },
  { id: "c2", title: "The war in Europe", done: 1, of: 4, current: true },
  { id: "c3", title: "The Pacific", done: 0, of: 2 },
  { id: "c4", title: "Home fronts", done: 0, of: 3 },
  { id: "c5", title: "Endings", done: 0, of: 1 },
]

const bar = (navOpen: boolean, toggle: () => void) => (
  <TopBar
    start={
      <>
        <IconButton icon="nav" variant="ghost" label={navOpen ? "Hide the navigation" : "Show the navigation"} shortcut={["["]} aria-expanded={navOpen} onClick={toggle} />
        <Text variant="strong">Learning Framework</Text>
      </>
    }
    end={<IconButton icon="dark" label="Switch to the dark theme" />}
  />
)

function UnitPage({ open }: { open: boolean }) {
  const [current, setCurrent] = useState("p1.c1.u1")
  const [navOpen, setNavOpen] = useState(open)
  return (
    <TooltipProvider>
      <div className={styles.frame}>
        <CourseShell
          bar={bar(navOpen, () => setNavOpen(!navOpen))}
          chapters={CHAPTERS}
          nav={<CourseNav parts={FIXTURE_PARTS} currentId={current} onSelect={setCurrent} />}
          navOpen={navOpen}
        >
          <div className={styles.stack}>
            <Text variant="label" tone="muted">
              Origins 1919–1939 › Asia
            </Text>
            <Text variant="heading" as="h1">
              Manchuria, 1931
            </Text>
            <div className={styles.row}>
              <Tag>p1.c1.u1</Tag>
              <Tag>2 h</Tag>
            </div>
          </div>
          <div className={styles.modules}>
            <ModuleRow kind="reading" state="complete" approach="perspectives" detail="50 min" action={<Button>Read again</Button>} />
            <ModuleRow
              kind="exercise"
              state="generated"
              approach="seminar"
              detail="Dialogue"
              action={
                <Button variant="primary" icon="exercise">
                  Start
                </Button>
              }
            />
            <ModuleRow kind="test" state="planned" detail="Not generated yet" action={<Button icon="generate">Generate</Button>} />
          </div>
          <Text variant="title" as="h2">
            Objectives
          </Text>
          <ObjectiveList
            objectives={[
              { id: "obj.manchuria.causes", text: "Explain why the Kwantung Army acted and why Tokyo followed.", level: "analyse", mastery: 0.8 },
              { id: "obj.manchuria.league", text: "Evaluate whether the League's failure was inevitable.", level: "evaluate" },
            ]}
          />
        </CourseShell>
      </div>
    </TooltipProvider>
  )
}

function ReadingPage() {
  const [current, setCurrent] = useState("p1.c1.u1")
  return (
    <TooltipProvider>
      <div className={styles.frame}>
        <CourseShell
          bar={bar(true, () => undefined)}
          chapters={CHAPTERS}
          nav={<CourseNav parts={FIXTURE_PARTS} currentId={current} onSelect={setCurrent} />}
          navOpen
        >
          <div className={styles.stack}>
            <Text variant="label" tone="muted">
              Manchuria, 1931 › Reading
            </Text>
            <Text variant="heading" as="h1">
              Three capitals and a railway
            </Text>
          </div>
          <Prose markdown={SAMPLE_READING} lead />
        </CourseShell>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "CourseShell",
  level: "template",
  layout: "stacked",
  states: {
    "Unit page, navigation open": () => <UnitPage open />,
    "Unit page, navigation closed": () => <UnitPage open={false} />,
    Reading: ReadingPage,
  },
}
