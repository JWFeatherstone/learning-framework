import type {
  ExerciseOutput,
  OutcomeOutput,
  PlanOutput,
  QuestionsOutput,
  ReadingOutput,
  RevisionOutput,
  TestOutput,
  Unit,
} from "@lf/contracts"
import type {
  ExerciseInputs,
  GradeInputs,
  ProposeInputs,
  QuestionsInputs,
  ReadingInputs,
  ReviseInputs,
  TestInputs,
} from "./inputs"
import { parseUserMessage } from "./prompt"
import type { Message, Provider } from "./provider"

// A provider that needs no key and gives the same answer to the same inputs, so the whole loop runs
// end to end on any machine. Its outputs are shaped right and dull on purpose.

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "topic"

const planned = { state: "planned" as const }
const modules = { reading: planned, exercise: planned, test: planned }

function unit(id: string, title: string, key: string, prerequisites: string[]): Unit {
  return {
    id,
    kind: "unit",
    title,
    estimate: "2h",
    prerequisites,
    objectives: [
      { id: `obj.${key}.explain`, text: `Explain the main developments in ${title.toLowerCase()}.`, level: "explain" },
      { id: `obj.${key}.assess`, text: `Assess the competing interpretations of ${title.toLowerCase()}.`, level: "evaluate" },
    ],
    modules,
  }
}

function questions({ intake }: QuestionsInputs): QuestionsOutput {
  return {
    questions: [
      {
        id: "scope",
        question: `Which period or aspect of ${intake.title} matters most to you?`,
        guess: `The whole of ${intake.title}, in outline, with depth where the goals point.`,
      },
      {
        id: "sources",
        question: "What kinds of sources can you get to: library books, articles online, primary documents?",
        guess: "Books from a public library and open-access articles; primary sources where they are online.",
      },
      {
        id: "testing",
        question: "How do you want to be tested: short written answers, discussion, or both?",
        guess: "Both: a seminar after each reading, then a short mixed paper.",
      },
    ],
  }
}

function propose({ intake, previous, comments }: ProposeInputs): PlanOutput {
  const base = slug(intake.title).replace(/-/g, "")
  const name = intake.title
  const plan: PlanOutput = {
    title: name,
    shape: "chronological",
    rationale: `A chronological spine for ${name} in two chapters, sized to about ${intake.hoursPerWeek ?? 3} hours a week over a term. Each unit has a reading, a seminar and a short test.`,
    nodes: [
      {
        id: "c1",
        kind: "chapter",
        title: `Foundations of ${name}`,
        children: [
          unit("c1.u1", `Origins of ${name}`, `${base}.origins`, []),
          unit("c1.u2", `Early development of ${name}`, `${base}.early`, ["c1.u1"]),
        ],
      },
      {
        id: "c2",
        kind: "chapter",
        title: `${name} in depth`,
        children: [
          unit("c2.u1", `Turning points in ${name}`, `${base}.turning`, ["c1.u2"]),
          unit("c2.u2", `Legacies of ${name}`, `${base}.legacies`, ["c2.u1"]),
        ],
      },
    ],
  }
  if (previous && comments) {
    const revised = structuredClone(previous)
    const last = revised.nodes[revised.nodes.length - 1]
    if (last?.kind === "chapter") {
      const n = last.children.length + 1
      last.children.push(unit(`${last.id}.u${n}`, `Further study: ${comments.slice(0, 40)}`, `${base}.further${n}`, [last.children[n - 2]?.id ?? last.children[0]!.id]))
    }
    revised.rationale = `${previous.rationale} Revised after your comments ("${comments.slice(0, 60)}"): one unit added at the end.`
    return revised
  }
  return plan
}

