import type { Bank } from "@lf/bank"
import { Intake, IntakeAnswer, MODULE_KINDS, PlanOutput, type ModuleKind } from "@lf/contracts"
import type { Runtime } from "@lf/runtime"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { z } from "zod"

const isKind = (value: string): value is ModuleKind => (MODULE_KINDS as readonly string[]).includes(value)

const QuestionsBody = z.object({ intake: Intake })
const ProposeBody = z.object({ intake: Intake, answers: z.array(IntakeAnswer), previous: PlanOutput.optional(), comments: z.string().optional() })
const CreateBody = z.object({ intake: Intake, answers: z.array(IntakeAnswer), plan: PlanOutput })
const ProgressBody = z.object({ unit: z.string(), module: z.enum(MODULE_KINDS), state: z.literal("complete") })
const TurnBody = z.object({ text: z.string().min(1) })
const AttemptBody = z.object({ answers: z.record(z.string(), z.string()) })
const VerificationBody = z.object({ state: z.enum(["verified", "unverified", "failed"]) })

// Every route is a call into @lf/bank or @lf/runtime that the CLI can make too. Reads are GETs on the
// bank; writes are POSTs into the runtime, which validates and writes files.
export function api(bank: Bank, runtime: Runtime) {
  const app = new Hono()

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

  app.post("/wizard/questions", async (c) => {
    const { intake } = QuestionsBody.parse(await c.req.json())
    return c.json({ questions: await runtime.plan.questions(intake) })
  })

  app.post("/wizard/propose", async (c) => {
    const body = ProposeBody.parse(await c.req.json())
    return c.json({ plan: await runtime.plan.propose(body) })
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
