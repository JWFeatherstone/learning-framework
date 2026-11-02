import { z } from "zod"

/** What the learner tells the wizard before the planner asks anything. */
export const Intake = z.object({
  title: z.string().min(1),
  goals: z.string().min(1),
  prior: z.string().min(1),
  hoursPerWeek: z.number().positive().optional(),
  /** With hours a week, the time the plan is sized to. */
  weeks: z.number().int().positive().optional(),
  preferences: z.string().optional(),
  /** Repositories on this machine (paths) and sites the course should draw on. */
  sources: z.array(z.string().min(1)).optional(),
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
