import { useState } from "react"
import { Icon } from "../atoms/Icon"
import { IconButton } from "../atoms/IconButton"
import { StateMark, type MarkState } from "../atoms/StateMark"
import { Text } from "../atoms/Text"
import styles from "./PlanOutline.module.css"

export interface OutlineUnit {
  id: string
  title: string
  /** The plan's estimate, as written: "2.5h", "50 min". */
  estimate?: string
  objectives: { id: string; text: string; level: string }[]
  /** Where the learner or the content stands, once the plan is a course. */
  state?: MarkState
  /** Against the plan before the last revision. */
  change?: "new" | "changed"
}

export interface OutlineChapter {
  id: string
  title: string
  units: OutlineUnit[]
}

export interface OutlinePart {
  id: string
  /** Absent when the plan has no parts. */
  title?: string
  chapters: OutlineChapter[]
}

interface Props {
  parts: OutlinePart[]
  /** Makes each unit's title open it. */
  onSelect?: (unitId: string) => void
  /** Adds a "comment on this" action to chapters and units; it is given the title. */
  onComment?: (title: string) => void
}

/** Hours in an estimate such as "2.5h", "2 h" or "50 min"; undefined when it says something else. */
export function hoursIn(estimate?: string): number | undefined {
  const match = estimate?.match(/^\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/i)
  if (!match) return undefined
  const value = Number(match[1])
  return match[2]?.toLowerCase().startsWith("h") ? value : value / 60
}

const total = (units: OutlineUnit[]) => {
  const hours = units.map((unit) => hoursIn(unit.estimate)).filter((value) => value !== undefined)
  if (hours.length < units.length) return undefined
  return `${Number(hours.reduce((sum, value) => sum + value, 0).toFixed(1))}h`
}

// A plan to scan: parts as overlines, chapters as headings with their hours, units as rows with
// hairlines between and their objectives folded away until asked for.
export function PlanOutline({ parts, onSelect, onComment }: Props) {
  const [shown, setShown] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setShown((now) => {
      const next = new Set(now)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.outline}>
      {parts.map((part) => (
        <section key={part.id} className={styles.part}>
          {part.title && (
            <Text variant="overline" as="h2" tone="muted" className={styles.partTitle}>
              {part.title}
            </Text>
          )}
          {part.chapters.map((chapter) => {
            const hours = total(chapter.units)
            return (
              <section key={chapter.id} className={styles.chapter}>
                <header className={styles.chapterHead}>
                  <Text variant="title" as="h3">
                    {chapter.title}
                  </Text>
                  {onComment && (
                    <IconButton icon="comment" size="sm" className={styles.comment} label={`Comment on ${chapter.title}`} onClick={() => onComment(chapter.title)} />
                  )}
                  <Text variant="label" tone="muted" className={styles.figure}>
                    {chapter.units.length} {chapter.units.length === 1 ? "unit" : "units"}
                    {hours && ` · ${hours}`}
                  </Text>
                </header>
                <ol className={styles.units}>
                  {chapter.units.map((unit) => {
                    const open = shown.has(unit.id)
                    return (
                      <li key={unit.id} className={styles.unit} data-change={unit.change}>
                        <div className={styles.unitHead}>
                          {unit.state && <StateMark state={unit.state} />}
                          <div className={styles.unitTitle}>
                            {onSelect ? (
                              <button type="button" className={styles.link} onClick={() => onSelect(unit.id)}>
                                {unit.title}
                              </button>
                            ) : (
                              <Text>{unit.title}</Text>
                            )}
                            {unit.change && (
                              <Text variant="label" className={styles.change}>
                                {unit.change === "new" ? "New" : "Changed"}
                              </Text>
                            )}
                          </div>
                          {onComment && (
                            <IconButton icon="comment" size="sm" className={styles.comment} label={`Comment on ${unit.title}`} onClick={() => onComment(unit.title)} />
                          )}
                          <button type="button" className={styles.toggle} aria-expanded={open} onClick={() => toggle(unit.id)}>
                            <Text variant="label" tone="muted">
                              {unit.objectives.length} {unit.objectives.length === 1 ? "objective" : "objectives"}
                            </Text>
                            <Icon name={open ? "open" : "closed"} size="sm" />
                          </button>
                          <Text variant="label" tone="muted" className={styles.estimate}>
                            {unit.estimate}
                          </Text>
                        </div>
                        {open && (
                          <ul className={styles.objectives}>
                            {unit.objectives.map((objective) => (
                              <li key={objective.id}>
                                <Text variant="label" tone="faint" className={styles.level}>
                                  {objective.level}
                                </Text>
                                <Text variant="label" tone="muted">
                                  {objective.text}
                                </Text>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </section>
            )
          })}
        </section>
      ))}
    </div>
  )
}
