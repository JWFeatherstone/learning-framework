import type { ReactNode } from "react"
import { Text } from "./Text"
import styles from "./Tag.module.css"

interface Props {
  children: ReactNode
}

// A label, not a control: tags never take clicks.
export function Tag({ children }: Props) {
  return (
    <span className={styles.tag}>
      <Text variant="label">{children}</Text>
    </span>
  )
}
