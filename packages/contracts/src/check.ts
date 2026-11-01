import { parse } from "yaml"
import type { ZodType } from "zod"
import { CONTRACTS_VERSION, MODULE_KINDS } from "./ids"
import { links, sections, splitFrontmatter } from "./markdown"
import { ModuleFrontmatter, REQUIRED_SECTIONS, TASK_SECTIONS } from "./module"
import { Plan, planUnits, type Unit } from "./plan"
import { ReferenceFrontmatter } from "./reference"
import { Revision } from "./revision"
import { Outcome, Progress, Session } from "./state"
import { Topic } from "./topic"

/** A topic's text files, keyed by path relative to the topic directory. Binary media is omitted. */
export type TopicFiles = Record<string, string>

export interface Issue {
  level: "error" | "warning"
  path: string
  message: string
}

type Report = {
  issues: Issue[]
  error: (path: string, message: string) => void
  warn: (path: string, message: string) => void
}

function report(): Report {
  const issues: Issue[] = []
  return {
    issues,
    error: (path, message) => issues.push({ level: "error", path, message }),
    warn: (path, message) => issues.push({ level: "warning", path, message }),
  }
}

function parseYaml<T>(files: TopicFiles, path: string, schema: ZodType<T>, out: Report): T | undefined {
  const text = files[path]
  if (text === undefined) {
    out.error(path, "missing")
    return undefined
  }
  let data: unknown
  try {
    data = parse(text)
  } catch (cause) {
    out.error(path, `not valid YAML: ${(cause as Error).message}`)
    return undefined
  }
  return validate(data, path, schema, out)
}

function validate<T>(data: unknown, path: string, schema: ZodType<T>, out: Report): T | undefined {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    out.error(path, `${issue.path.join(".") || "(root)"}: ${issue.message}`)
  }
  return undefined
}

function parseMarkdown<T>(files: TopicFiles, path: string, schema: ZodType<T>, out: Report) {
  const text = files[path]
  if (text === undefined) return undefined
  try {
    const { frontmatter, body } = splitFrontmatter(text)
    const data = validate(frontmatter, path, schema, out)
    return data === undefined ? undefined : { data, body }
  } catch (cause) {
    out.error(path, (cause as Error).message)
    return undefined
  }
}

const under = (files: TopicFiles, dir: string) =>
  Object.keys(files).filter((path) => path.startsWith(`${dir}/`))

/** Checks a topic the way CI checks a repository: schemas, then the rules the schemas cannot express. */
export function check(files: TopicFiles): Issue[] {
  const out = report()

  const topic = parseYaml(files, "topic.yaml", Topic, out)
  const plan = parseYaml(files, "plan.yaml", Plan, out)
  const progress = parseYaml(files, "progress.yaml", Progress, out)

  if (topic && topic.contractsVersion > CONTRACTS_VERSION) {
    out.error(
      "topic.yaml",
      `contractsVersion ${topic.contractsVersion} is ahead of this framework (${CONTRACTS_VERSION})`,
    )
  }
  if (topic && plan && plan.topic !== topic.id)
    out.error("plan.yaml", `topic is ${plan.topic}, but topic.yaml says ${topic.id}`)

  const references = new Map<string, ReferenceFrontmatter>()
  for (const path of under(files, "references")) {
    const parsed = parseMarkdown(files, path, ReferenceFrontmatter, out)
    if (!parsed) continue
    const expected = `references/${parsed.data.id}.md`
    if (path !== expected) out.error(path, `id ${parsed.data.id} does not match the file name`)
    references.set(parsed.data.id, parsed.data)
  }

  if (!plan) return out.issues

  const units = planUnits(plan)
  const unitIds = new Set(units.map((unit) => unit.id))
  const objectiveIds = new Set(units.flatMap((unit) => unit.objectives.map((objective) => objective.id)))
  checkPlanIds(plan, units, unitIds, objectiveIds, out)

  for (const unit of units)
    checkUnitModules(files, plan.version, unit, references, objectiveIds, unitIds, out)

  for (const path of under(files, "modules")) {
    const match = /^modules\/([^/]+)\/(reading|exercise|test)\.md$/.exec(path)
    if (!match)
      out.warn(path, "not a module file; a unit directory holds reading.md, exercise.md and test.md only")
    else if (!unitIds.has(match[1] ?? "")) out.error(path, `no unit ${match[1]} in the plan`)
  }

  if (progress) {
    for (const unitId of Object.keys(progress.units)) {
      if (!unitIds.has(unitId)) out.error("progress.yaml", `units.${unitId}: no such unit in the plan`)
    }
    for (const objectiveId of Object.keys(progress.mastery)) {
      if (!objectiveIds.has(objectiveId))
        out.error("progress.yaml", `mastery.${objectiveId}: no such objective in the plan`)
    }
  }

  for (const path of under(files, "revisions")) parseYaml(files, path, Revision, out)
  for (const path of under(files, "outcomes")) {
    const outcome = parseYaml(files, path, Outcome, out)
    if (outcome && files[`sessions/${outcome.session}/session.yaml`] === undefined) {
      out.error(path, `session ${outcome.session} has no sessions/ directory`)
    }
  }
  for (const path of under(files, "sessions")) {
    if (path.endsWith("/session.yaml")) parseYaml(files, path, Session, out)
  }

  return out.issues
}

