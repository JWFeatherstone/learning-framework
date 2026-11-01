import type { ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import type { IconName } from "../atoms/icons"
import styles from "./Callout.module.css"

type Tone = "info" | "warning" | "danger" | "progress"

const ICONS: Record<Tone, IconName> = { info: "info", warning: "warning", danger: "error", progress: "complete" }

interface Props {
  tone?: Tone
  title?: string
  children: ReactNode
  /** Buttons for what to do about it. */
  actions?: ReactNode
}

// A note in the flow of a page: a proposed revision awaiting an answer, a check that failed, a session
// that ended. One icon, a title if there is one, then plain text, then buttons.
export function Callout({ tone = "info", title, children, actions }: Props) {
  return (
    <aside className={`${styles.callout} ${styles[tone]}`} role={tone === "danger" ? "alert" : "note"}>
      <Icon name={ICONS[tone]} size="sm" />
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.text}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </aside>
  )
}
