# Architecture

Learning Framework turns a topic into a plan, generates each unit's reading, exercise and test on
demand, runs the seminar and grades the test, and revises the plan from what the learner showed. The
bank of files is the truth; the index, the server and the client are derived from it.

**Status.** Pass 2, 31 Oct 2026.

## Packages and apps

| Package              | Alias           | Holds                                                                                      | May import                                 |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `packages/contracts` | `@lf/contracts` | zod schemas for every bank file, ids, `check`, `applyRevision`, progress readings          | zod only. No I/O                           |
| `packages/bank`      | `@lf/bank`      | Reads and writes a bank directory atomically; the rebuildable SQLite index                 | `@lf/contracts`, yaml, `node:*`            |
| `packages/runtime`   | `@lf/runtime`   | The jobs, the prompts, the provider seam and its two adapters                              | `@lf/bank`, `@lf/contracts`                |
| `packages/cli`       | `lf`            | Commands over the runtime and the bank                                                     | `@lf/runtime`, `@lf/bank`                  |
| `packages/ui`        | `@lf/ui`        | The design system: tokens, atoms, molecules, templates. No domain words                    | Its own files, Radix, lucide               |
| `apps/server`        | —               | Hono routes, one per runtime or bank call; the only process holding a key                  | `@lf/runtime`, `@lf/bank`, `@lf/contracts` |
| `apps/client`        | —               | The universal client: `app/` composition, `data/` the API, `features/<name>/` organisms    | `@lf/ui`, `@lf/contracts` (types)          |
| `apps/lab`           | —               | The design lab, dev only                                                                   | `@lf/ui`                                   |

Packages are consumed as TypeScript source through explicit `exports`; there is no build step between
them. A package that needs something from one it may not import has found code in the wrong place.

## The bank

A topic is a directory under `topics/<slug>/`: `topic.yaml`, `plan.yaml`, `progress.yaml`,
`modules/<unit>/{reading,exercise,test}.md`, `references/<id>.md`, `revisions/<id>.yaml`,
`sessions/<id>/{session.yaml,module.md,transcript.md,attempt.yaml}`, `outcomes/<id>.yaml`,
`plan.history/v<n>.yaml`, `media/`. Every file has a schema in `@lf/contracts`; `check` validates a
topic the way CI validates a repository. `.index.sqlite` beside the topics is derived and gitignored.

- `plan.yaml` holds content state only (`planned | generating | generated | stale`, and the approach once generated). Learner state is `progress.yaml`. Sessions and outcomes are append-only.
- Exactly three levels (part optional › chapter › unit) and exactly three modules per unit. A revision is a list of ops that cannot change either.
- A session snapshots the module it ran against, so a later regeneration does not change a graded session.

## The runtime

One function per job in `@lf/runtime`: `plan.questions`, `plan.propose`, `plan.create`, `plan.revise`,
`plan.accept`, `plan.reject`, `generate`, `generateChapter`, `tutor.start | turn | end`, `grade.attempt`, `progress.set`,
`references.setVerification`. Each renders its prompt from `prompts/<job>.md` with its inputs as JSON,
calls the provider, validates the reply against `@lf/contracts` (one retry with the validation errors),
and writes through the bank. Provenance on every generated file records the model, the prompt version
and the inputs.

- The provider seam is `Provider { complete, stream }`. `anthropicProvider` talks to the Messages API over fetch; `fakeProvider` is deterministic and needs no key, so the whole loop runs on any machine and in tests.
- The client writes a chapter at a time: `generateChapter` writes each module the chapter still needs, in reading order, in one conversation with the author, so the units build on each other and a harness reads the sources once. Not the whole course: revisions would leave modules written ahead of them stale. The server runs the job in the background, one per topic, and the page follows it by polling `GET /topics/:slug/generation`, so a refresh or a second tab finds it; a server restart ends it, and its unfinished modules read as not written.
- The writing and grading jobs (`plan.*`, `generate`, `plan.revise`, `grade`) go to the author: the same provider, or with `LF_AUTHOR` an agent harness run headless (`claudeCodeProvider`, `cursorProvider` in `harness.ts`). A harness reads the learner's sources (and, for Claude Code, the web) without writing, and replies through the same seam, resuming one conversation across the wizard's steps; the runtime still validates and writes. Planning and module writing can take different models (`LF_PLAN_MODEL`, `LF_WRITE_MODEL`): a few calls decide the course, most of the volume writes it. The tutor stays on the live provider, which streams.
- Reference verification is a human act with no prompt.
- The server and the CLI call the same functions; neither writes a file itself.

