import type { Outcome, TestItem } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Textarea } from "@lf/ui/atoms/Textarea"
import { ChoiceGroup } from "@lf/ui/molecules/ChoiceGroup"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { DocumentFrame } from "@lf/ui/templates/DocumentFrame"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { api, getJson, useApi, type LoadedSession, type Module, type ProposedRevision } from "@data/api"
import { findUnit } from "../nav"
import { useCourse } from "./Course"
import { ModuleHead, NotGenerated } from "./ModuleHead"
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

  const jump = (id: string) =>
    document.getElementById(`q-${id}`)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    })

  // Down the right: the questions in order, each marked once answered (or with its score once graded),
  // and the one action, kept in view however long the test.
  const side = (
    <>
      <section className={styles.sideGroup}>
        <Text variant="strong" as="h2">
          {reviewing ? "Your answers" : `${answered} of ${items.length} answered`}
        </Text>
        <ol className={styles.questions}>
          {items.map((item, index) => {
            const score = result?.outcome.items.find((entry) => entry.id === item.id)
            return (
              <li key={item.id}>
                <a
                  href={`#q-${item.id}`}
                  data-answered={(answers[item.id] ?? "").trim() ? true : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    jump(item.id)
                  }}
                >
                  <Text variant="label">{index + 1}</Text>
                  <Text variant="label" className={styles.questionText}>
                    {item.prompt}
                  </Text>
                  {score ? (
                    <Text variant="label">
                      {score.score}/{score.of}
                    </Text>
                  ) : (
                    <span className={styles.questionMark} />
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      </section>
      {!reviewing && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            icon="test"
            loading={busy}
            disabledReason={answered < items.length ? `${items.length - answered} still to answer` : undefined}
            onClick={() => void submit()}
          >
            Submit for grading
          </Button>
        </div>
      )}
    </>
  )

  return (
    <DocumentFrame side={side} sideLabel="Questions">
    <article className={`${styles.stack} ${styles.document}`}>
      <ModuleHead
        unit={unit}
        kind="test"
        planVersion={frontmatter.planVersion}
        detail={`${items.length} ${items.length === 1 ? "question" : "questions"}`}
      />

      {reviewing && !loaded && !error && <Text tone="muted">Opening the attempt…</Text>}

      <ol className={styles.items}>
        {items.map((item, index) => {
          const value = answers[item.id] ?? ""
          const set = (next: string) => setAnswers((now) => ({ ...now, [item.id]: next }))
          const score = result?.outcome.items.find((entry) => entry.id === item.id)
          return (
            <li key={item.id} id={`q-${item.id}`} className={styles.item}>
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



      {result && <OutcomeView outcome={result.outcome} revision={result.revision} />}
    </article>
    </DocumentFrame>
  )
}
