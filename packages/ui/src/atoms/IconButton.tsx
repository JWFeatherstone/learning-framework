import type { ComponentProps, MouseEvent } from "react"
import { Icon } from "./Icon"
import type { IconName } from "./icons"
import { Tooltip } from "./Tooltip"
import styles from "./Button.module.css"

export interface IconButtonProps extends Omit<ComponentProps<"button">, "children"> {
  icon: IconName
  /** What the button does: its accessible name and its tooltip. */
  label: string
  /** The keys that do the same thing, shown in the tooltip. */
  shortcut?: string[]
  /** Makes the button unavailable and says why in its tooltip. It stays focusable, so the reason can be read. */
  disabledReason?: string
  /** Holds the tooltip open, for a hint shown without hovering, and for the lab. */
  tooltipOpen?: boolean
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md"
  /** Opens a menu: a small chevron follows the icon. */
  menu?: boolean
}

const blockClick = (event: MouseEvent) => event.preventDefault()

export function IconButton({
  icon,
  label,
  shortcut,
  disabledReason,
  tooltipOpen,
  variant = "ghost",
  size = "md",
  menu = false,
  className,
  type = "button",
  onClick,
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip
      label={disabledReason ?? label}
      shortcut={disabledReason ? undefined : shortcut}
      open={tooltipOpen}
    >
      <button
        {...rest}
        type={type}
        aria-label={label}
        aria-haspopup={menu ? "menu" : undefined}
        aria-disabled={disabledReason ? true : undefined}
        onClick={disabledReason ? blockClick : onClick}
        className={[
          styles.button,
          styles.square,
          menu && styles.menu,
          styles[variant],
          styles[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon name={icon} size={size} />
        {menu && <Icon name="open" size="xs" />}
      </button>
    </Tooltip>
  )
}
