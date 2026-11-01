import type { Intake, IntakeAnswer, Objective, Outcome, Plan, PlanOutput, Progress, TestItem } from "@lf/contracts"

// What each job is given. Inputs are plain data so a prompt can carry them as JSON and the fake
// provider can read them back.

export interface QuestionsInputs {
  intake: Intake
}

export interface ProposeInputs {
  intake: Intake
  answers: IntakeAnswer[]
  previous?: PlanOutput
  comments?: string
}

export interface UnitContext {
  topic: { id: string; title: string }
  learner: Intake
  trail: string[]
  unit: { id: string; title: string; estimate?: string; objectives: Objective[]; prerequisites: string[] }
  /** Other units' ids and titles, so a module can link them. */
  units: { id: string; title: string }[]
}

export interface ReadingInputs extends UnitContext {
  references: { id: string; type: string; citation: string; verification: string }[]
  /** On a retry: what the checker found wrong with the first attempt. */
  errors?: string[]
}

export interface ExerciseInputs extends UnitContext {
  reading?: string
  errors?: string[]
}

export interface TestInputs extends UnitContext {
  reading?: string
  errors?: string[]
}

export interface TutorInputs {
  module: string
  objectives: Objective[]
  learner: Intake
}

export interface GradeInputs {
  kind: "exercise" | "test"
  module: string
  objectives: Objective[]
  transcript?: { role: string; text: string }[]
  items?: TestItem[]
  answers?: Record<string, string>
}

export interface ReviseInputs {
  intake: Intake
  answers: IntakeAnswer[]
  plan: Plan
  progress: Progress
  outcome?: Outcome
  trigger: string
}
