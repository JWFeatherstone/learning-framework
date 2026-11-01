import type { KeyboardEvent, ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { Text } from "../atoms/Text"
import styles from "./Panel.module.css"

interface Props {
  /** Names the panel for screen readers, such as "Selected cell". */
  label: string
  /** A few words, or a control that chooses what the panel shows, such as a topic menu. */
  title: ReactNode
  /** One short fact at the end of the header, such as the selection's size. */
  detail?: string
  /** Esc does the same while focus is inside the panel. */
  onClose: () => void
  /** What closing does, as the close button's label. */
  closeLabel?: string
  children: ReactNode
}

// A frame for what's selected: one header row that stays, and contents that scroll beneath it. It is
// as tall as its contents, up to the height its container allows.
export function Panel({ label, title, detail, onClose, closeLabel = "Close", children }: Props) {
  const closeOnEscape = (event: KeyboardEvent) => {
    // A menu open inside the panel keeps its Esc to itself; anything else that handles Esc marks it.
    if (event.key !== "Escape" || event.defaultPrevented) return
    event.stopPropagation()
    onClose()
  }

  return (
    <aside className={styles.panel} aria-label={label} onKeyDown={closeOnEscape}>
      <header className={styles.head}>
        <div className={styles.title}>
          {typeof title === "string" ? (
            <Text variant="strong" as="h2">
              {title}
            </Text>
          ) : (
            title
          )}
        </div>
        {detail && (
          <Text variant="label" tone="muted" className={styles.detail}>
            {detail}
          </Text>
        )}
        <IconButton icon="close" label={closeLabel} shortcut={["Esc"]} size="sm" onClick={onClose} />
      </header>
      <div className={styles.body}>{children}</div>
    </aside>
  )
}
