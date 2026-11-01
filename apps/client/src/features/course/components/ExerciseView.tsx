import type { Outcome } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { Prose } from "@lf/ui/molecules/Prose"
import { Transcript, type Turn } from "@lf/ui/molecules/Transcript"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { api, getJson, useApi, type LoadedSession, type Module, type ProposedRevision } from "@data/api"
import { findUnit } from "../nav"
import { refResolver, section } from "../refs"
import { useCourse } from "./Course"
import { ModuleHead, NotGenerated, moduleTags } from "./ModuleHead"
import { OutcomeView } from "./OutcomeView"
import styles from "./course.module.css"

// The exercise: the learner's brief, then the seminar itself, a transcript with a tutor that ends in
// an outcome. The tutor's brief and the stop conditions stay with the tutor.
export function ExerciseView() {
  const { slug, detail, reload } = useCourse()
  const { unit: unitId = "", session: sessionId } = useParams()
  const navigate = useNavigate()
  const module = useApi<Module>(`/topics/${slug}/modules/${unitId}/exercise`)
  const [loaded, setLoaded] = useState<LoadedSession | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ outcome: Outcome; revision: ProposedRevision | null } | null>(null)

  useEffect(() => {
    setLoaded(null)
    setResult(null)
    if (!sessionId) {
      setTurns([])
      return
    }
    let cancelled = false
    getJson<LoadedSession>(`/topics/${slug}/sessions/${sessionId}`)
      .then((value) => {
        if (cancelled) return
        setLoaded(value)
        setTurns(value.turns)
        if (value.outcome) setResult({ outcome: value.outcome, revision: null })
      })
      .catch((cause: Error) => !cancelled && setError(cause.message))
    return () => {
      cancelled = true
    }
  }, [slug, sessionId])

  const unit = findUnit(detail.plan, unitId)
  if (!unit) return <Text tone="muted">No unit {unitId} in this plan.</Text>
  if (module.state === "loading") return <Text tone="muted">Opening the exercise…</Text>
  if (module.state === "error") return <NotGenerated unit={unit} kind="exercise" />

  const { frontmatter, body } = module.value
  const brief = section(body, "Brief for the learner")
  const ended = Boolean(loaded?.session.endedAt)
  const open = detail.sessions.find((entry) => entry.unit === unit.id && entry.kind === "exercise" && !entry.endedAt)

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const start = () =>
    run(async () => {
      const started = await api.startSession(slug, unit.id)
      reload()
      navigate(`/t/${slug}/u/${unit.id}/exercise/${started.session.id}`)
    })

  const send = (text: string) =>
    run(async () => {
      if (!sessionId) return
      setTurns((now) => [...now, { role: "learner", text }, { role: "tutor", text: "", pending: true }])
      let reply = ""
      for await (const delta of api.turn(slug, sessionId, text)) {
        reply += delta
        setTurns((now) => [...now.slice(0, -1), { role: "tutor", text: reply, pending: true }])
      }
      setTurns((now) => [...now.slice(0, -1), { role: "tutor", text: reply }])
    })

  const end = () =>
    run(async () => {
      if (!sessionId) return
      const graded = await api.endSession(slug, sessionId)
      setResult(graded)
      setLoaded((now) => (now ? { ...now, session: { ...now.session, endedAt: new Date().toISOString() } } : now))
      reload()
    })

  return (
    <article className={styles.stack}>
      <ModuleHead
        unit={unit}
        kind="exercise"
        tags={moduleTags(frontmatter.approach, frontmatter.planVersion, detail.plan.version)}
      />

      {!sessionId && (
        <>
          <Prose markdown={brief} resolveRef={refResolver(slug, detail)} />
          <div className={styles.actions}>
            {open ? (
              <Button variant="primary" icon="exercise" onClick={() => navigate(`/t/${slug}/u/${unit.id}/exercise/${open.id}`)}>
                Resume the seminar
              </Button>
            ) : (
              <Button variant="primary" icon="exercise" loading={busy} onClick={() => void start()}>
                Start the seminar
              </Button>
            )}
          </div>
        </>
      )}

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      {sessionId && !loaded && !error && <Text tone="muted">Opening the session…</Text>}

      {sessionId && loaded && (
        <div className={styles.session}>
          <Transcript turns={turns} onSend={(text) => void send(text)} onEnd={() => void end()} busy={busy} ended={ended} />
        </div>
      )}

      {result && <OutcomeView outcome={result.outcome} revision={result.revision} />}
    </article>
  )
}
