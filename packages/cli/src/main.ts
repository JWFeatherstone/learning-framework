import { parseArgs } from "node:util"
import { openBank, openIndex } from "@lf/bank"
import { createRuntime } from "@lf/runtime"

const USAGE = `lf: the learning framework's command line

  lf check <topic>                 validate a topic against the contracts
  lf topic new <slug> --title ...  create an empty topic in the bank
  lf topic list                    list topics in the bank
  lf bank index                    rebuild the derived index
  lf generate <topic> <unit> <kind>   (pass 2) generate a module

Reads the bank from $BANK_DIR.`

async function main(argv: string[]) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { title: { type: "string" }, goals: { type: "string" }, prior: { type: "string" } },
  })
  const [command, ...rest] = positionals
  const bank = openBank()

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
        const dir = bank.createTopic({
          id,
          title: values.title,
          goals: values.goals ?? "TODO",
          prior: values.prior ?? "TODO",
        })
        console.log(`Created ${dir}. Next: write plan.yaml (or run the wizard once the runtime exists).`)
        return
      }
      throw new Error("lf topic list | lf topic new <slug> --title ...")
    }
    case "bank": {
      if (rest[0] !== "index") throw new Error("lf bank index")
      const index = openIndex(bank.dir)
      index.rebuild(bank.listTopics().map((topic) => bank.loadTopic(topic.id)))
      for (const topic of index.topics()) console.log(`${topic.id}\t${topic.units} units`)
      index.close()
      return
    }
    case "generate": {
      const [topic, unit, kind] = rest
      if (!topic || !unit || (kind !== "reading" && kind !== "exercise" && kind !== "test")) {
        throw new Error("lf generate <topic> <unit> reading|exercise|test")
      }
      await createRuntime(bank).generate[kind](topic, unit)
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
