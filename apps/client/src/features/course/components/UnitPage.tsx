import { MODULE_KINDS, unitState, type ModuleKind, type Unit } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import type { MarkState } from "@lf/ui/atoms/StateMark"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { ModuleRow } from "@lf/ui/molecules/ModuleRow"
import { ObjectiveList } from "@lf/ui/molecules/ObjectiveList"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api, type TopicDetail } from "@data/api"
import { findUnit, trail } from "../nav"
import { useCourse } from "./Course"
import styles from "./course.module.css"

const DETAIL: Record<ModuleKind, string> = {
  reading: "Read, then mark it finished",
  exercise: "A dialogue with a tutor",
  test: "Graded against the objectives",
}

function moduleMark(detail: TopicDetail, unit: Unit, kind: ModuleKind): MarkState {
  const learner = detail.progress.units[unit.id]?.modules[kind]?.state
  if (learner === "assessed" || learner === "complete" || learner === "in-progress") return learner
  return unit.modules[kind].state
}

// A unit: where it sits, what it is for, and its three modules with the one thing to do with each.
export function UnitPage() {
  const { slug, detail, reload } = useCourse()
  const { unit: unitId = "" } = useParams()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<ModuleKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unit = findUnit(detail.plan, unitId)
  if (!unit) return <Text tone="muted">No unit {unitId} in this plan.</Text>

  const generate = async (kind: ModuleKind) => {
    setBusy(kind)
    setError(null)
    try {
      await api.generate(slug, unit.id, kind)
      reload()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const crumbs = trail(detail.plan, unit.id)
  const sessions = detail.sessions.filter((session) => session.unit === unit.id)
  const state = unitState(detail.progress, unit.id)

  return (
    <article className={styles.stack}>
      <header className={styles.stackTight}>
        <div className={styles.crumbs}>
          <Link to={`/t/${slug}`}>{detail.topic.title}</Link>
          {crumbs.map((crumb) => (
            <Text key={crumb} variant="label">
              › {crumb}
            </Text>
          ))}
        </div>
        <Text variant="heading" as="h1">
          {unit.title}
        </Text>
        <div className={styles.meta}>
          <Tag>{unit.id}</Tag>
          {unit.estimate && <Tag>{unit.estimate}</Tag>}
          <Tag>{state}</Tag>
          {unit.prerequisites.map((prerequisite) => (
            <Tag key={prerequisite}>after {prerequisite}</Tag>
          ))}
        </div>
      </header>

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      <div className={styles.modules}>
        {MODULE_KINDS.map((kind) => {
          const mark = moduleMark(detail, unit, kind)
          const planned = unit.modules[kind]
          const open = () => navigate(`/t/${slug}/u/${unit.id}/${kind}`)
          const needsGeneration = planned.state === "planned" || planned.state === "stale"
          const action = needsGeneration ? (
            <Button variant="primary" icon="generate" loading={busy === kind} onClick={() => void generate(kind)}>
              {planned.state === "stale" ? "Regenerate" : "Generate"}
            </Button>
          ) : planned.state === "generating" ? (
            <Button loading>Generating</Button>
          ) : mark === "complete" || mark === "assessed" ? (
            <Button onClick={open}>{kind === "test" ? "Review" : "Open again"}</Button>
          ) : (
            <Button variant="primary" icon={kind} onClick={open}>
              {mark === "in-progress" ? "Continue" : kind === "reading" ? "Read" : kind === "exercise" ? "Start" : "Take the test"}
            </Button>
          )
          return (
            <ModuleRow
              key={kind}
              kind={kind}
              state={mark}
              approach={planned.approach}
              detail={planned.state === "planned" ? "Not generated yet" : DETAIL[kind]}
              action={action}
            />
          )
        })}
      </div>

      <section className={styles.stackTight}>
        <Text variant="title" as="h2">
          Objectives
        </Text>
        <ObjectiveList
          objectives={unit.objectives.map((objective) => ({
            ...objective,
            mastery: detail.progress.mastery[objective.id]?.value,
          }))}
        />
      </section>

      {sessions.length > 0 && (
        <section className={styles.stackTight}>
          <Text variant="title" as="h2">
            Sessions
          </Text>
          <ul className={styles.list}>
            {sessions.map((session) => (
              <li key={session.id} className={styles.row}>
                <div className={styles.rowText}>
                  <Link to={`/t/${slug}/u/${unit.id}/${session.kind}/${session.id}`} className={styles.link}>
                    {session.kind === "exercise" ? "Seminar" : "Test"} · {session.startedAt.slice(0, 16).replace("T", " ")}
                  </Link>
                  <Text variant="label" tone="muted">
                    {session.endedAt ? (session.outcome ? "Graded" : "Ended") : "In progress"}
                  </Text>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
