import { z } from "zod"
import { ModuleId, ObjectiveId, Provenance, Slug, UnitId } from "./ids"

const Common = {
  id: ModuleId,
  unit: UnitId,
  objectives: z.array(ObjectiveId).min(1),
  approach: z.string().min(1),
  planVersion: z.number().int().positive(),
  provenance: Provenance,
}

export const ReadingFrontmatter = z.object({
  ...Common,
  kind: z.literal("reading"),
  estimate: z.string().optional(),
  /** Reference ids. Every one must be verified before a learner is sent to it. */
  references: z.array(Slug).default([]),
})

export const EXERCISE_FORMS = ["dialogue", "task"] as const

export const ExerciseFrontmatter = z.object({
  ...Common,
  kind: z.literal("exercise"),
  /** How the client runs it: a transcript with a tutor, or a task the learner completes. */
  form: z.enum(EXERCISE_FORMS),
})

export const TEST_ITEM_TYPES = ["free", "choice", "source"] as const

export const TestItem = z.object({
  id: z.string().min(1),
  objective: ObjectiveId,
  type: z.enum(TEST_ITEM_TYPES),
  prompt: z.string().min(1),
  /** For choice items. */
  options: z.array(z.string()).optional(),
  key: z.string().optional(),
  /** For free and source items: what a 0, 1 and 2 look like. */
  rubric: z.array(z.string()).optional(),
  /** For source items: the excerpt. */
  source: z.string().optional(),
})
export type TestItem = z.infer<typeof TestItem>

export const TestFrontmatter = z.object({
  ...Common,
  kind: z.literal("test"),
  items: z.array(TestItem).min(1),
  /** Passing mastery per objective, 0 to 1. */
  passing: z.record(ObjectiveId, z.number().min(0).max(1)).optional(),
})

export const ModuleFrontmatter = z.discriminatedUnion("kind", [
  ReadingFrontmatter,
  ExerciseFrontmatter,
  TestFrontmatter,
])
export type ModuleFrontmatter = z.infer<typeof ModuleFrontmatter>

/** Headings each kind's body must carry, in order. A test's items are its body, so it needs none. */
export const REQUIRED_SECTIONS: Record<ModuleFrontmatter["kind"], string[]> = {
  reading: ["Framing", "Material", "Perspectives", "Key terms", "Go deeper"],
  exercise: ["Brief for the learner", "Brief for the tutor", "Stop conditions"],
  test: [],
}

/** For a task exercise the tutor brief gives way to the task and its rubric. */
export const TASK_SECTIONS = ["Brief for the learner", "Task and rubric", "Stop conditions"]
