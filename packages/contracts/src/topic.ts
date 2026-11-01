import { z } from "zod"
import { IsoDate, Slug } from "./ids"
import { IntakeAnswer } from "./intake"

export const LearnerProfile = z.object({
  goals: z.string().min(1),
  prior: z.string().min(1),
  hoursPerWeek: z.number().positive().optional(),
  preferences: z.string().optional(),
})

export const ModelSettings = z
  .object({
    plan: z.string().optional(),
    generate: z.string().optional(),
    tutor: z.string().optional(),
    grade: z.string().optional(),
  })
  .optional()

/** topic.yaml: what the topic is and who is learning it. */
export const Topic = z.object({
  id: Slug,
  title: z.string().min(1),
  created: IsoDate,
  contractsVersion: z.number().int().positive(),
  learner: LearnerProfile,
  /** The wizard's questions and answers, so revisions plan from the same context as v1. */
  intake: z.array(IntakeAnswer).default([]),
  models: ModelSettings,
})
export type Topic = z.infer<typeof Topic>
