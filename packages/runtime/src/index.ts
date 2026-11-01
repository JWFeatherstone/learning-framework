import type { Bank } from "@lf/bank"
import type { Issue, ModuleKind, Outcome, Plan, Revision } from "@lf/contracts"
import { unconfiguredProvider, type Provider } from "./provider"

export type { CompleteOptions, Completion, Message, Provider } from "./provider"
export { unconfiguredProvider }

// Typed stubs for the nine runtime jobs. Each takes the bank and typed inputs, and in pass 2 will:
// render its prompt from prompts/, call the provider, validate against @lf/contracts, run check,
// retry once with the errors, then write files through @lf/bank. Both the server and the CLI call these.

export interface Runtime {
  plan: {
    questions(topic: string): Promise<{ question: string; guess: string }[]>
    propose(topic: string, answers: Record<string, string>): Promise<Plan>
    revise(topic: string): Promise<Revision | null>
  }
  generate: Record<ModuleKind, (topic: string, unit: string) => Promise<{ path: string; issues: Issue[] }>>
  tutor: { run(topic: string, unit: string): AsyncIterable<string> }
  grade: { attempt(topic: string, sessionId: string): Promise<Outcome> }
  references: { verify(topic: string, referenceId: string): Promise<"verified" | "failed"> }
}

const notImplemented = (job: string) => async (): Promise<never> => {
  throw new Error(`${job} is not implemented yet (pass 1 stub)`)
}

export function createRuntime(_bank: Bank, _provider: Provider = unconfiguredProvider()): Runtime {
  return {
    plan: {
      questions: notImplemented("plan.questions"),
      propose: notImplemented("plan.propose"),
      revise: notImplemented("plan.revise"),
    },
    generate: {
      reading: notImplemented("generate.reading"),
      exercise: notImplemented("generate.exercise"),
      test: notImplemented("generate.test"),
    },
    tutor: {
      // eslint-disable-next-line require-yield
      async *run() {
        throw new Error("tutor.run is not implemented yet (pass 1 stub)")
      },
    },
    grade: { attempt: notImplemented("grade.attempt") },
    references: { verify: notImplemented("references.verify") },
  }
}
