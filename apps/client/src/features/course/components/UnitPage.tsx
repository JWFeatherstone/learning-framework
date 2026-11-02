import { MODULE_KINDS, planUnits, type ModuleKind, type Unit } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { ModuleTrack, type TrackState, type TrackStep } from "@lf/ui/molecules/ModuleTrack"
import { ObjectiveList } from "@lf/ui/molecules/ObjectiveList"
import { Working } from "@lf/ui/molecules/Working"
import { Link, useNavigate, useParams } from "react-router"
import type { TopicDetail } from "@data/api"
import { chapterOf, findUnit } from "../nav"
import { useCourse } from "./Course"
import styles from "./course.module.css"

const DETAIL: Record<ModuleKind, string> = {
  reading: "Read, then mark it finished",
  exercise: "A dialogue with a tutor",
  test: "Graded against the objectives",
}

const OPEN: Record<ModuleKind, string> = { reading: "Read", exercise: "Start the seminar", test: "Take the test" }

function learnerState(detail: TopicDetail, unit: Unit, kind: ModuleKind) {
  return detail.progress.units[unit.id]?.modules[kind]?.state
}

// A unit: where it sits, its three modules as steps on a track, what it is for, and where it leads.
// Modules are written a chapter at a time, so the units of a chapter build on each other.
export function UnitPage() {
  const { slug, detail, generation, generateChapter } = useCourse()
  const { unit: unitId = "" } = useParams()
  const navigate = useNavigate()

  const unit = findUnit(detail.plan, unitId)
  const chapter = chapterOf(detail.plan, unitId)
  if (!unit || !chapter) return <Text tone="muted">No unit {unitId} in this plan.</Text>

  const pending = chapter.children.flatMap((member) =>
    MODULE_KINDS.filter((kind) => member.modules[kind].state !== "generated").map((kind) => ({ unit: member.id, kind })),
  )
  const writing = generation?.chapter === chapter.id ? generation : null
  // The chapter is written in reading order, so the module being written is the first still to write.
  const busy = writing && !writing.error ? pending[0] : undefined

  const units = planUnits(detail.plan)
  const following = units[units.findIndex((member) => member.id === unit.id) + 1]
  const position = chapter.children.findIndex((member) => member.id === unit.id) + 1
  const sessions = detail.sessions.filter((session) => session.unit === unit.id)

  const finished = (kind: ModuleKind) => ["complete", "assessed"].includes(learnerState(detail, unit, kind) ?? "")
  const next = MODULE_KINDS.find((kind) => unit.modules[kind].state === "generated" && !finished(kind))

  const steps: TrackStep[] = MODULE_KINDS.map((kind) => {
    const planned = unit.modules[kind]
    const learner = learnerState(detail, unit, kind)
    const open = () => navigate(`/t/${slug}/u/${unit.id}/${kind}`)
    const approach = planned.approach
    if (planned.state !== "generated") {
      const state: TrackState = busy?.unit === unit.id && busy.kind === kind ? "writing" : "unwritten"
      return {
        kind,
        state,
        detail:
          state === "writing"
            ? "Being written"
            : planned.state === "stale"
              ? "Out of date with the plan; written again with the chapter"
              : writing && !writing.error
                ? "Waiting its turn"
                : "Not written yet",
      }
    }
    if (finished(kind)) {
      return {
        kind,
        state: "done",
        approach,
        detail: learner === "assessed" ? "Graded" : "Finished",
        action: <Button onClick={open}>{kind === "test" ? "Review" : kind === "reading" ? "Read again" : "Open again"}</Button>,
      }
    }
    const state: TrackState = learner === "in-progress" ? "in-progress" : kind === next ? "next" : "ready"
    return {
      kind,
      state,
      approach,
      detail: DETAIL[kind],
      action:
        kind === next ? (
          <Button variant="primary" icon={kind} onClick={open}>
            {learner === "in-progress" ? "Continue" : OPEN[kind]}
          </Button>
        ) : (
          <Button variant="ghost" onClick={open}>
            {learner === "in-progress" ? "Continue" : "Open"}
          </Button>
        ),
    }
  })

  return (
    <div className={styles.unit}>
      <header className={styles.stackTight}>
        <Text variant="label" tone="muted">
          {chapter.title}, unit {position} of {chapter.children.length}
        </Text>
        <Text variant="display" as="h1" className={styles.unitTitle}>
          {unit.title}
        </Text>
        {(unit.estimate || unit.prerequisites.length > 0) && (
          <Text variant="label" tone="muted" as="p">
            {unit.estimate && `About ${unit.estimate}`}
            {unit.prerequisites.length > 0 && (unit.estimate ? ", after " : "After ")}
            {unit.prerequisites.map((id, index) => (
              <span key={id}>
                {index > 0 && (index === unit.prerequisites.length - 1 ? " and " : ", ")}
                <Link to={`/t/${slug}/u/${id}`} className={styles.link}>
                  {findUnit(detail.plan, id)?.title ?? id}
                </Link>
              </span>
            ))}
          </Text>
        )}
      </header>

      <section className={styles.stackTight} aria-label="Steps">
        <ModuleTrack steps={steps} label="Steps in this unit" />
        {writing?.error ? (
          <ErrorNote message={`Writing ${chapter.title} stopped: ${writing.error}`} onRetry={() => generateChapter(chapter.id)} />
        ) : writing ? (
          <Working label={`Writing ${chapter.title}, ${writing.written} of ${writing.of}`} line={writing.line} since={writing.since} />
        ) : (
          pending.length > 0 && (
            <div className={styles.write}>
              <div className={styles.rowText}>
                <Text variant="strong">
                  {pending.length === chapter.children.length * MODULE_KINDS.length
                    ? `${chapter.title} isn't written yet`
                    : `${pending.length} ${pending.length === 1 ? "module" : "modules"} in ${chapter.title} still to write`}
                </Text>
                <Text variant="label" tone="muted">
                  The chapter is written in one pass, so its units build on each other. It takes a few minutes; you can move
                  around the course meanwhile.
                </Text>
              </div>
              <Button
                variant="primary"
                icon="generate"
                disabledReason={generation && !generation.error ? "Another chapter is being written" : undefined}
                onClick={() => generateChapter(chapter.id)}
              >
                Write the chapter
              </Button>
            </div>
          )
        )}
      </section>

      <section className={styles.stackTight}>
        <Text variant="title" as="h2">
          What you'll be able to do
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
                    {session.kind === "exercise" ? "Seminar" : "Test"}, {session.startedAt.slice(0, 16).replace("T", " ")}
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

      {following && (
        <Link to={`/t/${slug}/u/${following.id}`} className={styles.following}>
          <Text variant="label" tone="muted">
            {chapter.children.some((member) => member.id === following.id) ? `Up next in ${chapter.title}` : "Up next, a new chapter"}
          </Text>
          <Text variant="title">{following.title}</Text>
        </Link>
      )}
    </div>
  )
}
