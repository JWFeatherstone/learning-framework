import { useId, type ReactNode } from "react"
import { Text } from "../atoms/Text"
import { Info } from "./Info"
import styles from "./Section.module.css"

interface Props {
  title: string
  /** A note on where the contents come from, behind an info button beside the title. */
  info?: ReactNode
  /** Buttons for the contents, such as showing them as a table, before the info button. */
  actions?: ReactNode
  children: ReactNode
}

// A titled block of a panel's contents.
export function Section({ title, info, actions, children }: Props) {
  const titleId = useId()
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.head}>
        <Text variant="strong" as="h3" id={titleId}>
          {title}
        </Text>
        <div className={styles.tools}>
          {actions}
          {info && <Info label={`About ${title.toLowerCase()}`}>{info}</Info>}
        </div>
      </div>
      {children}
    </section>
  )
}
