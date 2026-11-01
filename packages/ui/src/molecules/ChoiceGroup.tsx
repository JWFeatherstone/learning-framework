import { useId } from "react"
import styles from "./ChoiceGroup.module.css"

interface Props {
  /** The question, read with each option by screen readers. */
  label: string
  options: string[]
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

// One answer from a short list: radios in rows, the whole row a target. The label is the question
// itself, shown by the caller; here it names the group.
export function ChoiceGroup({ label, options, value, onChange, disabled = false }: Props) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className={styles.group}>
      {options.map((option, index) => (
        <label key={option} className={styles.option} data-checked={value === option || undefined}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            disabled={disabled}
            onChange={() => onChange(option)}
            className={styles.input}
          />
          <span className={styles.letter}>{String.fromCharCode(65 + index)}</span>
          <span>{option}</span>
        </label>
      ))}
    </div>
  )
}