function reading(inputs: ReadingInputs): ReadingOutput {
  const { unit, references } = inputs
  const verified = references.filter((reference) => reference.verification === "verified")
  const cite = verified.length ? ` ${verified.map((reference) => `[[ref:${reference.id}]]`).join(" ")}` : ""
  const objectiveLinks = unit.objectives.map((objective) => `[[obj:${objective.id}]]`).join(", ")
  const body = `This unit asks what happened in ${unit.title.toLowerCase()} and why it mattered to those living through it. It serves ${objectiveLinks}.

## Before

The actors held positions that made sense to each of them.${cite} Setting those out first is the only way to see the later choices as choices.

:::term Constraint
What an actor could not do, whatever it wanted.
:::

## The events

Each step narrowed the options of the next.

:::example Reading a decision
1. **Name who decided.** A choice belongs to someone, not to a country.
2. **Name what they could not do.** The constraint explains more than the motive.
:::

:::key
Each decision made sense from where it was taken; the outcome made sense from nowhere.
:::

:::check What turns a local matter into a wider one?
Escalation: the point at which other actors decide they cannot stay out.
:::

## Recap

- Positions first, then choices.
- Constraints explain more than motives.
`
  return {
    approach: "perspectives",
    estimate: unit.estimate ?? "2h",
    objectives: unit.objectives.map((objective) => objective.id),
    references: verified.map((reference) => reference.id),
    newReferences: [],
    body,
  }
}

function exercise({ unit }: ExerciseInputs): ExerciseOutput {
  const [first, ...rest] = unit.objectives
  const body = `## Brief for the learner

A seminar on one question: what, in ${unit.title.toLowerCase()}, was decided, and what was merely allowed to happen? Come ready to state the strongest case for a view you do not hold.

## Brief for the tutor

Open with the question above. Push on ${first ? `[[obj:${first.id}]]` : "the first objective"}: ask the learner to name who could have acted differently and what stopped them.${rest.map((objective) => ` Then turn to [[obj:${objective.id}]] and ask for the strongest counter-reading.`).join("")} Count a turn as strong when the learner names a constraint on a specific actor. Do not lecture; cap each turn at three sentences.

## Stop conditions

End after each objective has been probed twice, or when the learner asks to stop. Then write the outcome against every objective.
`
  return { approach: "seminar", form: "dialogue", objectives: unit.objectives.map((objective) => objective.id), body }
}

function test({ unit }: TestInputs): TestOutput {
  const items: TestOutput["items"] = []
  unit.objectives.forEach((objective, index) => {
    items.push({
      id: `q${items.length + 1}`,
      objective: objective.id,
      type: "free",
      prompt: `${objective.text} Answer in a paragraph.`,
      rubric: ["0: asserts without reasons", "1: one side with reasons", "2: more than one side, each with reasons"],
    })
    if (index === 0) {
      items.push({
        id: `q${items.length + 1}`,
        objective: objective.id,
        type: "choice",
        prompt: `Which best describes the reading's view of ${unit.title.toLowerCase()}?`,
        options: ["A single cause explains it", "Several actors chose, under constraints", "Nobody could have acted otherwise"],
        key: "Several actors chose, under constraints",
      })
    }
  })
  return { approach: "mixed paper", objectives: unit.objectives.map((objective) => objective.id), items }
}

function grade(inputs: GradeInputs): OutcomeOutput {
  const items: OutcomeOutput["items"] = []
  if (inputs.kind === "test" && inputs.items) {
    for (const item of inputs.items) {
      const answer = (inputs.answers?.[item.id] ?? "").trim()
      if (item.type === "choice") {
        const right = answer === item.key
        items.push({ id: item.id, objective: item.objective, score: right ? 1 : 0, of: 1, note: right ? "Matches the key." : `The key was "${item.key}".` })
      } else {
        const words = answer.split(/\s+/).filter(Boolean).length
        const score = words === 0 ? 0 : words < 25 ? 1 : 2
        items.push({ id: item.id, objective: item.objective, score, of: 2, note: words === 0 ? "No answer." : words < 25 ? "Too brief to show more than one side." : "Gives reasons on more than one side." })
      }
    }
  } else {
    const learnerWords = (inputs.transcript ?? []).filter((turn) => turn.role === "learner").reduce((sum, turn) => sum + turn.text.split(/\s+/).length, 0)
    inputs.objectives.forEach((objective, index) => {
      const score = learnerWords === 0 ? 0 : learnerWords < 40 ? 1 : 2
      items.push({ id: `obj-${index + 1}`, objective: objective.id, score, of: 2, note: learnerWords === 0 ? "The learner did not take a turn." : `The learner wrote ${learnerWords} words across the seminar.` })
    })
  }
  const byObjective = new Map<string, { score: number; of: number }>()
  for (const item of items) {
    const entry = byObjective.get(item.objective) ?? { score: 0, of: 0 }
    byObjective.set(item.objective, { score: entry.score + item.score, of: entry.of + item.of })
  }
  const gaps = [...byObjective].filter(([, value]) => value.score / value.of < 0.5).map(([objective]) => ({
    objective,
    diagnosis: "The evidence shows one side only, or none.",
    suggestion: "Reread the reading and try the seminar again.",
  }))
  const thin = items.every((item) => item.score === 0)
  return { confidence: thin ? "low" : "medium", items, gaps }
}

