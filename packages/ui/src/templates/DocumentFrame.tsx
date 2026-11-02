import type { ReactNode } from "react"
import styles from "./DocumentFrame.module.css"

interface Props {
  /** The document: a reading, a brief, a test. It is centred at its own width. */
  children: ReactNode
  /** What the document is read against: its map, its objectives, its progress. */
  side: ReactNode
  /** Names the side column for assistive technology. */
  sideLabel: string
}

// A document page on a desktop screen: the text centred in the room the rails leave, and down the right
// a column of chrome the full height of the screen, mirroring the navigation on the left. Where the two
// don't fit side by side, the column follows the document.
export function DocumentFrame({ children, side, sideLabel }: Props) {
  return (
    <div className={styles.frame}>
      <div className={styles.document}>{children}</div>
      <aside className={styles.side} aria-label={sideLabel}>
        {side}
      </aside>
    </div>
  )
}
