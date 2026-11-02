import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  Attempt,
  check,
  ModuleFrontmatter,
  Outcome,
  Plan,
  Progress,
  ReferenceFrontmatter,
  Revision,
  Session,
  splitFrontmatter,
  Topic,
  type Issue,
  type ModuleKind,
  type ModuleState,
  type TopicFiles,
} from "@lf/contracts"
import { parse, stringify } from "yaml"
import { openIndex, type Index } from "./index-store"

// The only package that touches $BANK_DIR. Files are the source of truth; the index is derived from
// them after every write. Every write is a whole small file written to a temp name and renamed, except
// the transcript, which is appended.

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
  references: ReferenceFrontmatter[]
  revisions: { id: string; revision: Revision }[]
  sessions: Session[]
  /** Every text file, by path relative to the topic directory. Binary media is omitted. */
  files: TopicFiles
}

export interface Module {
  frontmatter: ModuleFrontmatter
  body: string
}

export interface Turn {
  role: "tutor" | "learner"
  text: string
}

export interface LoadedSession {
  session: Session
  turns: Turn[]
  attempt?: Attempt
  outcome?: Outcome
}

export interface Bank {
  dir: string
  listTopics(): TopicSummary[]
  readFiles(slug: string): TopicFiles
  loadTopic(slug: string): LoadedTopic
  check(slug: string): Issue[]
  readModule(slug: string, unit: string, kind: ModuleKind): Module | undefined
  readSession(slug: string, id: string): LoadedSession | undefined
  readReference(slug: string, id: string): { frontmatter: ReferenceFrontmatter; body: string } | undefined

  createTopic(topic: Topic, plan: Plan): void
  /** Replaces plan.yaml. With `archive`, the old plan goes to plan.history/ first (revisions only). */
  writePlan(slug: string, plan: Plan, archive: boolean): void
  setModuleState(slug: string, unit: string, kind: ModuleKind, state: ModuleState, approach?: string): void
  writeProgress(slug: string, progress: Progress): void
  writeModule(slug: string, unit: string, kind: ModuleKind, frontmatter: ModuleFrontmatter, body: string): void
  writeReference(slug: string, frontmatter: ReferenceFrontmatter, body: string): void
  createSession(slug: string, session: Session, moduleSnapshot: string): void
  appendTurn(slug: string, sessionId: string, turn: Turn): void
  writeSession(slug: string, session: Session): void
  writeAttempt(slug: string, sessionId: string, attempt: Attempt): void
  writeOutcome(slug: string, outcome: Outcome): void
  writeRevision(slug: string, id: string, revision: Revision): void
  close(): void
}

/** BANK_DIR, or ./bank beside the monorepo root as a fallback for a first run. */
export function resolveBankDir(env: NodeJS.ProcessEnv = process.env): string {
  return resolve(env.BANK_DIR ?? fileURLToPath(new URL("../../../bank", import.meta.url)))
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

function writeAtomic(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, text)
  renameSync(temp, path)
}

const yaml = (data: unknown) => stringify(data, { lineWidth: 100 })
const markdown = (frontmatter: unknown, body: string) => `---\n${yaml(frontmatter)}---\n\n${body.trim()}\n`

