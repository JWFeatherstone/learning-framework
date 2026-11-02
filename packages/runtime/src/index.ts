import type { Bank, LoadedSession, LoadedTopic, Module } from "@lf/bank"
import {
  applyRevision,
  ExerciseOutput,
  OutcomeOutput,
  Plan,
  PlanOutput,
  planUnits,
  QuestionsOutput,
  ReadingOutput,
  RevisionOutput,
  TestOutput,
  unitState,
  CONTRACTS_VERSION,
  MODULE_KINDS,
  type Intake,
  type IntakeAnswer,
  type IntakeQuestion,
  type Issue,
  type ModuleFrontmatter,
  type ModuleKind,
  type Outcome,
  type Progress,
  type Provenance,
  type Revision,
  type Session,
  type Unit,
} from "@lf/contracts"
import type { z } from "zod"
import { authorFromEnv, loadEnv, providerFromEnv } from "./env"
import { fakeProvider } from "./fake"
import type { GradeInputs, ProposeInputs, ReviseInputs, TutorInputs, UnitContext } from "./inputs"
import { asMessages, extractJson, render, type Job } from "./prompt"
import type { Message, Provider } from "./provider"

export type { CompleteOptions, Completion, Message, Provider } from "./provider"
export type { ProposeInputs } from "./inputs"
export { anthropicProvider } from "./provider"
export { claudeCodeProvider, cursorProvider } from "./harness"
export { authorFromEnv, fakeProvider, loadEnv, providerFromEnv }

/** A writing job's conversation with a harness: resumed across the wizard's steps, reporting as it reads. */
export interface Run {
  session?: string
  onProgress?: (line: string) => void
}

export interface ProposedRevision {
  id: string
  revision: Revision
}

export interface Graded {
  outcome: Outcome
  revision: ProposedRevision | null
}

// The jobs. Each renders its prompt, asks the provider, validates the reply against @lf/contracts and
// writes through the bank. The server and the CLI both call these and nothing else writes a topic.
export interface Runtime {
  provider: { name: string; model: string }
  author: { name: string; model: string }
  plan: {
    questions(intake: Intake, run?: Run): Promise<{ questions: IntakeQuestion[]; session?: string }>
    propose(inputs: ProposeInputs, run?: Run): Promise<{ plan: PlanOutput; session?: string }>
    /** Confirms a proposal: the topic exists from here on. Returns the slug. */
    create(intake: Intake, answers: IntakeAnswer[], plan: PlanOutput): Promise<string>
    revise(slug: string, trigger: string, outcome?: Outcome): Promise<{ revision: ProposedRevision | null; reason?: string }>
    accept(slug: string, id: string): Promise<Plan>
    reject(slug: string, id: string): Promise<void>
  }
  generate(slug: string, unit: string, kind: ModuleKind, run?: Run): Promise<{ module: Module; issues: Issue[]; session?: string }>
  /** Every module in a chapter not yet written against the current plan, in reading order, in one
      conversation with the author so the units build on each other and the sources are read once. */
  generateChapter(slug: string, chapter: string, run?: Run & { onWritten?: (unit: string, kind: ModuleKind) => void }): Promise<{ written: number; session?: string }>
  tutor: {
    start(slug: string, unit: string): Promise<LoadedSession>
    turn(slug: string, sessionId: string, text: string): AsyncIterable<string>
    end(slug: string, sessionId: string): Promise<Graded>
  }
  grade: {
    attempt(slug: string, unit: string, answers: Record<string, string>): Promise<{ session: Session } & Graded>
  }
  progress: {
    set(slug: string, unit: string, module: ModuleKind, state: "complete"): Promise<Progress>
  }
  references: {
    setVerification(slug: string, id: string, state: "verified" | "unverified" | "failed"): Promise<void>
  }
}

type ModuleProgress = NonNullable<NonNullable<Progress["units"][string]>["modules"]["reading"]>

