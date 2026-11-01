import type { Bank } from "@lf/bank"
import { MODULE_KINDS, type ModuleKind } from "@lf/contracts"
import type { Runtime } from "@lf/runtime"
import { Hono } from "hono"

const isKind = (value: string): value is ModuleKind => (MODULE_KINDS as readonly string[]).includes(value)

export function api(bank: Bank, runtime: Runtime) {
  const app = new Hono()

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

  // Pass 2 wires these to the runtime; for now they report the stub honestly.
  app.post("/topics/:slug/modules/:unit/:kind/generate", async (c) => {
    const kind = c.req.param("kind")
    if (!isKind(kind)) return c.json({ error: "kind must be reading, exercise or test" }, 400)
    try {
      return c.json(await runtime.generate[kind](c.req.param("slug"), c.req.param("unit")))
    } catch (error) {
      return c.json({ error: (error as Error).message }, 501)
    }
  })

  app.onError((error, c) => c.json({ error: error.message }, error.message.startsWith("No topic") ? 404 : 500))
  return app
}
