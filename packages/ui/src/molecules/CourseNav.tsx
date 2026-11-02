import { useEffect, useState } from "react"
import { Icon } from "../atoms/Icon"
import { StateMark, type MarkState } from "../atoms/StateMark"
import { Text } from "../atoms/Text"
import styles from "./CourseNav.module.css"

export interface NavUnit {
  id: string
  title: string
  state: MarkState
  /** The plan's estimate, as written: "2.5h". */
  estimate?: string
}

export interface NavChapter {
  id: string
  title: string
  units: NavUnit[]
}

export interface NavPart {
  id: string
  /** Absent when the plan has no parts: the chapters stand on their own. */
  title?: string
  chapters: NavChapter[]
}

interface Props {
  parts: NavPart[]
  currentId?: string
  onSelect: (unitId: string) => void
}

const finished = (unit: NavUnit) => unit.state === "complete" || unit.state === "assessed"

// The plan as a tree down the left: parts as headers, chapters as one accordion, units as rows with a
// state mark and their estimate. One chapter is open at a time, the current unit's (or, with none, the
// first with something left to do), so a long plan shows its shape and only one chapter's detail.
export function CourseNav({ parts, currentId, onSelect }: Props) {
  const chapters = parts.flatMap((part) => part.chapters)
  const home = (
    chapters.find((chapter) => chapter.units.some((unit) => unit.id === currentId)) ??
    chapters.find((chapter) => chapter.units.some((unit) => !finished(unit)))
  )?.id
  const [open, setOpen] = useState(home)
  useEffect(() => setOpen(home), [home])

  return (
    <nav aria-label="Course" className={styles.nav}>
      {parts.map((part) => (
        <section key={part.id} className={styles.part}>
          {part.title && (
            <Text variant="overline" as="h2" className={styles.partTitle}>
              {part.title}
            </Text>
          )}
          {part.chapters.map((chapter) => {
            const isOpen = open === chapter.id
            return (
              <div key={chapter.id} className={styles.chapterGroup} data-open={isOpen || undefined}>
                <button
                  type="button"
                  className={styles.chapter}
                  aria-expanded={isOpen}
                  data-current={chapter.id === home && currentId ? true : undefined}
                  onClick={() => setOpen(isOpen ? undefined : chapter.id)}
                >
                  <Icon name={isOpen ? "open" : "closed"} size="sm" />
                  <span className={styles.chapterTitle}>{chapter.title}</span>
                  <Text variant="label" tone="muted" className={styles.figure}>
                    {chapter.units.filter(finished).length}/{chapter.units.length}
                  </Text>
                </button>
                {isOpen && (
                  <ul className={styles.units}>
                    {chapter.units.map((unit) => (
                      <li key={unit.id}>
                        <button
                          type="button"
                          className={styles.unit}
                          aria-current={unit.id === currentId ? "page" : undefined}
                          onClick={() => onSelect(unit.id)}
                        >
                          <StateMark state={unit.state} />
                          <span className={styles.unitTitle}>{unit.title}</span>
                          {unit.estimate && (
                            <Text variant="label" tone="muted" className={styles.figure}>
                              {unit.estimate}
                            </Text>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </nav>
  )
}
