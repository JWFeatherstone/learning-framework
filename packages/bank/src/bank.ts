import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { check, CONTRACTS_VERSION, Plan, Progress, Topic, type Issue, type TopicFiles } from "@lf/contracts"
import { parse, stringify } from "yaml"

// The only package that touches $BANK_DIR. Files are the source of truth; the index (index-store.ts) is derived.

export interface TopicSummary {
  id: string
  title: string
  created: string
  units: number
}

export interface LoadedTopic {
  id: string
  dir: string
  topic: Topic
  plan: Plan
  progress: Progress
  /** Every text file, by path relative to the topic directory. */
  files: TopicFiles
}

export interface Bank {
  dir: string
  listTopics(): TopicSummary[]
  readFiles(slug: string): TopicFiles
  loadTopic(slug: string): LoadedTopic
  check(slug: string): Issue[]
  createTopic(input: { id: string; title: string; goals: string; prior: string }): string
}

/** BANK_DIR, or ./bank beside the monorepo root as a fallback for a first run. */
export function resolveBankDir(env: NodeJS.ProcessEnv = process.env): string {
  return resolve(env.BANK_DIR ?? "bank")
}

const isText = (name: string) => /\.(ya?ml|md)$/.test(name)

function walk(root: string, current: string, files: TopicFiles) {
  for (const name of readdirSync(current)) {
    if (name.startsWith(".")) continue
    const path = join(current, name)
    if (statSync(path).isDirectory()) walk(root, path, files)
    else if (isText(name)) files[relative(root, path)] = readFileSync(path, "utf8")
  }
}

export function openBank(dir = resolveBankDir()): Bank {
  const topicsDir = join(dir, "topics")
  const topicDir = (slug: string) => join(topicsDir, slug)

  const readFiles = (slug: string): TopicFiles => {
    const files: TopicFiles = {}
    const root = topicDir(slug)
    if (!existsSync(root)) throw new Error(`No topic ${slug} in ${topicsDir}`)
    walk(root, root, files)
    return files
  }

  const loadTopic = (slug: string): LoadedTopic => {
    const files = readFiles(slug)
    return {
      id: slug,
      dir: topicDir(slug),
      topic: Topic.parse(parse(files["topic.yaml"] ?? "")),
      plan: Plan.parse(parse(files["plan.yaml"] ?? "")),
      progress: Progress.parse(parse(files["progress.yaml"] ?? "") ?? {}),
      files,
    }
  }

  return {
    dir,
    readFiles,
    loadTopic,
    check: (slug) => check(readFiles(slug)),
    listTopics() {
      if (!existsSync(topicsDir)) return []
      return readdirSync(topicsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => {
          const { topic, plan } = loadTopic(entry.name)
          const units = plan.nodes.reduce(
            (count, node) =>
              count +
              (node.kind === "part"
                ? node.children.reduce((n, c) => n + c.children.length, 0)
                : node.children.length),
            0,
          )
          return { id: topic.id, title: topic.title, created: topic.created, units }
        })
    },
    createTopic({ id, title, goals, prior }) {
      const root = topicDir(id)
      if (existsSync(root)) throw new Error(`Topic ${id} already exists`)
      for (const sub of [
        "modules",
        "references",
        "media",
        "revisions",
        "sessions",
        "outcomes",
        "plan.history",
      ]) {
        mkdirSync(join(root, sub), { recursive: true })
      }
      const created = new Date().toISOString().slice(0, 10)
      writeFileSync(
        join(root, "topic.yaml"),
        stringify({ id, title, created, contractsVersion: CONTRACTS_VERSION, learner: { goals, prior } }),
      )
      writeFileSync(join(root, "progress.yaml"), stringify({ units: {}, mastery: {} }))
      return root
    },
  }
}
