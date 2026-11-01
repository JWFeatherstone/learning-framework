import type { Bank } from "@lf/bank"
import { splitFrontmatter, type ModuleKind } from "@lf/contracts"
import type { Runtime } from "@lf/runtime"
import { Hono } from "hono"

const KINDS: ModuleKind[] = ["reading", "exercise", "test"]

export function api(bank: Bank, runtime: Runtime) {
  const app = new Hono()

  app.get("/topics", (c) => c.json(bank.listTopics()))

  app.get("/topics/:slug", (c) => {
    const { topic, plan, progress } = bank.loadTopic(c.req.param("slug"))
    return c.json({ topic, plan, progress })
  })

  app.get("/topics/:slug/check", (c) => c.json(bank.check(c.req.param("slug"))))

  app.get("/topics/:slug/modules/:unit/:kind", (c) => {
    const kind = c.req.param("kind") as ModuleKind
    if (!KINDS.includes(kind)) return c.json({ error: "kind must be reading, exercise or test" }, 400)
    const text = bank.readFiles(c.req.param("slug"))[`modules/${c.req.param("unit")}/${kind}.md`]
    if (text === undefined) return c.json({ error: "not generated" }, 404)
    return c.json(splitFrontmatter(text))
  })

  // Pass 2 wires these to the runtime; for now they report the stub honestly.
  app.post("/topics/:slug/modules/:unit/:kind/generate", async (c) => {
    const kind = c.req.param("kind") as ModuleKind
    if (!KINDS.includes(kind)) return c.json({ error: "kind must be reading, exercise or test" }, 400)
    try {
      return c.json(await runtime.generate[kind](c.req.param("slug"), c.req.param("unit")))
    } catch (error) {
      return c.json({ error: (error as Error).message }, 501)
    }
  })

  app.onError((error, c) =>
    c.json({ error: error.message }, error.message.startsWith("No topic") ? 404 : 500),
  )
  return app
}
