# Learning Framework

Structured, agent-guided self-learning. A topic is a plan of units; each unit has a reading, an
exercise (a seminar with a tutor) and a test; what the learner shows in the test and the seminar feeds
back into the plan as revisions the learner accepts or rejects. Everything is files in a memory bank;
the app reads and writes them through one runtime that a server and a CLI both call.

Read `ARCHITECTURE.md` before adding or moving a file and `DESIGN.md` before touching `packages/ui`.
`CLAUDE.md` holds the working rules.

## Run

Node 24 (`nvm use`) and pnpm through corepack; nothing is installed globally.

```sh
nvm use
corepack pnpm install
```

The bank is a separate directory of topics, named by `BANK_DIR`. The sample bank is a sibling repo:

```sh
export BANK_DIR=~/Personal/learning-framework-bank
```

The provider is read from `.env.local` at the repo root (gitignored) or the environment:

| Variable            | Meaning                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Enables the Anthropic adapter. Without it the deterministic fake provider runs            |
| `LF_PROVIDER`       | `anthropic` or `fake`; default `anthropic` when a key is present, else `fake`             |
| `LF_MODEL`          | Model id for the real adapter; default in `packages/runtime/src/env.ts` (`DEFAULT_MODEL`) |
| `LF_AUTHOR`         | `claude-code` or `cursor`: plan, generate and revise with that harness, run headless and signed in as you (`claude` or `cursor-agent` on the PATH). Claude Code gets only its file-reading and web tools; Cursor runs in ask mode. Unset, they use the provider above |
| `LF_PLAN_MODEL`     | With `LF_AUTHOR`: the model that plans and revises, such as `opus`. Unset, the harness's default |
| `LF_WRITE_MODEL`    | With `LF_AUTHOR`: the model that writes modules, such as `sonnet`. Most of the usage is here. Unset, the harness's default |

Then:

| Command                 | Does                                                                       |
| ----------------------- | -------------------------------------------------------------------------- |
| `corepack pnpm dev`     | Server on :3131 and client on :5173 (the client proxies `/api` to the server) |
| `corepack pnpm lab`     | The design lab on :5174: every element in every state, light and dark      |
| `corepack pnpm lf …`    | The CLI: `check`, `topic`, `generate`, `revise`, `revision`, `verify`, `bank index`, `provider` |
| `corepack pnpm check <topic>` | Validate a topic in the bank against the contracts                    |
| `corepack pnpm typecheck`, `test`, `build` | What must pass before a commit                             |

To serve the built client from the server alone: `corepack pnpm --filter @lf/client build`, then
`corepack pnpm --filter @lf/server start` and open http://localhost:3131.

## The loop

1. **New topic**: intake → the planner's clarifying questions, with its guesses filled in → a proposed
   plan to talk back to → confirm. The topic exists only once confirmed (`topic.yaml`, `plan.yaml` v1,
   `progress.yaml`).
2. **Unit**: generate the reading, exercise and test on demand; each is a Markdown file with
   frontmatter under `modules/<unit>/`. `check` validates every file against `@lf/contracts`.
3. **Reading**: read, mark as read. **Exercise**: a seminar, streamed turn by turn, ended by the
   learner and graded into an outcome. **Test**: items answered on the page, graded into an outcome.
4. **Revision**: after a graded session the planner may propose a change to the plan; the learner
   accepts (plan version bumps, the old plan is archived) or rejects. Nothing changes the plan otherwise.
5. **References** are verified by a human; a reading may only send the learner to a verified one.

## Layout

```
apps/client      the universal client (React, react-router, Vite)
apps/server      Hono over the runtime and the bank; the only process that holds a key
apps/lab         the design lab
packages/contracts   zod schemas for every file in the bank, check, revision apply, progress readings
packages/bank        reads and writes a bank directory; rebuildable SQLite index
packages/runtime     the jobs (plan, generate, tutor, grade, revise), prompts, provider adapters
packages/cli         lf
packages/ui          tokens, atoms, molecules, templates, and their lab entries
```
