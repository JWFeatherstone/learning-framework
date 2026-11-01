import type { ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { ProgressBar } from "../atoms/ProgressBar"
import { Text } from "../atoms/Text"
import styles from "./CourseShell.module.css"

interface Props {
  /** The bar across the top, from the app. */
  bar: ReactNode
  /** The topic's title, at the head of the rail. */
  title: string
  /** Units finished out of all. Shown as a figure and a bar, never as a streak. */
  completion: { done: number; of: number }
  /** The tree, usually a CourseNav. */
  nav: ReactNode
  navOpen: boolean
  onToggleNav: () => void
  children: ReactNode
}

// The course layout: a bar, a rail down the left that opens to the outline width and closes to a strip
// with just the toggle, and the page beside it in a column at the prose measure. The pattern is the
// one education platforms settled on; nothing here is new on purpose.
export function CourseShell({ bar, title, completion, nav, navOpen, onToggleNav, children }: Props) {
  const share = completion.of === 0 ? 0 : completion.done / completion.of
  return (
    <div className={styles.shell} data-nav={navOpen ? "open" : "closed"}>
      {bar}
      <div className={styles.body}>
        <aside className={styles.rail} aria-label="Course navigation">
          <div className={styles.railHead}>
            <IconButton
              icon="nav"
              label={navOpen ? "Hide the navigation" : "Show the navigation"}
              shortcut={["["]}
              aria-pressed={navOpen}
              onClick={onToggleNav}
            />
            {navOpen && (
              <div className={styles.summary}>
                <Text variant="strong" as="div" className={styles.title}>
                  {title}
                </Text>
                <Text variant="label" tone="muted">
                  {completion.done} of {completion.of} units finished
                </Text>
                <ProgressBar value={share} label={`${completion.done} of ${completion.of} units finished`} size="sm" />
              </div>
            )}
          </div>
          {navOpen && <div className={styles.navScroll}>{nav}</div>}
        </aside>
        <main className={styles.page}>
          <div className={styles.column}>{children}</div>
        </main>
      </div>
    </div>
  )
}
