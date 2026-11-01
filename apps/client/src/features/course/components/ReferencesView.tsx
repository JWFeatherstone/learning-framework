import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { useState } from "react"
import { api } from "@data/api"
import { useCourse } from "./Course"
import styles from "./course.module.css"

// Every reference the topic cites, with its verification. A learner is only sent to a verified one,
// and verifying is a human act: the button records that someone checked it exists and says what the
// module claims.
export function ReferencesView() {
  const { slug, detail, reload } = useCourse()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setState = async (id: string, state: "verified" | "unverified" | "failed") => {
    setBusy(id)
    setError(null)
    try {
      await api.verifyReference(slug, id, state)
      reload()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <article className={styles.stack}>
      <header className={styles.stackTight}>
        <Text variant="heading" as="h1">
          References
        </Text>
        <Text as="p" tone="muted">
          {detail.references.length} in this topic. Verifying one says you checked it exists and supports what the
          module cites it for.
        </Text>
      </header>

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      <ul className={styles.list}>
        {detail.references.map((reference) => {
          const verified = reference.verification.state === "verified"
          return (
            <li key={reference.id} className={styles.row}>
              <div className={styles.rowText}>
                {reference.url ? (
                  <a href={reference.url} target="_blank" rel="noreferrer" className={styles.link}>
                    {reference.citation}
                  </a>
                ) : (
                  <Text>{reference.citation}</Text>
                )}
                <div className={styles.meta}>
                  <Tag>{reference.id}</Tag>
                  <Tag>{reference.type}</Tag>
                  <Tag>{reference.access}</Tag>
                  <Tag>{reference.verification.state}</Tag>
                  {reference.locator && <Tag>{reference.locator}</Tag>}
                </div>
                {reference.verification.note && (
                  <Text variant="label" tone="muted">
                    {reference.verification.note}
                  </Text>
                )}
              </div>
              <Button
                size="sm"
                variant={verified ? "secondary" : "primary"}
                icon={verified ? undefined : "complete"}
                loading={busy === reference.id}
                onClick={() => void setState(reference.id, verified ? "unverified" : "verified")}
              >
                {verified ? "Unverify" : "Mark verified"}
              </Button>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
