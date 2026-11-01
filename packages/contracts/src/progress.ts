import { MODULE_KINDS, type ModuleKind } from "./ids"
import type { Plan, Unit } from "./plan"
import { planUnits } from "./plan"
import type { Progress, ProgressState } from "./state"

// Readings of learner state the client and the index both need, kept here so they agree.

/** A unit's state from its modules: the test's assessment wins, then the weakest module. */
export function unitState(progress: Progress, unitId: string): ProgressState {
  const unit = progress.units[unitId]
  if (!unit) return "not-started"
  if (unit.modules.test?.state === "assessed") return "assessed"
  const states = MODULE_KINDS.map((kind) => unit.modules[kind]?.state ?? "not-started")
  if (states.every((state) => state === "complete" || state === "assessed")) return "complete"
  if (states.every((state) => state === "not-started")) return "not-started"
  return "in-progress"
}

/** Modules finished out of three, for the small bars in the navigation. */
export function unitCompletion(progress: Progress, unitId: string): number {
  const unit = progress.units[unitId]
  if (!unit) return 0
  return MODULE_KINDS.filter((kind) => {
    const state = unit.modules[kind]?.state
    return state === "complete" || state === "assessed"
  }).length
}

/** Mean mastery over a unit's objectives, or undefined when none has been assessed. */
export function unitMastery(progress: Progress, unit: Unit): number | undefined {
  const values = unit.objectives.map((objective) => progress.mastery[objective.id]?.value).filter((v) => v !== undefined)
  if (values.length === 0) return undefined
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Units finished out of all, for the topic's one overall figure. */
export function topicCompletion(plan: Plan, progress: Progress): { done: number; of: number } {
  const units = planUnits(plan)
  const done = units.filter((unit) => {
    const state = unitState(progress, unit.id)
    return state === "complete" || state === "assessed"
  }).length
  return { done, of: units.length }
}

/** The first module a learner has not finished in a unit, in reading order. */
export function nextModule(progress: Progress, unitId: string): ModuleKind | undefined {
  const unit = progress.units[unitId]
  return MODULE_KINDS.find((kind) => {
    const state = unit?.modules[kind]?.state
    return state !== "complete" && state !== "assessed"
  })
}
