import type { Bank } from "@lf/bank"
import { Intake, IntakeAnswer, MODULE_KINDS, PlanOutput, type ModuleKind } from "@lf/contracts"
import type { Runtime } from "@lf/runtime"
import { Hono, type Context } from "hono"
import { streamSSE } from "hono/streaming"
import { z } from "zod"

const isKind = (value: string): value is ModuleKind => (MODULE_KINDS as readonly string[]).includes(value)

const QuestionsBody = z.object({ intake: Intake, session: z.string().optional() })
const ProposeBody = z.object({
  intake: Intake,
  answers: z.array(IntakeAnswer),
  previous: PlanOutput.optional(),
  comments: z.string().optional(),
  session: z.string().optional(),
})
const CreateBody = z.object({ intake: Intake, answers: z.array(IntakeAnswer), plan: PlanOutput })
const ProgressBody = z.object({ unit: z.string(), module: z.enum(MODULE_KINDS), state: z.literal("complete") })
const TurnBody = z.object({ text: z.string().min(1) })
const AttemptBody = z.object({ answers: z.record(z.string(), z.string()) })
const VerificationBody = z.object({ state: z.enum(["verified", "unverified", "failed"]) })

/** A chapter being written, held here so it outlives the page that asked for it. */
interface ChapterJob {
  chapter: string
  since: number
  line: string
  written: number
  of: number
  error?: string
}

