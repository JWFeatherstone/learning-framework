import type { Chapter, Intake, IntakeAnswer, IntakeQuestion, Part, PlanOutput } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Textarea } from "@lf/ui/atoms/Textarea"
import { TextField } from "@lf/ui/atoms/TextField"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { PlanOutline, type OutlinePart } from "@lf/ui/molecules/PlanOutline"
import { Working } from "@lf/ui/molecules/Working"
import { Columns } from "@lf/ui/templates/Columns"
import { useId, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { api } from "@data/api"
import styles from "./wizard.module.css"

type Change = "new" | "changed"

/** One round of talking back: what the learner asked for and what the planner changed. */
interface Round {
  comments: string
  changed: number
  added: number
  removed: number
}

type Step =
  | { step: "intake" }
  | { step: "questions"; questions: IntakeQuestion[] }
  | { step: "plan"; answers: IntakeAnswer[]; plan: PlanOutput; changes: Map<string, Change>; rounds: Round[] }

const units = (plan: PlanOutput) => groups(plan).flatMap((group) => group.chapters.flatMap((chapter) => chapter.children))

function groups(plan: PlanOutput): { id: string; title?: string; chapters: Chapter[] }[] {
  const parts = plan.nodes.filter((node): node is Part => node.kind === "part")
  if (parts.length) return parts.map((part) => ({ id: part.id, title: part.title, chapters: part.children }))
  return [{ id: "root", chapters: plan.nodes.filter((node): node is Chapter => node.kind === "chapter") }]
}

/** Which units a revision added or changed, by id, and how many it dropped. */
function compare(before: PlanOutput, after: PlanOutput) {
  const old = new Map(units(before).map((unit) => [unit.id, unit]))
  const changes = new Map<string, Change>()
  for (const unit of units(after)) {
    const was = old.get(unit.id)
    if (!was) changes.set(unit.id, "new")
    else if (JSON.stringify([was.title, was.estimate, was.objectives]) !== JSON.stringify([unit.title, unit.estimate, unit.objectives])) changes.set(unit.id, "changed")
  }
  const kept = new Set(units(after).map((unit) => unit.id))
  return { changes, removed: [...old.keys()].filter((id) => !kept.has(id)).length }
}

const outline = (plan: PlanOutput, changes: Map<string, Change>): OutlinePart[] =>
  groups(plan).map((group) => ({
    ...group,
    chapters: group.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      units: chapter.children.map((unit) => ({ ...unit, change: changes.get(unit.id) })),
    })),
  }))

