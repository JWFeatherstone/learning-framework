import type { TypeRole } from "../tokens/foundation"
import styles from "./Skeleton.module.css"
import textStyles from "./Text.module.css"

interface Props {
  /** The text role it stands in for, so it takes exactly that line's height and nothing shifts on arrival. */
  variant?: TypeRole
  /** About as wide as the value it replaces, such as "5ch". */
  width: string
}

export function Skeleton({ variant = "body", width }: Props) {
  return (
    <span aria-hidden="true" className={`${styles.skeleton} ${textStyles[variant]}`} style={{ width }}>
      <span className={styles.bar} />
    </span>
  )
}
