import { useId } from "react"
import styles from "./Segmented.module.css"

export interface SegmentedOption {
  value: string
  label: string
}

interface Props {
  /** Names the choice for screen readers, such as "Show modules as". */
  label: string
  options: SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
}

// Two to four choices in a row, one of them chosen: a native radio group under the look, so the arrow
// keys move the choice and Tab passes it. The chosen segment rises out of the track.
export function Segmented({ label, options, value, onValueChange }: Props) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className={styles.track}>
      {options.map((option) => (
        <label key={option.value} className={styles.segment}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onValueChange(option.value)}
            className={styles.input}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
