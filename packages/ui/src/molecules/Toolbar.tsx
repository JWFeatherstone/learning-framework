import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from "react"
import styles from "./Toolbar.module.css"

interface Props {
  /** Names the toolbar for screen readers, such as "Map tools". */
  label: string
  /** Icon buttons, with separators between groups. */
  children: ReactNode
}

const MOVES: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
}

// A row of buttons that is one stop for Tab; the arrow keys move between them. The stop starts on the
// pressed tool, or the first button, and then stays wherever focus last was.
export function Toolbar({ label, children }: Props) {
  const row = useRef<HTMLDivElement>(null)
  const stop = useRef<HTMLElement | null>(null)

  const buttons = () => Array.from(row.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])
  const makeStop = (target: HTMLElement) => {
    stop.current = target
    for (const button of buttons()) button.tabIndex = button === target ? 0 : -1
  }

  // Runs after every render, since the buttons are the caller's and may change.
  useEffect(() => {
    const all = buttons()
    const current = stop.current && all.includes(stop.current) ? stop.current : null
    const target = current ?? all.find((button) => button.getAttribute("aria-pressed") === "true") ?? all[0]
    if (target) makeStop(target)
  })

  const follow = (event: FocusEvent) => {
    if (event.target instanceof HTMLElement && buttons().includes(event.target)) makeStop(event.target)
  }

  const move = (event: KeyboardEvent) => {
    const all = buttons()
    const index = all.indexOf(document.activeElement as HTMLElement)
    const next = MOVES[event.key]
    // Keys pressed inside a menu opened from the toolbar reach here too; they aren't the toolbar's.
    if (index < 0 || !next) return
    event.preventDefault()
    all[next(index, all.length)]?.focus()
  }

  return (
    <div
      ref={row}
      role="toolbar"
      aria-label={label}
      className={styles.toolbar}
      onFocus={follow}
      onKeyDown={move}
    >
      {children}
    </div>
  )
}

export function ToolbarSeparator() {
  return <span role="separator" aria-orientation="vertical" className={styles.separator} />
}
