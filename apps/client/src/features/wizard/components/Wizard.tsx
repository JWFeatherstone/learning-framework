import type { Intake, IntakeAnswer, IntakeQuestion, PlanOutput } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Textarea } from "@lf/ui/atoms/Textarea"
import { TextField } from "@lf/ui/atoms/TextField"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { useState } from "react"
import { useNavigate } from "react-router"
import { api } from "@data/api"
import styles from "./wizard.module.css"

type Step =
  | { step: "intake" }
  | { step: "questions"; questions: IntakeQuestion[] }
  | { step: "plan"; answers: IntakeAnswer[]; plan: PlanOutput }

// A new topic in three pages: what you want and know, the planner's questions with its guesses
// filled in, then the proposed plan to talk back to or confirm. Nothing is written until confirmed.
export function Wizard() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [goals, setGoals] = useState("")
  const [prior, setPrior] = useState("")
  const [hours, setHours] = useState("")
  const [preferences, setPreferences] = useState("")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [comments, setComments] = useState("")
  const [state, setState] = useState<Step>({ step: "intake" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const intake = (): Intake => ({
    title: title.trim(),
    goals: goals.trim(),
    prior: prior.trim(),
    ...(Number(hours) > 0 ? { hoursPerWeek: Number(hours) } : {}),
    ...(preferences.trim() ? { preferences: preferences.trim() } : {}),
  })
  const complete = title.trim() && goals.trim() && prior.trim()

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

  const ask = () =>
    run(async () => {
      const { questions } = await api.questions(intake())
      setDrafts(Object.fromEntries(questions.map((question) => [question.id, question.guess])))
      setState({ step: "questions", questions })
    })

  const propose = (questions: IntakeQuestion[]) =>
    run(async () => {
      const answers = questions.map((question) => ({
        question: question.question,
        answer: (drafts[question.id] ?? "").trim() || question.guess,
      }))
      const { plan } = await api.propose(intake(), answers)
      setState({ step: "plan", answers, plan })
    })

  const revise = (answers: IntakeAnswer[], previous: PlanOutput) =>
    run(async () => {
      const { plan } = await api.propose(intake(), answers, previous, comments.trim())
      setComments("")
      setState({ step: "plan", answers, plan })
    })

  const confirm = (answers: IntakeAnswer[], plan: PlanOutput) =>
    run(async () => {
      const { id } = await api.createTopic(intake(), answers, plan)
      navigate(`/t/${id}`)
    })

  return (
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
          <Textarea
            label="What do you already know?"
            value={prior}
            onChange={(event) => setPrior(event.target.value)}
            rows={3}
          />
          <TextField
            label="Hours a week"
            hint="Optional. Sets the size of the plan."
            inputMode="decimal"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
          <Textarea
            label="Preferences"
            hint="Optional. Kinds of reading, how you like to be tested, anything to avoid."
            value={preferences}
            onChange={(event) => setPreferences(event.target.value)}
            rows={2}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="primary" icon="next" loading={busy} disabledReason={complete ? undefined : "Topic, goals and prior knowledge are needed"}>
              Continue
            </Button>
          </div>
        </form>
      )}

      {state.step === "questions" && (
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
          <div className={styles.actions}>
            <Button type="submit" variant="primary" icon="plan" loading={busy}>
              Propose a plan
            </Button>
            <Button variant="ghost" onClick={() => setState({ step: "intake" })}>
              Back
            </Button>
          </div>
        </form>
      )}

      {state.step === "plan" && (
        <div className={styles.fields}>
          <section className={styles.planHead}>
            <Text variant="title" as="h2">
              {state.plan.title}
            </Text>
            <Text as="p" tone="muted">
              {state.plan.rationale}
            </Text>
            <div className={styles.tags}>
              <Tag>{state.plan.shape}</Tag>
              <Tag>{state.plan.nodes.flatMap((node) => (node.kind === "part" ? node.children : [node])).flatMap((chapter) => chapter.children).length} units</Tag>
            </div>
          </section>
          <PlanTree plan={state.plan} />
          <Textarea
            label="Talk back"
            hint="What to change, add or drop. The planner proposes again."
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            rows={3}
          />
          <div className={styles.actions}>
            <Button variant="primary" icon="complete" loading={busy && !comments.trim()} onClick={() => void confirm(state.answers, state.plan)}>
              Confirm and create the topic
            </Button>
            <Button
              icon="revision"
              loading={busy && Boolean(comments.trim())}
              disabledReason={comments.trim() ? undefined : "Say what to change first"}
              onClick={() => void revise(state.answers, state.plan)}
            >
              Revise the plan
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}

function PlanTree({ plan }: { plan: PlanOutput }) {
  return (
    <ol className={styles.tree}>
      {plan.nodes.map((node) =>
        node.kind === "part" ? (
          <li key={node.id}>
            <Text variant="strong">{node.title}</Text>
            <ol className={styles.tree}>
              {node.children.map((chapter) => (
                <ChapterItem key={chapter.id} chapter={chapter} />
              ))}
            </ol>
          </li>
        ) : (
          <ChapterItem key={node.id} chapter={node} />
        ),
      )}
    </ol>
  )
}

function ChapterItem({ chapter }: { chapter: Extract<PlanOutput["nodes"][number], { kind: "chapter" }> }) {
  return (
    <li>
      <Text variant="strong">{chapter.title}</Text>
      <ul className={styles.units}>
        {chapter.children.map((unit) => (
          <li key={unit.id}>
            <Text>{unit.title}</Text>
            {unit.estimate && (
              <Text variant="label" tone="muted">
                {" "}
                · {unit.estimate}
              </Text>
            )}
            <ul className={styles.objectives}>
              {unit.objectives.map((objective) => (
                <li key={objective.id}>
                  <Text variant="label" tone="muted">
                    {objective.level}: {objective.text}
                  </Text>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </li>
  )
}
