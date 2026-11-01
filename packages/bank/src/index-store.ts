import { DatabaseSync } from "node:sqlite"
import { join } from "node:path"
import { MODULE_KINDS, planUnits, unitState } from "@lf/contracts"
import type { LoadedTopic } from "./bank"

// A derived, rebuildable index over the bank's files, for cross-file queries. Never holds anything
// that is not on disk; deleting it costs a rebuild. Rows carry what the client lists: topics, units
// with their learner state, module content state, sessions.

const SCHEMA_VERSION = 2

export interface Index {
  rebuild(topics: LoadedTopic[]): void
  indexTopic(topic: LoadedTopic): void
  topics(): { id: string; title: string; units: number; sessions: number }[]
  close(): void
}

export function openIndex(bankDir: string): Index {
  const db = new DatabaseSync(join(bankDir, ".index.sqlite"))
  db.exec("create table if not exists meta (key text primary key, value text not null)")
  const version = db.prepare("select value from meta where key = 'schema'").get() as { value: string } | undefined
  if (version && Number(version.value) !== SCHEMA_VERSION) {
    db.exec("drop table if exists topics; drop table if exists units; drop table if exists modules; drop table if exists sessions")
    db.exec("delete from meta")
  }
  db.exec(`
    create table if not exists topics (id text primary key, title text not null, plan_version integer not null);
    create table if not exists units (
      topic text not null, id text not null, title text not null, position integer not null, state text not null,
      primary key (topic, id)
    );
    create table if not exists modules (
      topic text not null, unit text not null, kind text not null, state text not null, approach text,
      primary key (topic, unit, kind)
    );
    create table if not exists sessions (
      topic text not null, id text not null, kind text not null, unit text not null,
      started_at text not null, ended_at text, outcome text,
      primary key (topic, id)
    );
  `)
  db.prepare("insert or replace into meta (key, value) values ('schema', ?)").run(String(SCHEMA_VERSION))

  const clear = ["topics", "units", "modules", "sessions"].map((table) =>
    db.prepare(`delete from ${table} where ${table === "topics" ? "id" : "topic"} = ?`),
  )
  const insertTopic = db.prepare("insert into topics (id, title, plan_version) values (?, ?, ?)")
  const insertUnit = db.prepare("insert into units (topic, id, title, position, state) values (?, ?, ?, ?, ?)")
  const insertModule = db.prepare("insert into modules (topic, unit, kind, state, approach) values (?, ?, ?, ?, ?)")
  const insertSession = db.prepare(
    "insert into sessions (topic, id, kind, unit, started_at, ended_at, outcome) values (?, ?, ?, ?, ?, ?, ?)",
  )

  const indexTopic = (loaded: LoadedTopic) => {
    for (const statement of clear) statement.run(loaded.id)
    insertTopic.run(loaded.id, loaded.plan.title, loaded.plan.version)
    planUnits(loaded.plan).forEach((unit, position) => {
      insertUnit.run(loaded.id, unit.id, unit.title, position, unitState(loaded.progress, unit.id))
      for (const kind of MODULE_KINDS) {
        const planned = unit.modules[kind]
        insertModule.run(loaded.id, unit.id, kind, planned.state, planned.approach ?? null)
      }
    })
    for (const session of loaded.sessions) {
      insertSession.run(
        loaded.id,
        session.id,
        session.kind,
        session.unit,
        session.startedAt,
        session.endedAt ?? null,
        session.outcome ?? null,
      )
    }
  }

  return {
    rebuild(topics) {
      db.exec("begin")
      db.exec("delete from topics; delete from units; delete from modules; delete from sessions")
      for (const loaded of topics) indexTopic(loaded)
      db.exec("commit")
    },
    indexTopic(topic) {
      db.exec("begin")
      indexTopic(topic)
      db.exec("commit")
    },
    topics() {
      return db
        .prepare(
          `select t.id, t.title,
             (select count(*) from units u where u.topic = t.id) as units,
             (select count(*) from sessions s where s.topic = t.id) as sessions
           from topics t order by t.id`,
        )
        .all() as { id: string; title: string; units: number; sessions: number }[]
    },
    close: () => db.close(),
  }
}
