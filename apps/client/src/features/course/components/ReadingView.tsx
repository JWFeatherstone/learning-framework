import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { Prose } from "@lf/ui/molecules/Prose"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api, useApi, type Module } from "@data/api"
import { findUnit } from "../nav"
import { refResolver } from "../refs"
import { useCourse } from "./Course"
import { ModuleHead, NotGenerated, moduleTags } from "./ModuleHead"
import styles from "./course.module.css"

// The reading, as a document: the body at the prose measure, its references beneath, and one button
// to say it is read.
export function ReadingView() {
  const { slug, detail, reload } = useCourse()
  const { unit: unitId = "" } = useParams()
  const navigate = useNavigate()
  const module = useApi<Module>(`/topics/${slug}/modules/${unitId}/reading`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unit = findUnit(detail.plan, unitId)
  if (!unit) return <Text tone="muted">No unit {unitId} in this plan.</Text>
  if (module.state === "loading") return <Text tone="muted">Opening the reading…</Text>
  if (module.state === "error") return <NotGenerated unit={unit} kind="reading" />

  const { frontmatter, body } = module.value
  const done = detail.progress.units[unit.id]?.modules.reading?.state === "complete"
  const cited = frontmatter.kind === "reading" ? frontmatter.references : []
  const references = detail.references.filter((reference) => cited.includes(reference.id))

  const finish = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.markComplete(slug, unit.id, "reading")
      reload()
      navigate(`/t/${slug}/u/${unit.id}`)
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={styles.stack}>
      <ModuleHead
        unit={unit}
        kind="reading"
        tags={
          <>
            {moduleTags(frontmatter.approach, frontmatter.planVersion, detail.plan.version)}
            {frontmatter.kind === "reading" && frontmatter.estimate && <Tag>{frontmatter.estimate}</Tag>}
          </>
        }
      />

      <Prose markdown={body} resolveRef={refResolver(slug, detail)} lead />

      {references.length > 0 && (
        <section className={styles.stackTight}>
          <Text variant="title" as="h2">
            References
          </Text>
          <ul className={styles.list}>
            {references.map((reference) => (
              <li key={reference.id} className={styles.row}>
                <div className={styles.rowText}>
                  {reference.url ? (
                    <a href={reference.url} target="_blank" rel="noreferrer" className={styles.link}>
                      {reference.citation}
                    </a>
                  ) : (
                    <Text>{reference.citation}</Text>
                  )}
                  <Text variant="label" tone="muted">
                    {reference.type}
                    {reference.locator ? ` · ${reference.locator}` : ""} · {reference.access} · {reference.verification.state}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      <footer className={styles.actions}>
        {done ? (
          <Text tone="muted">Marked as read.</Text>
        ) : (
          <Button variant="primary" icon="complete" loading={busy} onClick={() => void finish()}>
            Mark as read
          </Button>
        )}
        <Link to={`/t/${slug}/u/${unit.id}/exercise`} className={styles.link}>
          On to the exercise
        </Link>
      </footer>
    </article>
  )
}
