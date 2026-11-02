import type { ReactNode } from "react"
import { Tooltip } from "../atoms/Tooltip"
import styles from "./CourseShell.module.css"

interface Props {
  /** The bar across the top, from the app. It holds the rail's toggle at its start. */
  bar: ReactNode
  /** The topic's chapters in order, with units finished out of all: drawn as a line along the bar's
      bottom edge, never a streak. */
  chapters: { id: string; title: string; done: number; of: number; current?: boolean }[]
  /** The tree, usually a CourseNav. */
  nav: ReactNode
  navOpen: boolean
  children: ReactNode
}

// The course layout: a bar with the topic's progress along its edge, a rail down the left that opens to
// the outline width and closes away entirely, and the page beside it. The toggle lives in the bar so it
// never sits inside what it hides.
export function CourseShell({ bar, chapters, nav, navOpen, children }: Props) {
  const done = chapters.reduce((sum, chapter) => sum + chapter.done, 0)
  const of = chapters.reduce((sum, chapter) => sum + chapter.of, 0)
  return (
    <div className={styles.shell} data-nav={navOpen ? "open" : "closed"}>
      {bar}
      {/* The course as a line: a segment per chapter, as wide as its units, filled as they finish. The
          chapter on screen hangs a little lower, so the line also says where you are. */}
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`${done} of ${of} units finished`}
        aria-valuemin={0}
        aria-valuemax={of}
        aria-valuenow={done}
      >
        {chapters.map((chapter) => (
          <Tooltip key={chapter.id} label={`${chapter.title}: ${chapter.done} of ${chapter.of}`} side="bottom">
            <div className={styles.chapter} style={{ flexGrow: chapter.of }} data-current={chapter.current || undefined}>
              <div className={styles.fill} style={{ width: `${chapter.of === 0 ? 0 : (chapter.done / chapter.of) * 100}%` }} />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className={styles.body}>
        <aside className={styles.rail} aria-label="Course navigation" hidden={!navOpen}>
          <div className={styles.navScroll}>{nav}</div>
        </aside>
        <main className={styles.page}>
          <div className={styles.column}>{children}</div>
        </main>
      </div>
    </div>
  )
}
