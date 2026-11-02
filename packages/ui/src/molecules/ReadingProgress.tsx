import { useEffect, useRef, useState } from "react"
import styles from "./ReadingProgress.module.css"

export interface ProgressSection {
  id: string
  title: string
  level: 2 | 3
}

interface Props {
  /** The id of the element being read; its headings carry the sections' ids. */
  target: string
  sections: ProgressSection[]
  /** A map of the text the height of its column, or a line across the top when there is no column. */
  variant?: "map" | "bar"
  /** The whole text's reading time, for the time left. */
  minutes?: number
}

interface Reading {
  /** How far through the text the reader is, 0 to 1. */
  share: number
  /** The section whose heading they last passed. */
  current?: string
  /** Where each section starts, as a share of the text. */
  at: number[]
}

/** A section's heading, looked up inside the target, so two copies of a text on one screen don't mix. */
const heading = (target: string, id: string) => document.getElementById(target)?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)

/** The nearest ancestor that scrolls, or none when the window does. */
function scroller(element: HTMLElement): HTMLElement | undefined {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node
  }
  return undefined
}

const same = (a: Reading, b: Reading) =>
  a.share === b.share && a.current === b.current && a.at.length === b.at.length && a.at.every((value, i) => value === b.at[i])

function useReading(target: string, sections: ProgressSection[]): Reading {
  const [state, setState] = useState<Reading>({ share: 0, current: sections[0]?.id, at: [] })
  useEffect(() => {
    const measure = () => {
      const element = document.getElementById(target)
      if (!element) return
      const view = scroller(element)
      const top = view?.getBoundingClientRect().top ?? 0
      const height = view?.clientHeight ?? innerHeight
      const box = element.getBoundingClientRect()
      const span = box.height - height
      const share = span <= 0 ? 1 : Math.min(1, Math.max(0, (top - box.top) / span))
      const tops = sections.map((section) => heading(target, section.id)?.getBoundingClientRect().top ?? box.bottom)
      const at = tops.map((y) => Math.round(((y - box.top) / box.height) * 1000) / 1000)
      // A heading counts as passed once it reaches the top third of what is in view.
      const passed = sections.filter((_, i) => (tops[i] ?? Infinity) - top < height / 3)
      const next = { share, current: passed[passed.length - 1]?.id ?? sections[0]?.id, at }
      setState((now) => (same(now, next) ? now : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    const element = document.getElementById(target)
    if (element) observer.observe(element)
    // Capture, so a scroll inside any container (the course's page scrolls, not the window) is heard.
    addEventListener("scroll", measure, { capture: true, passive: true })
    addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      removeEventListener("scroll", measure, { capture: true })
      removeEventListener("resize", measure)
    }
  }, [target, sections])
  return state
}

const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth")

const jumpTo = (target: string, id: string) => heading(target, id)?.scrollIntoView({ behavior: smooth(), block: "start" })

/** Scrolls so the reader is the given share of the way through the text. */
function jumpToShare(target: string, share: number) {
  const element = document.getElementById(target)
  if (!element) return
  const view = scroller(element)
  if (!view) return
  const start = element.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop
  view.scrollTo({ top: start + share * (element.offsetHeight - view.clientHeight), behavior: smooth() })
}

function timeLeft(minutes: number, share: number) {
  const left = Math.round(minutes * (1 - share))
  if (left < 1 || share > 0.98) return "At the end"
  if (left < 60) return `About ${left} min left`
  const hours = Math.floor(left / 60)
  const rest = Math.round((left % 60) / 5) * 5
  return rest ? `About ${hours}h ${rest}m left` : `About ${hours}h left`
}

/** Label positions in px: each at its section's place, pushed apart just enough not to overlap. */
function spread(at: number[], height: number, gap: number) {
  const ys = at.map((share) => share * height)
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i] ?? 0, (ys[i - 1] ?? 0) + gap)
  for (let i = ys.length - 1; i >= 0; i--) ys[i] = Math.min(ys[i] ?? 0, i === ys.length - 1 ? height - gap / 2 : (ys[i + 1] ?? 0) - gap)
  return ys
}

// Where the reader is in a long text. As a map, the column's height stands for the whole text: each
// section's tick sits where it starts, so a long section takes a long stretch; the line fills to where the
// reader is; a click anywhere goes there. Subsections are ticks only, named while the reader is in them.
// As a bar, only the line.
export function ReadingProgress({ target, sections, variant = "map", minutes }: Props) {
  const { share, current, at } = useReading(target, sections)
  const field = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!field.current) return
    const observer = new ResizeObserver(([entry]) => setHeight(entry?.contentRect.height ?? 0))
    observer.observe(field.current)
    return () => observer.disconnect()
  }, [variant])

  const percent = Math.round(share * 100)
  const progress = { role: "progressbar", "aria-label": `${percent}% read`, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percent }

  if (variant === "bar") {
    return (
      <div className={styles.bar} {...progress}>
        <div className={styles.barFill} style={{ width: `${share * 100}%` }} />
      </div>
    )
  }

  const major = sections.map((section, i) => ({ section, at: at[i] ?? 0 })).filter(({ section }) => section.level === 2)
  const labels = spread(
    major.map((entry) => entry.at),
    height,
    32,
  )
  const currentIndex = sections.findIndex((section) => section.id === current)
  const currentMajor = sections.slice(0, currentIndex + 1).filter((section) => section.level === 2).pop()?.id

  return (
    <nav className={styles.map} aria-label="Sections">
      {minutes !== undefined && <p className={styles.left}>{timeLeft(minutes, share)}</p>}
      <div
        ref={field}
        className={styles.field}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          jumpToShare(target, (event.clientY - box.top) / box.height)
        }}
      >
        <div className={styles.track} {...progress}>
          <div className={styles.trackFill} style={{ height: `${share * 100}%` }} />
        </div>
        {sections.map((section, i) => (
          <span
            key={`tick-${section.id}`}
            className={styles.tick}
            data-level={section.level}
            data-passed={(at[i] ?? 1) <= share || undefined}
            style={{ top: `${(at[i] ?? 0) * 100}%` }}
          />
        ))}
        <ol className={styles.sections}>
          {sections.map((section, i) => {
            const majorIndex = major.findIndex((entry) => entry.section.id === section.id)
            const here = section.id === current || (section.level === 2 && section.id === currentMajor)
            const top = majorIndex >= 0 ? labels[majorIndex] : (at[i] ?? 0) * height
            return (
              <li key={section.id} data-level={section.level} data-shown={section.level === 2 || section.id === current || undefined} style={{ top }}>
                <a
                  href={`#${section.id}`}
                  className={styles.section}
                  aria-current={here ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    jumpTo(target, section.id)
                  }}
                >
                  {section.title}
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