// Every route is a call into @lf/bank or @lf/runtime that the CLI can make too. Reads are GETs on the
// bank; writes are POSTs into the runtime, which validates and writes files.
export function api(bank: Bank, runtime: Runtime) {
  const app = new Hono()
  /** One chapter at a time per topic, by slug. A restart forgets them, which is right: the job died with it. */
  const jobs = new Map<string, ChapterJob>()

  app.get("/health", (c) => c.json(runtime.provider))

  app.get("/topics", (c) => c.json(bank.listTopics()))

  app.get("/topics/:slug", (c) => {
    const slug = c.req.param("slug")
    const { topic, plan, progress, references, revisions, sessions } = bank.loadTopic(slug)
    return c.json({ topic, plan, progress, references, revisions, sessions, issues: bank.check(slug) })
  })

  app.get("/topics/:slug/check", (c) => c.json(bank.check(c.req.param("slug"))))

  app.get("/topics/:slug/modules/:unit/:kind", (c) => {
    const kind = c.req.param("kind")
    if (!isKind(kind)) return c.json({ error: "kind must be reading, exercise or test" }, 400)
    const module = bank.readModule(c.req.param("slug"), c.req.param("unit"), kind)
    return module ? c.json(module) : c.json({ error: "not generated" }, 404)
  })

  app.get("/topics/:slug/sessions/:id", (c) => {
    const session = bank.readSession(c.req.param("slug"), c.req.param("id"))
    return session ? c.json(session) : c.json({ error: "no such session" }, 404)
  })

  // A planning step can take minutes when the author reads the sources, so it streams a line per thing
  // read, then ends on the result and the conversation to resume next time.
  // A long writing job as a stream: what it reads as it goes, anything else it reports, then its result.
  const planning = (c: Context, step: (send: (event: object) => void) => Promise<object>) =>
    streamSSE(c, async (stream) => {
      try {
        const result = await step((event) => void stream.writeSSE({ data: JSON.stringify(event) }))
        await stream.writeSSE({ data: JSON.stringify({ done: true, result }) })
      } catch (error) {
        await stream.writeSSE({ data: JSON.stringify({ error: (error as Error).message }) })
      }
    })

  app.post("/wizard/questions", async (c) => {
    const { intake, session } = QuestionsBody.parse(await c.req.json())
    return planning(c, (send) => runtime.plan.questions(intake, { session, onProgress: (progress) => send({ progress }) }))
  })

  app.post("/wizard/propose", async (c) => {
    const { session, ...inputs } = ProposeBody.parse(await c.req.json())
    return planning(c, (send) => runtime.plan.propose(inputs, { session, onProgress: (progress) => send({ progress }) }))
  })

  app.post("/topics", async (c) => {
    const { intake, answers, plan } = CreateBody.parse(await c.req.json())
    return c.json({ id: await runtime.plan.create(intake, answers, plan) }, 201)
  })

  app.post("/topics/:slug/modules/:unit/:kind/generate", async (c) => {
    const kind = c.req.param("kind")
    if (!isKind(kind)) return c.json({ error: "kind must be reading, exercise or test" }, 400)
    return c.json(await runtime.generate(c.req.param("slug"), c.req.param("unit"), kind))
  })

  // What is being written for a topic, or null. A failure is told once, then forgotten.
  app.get("/topics/:slug/generation", (c) => {
    const slug = c.req.param("slug")
    const job = jobs.get(slug) ?? null
    if (job?.error) jobs.delete(slug)
    return c.json(job)
  })

  // Starts a chapter and answers at once; the writing carries on here whatever happens to the page.
  app.post("/topics/:slug/chapters/:chapter/generate", (c) => {
    const slug = c.req.param("slug")
    const chapter = c.req.param("chapter")
    const running = jobs.get(slug)
    if (running && !running.error) return c.json({ error: "A chapter of this topic is already being written" }, 409)
    const found = bank
      .loadTopic(slug)
      .plan.nodes.flatMap((node) => (node.kind === "part" ? node.children : [node]))
      .find((candidate) => candidate.id === chapter)
    if (!found) return c.json({ error: `No chapter ${chapter} in the plan` }, 404)
    const job: ChapterJob = {
      chapter,
      since: Date.now(),
      line: "",
      written: 0,
      of: found.children.flatMap((unit) => MODULE_KINDS.filter((kind) => unit.modules[kind].state !== "generated")).length,
    }
    jobs.set(slug, job)
    runtime
      .generateChapter(slug, chapter, { onProgress: (line) => (job.line = line), onWritten: () => (job.written += 1) })
      .then(() => jobs.get(slug) === job && jobs.delete(slug))
      .catch((error: Error) => (job.error = error.message))
    return c.json(job, 202)
  })

  app.post("/topics/:slug/progress", async (c) => {
    const { unit, module, state } = ProgressBody.parse(await c.req.json())
    return c.json(await runtime.progress.set(c.req.param("slug"), unit, module, state))
  })

  app.post("/topics/:slug/units/:unit/sessions", async (c) =>
    c.json(await runtime.tutor.start(c.req.param("slug"), c.req.param("unit")), 201),
  )

  app.post("/topics/:slug/sessions/:id/turns", async (c) => {
    const { text } = TurnBody.parse(await c.req.json())
    const slug = c.req.param("slug")
    const id = c.req.param("id")
    return streamSSE(c, async (stream) => {
      try {
        for await (const delta of runtime.tutor.turn(slug, id, text)) {
          await stream.writeSSE({ data: JSON.stringify({ delta }) })
        }
        await stream.writeSSE({ data: JSON.stringify({ done: true }) })
      } catch (error) {
        await stream.writeSSE({ data: JSON.stringify({ error: (error as Error).message }) })
      }
    })
  })

  app.post("/topics/:slug/sessions/:id/end", async (c) => c.json(await runtime.tutor.end(c.req.param("slug"), c.req.param("id"))))

  app.post("/topics/:slug/units/:unit/attempts", async (c) => {
    const { answers } = AttemptBody.parse(await c.req.json())
    return c.json(await runtime.grade.attempt(c.req.param("slug"), c.req.param("unit"), answers), 201)
  })

  app.post("/topics/:slug/revise", async (c) => c.json(await runtime.plan.revise(c.req.param("slug"), "On request")))

  app.post("/topics/:slug/revisions/:id/accept", async (c) =>
    c.json({ plan: await runtime.plan.accept(c.req.param("slug"), c.req.param("id")) }),
  )

  app.post("/topics/:slug/revisions/:id/reject", async (c) => {
    await runtime.plan.reject(c.req.param("slug"), c.req.param("id"))
    return c.json({ ok: true })
  })

  app.post("/topics/:slug/references/:id/verification", async (c) => {
    const { state } = VerificationBody.parse(await c.req.json())
    await runtime.references.setVerification(c.req.param("slug"), c.req.param("id"), state)
    return c.json({ ok: true })
  })

  app.onError((error, c) => {
    if (error instanceof z.ZodError) return c.json({ error: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") }, 400)
    const status = /^No (topic|unit|session|revision|reference)/.test(error.message) ? 404 : 500
    return c.json({ error: error.message }, status)
  })
  return app
}
