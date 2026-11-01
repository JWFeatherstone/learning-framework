import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fakeProvider } from "./fake"
import { anthropicProvider, type Provider } from "./provider"

/** The model used when LF_MODEL is unset. Check it against Anthropic's current list before relying on it. */
export const DEFAULT_MODEL = "claude-sonnet-4-5"

/** Loads the nearest .env.local above the working directory, if any. Values never leave process.env. */
export function loadEnv(from = process.cwd()) {
  let dir = from
  for (;;) {
    const file = join(dir, ".env.local")
    if (existsSync(file)) {
      process.loadEnvFile(file)
      return file
    }
    const parent = dirname(dir)
    if (parent === dir || existsSync(join(dir, "pnpm-workspace.yaml"))) return undefined
    dir = parent
  }
}

/** The provider the environment names: LF_PROVIDER=anthropic|fake; unset means anthropic when a key is
    present, else fake. The key is read from ANTHROPIC_API_KEY and never echoed. */
export function providerFromEnv(env: NodeJS.ProcessEnv = process.env): Provider {
  const key = env.ANTHROPIC_API_KEY
  const choice = env.LF_PROVIDER ?? (key ? "anthropic" : "fake")
  const model = env.LF_MODEL ?? DEFAULT_MODEL
  if (choice === "fake") return fakeProvider()
  if (choice === "anthropic") {
    if (!key) throw new Error("LF_PROVIDER is anthropic but ANTHROPIC_API_KEY is not set (put it in .env.local)")
    return anthropicProvider(key, model)
  }
  throw new Error(`Unknown LF_PROVIDER ${choice}; use anthropic or fake`)
}
