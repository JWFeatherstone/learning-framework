import { useId, useRef, type ComponentProps, type PointerEvent } from "react"
import { Icon } from "./Icon"
import { IconButton } from "./IconButton"
import type { IconName } from "./icons"
import styles from "./TextField.module.css"

export interface TextFieldProps extends Omit<ComponentProps<"input">, "size" | "ref"> {
  /** The field's name, shown above it or, with hideLabel, read by screen readers only. */
  label: string
  /** For a field whose purpose is plain from its icon and placeholder, such as search. */
  hideLabel?: boolean
  /** An icon before the text. */
  icon?: IconName
  /** A line of help below the field. An error takes its place. */
  hint?: string
  /** What is wrong with the value. Marks the field invalid. */
  error?: string
  /** Shows a clear button while the field holds text. Focus goes back to the field after. */
  onClear?: () => void
  /** Boxed, in a form; quiet, with no box, where the field sits in a band of chrome, such as a
      dialog's top row. */
  variant?: "boxed" | "quiet"
}

function Note({ id, text, error }: { id: string; text: string; error: boolean }) {
  return (
    <p id={id} className={error ? styles.error : styles.hint}>
      {error && <Icon name="error" size="xs" />}
      {text}
    </p>
  )
}

export function TextField({
  label,
  hideLabel = false,
  icon,
  hint,
  error,
  onClear,
  variant = "boxed",
  id,
  value,
  className,
  ...rest
}: TextFieldProps) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const noteId = `${inputId}-note`
  const input = useRef<HTMLInputElement>(null)
  const note = error ?? hint
  const clearable = onClear && value !== undefined && String(value) !== ""

  // A press on the box's padding or icon puts the caret in the field, as a press on the text would.
  const focusInput = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    event.preventDefault()
    input.current?.focus()
  }

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className={hideLabel ? styles.hidden : styles.label}>
        {label}
      </label>
      <div className={`${styles.box} ${styles[variant]}`} onPointerDown={focusInput}>
        {icon && <Icon name={icon} size="sm" />}
        <input
          {...rest}
          ref={input}
          id={inputId}
          value={value}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
        />
        {clearable && (
          <IconButton
            icon="close"
            label="Clear"
            size="sm"
            className={styles.clear}
            onClick={() => {
              onClear()
              input.current?.focus()
            }}
          />
        )}
      </div>
      {note && <Note id={noteId} text={note} error={Boolean(error)} />}
    </div>
  )
}
