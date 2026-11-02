import { useEffect, useState } from "react"
import { Spinner } from "../atoms/Spinner"
import { Text } from "../atoms/Text"
import styles from "./Working.module.css"

interface Props {
  /** What is being done, as a sentence: "Proposing a plan". */
  label: string
  /** The latest thing the worker reported, such as a file it read. */
  line?: string
  /** When the work started, in ms since the epoch; the time since is counted up beside the label. */
  since: number
}

const clock = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

// Long work in the place of the action that started it: what is happening, for how long, and what it
// last touched, so a minute of waiting never looks like nothing.
export function Working({ label, line, since }: Props) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className={styles.working} role="status">
      <div className={styles.head}>
        <Spinner />
        <Text variant="strong">{label}</Text>
        <Text variant="label" tone="muted" className={styles.clock}>
          {clock(now - since)}
        </Text>
      </div>
      <Text variant="label" tone="muted" className={styles.line}>
        {line || "Starting…"}
      </Text>
    </div>
  )
}
