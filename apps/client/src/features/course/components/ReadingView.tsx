import { Button } from "@lf/ui/atoms/Button"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { outline, Prose } from "@lf/ui/molecules/Prose"
import { hoursIn } from "@lf/ui/molecules/PlanOutline"
import { ReadingProgress } from "@lf/ui/molecules/ReadingProgress"
import { DocumentFrame } from "@lf/ui/templates/DocumentFrame"
import { useId, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api, useApi, type Module } from "@data/api"
import { findUnit } from "../nav"
import { refResolver } from "../refs"
import { useCourse } from "./Course"
import { ModuleHead, NotGenerated } from "./ModuleHead"
import styles from "./course.module.css"

const GLOSSARY = "Key terms"

// The reading, as a document centred at the prose measure: its terms gathered at the end, its references
// beneath, and one button to say it is read. Down the right, a map of the text the height of the screen;
// on a narrow page, only a line across the top.
export function ReadingView() {
  const { slug, detail, reload } = useCourse()
  const { unit: unitId = "" } = useParams()
  const navigate = useNavigate()
  const module = useApi<Module>(`/topics/${slug}/modules/${unitId}/reading`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  const sections = useMemo(
    () => outline(module.state === "ready" ? module.value.body : "", GLOSSARY),
    [module],
  )

  const unit = findUnit(detail.plan, unitId)
  if (!unit) return <Text tone="muted">No unit {unitId} in this plan.</Text>
  if (module.state === "loading") return <Text tone="muted">Opening the reading…</Text>
  if (module.state === "error") return <NotGenerated unit={unit} kind="reading" />

  const { frontmatter, body } = module.value
  const done = detail.progress.units[unit.id]?.modules.reading?.state === "complete"
  const cited = frontmatter.kind === "reading" ? frontmatter.references : []
  const references = detail.references.filter((reference) => cited.includes(reference.id))
  const hours = hoursIn(frontmatter.kind === "reading" ? frontmatter.estimate : undefined)
  const minutes = hours === undefined ? undefined : hours * 60

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
    <DocumentFrame
      sideLabel="Sections"
      side={
        <div className={styles.mapOnly}>
          <ReadingProgress target={id} sections={sections} minutes={minutes} />
        </div>
      }
    >
      <div className={styles.reading}>
        <ReadingProgress target={id} sections={sections} variant="bar" />
        <article id={id} className={`${styles.stack} ${styles.document}`}>
          <ModuleHead
        unit={unit}
        kind="reading"
        planVersion={frontmatter.planVersion}
        detail={frontmatter.kind === "reading" && frontmatter.estimate ? `about ${frontmatter.estimate}` : undefined}
      />

          <Prose markdown={body} resolveRef={refResolver(slug, detail)} lead glossary={GLOSSARY} />

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
                        {reference.locator ? ` · ${reference.locator}` : ""} · {reference.access} ·{" "}
                        {reference.verification.state}
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
      </div>
    </DocumentFrame>
  )
}
