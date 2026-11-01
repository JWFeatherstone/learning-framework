import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import * as contracts from "../src/index"

// Writes one JSON Schema per document kind into schemas/, for prompts and for editors.
const SCHEMAS = {
  topic: contracts.Topic,
  plan: contracts.Plan,
  "module-reading": contracts.ReadingFrontmatter,
  "module-exercise": contracts.ExerciseFrontmatter,
  "module-test": contracts.TestFrontmatter,
  reference: contracts.ReferenceFrontmatter,
  progress: contracts.Progress,
  session: contracts.Session,
  outcome: contracts.Outcome,
  revision: contracts.Revision,
  attempt: contracts.Attempt,
  intake: contracts.Intake,
  "output-questions": contracts.QuestionsOutput,
  "output-plan": contracts.PlanOutput,
  "output-reading": contracts.ReadingOutput,
  "output-exercise": contracts.ExerciseOutput,
  "output-test": contracts.TestOutput,
  "output-outcome": contracts.OutcomeOutput,
  "output-revision": contracts.RevisionOutput,
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas")
mkdirSync(dir, { recursive: true })
for (const [name, schema] of Object.entries(SCHEMAS)) {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12", io: "input" })
  writeFileSync(join(dir, `${name}.schema.json`), `${JSON.stringify(json, null, 2)}\n`)
}
console.log(`Wrote ${Object.keys(SCHEMAS).length} schemas to ${dir}`)
