import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MODULE_KINDS, ModuleFrontmatter, Plan, planUnits, ReferenceFrontmatter, splitFrontmatter, Topic } from "@lf/contracts"
import { parse } from "yaml"
import { afterAll, describe, expect, it } from "vitest"
import { openBank, parseTranscript } from "./bank"

const FIXTURE = new URL("../../contracts/fixtures/ww2-global", import.meta.url).pathname

describe("bank", () => {
  const dir = mkdtempSync(join(tmpdir(), "lf-bank-"))
  const bank = openBank(dir)
  afterAll(() => {
    bank.close()
    rmSync(dir, { recursive: true, force: true })
  })

  it("creates a topic, writes state, and keeps check clean", () => {
    const topic = readYaml("topic.yaml", Topic)
    const plan = readYaml("plan.yaml", Plan)
    bank.createTopic(topic, plan)
    for (const path of ["references/iriye-origins.md", "references/lytton-report.md"]) {
      const { frontmatter, body } = splitFrontmatter(readFileSync(join(FIXTURE, path), "utf8"))
      bank.writeReference("ww2-global", ReferenceFrontmatter.parse(frontmatter), body)
    }
    for (const kind of MODULE_KINDS) {
      const { frontmatter, body } = splitFrontmatter(readFileSync(join(FIXTURE, "modules/p1.c1.u1", `${kind}.md`), "utf8"))
      bank.writeModule("ww2-global", "p1.c1.u1", kind, ModuleFrontmatter.parse(frontmatter), body)
    }
    expect(bank.listTopics()).toEqual([{ id: "ww2-global", title: topic.title, created: topic.created, units: 2 }])
    expect(bank.check("ww2-global")).toEqual([])
    expect(bank.readModule("ww2-global", "p1.c1.u1", "reading")?.frontmatter.approach).toBe("perspectives")
  })

  it("sets module state in the plan and archives on a plan rewrite", () => {
    bank.setModuleState("ww2-global", "p1.c1.u2", "reading", "generating")
    expect(planUnits(bank.loadTopic("ww2-global").plan)[1]?.modules.reading.state).toBe("generating")
    const plan = bank.loadTopic("ww2-global").plan
    bank.writePlan("ww2-global", { ...plan, version: 2 }, true)
    expect(bank.readFiles("ww2-global")["plan.history/v1.yaml"]).toContain("version: 1")
  })

  it("records a session as a transcript it can read back", () => {
    bank.createSession(
      "ww2-global",
      { id: "s1", kind: "exercise", unit: "p1.c1.u1", module: "exercise", planVersion: 1, startedAt: "2026-10-31T20:00:00Z" },
      "snapshot",
    )
    bank.appendTurn("ww2-global", "s1", { role: "tutor", text: "Opening question?" })
    bank.appendTurn("ww2-global", "s1", { role: "learner", text: "An answer\n\nin two paragraphs." })
    expect(bank.readSession("ww2-global", "s1")?.turns).toEqual([
      { role: "tutor", text: "Opening question?" },
      { role: "learner", text: "An answer\n\nin two paragraphs." },
    ])
  })

  it("parses an empty transcript", () => {
    expect(parseTranscript("")).toEqual([])
  })
})

function readYaml<T>(name: string, schema: { parse(data: unknown): T }): T {
  return schema.parse(parse(readFileSync(join(FIXTURE, name), "utf8")))
}
