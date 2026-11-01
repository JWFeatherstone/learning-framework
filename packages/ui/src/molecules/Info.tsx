import * as RadixPopover from "@radix-ui/react-popover"
import type { ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { useThemedRegion } from "../atoms/themedRegion"
import styles from "./Info.module.css"

interface Props {
  /** What the note is about, as the button's label, such as "About density". */
  label: string
  /** The note: where a figure comes from and how it was made. */
  children: ReactNode
  /** Held open, for the lab. */
  open?: boolean
}

// An info button that opens a short note on click. Notes can run to a few lines or carry a link, which a
// tooltip can't hold, so it opens on click and stays until dismissed.
export function Info({ label, children, open }: Props) {
  const [region, attach] = useThemedRegion()
  return (
    <RadixPopover.Root open={open}>
      <RadixPopover.Trigger asChild ref={attach}>
        <IconButton icon="info" label={label} size="sm" />
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={region}>
        <RadixPopover.Content
          side="bottom"
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className={styles.note}
          // Esc closes the note and goes no further, so a panel around it stays open.
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
