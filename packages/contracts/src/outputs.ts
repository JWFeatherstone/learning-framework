import { z } from "zod"
import { IntakeQuestion } from "./intake"
import { blockProblems } from "./markdown"
import { EXERCISE_FORMS, MODULE_BLOCKS, TestItem } from "./module"
import { Plan } from "./plan"
import { ACCESS, REFERENCE_TYPES } from "./reference"
import { Revision } from "./revision"
import { Outcome } from "./state"
import { ObjectiveId, Slug } from "./ids"

// What each runtime job asks the model for. The runtime validates the model's JSON against these, then
// adds ids, versions and provenance itself, so a model never writes a file's bookkeeping.

export const QuestionsOutput = z.object({ questions: z.array(IntakeQuestion).min(1).max(8) })
export type QuestionsOutput = z.infer<typeof QuestionsOutput>

export const PlanOutput = Plan.omit({ version: true, topic: true, contractsVersion: true })
export type PlanOutput = z.infer<typeof PlanOutput>

/** A reference the generator wants to cite that the topic does not have yet. Written unverified. */
export const NewReference = z.object({
  id: Slug,
  type: z.enum(REFERENCE_TYPES),
  citation: z.string().min(1),
  locator: z.string().optional(),
  url: z.string().optional(),
  access: z.enum(ACCESS),
  note: z.string().optional(),
})
export type NewReference = z.infer<typeof NewReference>

export const ReadingOutput = z.object({
  approach: z.string().min(1),
  estimate: z.string().optional(),
  objectives: z.array(ObjectiveId).min(1),
  references: z.array(Slug).default([]),
  newReferences: z.array(NewReference).default([]),
  // Checked here as well as by `check`, so a malformed block goes back to the model with the reason.
  body: z
    .string()
    .min(1)
    .superRefine((body, context) => {
      for (const problem of blockProblems(body, MODULE_BLOCKS)) context.addIssue({ code: "custom", message: problem })
    }),
})
export type ReadingOutput = z.infer<typeof ReadingOutput>

export const ExerciseOutput = z.object({
  approach: z.string().min(1),
  form: z.enum(EXERCISE_FORMS),
  objectives: z.array(ObjectiveId).min(1),
  body: z.string().min(1),
})
export type ExerciseOutput = z.infer<typeof ExerciseOutput>

export const TestOutput = z.object({
  approach: z.string().min(1),
  objectives: z.array(ObjectiveId).min(1),
  items: z.array(TestItem).min(1),
  passing: z.record(ObjectiveId, z.number().min(0).max(1)).optional(),
})
export type TestOutput = z.infer<typeof TestOutput>

export const OutcomeOutput = Outcome.pick({ confidence: true, items: true, gaps: true })
export type OutcomeOutput = z.infer<typeof OutcomeOutput>

/** The planner either proposes a revision or says why the plan should stand. */
export const RevisionOutput = z.union([
  z.object({ revise: z.literal(false), reason: z.string().min(1) }),
  z.object({ revise: z.literal(true) }).extend(Revision.pick({ summary: true, changes: true, reasons: true }).shape),
])
export type RevisionOutput = z.infer<typeof RevisionOutput>
