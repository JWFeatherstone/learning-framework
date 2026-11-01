import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Button } from "../atoms/Button"
import { IconButton } from "../atoms/IconButton"
import { Text } from "../atoms/Text"
import { Textarea } from "../atoms/Textarea"
import styles from "./Transcript.module.css"

export interface Turn {
  role: "tutor" | "learner"
  text: string
  /** Still arriving from the model. */
  pending?: boolean
}

interface Props {
  turns: Turn[]
  onSend: (text: string) => void
  onEnd?: () => void
  /** While the tutor is answering, the composer waits. */
  busy?: boolean
  /** After the session has ended: no composer, the turns stay readable. */
  ended?: boolean
  placeholder?: string
}

// A seminar: the tutor's turns at the left margin, the learner's indented, and a composer at the foot.
// Enter sends; Shift+Enter breaks a line. The learner ends the session, never the tutor.
export function Transcript({
  turns,
  onSend,
  onEnd,
  busy = false,
  ended = false,
  placeholder = "Your turn. Enter sends; Shift+Enter for a new line.",
}: Props) {
  const [draft, setDraft] = useState("")
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [turns])

  const send = () => {
    const text = draft.trim()
    if (!text || busy) return
    onSend(text)
    setDraft("")
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.transcript}>
      <ol className={styles.turns} aria-live="polite">
        {turns.map((turn, index) => (
          <li key={index} className={`${styles.turn} ${styles[turn.role]}`} data-pending={turn.pending || undefined}>
            <Text variant="overline" as="div" className={styles.who}>
              {turn.role === "tutor" ? "Tutor" : "You"}
            </Text>
            <div className={styles.text}>{turn.text || (turn.pending ? "…" : "")}</div>
          </li>
        ))}
        <div ref={end} />
      </ol>
      {ended ? (
        <div className={styles.ended}>
          <Text tone="muted">The session has ended. Its outcome is below.</Text>
        </div>
      ) : (
        <div className={styles.composer}>
          <Textarea
            label="Your turn"
            hideLabel
            rows={2}
            value={draft}
            placeholder={placeholder}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            className={styles.field}
          />
          <div className={styles.actions}>
            <IconButton icon="send" label="Send" variant="primary" onClick={send} disabled={busy || !draft.trim()} />
            {onEnd && (
              <Button size="sm" variant="ghost" onClick={onEnd} disabled={busy}>
                End session
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
