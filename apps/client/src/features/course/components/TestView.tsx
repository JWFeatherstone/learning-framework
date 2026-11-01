import type { Outcome, TestItem } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Textarea } from "@lf/ui/atoms/Textarea"
import { ChoiceGroup } from "@lf/ui/molecules/ChoiceGroup"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { api, getJson, useApi, type LoadedSession, type Module, type ProposedRevision } from "@data/api"
import { findUnit } from "../nav"
import { useCourse } from "./Course"
import { ModuleHead, NotGenerated, moduleTags } from "./ModuleHead"
import { OutcomeView } from "./OutcomeView"
import styles from "./course.module.css"

// The test: its items down the page, each with a place to answer; submit once; then the outcome.
// With a session in the route it shows that attempt and its grade instead.
export function TestView() {
  const { slug, detail, reload } = useCourse()
  const { unit: unitId = "", session: sessionId } = useParams()
  const navigate = useNavigate()
  const module = useApi<Module>(`/topics/${slug}/modules/${unitId}/test`)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState<LoadedSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ outcome: Outcome; revision: ProposedRevision | null } | null>(null)

  useEffect(() => {
    setLoaded(null)
    setResult(null)
    if (!sessionId) return
    let cancelled = false
    getJson<LoadedSession>(`/topics/${slug}/sessions/${sessionId}`)
      .then((value) => {
        if (cancelled) return
        setLoaded(value)
        setAnswers(value.attempt?.answers ?? {})
        if (value.outcome) setResult({ outcome: value.outcome, revision: null })
      })
      .catch((cause: Error) => !cancelled && setError(cause.message))
    return () => {
      cancelled = true
    }
  }, [slug, sessionId])

  const unit = findUnit(detail.plan, unitId)
  if (!unit) return <Text tone="muted">No unit {unitId} in this plan.</Text>
  if (module.state === "loading") return <Text tone="muted">Opening the test…</Text>
  if (module.state === "error") return <NotGenerated unit={unit} kind="test" />

  const { frontmatter } = module.value
  const items: TestItem[] = frontmatter.kind === "test" ? frontmatter.items : []
  const reviewing = Boolean(sessionId)
  const answered = items.filter((item) => (answers[item.id] ?? "").trim().length > 0).length

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const graded = await api.attempt(slug, unit.id, answers)
      reload()
      navigate(`/t/${slug}/u/${unit.id}/test/${graded.session.id}`, { replace: true })
      setResult({ outcome: graded.outcome, revision: graded.revision })
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
        kind="test"
        tags={
          <>
            {moduleTags(frontmatter.approach, frontmatter.planVersion, detail.plan.version)}
            <Tag>{items.length} items</Tag>
          </>
        }
      />

      {reviewing && !loaded && !error && <Text tone="muted">Opening the attempt…</Text>}

      <ol className={styles.items}>
        {items.map((item, index) => {
          const value = answers[item.id] ?? ""
          const set = (next: string) => setAnswers((now) => ({ ...now, [item.id]: next }))
          const score = result?.outcome.items.find((entry) => entry.id === item.id)
          return (
            <li key={item.id} className={styles.item}>
              <div className={styles.meta}>
                <Text variant="label" tone="muted">
                  {index + 1} of {items.length} · {item.type}
                </Text>
                {score && (
                  <Tag>
                    {score.score}/{score.of}
                  </Tag>
                )}
              </div>
              <Text variant="prose" as="p">
                {item.prompt}
              </Text>
              {item.source && <blockquote className={styles.source}>{item.source}</blockquote>}
              {item.type === "choice" && item.options ? (
                <ChoiceGroup label="Your answer" options={item.options} value={value || undefined} onChange={set} disabled={reviewing} />
              ) : (
                <Textarea
                  label="Your answer"
                  hideLabel
                  rows={item.type === "source" ? 6 : 4}
                  value={value}
                  onChange={(event) => set(event.target.value)}
                  readOnly={reviewing}
                />
              )}
              {score?.note && (
                <Text variant="label" tone="muted">
                  {score.note}
                </Text>
              )}
            </li>
          )
        })}
      </ol>

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      {!reviewing && (
        <footer className={styles.actions}>
          <Button
            variant="primary"
            icon="test"
            loading={busy}
            disabledReason={answered < items.length ? `${items.length - answered} still to answer` : undefined}
            onClick={() => void submit()}
          >
            Submit for grading
          </Button>
        </footer>
      )}

      {result && <OutcomeView outcome={result.outcome} revision={result.revision} />}
    </article>
  )
}