// A new topic in three pages: what you want and know, the planner's questions with its guesses
// filled in, then the proposed plan to talk back to or confirm. Nothing is written until confirmed.
// While the planner works the page is locked and says what it is reading.
export function Wizard() {
  const navigate = useNavigate()
  const talkId = useId()
  const [title, setTitle] = useState("")
  const [goals, setGoals] = useState("")
  const [prior, setPrior] = useState("")
  const [hours, setHours] = useState("")
  const [weeks, setWeeks] = useState("")
  const [preferences, setPreferences] = useState("")
  const [sources, setSources] = useState("")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [comments, setComments] = useState("")
  const [state, setState] = useState<Step>({ step: "intake" })
  const [working, setWorking] = useState<{ label: string; since: number } | null>(null)
  // The planner's conversation, resumed at each step, and the last thing it reported reading.
  const [session, setSession] = useState<string>()
  const [progress, setProgress] = useState("")
  const [error, setError] = useState<string | null>(null)

  const sourceList = sources
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const intake = (): Intake => ({
    title: title.trim(),
    goals: goals.trim(),
    prior: prior.trim(),
    ...(Number(hours) > 0 ? { hoursPerWeek: Number(hours) } : {}),
    ...(Number.isInteger(Number(weeks)) && Number(weeks) > 0 ? { weeks: Number(weeks) } : {}),
    ...(preferences.trim() ? { preferences: preferences.trim() } : {}),
    ...(sourceList.length ? { sources: sourceList } : {}),
  })
  const complete = title.trim() && goals.trim() && prior.trim()

  const run = async (label: string, work: () => Promise<void>) => {
    setWorking({ label, since: Date.now() })
    setError(null)
    setProgress("")
    try {
      await work()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setWorking(null)
    }
  }

  const ask = () =>
    run(sourceList.length ? "Reading your sources and drafting questions" : "Drafting questions", async () => {
      const reply = await api.questions({ intake: intake(), session }, setProgress)
      setSession(reply.session)
      setDrafts(Object.fromEntries(reply.questions.map((question) => [question.id, question.guess])))
      setState({ step: "questions", questions: reply.questions })
    })

  const propose = (questions: IntakeQuestion[]) =>
    run("Proposing a plan", async () => {
      const answers = questions.map((question) => ({
        question: question.question,
        answer: (drafts[question.id] ?? "").trim() || question.guess,
      }))
      const reply = await api.propose({ intake: intake(), answers, session }, setProgress)
      setSession(reply.session)
      setState({ step: "plan", answers, plan: reply.plan, changes: new Map(), rounds: [] })
    })

  const revise = (current: Extract<Step, { step: "plan" }>) =>
    run("Revising the plan", async () => {
      const said = comments.trim()
      const reply = await api.propose(
        { intake: intake(), answers: current.answers, previous: current.plan, comments: said, session },
        setProgress,
      )
      setSession(reply.session)
      setComments("")
      const { changes, removed } = compare(current.plan, reply.plan)
      const count = (kind: Change) => [...changes.values()].filter((change) => change === kind).length
      const round = { comments: said, changed: count("changed"), added: count("new"), removed }
      setState({ ...current, plan: reply.plan, changes, rounds: [...current.rounds, round] })
    })

  const confirm = (answers: IntakeAnswer[], plan: PlanOutput) =>
    run("Creating the topic", async () => {
      const { id } = await api.createTopic(intake(), answers, plan)
      navigate(`/t/${id}`)
    })

  // The step's actions, or what the planner is doing in their place.
  const actions = (buttons: ReactNode) =>
    working ? <Working label={working.label} line={progress} since={working.since} /> : <div className={styles.actions}>{buttons}</div>

  const quote = (what: string) => {
    setComments((now) => `${now}${now && !now.endsWith("\n") ? "\n" : ""}On “${what}”: `)
    const box = document.getElementById(talkId)
    if (box instanceof HTMLTextAreaElement) requestAnimationFrame(() => box.focus())
  }

  return (
    <fieldset disabled={Boolean(working)} className={styles.lock}>
      <article className={styles.wizard}>
        <header className={styles.head}>
          <Text variant="overline" tone="muted" as="p">
            New topic · {state.step === "intake" ? "1 of 3" : state.step === "questions" ? "2 of 3" : "3 of 3"}
          </Text>
          <Text variant="heading" as="h1">
            {state.step === "intake" ? "What do you want to learn?" : state.step === "questions" ? "A few questions" : "The proposed plan"}
          </Text>
        </header>

        {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

        {state.step === "intake" && (
          <Columns aside={<Guide />} asideLabel="How this works">
            <form
              className={styles.fields}
              onSubmit={(event) => {
                event.preventDefault()
                void ask()
              }}
            >
              <TextField label="Topic" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="The Second World War" />
              <Textarea
                label="What do you want to be able to do?"
                hint="Goals in your own words. The planner turns them into objectives."
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
              />
              <Textarea label="What do you already know?" value={prior} onChange={(event) => setPrior(event.target.value)} rows={3} />
              <div className={styles.pair}>
                <TextField
                  label="Hours a week"
                  hint="Optional. Sets the size of the plan."
                  inputMode="decimal"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                />
                <TextField
                  label="Weeks"
                  hint="Optional. With hours, how deep it goes."
                  inputMode="numeric"
                  value={weeks}
                  onChange={(event) => setWeeks(event.target.value)}
                />
              </div>
              <Textarea
                label="Preferences"
                hint="Optional. Kinds of reading, how you like to be tested, anything to avoid."
                value={preferences}
                onChange={(event) => setPreferences(event.target.value)}
                rows={2}
              />
              <Textarea
                label="Sources"
                hint="Optional. Repositories on this machine (paths) or sites the course should draw on, one per line."
                value={sources}
                onChange={(event) => setSources(event.target.value)}
                rows={2}
              />
              {actions(
                <Button type="submit" variant="primary" icon="next" disabledReason={complete ? undefined : "Topic, goals and prior knowledge are needed"}>
                  Continue
                </Button>,
              )}
            </form>
          </Columns>
        )}

        {state.step === "questions" && (
          <Columns aside={<Summary intake={intake()} />} asideLabel="What you told the planner">
            <form
              className={styles.fields}
              onSubmit={(event) => {
                event.preventDefault()
                void propose(state.questions)
              }}
            >
              <Text as="p" tone="muted">
                The planner's best guess is filled in for each. Change what is wrong and leave the rest.
              </Text>
              {state.questions.map((question) => (
                <Textarea
                  key={question.id}
                  label={question.question}
                  value={drafts[question.id] ?? ""}
                  onChange={(event) => setDrafts((now) => ({ ...now, [question.id]: event.target.value }))}
                  rows={2}
                />
              ))}
              {actions(
                <>
                  <Button type="submit" variant="primary" icon="plan">
                    Propose a plan
                  </Button>
                  <Button variant="ghost" onClick={() => setState({ step: "intake" })}>
                    Back
                  </Button>
                </>,
              )}
            </form>
          </Columns>
        )}

        {state.step === "plan" && (
          <Columns
            asideLabel="Talk back to the planner"
            aside={
              <section className={styles.fields}>
                <Text variant="title" as="h2">
                  Talk back
                </Text>
                {state.rounds.length === 0 ? (
                  <Text as="p" tone="muted">
                    Say what to change, add or drop, or use the comment beside a chapter or unit. The planner proposes again and marks
                    what changed.
                  </Text>
                ) : (
                  <ol className={styles.rounds}>
                    {state.rounds.map((round, index) => (
                      <li key={index}>
                        <Text as="p">{round.comments}</Text>
                        <Text variant="label" tone="muted" as="p">
                          {[
                            round.changed && `${round.changed} changed`,
                            round.added && `${round.added} added`,
                            round.removed && `${round.removed} dropped`,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No units changed"}
                        </Text>
                      </li>
                    ))}
                  </ol>
                )}
                <Textarea id={talkId} label="What to change" hideLabel value={comments} onChange={(event) => setComments(event.target.value)} rows={4} />
                {actions(
                  <>
                    <Button
                      icon="revision"
                      disabledReason={comments.trim() ? undefined : "Say what to change first"}
                      onClick={() => void revise(state)}
                    >
                      Revise
                    </Button>
                    <Button variant="primary" icon="complete" onClick={() => void confirm(state.answers, state.plan)}>
                      Create the topic
                    </Button>
                  </>,
                )}
              </section>
            }
          >
            <section className={styles.planHead}>
              <Text variant="title" as="h2">
                {state.plan.title}
              </Text>
              <Text as="p" tone="muted">
                {state.plan.rationale}
              </Text>
              <div className={styles.tags}>
                <Tag>{state.plan.shape}</Tag>
                <Tag>{units(state.plan).length} units</Tag>
              </div>
            </section>
            <PlanOutline parts={outline(state.plan, state.changes)} onComment={quote} />
          </Columns>
        )}
      </article>
    </fieldset>
  )
}

function Guide() {
  return (
    <section className={styles.fields}>
      <Text variant="title" as="h2">
        How this works
      </Text>
      <ol className={styles.steps}>
        <li>
          <Text as="p">The planner reads your sources, if you give any, and asks a few questions with its guesses filled in.</Text>
        </li>
        <li>
          <Text as="p">It proposes a plan of chapters and units, sized to your time.</Text>
        </li>
        <li>
          <Text as="p">You talk back until it is right. Nothing is saved until you create the topic.</Text>
        </li>
      </ol>
    </section>
  )
}

function Summary({ intake }: { intake: Intake }) {
  return (
    <section className={styles.fields}>
      <Text variant="title" as="h2">
        {intake.title}
      </Text>
      <Text as="p" tone="muted">
        {intake.goals}
      </Text>
      <div className={styles.tags}>
        {intake.hoursPerWeek && <Tag>{intake.hoursPerWeek} h/week</Tag>}
        {intake.weeks && <Tag>{intake.weeks} weeks</Tag>}
      </div>
      {intake.sources && (
        <ul className={styles.sources}>
          {intake.sources.map((source) => (
            <li key={source}>
              <Text variant="code">{source}</Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
