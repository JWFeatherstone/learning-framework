import type { ComponentProps, MouseEvent } from "react"
import { Icon } from "./Icon"
import type { IconName } from "./icons"
import { Spinner } from "./Spinner"
import { Tooltip } from "./Tooltip"
import styles from "./Button.module.css"

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md"
  /** An icon before the label. */
  icon?: IconName
  /** A spinner takes the icon's place and clicks are blocked; the label stays, so the width holds. */
  loading?: boolean
  /** Makes the button unavailable and says why in a tooltip. It stays focusable, so the reason can be read. */
  disabledReason?: string
  /** Holds the reason's tooltip open, for a hint shown without hovering, and for the lab. */
  tooltipOpen?: boolean
}

const blockClick = (event: MouseEvent) => event.preventDefault()

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  loading = false,
  disabledReason,
  tooltipOpen,
  disabled,
  className,
  type = "button",
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const button = (
    <button
      {...rest}
      type={type}
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabledReason ? true : undefined}
      onClick={disabledReason ? blockClick : onClick}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} />}
      {children}
    </button>
  )
  return disabledReason ? (
    <Tooltip label={disabledReason} open={tooltipOpen}>
      {button}
    </Tooltip>
  ) : (
    button
  )
}
