import { useState, type ComponentProps } from "react"
import styles from "./Avatar.module.css"

interface Props extends Omit<ComponentProps<"button">, "children"> {
  /** Whose it is: the initials come from it, and screen readers hear it. */
  name: string
  /** A photo, when there is one; the initials show until it loads, and if it fails. */
  photo?: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase()

// A person, as a round button: their photo, or their initials on a grey fill. It opens what is theirs,
// such as an account menu, so it is always a button.
export function Avatar({ name, photo, className, type = "button", ...rest }: Props) {
  const [failed, setFailed] = useState(false)
  return (
    <button
      {...rest}
      type={type}
      aria-label={rest["aria-label"] ?? name}
      className={[styles.avatar, className].filter(Boolean).join(" ")}
    >
      <span className={styles.face} aria-hidden="true">
        {initials(name)}
        {photo && !failed && (
          <img src={photo} alt="" className={styles.photo} onError={() => setFailed(true)} />
        )}
      </span>
    </button>
  )
}
