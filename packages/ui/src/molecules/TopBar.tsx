import type { ReactNode } from "react"
import styles from "./TopBar.module.css"

interface Props {
  /** At the start: the logo. */
  start: ReactNode
  /** Centred: the map's tools. */
  middle?: ReactNode
  /** At the end: the account. */
  end?: ReactNode
}

// The bar across the top of the screen: raised, full width, one line below. Its middle stays
// centred on the screen whatever the ends hold.
export function TopBar({ start, middle, end }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.start}>{start}</div>
      <div className={styles.middle}>{middle}</div>
      <div className={styles.end}>{end}</div>
    </header>
  )
}
