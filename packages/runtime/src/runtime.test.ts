import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openBank } from "@lf/bank"
import { planUnits } from "@lf/contracts"
import { afterAll, describe, expect, it } from "vitest"
import { createRuntime } from "./index"

// The whole Phase 0 loop against a temporary bank with the deterministic provider: wizard, confirm,
// generate, read, seminar, test, grade, revise, accept. Every write goes through the bank; `check`
// stays clean at each step.
const dir = mkdtempSync(join(tmpdir(), "lf-runtime-"))
const bank = openBank(dir)
const runtime = createRuntime(bank, { by: "cli" })

afterAll(() => {
  bank.close()
  rmSync(dir, { recursive: true, force: true })
})

const intake = {
  title: "The Thirty Years War",
  goals: "Explain why it lasted so long and assess the peace.",
  prior: "A general sense of early modern Europe.",
  hoursPerWeek: 3,
}

describe("the loop", () => {
  let slug = ""

  it("asks questions, proposes a plan and creates the topic on confirmation", async () => {
    const questions = await runtime.plan.questions(intake)
    expect(questions.length).toBeGreaterThan(0)
    const answers = questions.map((question) => ({ question: question.question, answer: question.guess }))
    const first = await runtime.plan.propose({ intake, answers })
    const second = await runtime.plan.propose({ intake, answers, previous: first, comments: "Add a unit on Sweden." })
    expect(second.nodes.at(-1)?.children.length).toBe((first.nodes.at(-1)?.children.length ?? 0) + 1)
    expect(bank.listTopics()).toHaveLength(0)
    slug = await runtime.plan.create(intake, answers, second)
    expect(slug).toBe("the-thirty-years-war")
    expect(bank.check(slug)).toEqual([])
    expect(bank.loadTopic(slug).topic.intake).toEqual(answers)
  })

  it("generates the three modules of a unit and check stays clean", async () => {
    for (const kind of ["reading", "exercise", "test"] as const) {
      const { module, issues } = await runtime.generate(slug, "c1.u1", kind)
      expect(module.frontmatter.kind).toBe(kind)
      expect(issues.filter((issue) => issue.level === "error")).toEqual([])
    }
    const { plan } = bank.loadTopic(slug)
    expect(planUnits(plan).find((unit) => unit.id === "c1.u1")?.modules.reading).toEqual({ state: "generated", approach: "perspectives" })
    expect(bank.check(slug)).toEqual([])
  })

  it("marks the reading complete", async () => {
    const progress = await runtime.progress.set(slug, "c1.u1", "reading", "complete")
    expect(progress.units["c1.u1"]?.modules.reading?.state).toBe("complete")
    expect(progress.units["c1.u1"]?.state).toBe("in-progress")
  })

  it("runs a seminar: opening turn, a streamed reply, then an outcome", async () => {
    const session = await runtime.tutor.start(slug, "c1.u1")
    expect(session.turns).toHaveLength(1)
    expect(session.turns[0]?.role).toBe("tutor")
    let reply = ""
    for await (const delta of runtime.tutor.turn(slug, session.session.id, "Sweden chose to intervene; France paid for it.")) reply += delta
    expect(reply.length).toBeGreaterThan(10)
    expect(bank.readSession(slug, session.session.id)?.turns).toHaveLength(3)
    const { outcome } = await runtime.tutor.end(slug, session.session.id)
    expect(outcome.items.length).toBe(2)
    const after = bank.loadTopic(slug)
    expect(after.progress.units["c1.u1"]?.modules.exercise?.state).toBe("complete")
    expect(Object.keys(after.progress.mastery)).toHaveLength(2)
    expect(after.sessions[0]?.endedAt).toBeDefined()
    expect(bank.check(slug)).toEqual([])
  })

  it("grades a test attempt, proposes a revision for the gap, and applies it on acceptance", async () => {
    const test = bank.readModule(slug, "c1.u1", "test")
    if (test?.frontmatter.kind !== "test") throw new Error("no test")
    // The first objective's free item goes unanswered; the rest are answered well.
    const answers = Object.fromEntries(
      test.frontmatter.items.map((item, index) => [
        item.id,
        item.type === "choice" ? (item.key ?? "") : index === 0 ? "" : "A long answer ".repeat(10).trim(),
      ]),
    )
    const graded = await runtime.grade.attempt(slug, "c1.u1", answers)
    expect(graded.outcome.gaps.length).toBeGreaterThan(0)
    expect(graded.revision).not.toBeNull()
    const before = bank.loadTopic(slug)
    expect(before.progress.units["c1.u1"]?.state).toBe("assessed")
    expect(before.revisions[0]?.revision.state).toBe("proposed")

    const plan = await runtime.plan.accept(slug, graded.revision!.id)
    expect(plan.version).toBe(2)
    expect(planUnits(plan).find((unit) => unit.id === "c1.u1")?.modules.exercise.state).toBe("stale")
    const after = bank.loadTopic(slug)
    expect(after.revisions[0]?.revision.state).toBe("accepted")
    expect(after.files["plan.history/v1.yaml"]).toBeDefined()
    expect(bank.check(slug).filter((issue) => issue.level === "error")).toEqual([])
  })

  it("proposes on request from the latest outcome, against the current plan", async () => {
    const result = await runtime.plan.revise(slug, "On request")
    expect(result.revision?.revision.basedOn).toBe(2)
    expect(result.revision?.revision.trigger).toBe("On request")
    await runtime.plan.reject(slug, result.revision!.id)
    expect(bank.loadTopic(slug).revisions.find((entry) => entry.id === result.revision!.id)?.revision.state).toBe("rejected")
  })

  it("records a human's verification of a reference", async () => {
    bank.writeReference(
      slug,
      { id: "wedgwood", type: "book", citation: "Wedgwood, C. V. The Thirty Years War. 1938.", access: "library", verification: { state: "unverified" } },
      "",
    )
    await runtime.references.setVerification(slug, "wedgwood", "verified")
    expect(bank.readReference(slug, "wedgwood")?.frontmatter.verification.state).toBe("verified")
  })
})
