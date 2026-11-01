import { z } from "zod"
import { ChapterId, ObjectiveId, PartId, Slug, UnitId } from "./ids"

export const OBJECTIVE_LEVELS = ["recall", "explain", "analyse", "evaluate", "create"] as const

export const Objective = z.object({
  id: ObjectiveId,
  text: z.string().min(1),
  level: z.enum(OBJECTIVE_LEVELS),
})
export type Objective = z.infer<typeof Objective>

/** Content state only. Learner progress lives in progress.yaml. */
export const MODULE_STATES = ["planned", "generating", "generated", "stale"] as const
export const ModuleState = z.enum(MODULE_STATES)
export type ModuleState = z.infer<typeof ModuleState>

export const PlanModule = z.object({
  state: ModuleState,
  /** Set once generated: the generator's short name for how the module goes about its job. */
  approach: z.string().optional(),
})
export type PlanModule = z.infer<typeof PlanModule>

// Every unit has exactly these three. A unit that wants two readings is two units.
export const UnitModules = z.strictObject({
  reading: PlanModule,
  exercise: PlanModule,
  test: PlanModule,
})

export const Unit = z.object({
  id: UnitId,
  kind: z.literal("unit"),
  title: z.string().min(1),
  estimate: z.string().optional(),
  prerequisites: z.array(UnitId).default([]),
  objectives: z.array(Objective).min(1),
  modules: UnitModules,
})
export type Unit = z.infer<typeof Unit>

export const Chapter = z.object({
  id: ChapterId,
  kind: z.literal("chapter"),
  title: z.string().min(1),
  children: z.array(Unit).min(1),
})
export type Chapter = z.infer<typeof Chapter>

export const Part = z.object({
  id: PartId,
  kind: z.literal("part"),
  title: z.string().min(1),
  children: z.array(Chapter).min(1),
})
export type Part = z.infer<typeof Part>

/** plan.yaml: the curriculum. Exactly three levels; parts optional, so the top is all parts or all chapters. */
export const Plan = z.object({
  version: z.number().int().positive(),
  topic: Slug,
  contractsVersion: z.number().int().positive(),
  title: z.string().min(1),
  shape: z.string().min(1),
  rationale: z.string().min(1),
  nodes: z.union([z.array(Part).min(1), z.array(Chapter).min(1)]),
})
export type Plan = z.infer<typeof Plan>

/** Every unit in a plan, in reading order. */
export function planUnits(plan: Plan): Unit[] {
  return plan.nodes.flatMap((node) =>
    node.kind === "part" ? node.children.flatMap((chapter) => chapter.children) : node.children,
  )
}
