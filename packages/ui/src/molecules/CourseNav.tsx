import { useState } from "react"
import { Icon } from "../atoms/Icon"
import { ProgressBar } from "../atoms/ProgressBar"
import { StateMark, type MarkState } from "../atoms/StateMark"
import { Text } from "../atoms/Text"
import styles from "./CourseNav.module.css"

export interface NavUnit {
  id: string
  title: string
  state: MarkState
  /** Modules finished, 0 to 3. */
  done: number
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

// The plan as a tree down the left: parts as headers, chapters that open and close, units as rows with
// a state mark and a thin bar for the modules finished. The chapter holding the current unit starts open
// and the rest closed, so a long plan fits; with no current unit (the topic's home) every chapter is open.
export function CourseNav({ parts, currentId, onSelect }: Props) {
  const chapters = parts.flatMap((part) => part.chapters)
  const current = chapters.find((chapter) => chapter.units.some((unit) => unit.id === currentId))
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current.id] : chapters.map((chapter) => chapter.id)))
  const toggle = (id: string) =>
    setOpen((now) => {
      const next = new Set(now)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

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
            const isOpen = open.has(chapter.id)
            const finished = chapter.units.filter((unit) => unit.state === "complete" || unit.state === "assessed")
            return (
              <div key={chapter.id}>
                <button
                  type="button"
                  className={styles.chapter}
                  aria-expanded={isOpen}
                  onClick={() => toggle(chapter.id)}
                >
                  <Icon name={isOpen ? "open" : "closed"} size="sm" />
                  <span className={styles.chapterTitle}>{chapter.title}</span>
                  <Text variant="label" tone="muted">
                    {finished.length}/{chapter.units.length}
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
                          <span className={styles.unitBody}>
                            <span className={styles.unitTitle}>{unit.title}</span>
                            <ProgressBar value={unit.done / 3} label={`${unit.done} of 3 modules`} size="sm" />
                          </span>
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
