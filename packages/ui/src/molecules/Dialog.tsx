import * as RadixDialog from "@radix-ui/react-dialog"
import type { KeyboardEvent, ReactElement, ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { useThemedRegion } from "../atoms/themedRegion"
import styles from "./Dialog.module.css"

interface Props {
  title: string
  /** The button that opens it, when there is one. It must take a ref. */
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Wide, for two panes; narrow, for one. */
  size?: "wide" | "narrow"
  /** Beside the title, in the top row: a search field, say. The row is the dialog's one band of chrome. */
  tools?: ReactNode
  /** A pane down the left, such as sections or filters. The title sits above it, and one rule runs the
      dialog's full height between it and the contents. */
  sidebar?: ReactNode
  /** Keys pressed anywhere in the dialog pass here first, such as letters to send to a search. */
  onKeyDown?: (event: KeyboardEvent) => void
  children: ReactNode
}

// Focus starts on a field that asks for it with autoFocus, such as a search; otherwise on the dialog
// itself, rather than on the close button, whose tooltip would open on its own.
const focusStart = (event: Event) => {
  event.preventDefault()
  const content = event.currentTarget
  if (content instanceof HTMLElement && !content.contains(document.activeElement)) content.focus()
}

// A modal: solid, over a dimmed screen, with one row of chrome (the title, any tools, close) and its
// contents below, with or without a sidebar. Focus stays inside while open; Esc or close returns it to
// whatever opened the dialog.
export function Dialog(props: Props) {
  const { title, trigger, open, onOpenChange, size = "wide", tools, sidebar, onKeyDown, children } = props
  const [region, attach] = useThemedRegion()
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <RadixDialog.Trigger asChild ref={attach}>
          {trigger}
        </RadixDialog.Trigger>
      )}
      <RadixDialog.Portal container={region}>
        <RadixDialog.Overlay className={styles.scrim} />
        <RadixDialog.Content
          className={`${styles.dialog} ${styles[size]} ${sidebar ? styles.split : ""}`}
          aria-describedby={undefined}
          onOpenAutoFocus={focusStart}
          onKeyDown={onKeyDown}
        >
          <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
          <div className={styles.tools}>
            {tools}
            <RadixDialog.Close asChild>
              <IconButton icon="close" label="Close" shortcut={["Esc"]} size="sm" />
            </RadixDialog.Close>
          </div>
          {sidebar && <div className={styles.sidebar}>{sidebar}</div>}
          <div className={styles.body}>{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
