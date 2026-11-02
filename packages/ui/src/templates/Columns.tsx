import type { ReactNode } from "react"
import styles from "./Columns.module.css"

interface Props {
  /** The content: the outline, the module rows, the form. */
  children: ReactNode
  /** What the content is read against: the next action, the objectives, the conversation. It stays in
      view while the content scrolls, and drops below the content when the page is narrow. */
  aside: ReactNode
  /** Names the aside for assistive technology. */
  asideLabel: string
}

// The page's two columns on a wide screen. Both sit on the page, unboxed; a hairline divides them.
export function Columns({ children, aside, asideLabel }: Props) {
  return (
    <div className={styles.columns}>
      <div className={styles.main}>{children}</div>
      <aside className={styles.aside} aria-label={asideLabel}>
        {aside}
      </aside>
    </div>
  )
}
