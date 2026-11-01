import { DatabaseSync } from "node:sqlite"
import { join } from "node:path"
import { planUnits, type Plan } from "@lf/contracts"
import type { LoadedTopic } from "./bank"

// A derived, rebuildable index over the bank's files, for cross-file queries. Never holds anything
// that is not on disk; deleting it costs a rebuild. Pass 1 indexes topics and units only.

const SCHEMA_VERSION = 1

export interface Index {
  rebuild(topics: LoadedTopic[]): void
  topics(): { id: string; title: string; units: number }[]
  close(): void
}

export function openIndex(bankDir: string): Index {
  const db = new DatabaseSync(join(bankDir, ".index.sqlite"))
  db.exec(`
    create table if not exists meta (key text primary key, value text not null);
    create table if not exists topics (id text primary key, title text not null, plan_version integer not null);
    create table if not exists units (
      topic text not null, id text not null, title text not null, position integer not null,
      primary key (topic, id)
    );
  `)
  const version = db.prepare("select value from meta where key = 'schema'").get() as
    { value: string } | undefined
  if (version && Number(version.value) !== SCHEMA_VERSION) {
    db.exec("drop table topics; drop table units;")
    db.exec("delete from meta")
  }
  db.prepare("insert or replace into meta (key, value) values ('schema', ?)").run(String(SCHEMA_VERSION))

  const insertTopic = db.prepare("insert or replace into topics (id, title, plan_version) values (?, ?, ?)")
  const insertUnit = db.prepare(
    "insert or replace into units (topic, id, title, position) values (?, ?, ?, ?)",
  )

  const indexPlan = (topic: string, plan: Plan) => {
    insertTopic.run(topic, plan.title, plan.version)
    planUnits(plan).forEach((unit, position) => insertUnit.run(topic, unit.id, unit.title, position))
  }

  return {
    rebuild(topics) {
      db.exec("begin; delete from topics; delete from units;")
      for (const loaded of topics) indexPlan(loaded.id, loaded.plan)
      db.exec("commit")
    },
    topics() {
      return db
        .prepare(
          "select t.id, t.title, count(u.id) as units from topics t left join units u on u.topic = t.id group by t.id",
        )
        .all() as { id: string; title: string; units: number }[]
    },
    close: () => db.close(),
  }
}
