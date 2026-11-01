import * as RadixTooltip from "@radix-ui/react-tooltip"
import type { ReactElement } from "react"
import { useThemedRegion } from "./themedRegion"
import styles from "./Tooltip.module.css"

interface Props {
  label: string
  /** The keys that do the same thing, one cap each, such as ["⌘", "K"]. */
  shortcut?: string[]
  side?: "top" | "right" | "bottom" | "left"
  /** Held open, for hints shown without hovering, and for the lab. */
  open?: boolean
  /** The element described. It must take a ref, as Button and IconButton do. */
  children: ReactElement
}

export function Tooltip({ label, shortcut, side = "top", open, children }: Props) {
  const [region, attach] = useThemedRegion()

  return (
    <RadixTooltip.Root open={open}>
      <RadixTooltip.Trigger asChild ref={attach}>
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal container={region}>
        <RadixTooltip.Content side={side} sideOffset={6} className={styles.tooltip}>
          {label}
          {shortcut && (
            <span className={styles.keys}>
              {shortcut.map((key) => (
                <kbd key={key} className={styles.key}>
                  {key}
                </kbd>
              ))}
            </span>
          )}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
