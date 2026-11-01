import { parseArgs } from "node:util"
import { openBank, openIndex } from "@lf/bank"
import { createRuntime, loadEnv, providerFromEnv } from "@lf/runtime"

const USAGE = `lf: the learning framework's command line

  lf check <topic>                          validate a topic against the contracts
  lf topic list                             list topics in the bank
  lf topic new <slug> --title ... [--goals ...] [--prior ...]
                                            create a topic with an empty plan, for hand-written fixtures
  lf generate <topic> <unit> <kind>         generate a module: reading, exercise or test
  lf revise <topic>                         ask the planner for a revision from the latest outcome
  lf revision accept|reject <topic> <id>    decide a proposed revision
  lf verify <topic> <reference> [--state verified|unverified|failed]
                                            record that a human checked a reference
  lf bank index                             rebuild the derived index
  lf provider                               say which provider and model the environment selects

Reads the bank from $BANK_DIR and the provider from .env.local (ANTHROPIC_API_KEY, LF_PROVIDER, LF_MODEL).`

async function main(argv: string[]) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      title: { type: "string" },
      goals: { type: "string" },
      prior: { type: "string" },
      state: { type: "string", default: "verified" },
    },
  })
  const [command, ...rest] = positionals
  loadEnv()
  const bank = openBank()
  const runtime = () => createRuntime(bank, { provider: providerFromEnv(), by: "cli" })

  switch (command) {
    case "check": {
      const slug = rest[0]
      if (!slug) throw new Error("lf check <topic>")
      const issues = bank.check(slug)
      for (const issue of issues)
        console.log(`${issue.level === "error" ? "error" : "warn "}  ${issue.path}: ${issue.message}`)
      const errors = issues.filter((issue) => issue.level === "error").length
      console.log(
        issues.length === 0
          ? `${slug}: clean`
          : `${slug}: ${errors} error(s), ${issues.length - errors} warning(s)`,
      )
      process.exitCode = errors > 0 ? 1 : 0
      return
    }
    case "topic": {
      if (rest[0] === "list") {
        for (const topic of bank.listTopics())
          console.log(`${topic.id}\t${topic.units} units\t${topic.title}`)
        return
      }
      if (rest[0] === "new") {
        const id = rest[1]
        if (!id || !values.title)
          throw new Error("lf topic new <slug> --title ... [--goals ...] [--prior ...]")
        const today = new Date().toISOString().slice(0, 10)
        bank.createTopic(
          {
            id,
            title: values.title,
            created: today,
            contractsVersion: 1,
            learner: { goals: values.goals ?? "TODO", prior: values.prior ?? "TODO" },
            intake: [],
            models: undefined,
          },
          {
            version: 1,
            topic: id,
            contractsVersion: 1,
            title: values.title,
            shape: "TODO",
            rationale: "TODO: written by hand.",
            nodes: [
              {
                id: "c1",
                kind: "chapter",
                title: "TODO",
                children: [
                  {
                    id: "c1.u1",
                    kind: "unit",
                    title: "TODO",
                    prerequisites: [],
                    objectives: [{ id: "obj.todo.first", text: "TODO", level: "explain" }],
                    modules: { reading: { state: "planned" }, exercise: { state: "planned" }, test: { state: "planned" } },
                  },
                ],
              },
            ],
          },
        )
        console.log(`Created ${id} in ${bank.dir}. Edit plan.yaml, then lf check ${id}.`)
        return
      }
      throw new Error("lf topic list | lf topic new <slug> --title ...")
    }
    case "generate": {
      const [topic, unit, kind] = rest
      if (!topic || !unit || (kind !== "reading" && kind !== "exercise" && kind !== "test")) {
        throw new Error("lf generate <topic> <unit> reading|exercise|test")
      }
      const { module, issues } = await runtime().generate(topic, unit, kind)
      console.log(`Wrote modules/${unit}/${kind}.md (${module.frontmatter.approach})`)
      for (const issue of issues) console.log(`${issue.level === "error" ? "error" : "warn "}  ${issue.path}: ${issue.message}`)
      return
    }
    case "revise": {
      const topic = rest[0]
      if (!topic) throw new Error("lf revise <topic>")
      const result = await runtime().plan.revise(topic, "On request from the command line")
      console.log(result.revision ? `Proposed ${result.revision.id}: ${result.revision.revision.summary}` : `No revision: ${result.reason}`)
      return
    }
    case "revision": {
      const [decision, topic, id] = rest
      if ((decision !== "accept" && decision !== "reject") || !topic || !id) throw new Error("lf revision accept|reject <topic> <id>")
      if (decision === "accept") {
        const plan = await runtime().plan.accept(topic, id)
        console.log(`Accepted ${id}; the plan is v${plan.version}`)
      } else {
        await runtime().plan.reject(topic, id)
        console.log(`Rejected ${id}`)
      }
      return
    }
    case "verify": {
      const [topic, reference] = rest
      const state = values.state
      if (!topic || !reference || (state !== "verified" && state !== "unverified" && state !== "failed")) {
        throw new Error("lf verify <topic> <reference> [--state verified|unverified|failed]")
      }
      await runtime().references.setVerification(topic, reference, state)
      console.log(`${reference}: ${state}`)
      return
    }
    case "bank": {
      if (rest[0] !== "index") throw new Error("lf bank index")
      const index = openIndex(bank.dir)
      index.rebuild(bank.listTopics().map((topic) => bank.loadTopic(topic.id)))
      for (const topic of index.topics()) console.log(`${topic.id}\t${topic.units} units`)
      index.close()
      return
    }
    case "provider": {
      const provider = providerFromEnv()
      console.log(`${provider.name} (${provider.model})`)
      return
    }
    default:
      console.log(USAGE)
      process.exitCode = command ? 1 : 0
  }
}

main(process.argv.slice(2)).catch((error: Error) => {
  console.error(error.message)
  process.exitCode = 1
})
