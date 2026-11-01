import { planUnits, unitCompletion, unitState, type Chapter, type Plan, type Progress, type Unit } from "@lf/contracts"
import type { MarkState } from "@lf/ui/atoms/StateMark"
import type { NavPart } from "@lf/ui/molecules/CourseNav"

// The plan as the navigation sees it: learner state per unit, falling back to content state when the
// learner has not started.

export function markFor(progress: Progress, unit: Unit): MarkState {
  const learner = unitState(progress, unit.id)
  if (learner !== "not-started") return learner
  const states = [unit.modules.reading.state, unit.modules.exercise.state, unit.modules.test.state]
  if (states.includes("stale")) return "stale"
  if (states.includes("generating")) return "generating"
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
      done: unitCompletion(progress, unit.id),
    })),
  }
}

export function navParts(plan: Plan, progress: Progress): NavPart[] {
  const first = plan.nodes[0]
  if (first?.kind === "part") {
    return plan.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      chapters: (node as { children: Chapter[] }).children.map((chapter) => chapterNav(progress, chapter)),
    }))
  }
  return [{ id: "root", chapters: (plan.nodes as Chapter[]).map((chapter) => chapterNav(progress, chapter)) }]
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
