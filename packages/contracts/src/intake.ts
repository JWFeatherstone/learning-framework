import { z } from "zod"

/** What the learner tells the wizard before the planner asks anything. */
export const Intake = z.object({
  title: z.string().min(1),
  goals: z.string().min(1),
  prior: z.string().min(1),
  hoursPerWeek: z.number().positive().optional(),
  preferences: z.string().optional(),
})
export type Intake = z.infer<typeof Intake>

/** One clarifying question from the planner, with its best guess so most can be accepted as they are. */
export const IntakeQuestion = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  guess: z.string().min(1),
})
export type IntakeQuestion = z.infer<typeof IntakeQuestion>

/** A question and the learner's answer, kept in topic.yaml so later planning sees the same context. */
export const IntakeAnswer = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})
export type IntakeAnswer = z.infer<typeof IntakeAnswer>
