import { useId, type ComponentProps } from "react"
import { Icon } from "./Icon"
import styles from "./Textarea.module.css"

export interface TextareaProps extends Omit<ComponentProps<"textarea">, "ref"> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}

// A text field for more than one line: the same well as TextField, grown to its rows, resizable down the
// page only.
export function Textarea({ label, hideLabel = false, hint, error, id, rows = 4, className, ...rest }: TextareaProps) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const noteId = `${inputId}-note`
  const note = error ?? hint
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className={hideLabel ? styles.hidden : styles.label}>
        {label}
      </label>
      <textarea
        {...rest}
        id={inputId}
        rows={rows}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
      />
      {note && (
        <p id={noteId} className={error ? styles.error : styles.hint}>
          {error && <Icon name="error" size="xs" />}
          {note}
        </p>
      )}
    </div>
  )
}