/** Transcript turns as Markdown: a level-3 heading per speaker, the text under it. */
export function parseTranscript(text: string): Turn[] {
  const turns: Turn[] = []
  for (const match of text.matchAll(/^### (tutor|learner)\s*\n([\s\S]*?)(?=^### (?:tutor|learner)\s*$|(?![\s\S]))/gm)) {
    turns.push({ role: match[1] as Turn["role"], text: (match[2] ?? "").trim() })
  }
  return turns
}

export function openBank(dir = resolveBankDir()): Bank {
  const topicsDir = join(dir, "topics")
  const topicDir = (slug: string) => join(topicsDir, slug)
  const at = (slug: string, ...parts: string[]) => join(topicDir(slug), ...parts)
  let index: Index | undefined
  const getIndex = () => (index ??= openIndex(dir))

  const readFiles = (slug: string): TopicFiles => {
    const files: TopicFiles = {}
    const root = topicDir(slug)
    if (!existsSync(root)) throw new Error(`No topic ${slug} in ${topicsDir}`)
    walk(root, root, files)
    return files
  }

  const loadTopic = (slug: string): LoadedTopic => {
    const files = readFiles(slug)
    const references = Object.keys(files)
      .filter((path) => /^references\/[^/]+\.md$/.test(path))
      .map((path) => ReferenceFrontmatter.parse(splitFrontmatter(files[path] ?? "").frontmatter))
    const revisions = Object.keys(files)
      .filter((path) => /^revisions\/[^/]+\.ya?ml$/.test(path))
      .sort()
      .map((path) => ({
        id: path.replace(/^revisions\//, "").replace(/\.ya?ml$/, ""),
        revision: Revision.parse(parse(files[path] ?? "")),
      }))
    const sessions = Object.keys(files)
      .filter((path) => /^sessions\/[^/]+\/session\.yaml$/.test(path))
      .map((path) => Session.parse(parse(files[path] ?? "")))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    return {
      id: slug,
      dir: topicDir(slug),
      topic: Topic.parse(parse(files["topic.yaml"] ?? "")),
      plan: Plan.parse(parse(files["plan.yaml"] ?? "")),
      progress: Progress.parse(parse(files["progress.yaml"] ?? "") ?? {}),
      references,
      revisions,
      sessions,
      files,
    }
  }

  const reindex = (slug: string) => getIndex().indexTopic(loadTopic(slug))

  const write = (slug: string, path: string, text: string) => {
    writeAtomic(at(slug, path), text)
    reindex(slug)
  }

  const readPlan = (slug: string) => Plan.parse(parse(readFileSync(at(slug, "plan.yaml"), "utf8")))

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
              (node.kind === "part" ? node.children.reduce((n, c) => n + c.children.length, 0) : node.children.length),
            0,
          )
          return { id: topic.id, title: topic.title, created: topic.created, units }
        })
    },
    readModule(slug, unit, kind) {
      const path = at(slug, "modules", unit, `${kind}.md`)
      if (!existsSync(path)) return undefined
      const { frontmatter, body } = splitFrontmatter(readFileSync(path, "utf8"))
      return { frontmatter: ModuleFrontmatter.parse(frontmatter), body }
    },
    readReference(slug, id) {
      const path = at(slug, "references", `${id}.md`)
      if (!existsSync(path)) return undefined
      const { frontmatter, body } = splitFrontmatter(readFileSync(path, "utf8"))
      return { frontmatter: ReferenceFrontmatter.parse(frontmatter), body }
    },
    readSession(slug, id) {
      const root = at(slug, "sessions", id)
      if (!existsSync(join(root, "session.yaml"))) return undefined
      const read = (name: string) => (existsSync(join(root, name)) ? readFileSync(join(root, name), "utf8") : undefined)
      const outcomePath = at(slug, "outcomes", `${id}.yaml`)
      const attempt = read("attempt.yaml")
      return {
        session: Session.parse(parse(read("session.yaml") ?? "")),
        turns: parseTranscript(read("transcript.md") ?? ""),
        attempt: attempt ? Attempt.parse(parse(attempt)) : undefined,
        outcome: existsSync(outcomePath) ? Outcome.parse(parse(readFileSync(outcomePath, "utf8"))) : undefined,
      }
    },

    createTopic(topic, plan) {
      const root = topicDir(topic.id)
      if (existsSync(root)) throw new Error(`Topic ${topic.id} already exists`)
      for (const sub of ["modules", "references", "media", "revisions", "sessions", "outcomes", "plan.history"]) {
        mkdirSync(join(root, sub), { recursive: true })
      }
      writeAtomic(join(root, "topic.yaml"), yaml(topic))
      writeAtomic(join(root, "plan.yaml"), yaml(plan))
      writeAtomic(join(root, "progress.yaml"), yaml({ units: {}, mastery: {} }))
      reindex(topic.id)
    },
    writePlan(slug, plan, archive) {
      if (archive) {
        const previous = readPlan(slug)
        writeAtomic(at(slug, "plan.history", `v${previous.version}.yaml`), yaml(previous))
      }
      write(slug, "plan.yaml", yaml(plan))
    },
    setModuleState(slug, unit, kind, state, approach) {
      const plan = readPlan(slug)
      const found = plan.nodes
        .flatMap((node) => (node.kind === "part" ? node.children : [node]))
        .flatMap((chapter) => chapter.children)
        .find((candidate) => candidate.id === unit)
      if (!found) throw new Error(`No unit ${unit} in ${slug}`)
      found.modules[kind] = { state, ...(approach ? { approach } : {}) }
      write(slug, "plan.yaml", yaml(plan))
    },
    writeProgress(slug, progress) {
      write(slug, "progress.yaml", yaml(progress))
    },
    writeModule(slug, unit, kind, frontmatter, body) {
      write(slug, join("modules", unit, `${kind}.md`), markdown(frontmatter, body))
    },
    writeReference(slug, frontmatter, body) {
      write(slug, join("references", `${frontmatter.id}.md`), markdown(frontmatter, body))
    },
    createSession(slug, session, moduleSnapshot) {
      const root = at(slug, "sessions", session.id)
      mkdirSync(root, { recursive: true })
      writeAtomic(join(root, "session.yaml"), yaml(session))
      writeAtomic(join(root, "module.md"), moduleSnapshot)
      writeAtomic(join(root, "transcript.md"), "")
      reindex(slug)
    },
    appendTurn(slug, sessionId, turn) {
      appendFileSync(at(slug, "sessions", sessionId, "transcript.md"), `### ${turn.role}\n\n${turn.text.trim()}\n\n`)
    },
    writeSession(slug, session) {
      write(slug, join("sessions", session.id, "session.yaml"), yaml(session))
    },
    writeAttempt(slug, sessionId, attempt) {
      write(slug, join("sessions", sessionId, "attempt.yaml"), yaml(attempt))
    },
    writeOutcome(slug, outcome) {
      write(slug, join("outcomes", `${outcome.session}.yaml`), yaml(outcome))
    },
    writeRevision(slug, id, revision) {
      write(slug, join("revisions", `${id}.yaml`), yaml(revision))
    },
    close() {
      index?.close()
    },
  }
}
