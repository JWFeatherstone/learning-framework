import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { check, type TopicFiles } from "./check"

const FIXTURE = new URL("../fixtures/ww2-global", import.meta.url).pathname

function readTopic(dir: string): TopicFiles {
  const files: TopicFiles = {}
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.(ya?ml|md)$/.test(name)) files[relative(dir, path)] = readFileSync(path, "utf8")
    }
  }
  walk(dir)
  return files
}

const errors = (files: TopicFiles) => check(files).filter((issue) => issue.level === "error")

describe("check", () => {
  const fixture = readTopic(FIXTURE)

  it("passes the fixture topic", () => {
    expect(check(fixture)).toEqual([])
  })

  it("refuses a reading that cites an unverified reference", () => {
    const files = { ...fixture }
    files["modules/p1.c1.u1/reading.md"] = files["modules/p1.c1.u1/reading.md"]!.replace(
      "references: [iriye-origins, lytton-report]",
      "references: [iriye-origins, mitter-war]",
    )
    expect(errors(files).map((issue) => issue.message)).toContainEqual(expect.stringContaining("mitter-war"))
  })

  it("refuses a fourth level and a fourth module kind", () => {
    const files = { ...fixture }
    files["plan.yaml"] = files["plan.yaml"]!.replace(
      "test: { state: generated, approach: mixed paper }",
      "test: { state: generated, approach: mixed paper }\n              quiz: { state: planned }",
    )
    expect(errors(files).some((issue) => issue.path === "plan.yaml")).toBe(true)
  })

  it("wants every objective tested", () => {
    const files = { ...fixture }
    files["modules/p1.c1.u1/test.md"] = files["modules/p1.c1.u1/test.md"]!.replace(
      "objective: obj.manchuria.causes\n    type: free",
      "objective: obj.manchuria.league\n    type: free",
    )
    expect(errors(files).map((issue) => issue.message)).toContainEqual("no item tests obj.manchuria.causes")
  })

  it("flags a generated module whose file is missing", () => {
    const files = { ...fixture }
    delete files["modules/p1.c1.u1/exercise.md"]
    expect(errors(files).map((issue) => issue.message)).toContainEqual(
      expect.stringContaining("exercise.md is missing"),
    )
  })

  it("catches a dangling link", () => {
    const files = { ...fixture }
    files["modules/p1.c1.u1/reading.md"] = `${files["modules/p1.c1.u1/reading.md"]}\nSee [[unit:p9.c9.u9]].\n`
    expect(errors(files).map((issue) => issue.message)).toContainEqual("[[unit:p9.c9.u9]] is not in the plan")
  })
})