function revise({ outcome, plan }: ReviseInputs): RevisionOutput {
  const gap = outcome?.gaps[0]
  if (!gap) return { revise: false, reason: "The latest outcome shows no gap; the plan stands." }
  const unit = plan.nodes
    .flatMap((node) => (node.kind === "part" ? node.children : [node]))
    .flatMap((chapter) => chapter.children)
    .find((candidate) => candidate.objectives.some((objective) => objective.id === gap.objective))
  if (!unit) return { revise: false, reason: "The gap's objective is not in the plan." }
  return {
    revise: true,
    summary: `Rework the exercise for ${unit.title}`,
    changes: [{ op: "set-module-state", node: unit.id, module: "exercise", value: "stale" }],
    reasons: [`The outcome found a gap on ${gap.objective}; the seminar should be regenerated to press on it.`],
  }
}

function answer(messages: Message[]): string {
  const user = messages.find((message) => message.role === "user")
  if (!user) throw new Error("fake provider: no user message")
  const { job, inputs } = parseUserMessage(user.content)
  switch (job) {
    case "plan.questions":
      return JSON.stringify(questions(inputs as QuestionsInputs))
    case "plan.propose":
      return JSON.stringify(propose(inputs as ProposeInputs))
    case "plan.revise":
      return JSON.stringify(revise(inputs as ReviseInputs))
    case "generate.reading":
      return JSON.stringify(reading(inputs as ReadingInputs))
    case "generate.exercise":
      return JSON.stringify(exercise(inputs as ExerciseInputs))
    case "generate.test":
      return JSON.stringify(test(inputs as TestInputs))
    case "grade":
      return JSON.stringify(grade(inputs as GradeInputs))
    case "tutor": {
      const turns = messages.filter((message) => message.role !== "system").slice(1)
      const last = turns.at(-1)
      if (!last || last.role === "assistant") {
        return "Let us begin with the question in the brief: what here was decided, and what was merely allowed to happen? Name one actor and one choice they made."
      }
      const words = last.content.trim().split(/\s+/).filter(Boolean)
      const n = turns.filter((turn) => turn.role === "user").length
      if (/\b(stop|enough|finish|end)\b/i.test(last.content)) return "Then we stop here. You named actors and reasons; next time, press on what constrained them."
      return `You say "${words.slice(0, 8).join(" ")}${words.length > 8 ? "…" : ""}". ${n % 2 ? "Who could have acted otherwise at that point, and what stopped them?" : "What is the strongest reading against that, and who held it?"}`
    }
  }
}

export function fakeProvider(): Provider {
  return {
    name: "fake",
    model: "fake/deterministic",
    async complete({ messages }) {
      const text = answer(messages)
      return { text, usage: { inputTokens: 0, outputTokens: 0 } }
    },
    async *stream({ messages }) {
      for (const word of answer(messages).split(/(?<=\s)/)) {
        await new Promise((resolve) => setTimeout(resolve, 15))
        yield word
      }
    },
  }
}