function checkPlanIds(
  plan: Plan,
  units: Unit[],
  unitIds: Set<string>,
  objectiveIds: Set<string>,
  out: Report,
) {
  const seen = new Set<string>()
  const visit = (id: string) => {
    if (seen.has(id)) out.error("plan.yaml", `duplicate id ${id}`)
    seen.add(id)
  }
  for (const node of plan.nodes) {
    visit(node.id)
    for (const child of node.children) {
      visit(child.id)
      if (!child.id.startsWith(`${node.id}.`))
        out.error("plan.yaml", `${child.id} should be nested under ${node.id} by name`)
      if (child.kind === "chapter") {
        for (const unit of child.children) {
          visit(unit.id)
          if (!unit.id.startsWith(`${child.id}.`))
            out.error("plan.yaml", `${unit.id} should be nested under ${child.id} by name`)
        }
      }
    }
  }
  if (objectiveIds.size !== units.reduce((count, unit) => count + unit.objectives.length, 0)) {
    out.error("plan.yaml", "an objective id is used by more than one unit")
  }
  for (const unit of units) {
    for (const prerequisite of unit.prerequisites) {
      if (!unitIds.has(prerequisite))
        out.error("plan.yaml", `${unit.id}: prerequisite ${prerequisite} is not a unit`)
    }
  }
}

function checkUnitModules(
  files: TopicFiles,
  planVersion: number,
  unit: Unit,
  references: Map<string, ReferenceFrontmatter>,
  objectiveIds: Set<string>,
  unitIds: Set<string>,
  out: Report,
) {
  const unitObjectives = new Set(unit.objectives.map((objective) => objective.id))
  for (const kind of MODULE_KINDS) {
    const path = `modules/${unit.id}/${kind}.md`
    const planned = unit.modules[kind]
    const exists = files[path] !== undefined
    if (planned.state === "planned" || planned.state === "generating") {
      if (exists) out.warn(path, `exists, but the plan says ${planned.state}`)
      continue
    }
    if (!exists) {
      out.error("plan.yaml", `${unit.id}.modules.${kind} is ${planned.state}, but ${path} is missing`)
      continue
    }
    const parsed = parseMarkdown(files, path, ModuleFrontmatter, out)
    if (!parsed) continue
    const { data, body } = parsed
    if (data.kind !== kind) out.error(path, `kind is ${data.kind}; the file name says ${kind}`)
    if (data.unit !== unit.id) out.error(path, `unit is ${data.unit}; the directory says ${unit.id}`)
    if (data.id !== `${unit.id}/${kind}`) out.error(path, `id should be ${unit.id}/${kind}`)
    for (const objective of data.objectives) {
      if (!unitObjectives.has(objective)) out.error(path, `objective ${objective} is not one of the unit's`)
    }
    if (data.planVersion < planVersion && planned.state !== "stale") {
      out.warn(
        path,
        `written against plan v${data.planVersion}; the plan is v${planVersion}. Mark it stale or regenerate`,
      )
    }

    const required =
      data.kind === "exercise" && data.form === "task" ? TASK_SECTIONS : REQUIRED_SECTIONS[data.kind]
    const present = sections(body)
    for (const section of required) {
      if (!present.includes(section)) out.error(path, `missing section "## ${section}"`)
    }

    if (data.kind === "reading") {
      for (const id of data.references) {
        const reference = references.get(id)
        if (!reference) out.error(path, `references ${id}, which has no references/${id}.md`)
        else if (reference.verification.state !== "verified") {
          out.error(
            path,
            `cites ${id}, which is ${reference.verification.state}; a learner is only sent to verified sources`,
          )
        }
      }
    }

    if (data.kind === "test") {
      const covered = new Set(data.items.map((item) => item.objective))
      for (const item of data.items) {
        if (!unitObjectives.has(item.objective))
          out.error(path, `item ${item.id} tests ${item.objective}, not one of the unit's`)
        if (item.type === "choice" && (!item.options || item.key === undefined)) {
          out.error(path, `item ${item.id} is a choice item without options and a key`)
        }
        if (item.type !== "choice" && !item.rubric) out.warn(path, `item ${item.id} has no rubric`)
      }
      for (const objective of unitObjectives) {
        if (!covered.has(objective)) out.error(path, `no item tests ${objective}`)
      }
    }

    for (const link of links(body)) {
      switch (link.kind) {
        case "ref":
          if (!references.has(link.id)) out.error(path, `[[ref:${link.id}]] has no references/${link.id}.md`)
          break
        case "unit":
          if (!unitIds.has(link.id)) out.error(path, `[[unit:${link.id}]] is not in the plan`)
          break
        case "obj":
          if (!objectiveIds.has(link.id)) out.error(path, `[[obj:${link.id}]] is not in the plan`)
          break
        case "media":
          if (files[`media/${link.id}.md`] === undefined)
            out.error(path, `[[media:${link.id}]] has no media/${link.id}.md sidecar`)
          break
        default:
          out.error(path, `unknown link kind [[${link.kind}:...]]`)
      }
    }
  }
}
