import { planUnits, unitState, type Chapter, type Part, type Plan, type Progress, type Unit } from "@lf/contracts"
import type { MarkState } from "@lf/ui/atoms/StateMark"
import type { NavPart } from "@lf/ui/molecules/CourseNav"
import type { OutlinePart } from "@lf/ui/molecules/PlanOutline"

// The plan as the navigation sees it: learner state per unit, falling back to content state when the
// learner has not started. "generating" in the plan outlives a job that died, so it reads as planned;
// the unit page shows what is really being written.

export function markFor(progress: Progress, unit: Unit): MarkState {
  const learner = unitState(progress, unit.id)
  if (learner !== "not-started") return learner
  const states = [unit.modules.reading.state, unit.modules.exercise.state, unit.modules.test.state]
  if (states.includes("stale")) return "stale"
  if (states.every((state) => state === "generated")) return "generated"
  return "planned"
}

function chapterNav(progress: Progress, chapter: Chapter) {
  return {
    id: chapter.id,
    title: chapter.title,
    units: chapter.children.map((unit) => ({
      id: unit.id,
      title: unit.title,
      state: markFor(progress, unit),
      ...(unit.estimate ? { estimate: unit.estimate } : {}),
    })),
  }
}

/** The plan's chapters grouped by part; a plan without parts is one untitled group. */
function groups(plan: Plan): { id: string; title?: string; chapters: Chapter[] }[] {
  const parts = plan.nodes.filter((node): node is Part => node.kind === "part")
  if (parts.length) return parts.map((part) => ({ id: part.id, title: part.title, chapters: part.children }))
  return [{ id: "root", chapters: plan.nodes.filter((node): node is Chapter => node.kind === "chapter") }]
}

export function navParts(plan: Plan, progress: Progress): NavPart[] {
  return groups(plan).map((group) => ({ ...group, chapters: group.chapters.map((chapter) => chapterNav(progress, chapter)) }))
}

export function outlineParts(plan: Plan, progress: Progress): OutlinePart[] {
  return groups(plan).map((group) => ({
    ...group,
    chapters: group.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      units: chapter.children.map((unit) => ({ ...unit, state: markFor(progress, unit) })),
    })),
  }))
}

/** The chapter and part a unit sits in, for breadcrumbs. */
export function trail(plan: Plan, unitId: string): string[] {
  for (const node of plan.nodes) {
    if (node.kind === "part") {
      for (const chapter of node.children) {
        if (chapter.children.some((unit) => unit.id === unitId)) return [node.title, chapter.title]
      }
    } else if (node.children.some((unit) => unit.id === unitId)) return [node.title]
  }
  return []
}

export function chapterOf(plan: Plan, unitId: string): Chapter | undefined {
  return groups(plan)
    .flatMap((group) => group.chapters)
    .find((chapter) => chapter.children.some((unit) => unit.id === unitId))
}

export function findUnit(plan: Plan, unitId: string): Unit | undefined {
  return planUnits(plan).find((unit) => unit.id === unitId)
}

/** The first unit the learner has not finished, in reading order. */
export function nextUnit(plan: Plan, progress: Progress): Unit | undefined {
  return planUnits(plan).find((unit) => {
    const state = unitState(progress, unit.id)
    return state !== "complete" && state !== "assessed"
  })
}
