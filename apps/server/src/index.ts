import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { openBank } from "@lf/bank"
import { createRuntime, loadEnv, providerFromEnv } from "@lf/runtime"
import { Hono } from "hono"
import { api } from "./routes"

// The one process that holds a provider key and writes learner state. Thin: every route is a call into
// @lf/runtime or @lf/bank that the CLI can make too. Serves the built client when dist/ exists.
loadEnv()
const bank = openBank()
const provider = providerFromEnv()
const runtime = createRuntime(bank, { provider, by: "server" })
const port = Number(process.env.PORT ?? 3131)

const app = new Hono()
app.route("/api", api(bank, runtime))

const dist = resolve(import.meta.dirname, "../../client/dist")
if (existsSync(dist)) {
  app.use("/*", serveStatic({ root: dist }))
  app.get("*", serveStatic({ root: dist, path: "index.html" }))
}

serve({ fetch: app.fetch, port }, () => {
  console.log(`lf server on http://localhost:${port}, bank at ${bank.dir}, provider ${provider.name} (${provider.model})`)
})
