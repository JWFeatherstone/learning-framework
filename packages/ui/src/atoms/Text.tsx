import type { HTMLAttributes } from "react"
import type { TypeRole } from "../tokens/foundation"
import styles from "./Text.module.css"

type Element = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "dt" | "dd" | "label" | "figcaption"

interface Props extends HTMLAttributes<HTMLElement> {
  /** The text role, from DESIGN.md. */
  variant?: TypeRole
  /** Default inherits the surrounding colour, so text on an inverse fill stays legible. */
  tone?: "default" | "muted" | "faint"
  as?: Element
}

export function Text({ variant = "body", tone = "default", as: Tag = "span", className, ...rest }: Props) {
  return (
    <Tag
      {...rest}
      className={[styles.text, styles[variant], tone !== "default" && styles[tone], className]
        .filter(Boolean)
        .join(" ")}
    />
  )
}