## The client

| Folder                   | Does                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `app/`                   | The router, the bar, the two shells (plain, and the course shell with the navigation rail)       |
| `data/api.ts`            | `Resource<T>`, `useApi`, the typed calls, the SSE reader                                          |
| `features/topics/`       | The list of topics                                                                               |
| `features/wizard/`       | New topic: intake, questions, proposed plan beside the conversation about it, confirm            |
| `features/course/`       | A topic: home, unit page, reading, exercise (seminar), test, references, revisions               |

A feature never imports another feature. Organisms take what they show as props where the lab needs to
render them; their data comes from `useApi` and `api`.

## Atomic design

| Level              | Where                     | Rule                                                                                                                    |
| ------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tokens, atoms, molecules | `packages/ui/src/{tokens,atoms,molecules}` | Props describe content and behaviour, never domain. Every state renders from props alone                  |
| Templates          | `packages/ui/src/templates` | Lay out the screen (`CourseShell`). Fetch nothing                                                                      |
| Organisms          | `apps/client/src/features/*/components` | Assemble molecules; connect them to the API. Define no styled primitives                                   |

Each element is designed on its own in the lab, in every state and both themes, before an organism
uses it. The lab finds `*.lab.tsx` entries by file name.

| Element      | Level    | Built on                                                                      |
| ------------ | -------- | ----------------------------------------------------------------------------- |
| Button, icon button, Tag, Text, TextField, Textarea, ProgressBar, StateMark, Avatar, Skeleton, Spinner | Atom | Our own |
| Tooltip      | Atom     | Radix Tooltip                                                                 |
| Select, Menu, Dialog | Molecule | Radix; overlays, the only raised surfaces                               |
| Segmented, TopBar, ErrorNote, Callout, ChoiceGroup, Working | Molecule | Our own                            |
| CourseNav    | Molecule | Our own: the plan tree, one chapter open, a state mark and estimate per unit  |
| PlanOutline  | Molecule | Our own: the plan to scan, with hours per chapter and objectives folded       |
| Prose        | Molecule | Our own: Markdown to type roles, `[[kind:id]]` links resolved by the caller; tables and the six blocks (`MODULE_BLOCKS`), terms gathered into a glossary |
| ReadingProgress | Molecule | Our own: a map of a long text, sections at their true positions on a line that fills as it is read, with the time left; a bar when narrow |
| Transcript   | Molecule | Our own: streamed turns and a composer                                        |
| ModuleRow, ObjectiveList, RevisionList | Molecule | Our own: rows with hairlines in the page, never boxes   |
| ModuleTrack  | Molecule | Our own: a unit's modules as steps on a line that fills as they finish        |
| CourseShell  | Template | Our own: bar, collapsible rail, the page between the bar's margins            |
| Columns      | Template | Our own: the page's content and its second column, stacked when narrow       |
| DocumentFrame | Template | Our own: a module page; the document centred, a full-height column of chrome down the right |

## Files and types

- One export per file where it is a component; helpers may share a module. No barrel `index.ts` except a package's entry.
- Modules in `contracts`, `bank` and `runtime` have a `*.test.ts` beside them where they hold logic.
- Strict TypeScript with `noUncheckedIndexedAccess`. No `any`, no `!` outside tests. `unknown` only at a parse boundary, parsed by a zod schema.
- Comments say why, in a line or two.

| Word       | Means                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| topic      | One course: a directory in the bank                                                |
| plan       | The curriculum: parts, chapters, units, objectives; versioned by revisions         |
| module     | A unit's reading, exercise or test                                                 |
| approach   | The generator's short name for how a module goes about its job                     |
| session    | One run of an exercise (a seminar) or a test (an attempt)                          |
| outcome    | The grader's reading of a session against the objectives                           |
| revision   | A proposed change to the plan, as ops, accepted or rejected by the learner         |
| reference  | A source a reading may cite, once a human has verified it                          |