interface Options {
  /** The live provider: the tutor and the grader. */
  provider?: Provider
  /** The planning jobs' provider: plan, revise. Defaults to `provider`. */
  author?: Provider
  /** The module-writing jobs' provider: generate. Defaults to `author`. */
  writer?: Provider
  /** Recorded in provenance. */
  by?: "server" | "cli"
}

const now = () => new Date().toISOString()
const today = () => now().slice(0, 10)
const stamp = () => now().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "topic"

const findUnit = (plan: Plan, id: string): Unit => {
  const unit = planUnits(plan).find((candidate) => candidate.id === id)
  if (!unit) throw new Error(`No unit ${id} in the plan`)
  return unit
}

const trailOf = (plan: Plan, unitId: string): string[] => {
  for (const node of plan.nodes) {
    if (node.kind === "part") {
      for (const chapter of node.children) {
        if (chapter.children.some((unit) => unit.id === unitId)) return [node.title, chapter.title]
      }
    } else if (node.children.some((unit) => unit.id === unitId)) return [node.title]
  }
  return []
}

export function createRuntime(bank: Bank, options: Options = {}): Runtime {
  const provider = options.provider ?? fakeProvider()
  const author = options.author ?? provider
  const writer = options.writer ?? author
  const by = options.by ?? "server"

  /** Asks for JSON and validates it; one more try with the validation errors if the first reply fails.
      Grading is live, like the tutor; writing modules goes to the writer; the rest plans the course and
      goes to the author. */
  async function ask<T>(
    job: Job,
    inputs: unknown,
    schema: z.ZodType<T>,
    run: Run & { sources?: string[] } = {},
  ): Promise<{ value: T; prompt: string; cost: Provenance["cost"]; model: string; session?: string }> {
    const via = job === "grade" ? provider : job.startsWith("generate.") ? writer : author
    const rendered = render(job, inputs, schema)
    const messages = asMessages(rendered)
    let cost = { inputTokens: 0, outputTokens: 0 }
    let session = run.session
    let model = via.model
    let lastError = ""
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const reply = await via.complete({ messages, sources: run.sources, session, onProgress: run.onProgress })
      session = reply.session ?? session
      model = reply.model ?? model
      cost = {
        inputTokens: cost.inputTokens + (reply.usage?.inputTokens ?? 0),
        outputTokens: cost.outputTokens + (reply.usage?.outputTokens ?? 0),
      }
      const parsed = schema.safeParse(tryJson(reply.text))
      if (parsed.success) return { value: parsed.data, prompt: rendered.prompt, cost, model: `${via.name}/${model}`, session }
      lastError = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
      messages.push({ role: "assistant", content: reply.text }, { role: "user", content: `That did not validate: ${lastError}. Reply again with JSON only.` })
    }
    throw new Error(`${job}: the model's reply did not match the contract after two tries (${lastError})`)
  }

  const tryJson = (text: string): unknown => {
    try {
      return extractJson(text)
    } catch {
      return undefined
    }
  }

  const provenance = (prompt: string, model: string, inputs: string[], cost: Provenance["cost"]): Provenance => ({
    generatedAt: now(),
    model,
    prompt,
    inputs,
    by,
    ...(cost && (cost.inputTokens || cost.outputTokens) ? { cost } : {}),
    reviewed: false,
  })

  const learnerOf = (loaded: LoadedTopic): Intake => ({ title: loaded.topic.title, ...loaded.topic.learner })

  const context = (loaded: LoadedTopic, unit: Unit): UnitContext => ({
    topic: { id: loaded.id, title: loaded.topic.title },
    learner: learnerOf(loaded),
    trail: trailOf(loaded.plan, unit.id),
    unit: {
      id: unit.id,
      title: unit.title,
      ...(unit.estimate ? { estimate: unit.estimate } : {}),
      objectives: unit.objectives,
      prerequisites: unit.prerequisites,
    },
    units: planUnits(loaded.plan).map(({ id, title }) => ({ id, title })),
  })

  const updateProgress = (slug: string, mutate: (progress: Progress) => void): Progress => {
    const { progress } = bank.loadTopic(slug)
    mutate(progress)
    for (const id of Object.keys(progress.units)) {
      const unit = progress.units[id]
      if (unit) unit.state = unitState(progress, id)
    }
    bank.writeProgress(slug, progress)
    return progress
  }

  const setModule = (progress: Progress, unit: string, kind: ModuleKind, patch: ModuleProgress) => {
    const entry = (progress.units[unit] ??= { state: "in-progress", modules: {} })
    entry.modules[kind] = { ...entry.modules[kind], ...patch }
  }

  const recordMastery = (progress: Progress, outcome: Outcome) => {
    const totals = new Map<string, { score: number; of: number }>()
    for (const item of outcome.items) {
      const entry = totals.get(item.objective) ?? { score: 0, of: 0 }
      totals.set(item.objective, { score: entry.score + item.score, of: entry.of + item.of })
    }
    for (const [objective, { score, of }] of totals) {
      progress.mastery[objective] = { value: of === 0 ? 0 : Math.min(1, score / of), lastAssessed: now() }
    }
  }

  const moduleText = (slug: string, unit: string, kind: ModuleKind): string => {
    const text = bank.readFiles(slug)[`modules/${unit}/${kind}.md`]
    if (!text) throw new Error(`The ${kind} for ${unit} has not been generated`)
    return text
  }

  const readModuleOrThrow = (slug: string, unit: string, kind: ModuleKind): Module => {
    const module = bank.readModule(slug, unit, kind)
    if (!module) throw new Error(`The ${kind} for ${unit} has not been generated`)
    return module
  }

  const latestOutcome = (loaded: LoadedTopic): Outcome | undefined => {
    const graded = loaded.sessions.filter((session) => session.outcome).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
    return graded ? bank.readSession(loaded.id, graded.id)?.outcome : undefined
  }

  const tutorMessages = (slug: string, loaded: LoadedSession, unit: Unit, learner: Intake): Message[] => {
    const inputs: TutorInputs = { module: snapshot(slug, loaded), objectives: unit.objectives, learner }
    const history: Message[] = loaded.turns.map((turn) => ({ role: turn.role === "tutor" ? "assistant" : "user", content: turn.text }))
    return asMessages(render("tutor", inputs), history)
  }

  /** The module as it was when the session began, so a later regeneration does not change a graded session. */
  const snapshot = (slug: string, loaded: LoadedSession) => bank.readFiles(slug)[`sessions/${loaded.session.id}/module.md`] ?? ""

  const loadSession = (slug: string, id: string): LoadedSession => {
    const loaded = bank.readSession(slug, id)
    if (!loaded) throw new Error(`No session ${id} in ${slug}`)
    return loaded
  }

  async function gradeSession(slug: string, loaded: LoadedSession, unit: Unit, inputs: GradeInputs): Promise<Graded> {
    const { value, prompt, model } = await ask("grade", inputs, OutcomeOutput)
    const outcome: Outcome = {
      session: loaded.session.id,
      module: `${unit.id}/${loaded.session.kind}`,
      grader: { model, prompt },
      ...value,
    }
    bank.writeOutcome(slug, outcome)
    bank.writeSession(slug, { ...loaded.session, endedAt: now(), outcome: loaded.session.id })
    updateProgress(slug, (progress) => {
      setModule(progress, unit.id, loaded.session.kind, {
        state: loaded.session.kind === "test" ? "assessed" : "complete",
        at: now(),
        session: loaded.session.id,
        outcome: loaded.session.id,
      })
      recordMastery(progress, outcome)
    })
    const revision =
      outcome.confidence === "low"
        ? null
        : (await runtime.plan.revise(slug, `After the ${loaded.session.kind === "test" ? "test" : "seminar"} for ${unit.id}`, outcome)).revision
    return { outcome, revision }
  }

  const runtime: Runtime = {
    provider: { name: provider.name, model: provider.model },
    author: { name: author.name, model: author.model },

    plan: {
      async questions(intake, run = {}) {
        const { value, session } = await ask("plan.questions", { intake }, QuestionsOutput, { ...run, sources: intake.sources })
        return { questions: value.questions, session }
      },
      async propose(inputs, run = {}) {
        const { value, session } = await ask("plan.propose", inputs, PlanOutput, { ...run, sources: inputs.intake.sources })
        return { plan: value, session }
      },
      async create(intake, answers, proposal) {
        const { title, ...learner } = intake
        const taken = new Set(bank.listTopics().map((topic) => topic.id))
        const base = slugify(title)
        let id = base
        for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`
        const plan: Plan = { version: 1, topic: id, contractsVersion: CONTRACTS_VERSION, ...proposal }
        Plan.parse(plan)
        bank.createTopic(
          {
            id,
            title,
            created: today(),
            contractsVersion: CONTRACTS_VERSION,
            learner,
            intake: answers,
            models: undefined,
          },
          plan,
        )
        return id
      },
      async revise(slug, trigger, outcome) {
        const loaded = bank.loadTopic(slug)
        const inputs: ReviseInputs = {
          intake: learnerOf(loaded),
          answers: loaded.topic.intake,
          plan: loaded.plan,
          progress: loaded.progress,
          ...(outcome ?? latestOutcome(loaded) ? { outcome: outcome ?? latestOutcome(loaded) } : {}),
          trigger,
        }
        const { value } = await ask("plan.revise", inputs, RevisionOutput, { sources: loaded.topic.learner.sources })
        if (!value.revise) return { revision: null, reason: value.reason }
        const revision: Revision = {
          basedOn: loaded.plan.version,
          trigger,
          summary: value.summary,
          changes: value.changes,
          reasons: value.reasons,
          state: "proposed",
        }
        try {
          Plan.parse(applyRevision(loaded.plan, revision))
        } catch (cause) {
          return { revision: null, reason: `The planner proposed a revision that does not apply: ${(cause as Error).message}` }
        }
        const taken = new Set(loaded.revisions.map((entry) => entry.id))
        const base = `${today()}-${slugify(value.summary).slice(0, 32)}`
        let id = base
        for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`
        bank.writeRevision(slug, id, revision)
        return { revision: { id, revision } }
      },
      async accept(slug, id) {
        const loaded = bank.loadTopic(slug)
        const entry = loaded.revisions.find((candidate) => candidate.id === id)
        if (!entry) throw new Error(`No revision ${id}`)
        if (entry.revision.state !== "proposed") throw new Error(`Revision ${id} is already ${entry.revision.state}`)
        const plan = Plan.parse(applyRevision(loaded.plan, entry.revision))
        bank.writePlan(slug, plan, true)
        bank.writeRevision(slug, id, { ...entry.revision, state: "accepted" })
        return plan
      },
      async reject(slug, id) {
        const loaded = bank.loadTopic(slug)
        const entry = loaded.revisions.find((candidate) => candidate.id === id)
        if (!entry) throw new Error(`No revision ${id}`)
        bank.writeRevision(slug, id, { ...entry.revision, state: "rejected" })
      },
    },

    async generate(slug, unitId, kind, run = {}) {
      const loaded = bank.loadTopic(slug)
      const unit = findUnit(loaded.plan, unitId)
      const before = unit.modules[kind].state
      bank.setModuleState(slug, unitId, kind, "generating")
      try {
        const reading = kind === "reading" ? undefined : bank.readModule(slug, unitId, "reading")?.body
        const base = { ...context(loaded, unit), ...(reading ? { reading } : {}) }
        const sources = loaded.topic.learner.sources
        const path = `modules/${unitId}/${kind}.md`
        const inputs = [`plan.yaml@v${loaded.plan.version}`, ...(reading ? [`modules/${unitId}/reading.md`] : [])]
        let errors: string[] = []
        let session = run.session
        const via = () => ({ sources, session, onProgress: run.onProgress })
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const extra = errors.length ? { errors } : {}
          let approach: string
          if (kind === "reading") {
            const references = loaded.references.map(({ id, type, citation, verification }) => ({ id, type, citation, verification: verification.state }))
            const { value, prompt, cost, model, session: next } = await ask("generate.reading", { ...base, references, ...extra }, ReadingOutput, via())
            session = next
            for (const reference of value.newReferences) {
              if (!loaded.references.some((existing) => existing.id === reference.id)) {
                const { note, ...rest } = reference
                bank.writeReference(slug, { ...rest, verification: { state: "unverified" } }, note ?? "Added by the reading generator; not yet checked.")
              }
            }
            const frontmatter: ModuleFrontmatter = {
              id: `${unitId}/reading`,
              kind: "reading",
              unit: unitId,
              objectives: value.objectives,
              approach: value.approach,
              planVersion: loaded.plan.version,
              provenance: provenance(prompt, model, inputs, cost),
              ...(value.estimate ? { estimate: value.estimate } : {}),
              references: [...new Set([...value.references, ...value.newReferences.map((reference) => reference.id)])],
            }
            bank.writeModule(slug, unitId, kind, frontmatter, value.body)
            approach = value.approach
          } else if (kind === "exercise") {
            const { value, prompt, cost, model, session: next } = await ask("generate.exercise", { ...base, ...extra }, ExerciseOutput, via())
            session = next
            const frontmatter: ModuleFrontmatter = {
              id: `${unitId}/exercise`,
              kind: "exercise",
              unit: unitId,
              objectives: value.objectives,
              approach: value.approach,
              planVersion: loaded.plan.version,
              provenance: provenance(prompt, model, inputs, cost),
              form: value.form,
            }
            bank.writeModule(slug, unitId, kind, frontmatter, value.body)
            approach = value.approach
          } else {
            const { value, prompt, cost, model, session: next } = await ask("generate.test", { ...base, ...extra }, TestOutput, via())
            session = next
            const frontmatter: ModuleFrontmatter = {
              id: `${unitId}/test`,
              kind: "test",
              unit: unitId,
              objectives: value.objectives,
              approach: value.approach,
              planVersion: loaded.plan.version,
              provenance: provenance(prompt, model, inputs, cost),
              items: value.items,
              ...(value.passing ? { passing: value.passing } : {}),
            }
            bank.writeModule(slug, unitId, kind, frontmatter, "")
            approach = value.approach
          }
          bank.setModuleState(slug, unitId, kind, "generated", approach)
          const issues = bank.check(slug).filter((issue) => issue.path === path)
          // Unverified citations are for a human to resolve, not for another try.
          errors = issues.filter((issue) => issue.level === "error" && !issue.message.includes("a learner is only sent to verified")).map((issue) => issue.message)
          if (errors.length === 0 || attempt === 1) return { module: readModuleOrThrow(slug, unitId, kind), issues, session }
        }
        throw new Error("unreachable")
      } catch (cause) {
        bank.setModuleState(slug, unitId, kind, before === "generating" ? "planned" : before, unit.modules[kind].approach)
        throw cause
      }
    },

    async generateChapter(slug, chapterId, run = {}) {
      const plan = bank.loadTopic(slug).plan
      const chapter = plan.nodes
        .flatMap((node) => (node.kind === "part" ? node.children : [node]))
        .find((candidate) => candidate.id === chapterId)
      if (!chapter) throw new Error(`No chapter ${chapterId} in the plan`)
      let session = run.session
      let written = 0
      for (const unit of chapter.children) {
        for (const kind of MODULE_KINDS) {
          if (unit.modules[kind].state === "generated") continue
          run.onProgress?.(`Writing the ${kind} for ${unit.title}`)
          session = (await runtime.generate(slug, unit.id, kind, { session, onProgress: run.onProgress })).session
          written += 1
          run.onWritten?.(unit.id, kind)
        }
      }
      return { written, session }
    },

    tutor: {
      async start(slug, unitId) {
        const loaded = bank.loadTopic(slug)
        const unit = findUnit(loaded.plan, unitId)
        if (unit.modules.exercise.state !== "generated" && unit.modules.exercise.state !== "stale") {
          throw new Error(`The exercise for ${unitId} has not been generated`)
        }
        const session: Session = {
          id: `${stamp()}-${unitId}-exercise`,
          kind: "exercise",
          unit: unitId,
          module: "exercise",
          planVersion: loaded.plan.version,
          startedAt: now(),
          model: `${provider.name}/${provider.model}`,
        }
        bank.createSession(slug, session, moduleText(slug, unitId, "exercise"))
        const fresh = loadSession(slug, session.id)
        const opening = await provider.complete({ messages: tutorMessages(slug, fresh, unit, learnerOf(loaded)) })
        bank.appendTurn(slug, session.id, { role: "tutor", text: opening.text })
        updateProgress(slug, (progress) => setModule(progress, unitId, "exercise", { state: "in-progress", at: now(), session: session.id }))
        return loadSession(slug, session.id)
      },
      async *turn(slug, sessionId, text) {
        const loaded = loadSession(slug, sessionId)
        if (loaded.session.endedAt) throw new Error("This seminar has ended")
        const unit = findUnit(bank.loadTopic(slug).plan, loaded.session.unit)
        bank.appendTurn(slug, sessionId, { role: "learner", text })
        const withTurn = loadSession(slug, sessionId)
        let reply = ""
        for await (const delta of provider.stream({ messages: tutorMessages(slug, withTurn, unit, learnerOf(bank.loadTopic(slug))) })) {
          reply += delta
          yield delta
        }
        bank.appendTurn(slug, sessionId, { role: "tutor", text: reply })
      },
      async end(slug, sessionId) {
        const loaded = loadSession(slug, sessionId)
        if (loaded.session.endedAt) throw new Error("This seminar has already ended")
        const unit = findUnit(bank.loadTopic(slug).plan, loaded.session.unit)
        return gradeSession(slug, loaded, unit, {
          kind: "exercise",
          module: snapshot(slug, loaded),
          objectives: unit.objectives,
          transcript: loaded.turns,
        })
      },
    },

    grade: {
      async attempt(slug, unitId, answers) {
        const loaded = bank.loadTopic(slug)
        const unit = findUnit(loaded.plan, unitId)
        const module = readModuleOrThrow(slug, unitId, "test")
        if (module.frontmatter.kind !== "test") throw new Error("not a test")
        const session: Session = {
          id: `${stamp()}-${unitId}-test`,
          kind: "test",
          unit: unitId,
          module: "test",
          planVersion: loaded.plan.version,
          startedAt: now(),
          model: `${provider.name}/${provider.model}`,
        }
        bank.createSession(slug, session, moduleText(slug, unitId, "test"))
        bank.writeAttempt(slug, session.id, { answers, submittedAt: now() })
        const fresh = loadSession(slug, session.id)
        const graded = await gradeSession(slug, fresh, unit, {
          kind: "test",
          module: snapshot(slug, fresh),
          objectives: unit.objectives,
          items: module.frontmatter.items,
          answers,
        })
        return { session: loadSession(slug, session.id).session, ...graded }
      },
    },

    progress: {
      async set(slug, unitId, module, state) {
        findUnit(bank.loadTopic(slug).plan, unitId)
        return updateProgress(slug, (progress) => setModule(progress, unitId, module, { state, at: now() }))
      },
    },

    references: {
      async setVerification(slug, id, state) {
        const reference = bank.readReference(slug, id)
        if (!reference) throw new Error(`No reference ${id} in ${slug}`)
        const verification = { state, by: process.env.USER ?? "human", at: today() }
        bank.writeReference(slug, { ...reference.frontmatter, verification }, reference.body)
      },
    },
  }

  return runtime
}
