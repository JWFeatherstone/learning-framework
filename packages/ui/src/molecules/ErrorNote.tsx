import { Button } from "../atoms/Button"
import { Icon } from "../atoms/Icon"
import styles from "./ErrorNote.module.css"

interface Props {
  /** What failed, in a plain sentence, such as "These cells couldn't be loaded." */
  message: string
  onRetry: () => void
}

// What couldn't be loaded, in the danger colour as a text field's error is, and a way to try again. Its
// reason is for the console, not the screen.
export function ErrorNote({ message, onRetry }: Props) {
  return (
    <div className={styles.note} role="alert">
      <p className={styles.message}>
        <Icon name="error" size="xs" />
        {message}
      </p>
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
