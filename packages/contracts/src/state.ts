import { z } from "zod"
import { IsoDate, ModuleId, ModuleKind, ObjectiveId, UnitId } from "./ids"

// Learner state, as files. Only progress.yaml is rewritten in place; sessions and outcomes are append-only.

export const PROGRESS_STATES = ["not-started", "in-progress", "complete", "assessed"] as const
export const ProgressState = z.enum(PROGRESS_STATES)
export type ProgressState = z.infer<typeof ProgressState>

const SessionId = z.string().min(1)

export const ModuleProgress = z.object({
  state: ProgressState,
  at: IsoDate.optional(),
  session: SessionId.optional(),
  outcome: z.string().optional(),
})

export const UnitProgress = z.object({
  state: ProgressState,
  modules: z.object({
    reading: ModuleProgress.optional(),
    exercise: ModuleProgress.optional(),
    test: ModuleProgress.optional(),
  }),
})

/** progress.yaml */
export const Progress = z.object({
  units: z.record(UnitId, UnitProgress).default({}),
  mastery: z
    .record(ObjectiveId, z.object({ value: z.number().min(0).max(1), lastAssessed: IsoDate }))
    .default({}),
})
export type Progress = z.infer<typeof Progress>

/** sessions/<id>/session.yaml */
export const Session = z.object({
  id: SessionId,
  kind: ModuleKind.exclude(["reading"]),
  unit: UnitId,
  module: ModuleKind,
  planVersion: z.number().int().positive(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  model: z.string().optional(),
  outcome: z.string().optional(),
})
export type Session = z.infer<typeof Session>

/** sessions/<id>/attempt.yaml: a test attempt's answers by item id, written before grading. */
export const Attempt = z.object({
  answers: z.record(z.string(), z.string()),
  submittedAt: z.string(),
})
export type Attempt = z.infer<typeof Attempt>

/** outcomes/<id>.yaml */
export const Outcome = z.object({
  session: SessionId,
  module: ModuleId,
  grader: z.object({ model: z.string(), prompt: z.string() }),
  confidence: z.enum(["low", "medium", "high"]),
  items: z.array(
    z.object({
      id: z.string(),
      objective: ObjectiveId,
      score: z.number().min(0),
      of: z.number().positive(),
      note: z.string().optional(),
    }),
  ),
  gaps: z
    .array(z.object({ objective: ObjectiveId, diagnosis: z.string(), suggestion: z.string().optional() }))
    .default([]),
})
export type Outcome = z.infer<typeof Outcome>
