import styles from "./ProgressBar.module.css"

interface Props {
  /** 0 to 1. */
  value: number
  /** What the bar measures, for screen readers, such as "Mastery of obj.manchuria.league". */
  label: string
  size?: "sm" | "md"
}

// A grey track with the progress colour to the value. Information, not a nudge: no animation, no
// celebration at the end.
export function ProgressBar({ value, label, size = "md" }: Props) {
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(clamped.toFixed(2))}
      className={`${styles.track} ${styles[size]}`}
    >
      <div className={styles.bar} style={{ width: `${clamped * 100}%` }} />
    </div>
  )
}
