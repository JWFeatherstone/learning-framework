A framework for structured, agent-guided self-learning. For any topic of interest, the user defines their scope, background, time constraints, and learning preferences, whereupon the agent designs a learning programme consisting of a hierarchy of chapters and units. Each unit is divided into three components: reading (or intake), exercises (or application and internalization), and testing. Each test, seminar or exercise feeds back into the plan as revisions that inform the development of the next chapter and the shape of the programme moving forward.

Everything is files in a memory bank; the app reads and writes them through one runtime that a server and a CLI both call.

## Quick start

You need Node 24 (the repo pins it in `.nvmrc`; [nvm](https://github.com/nvm-sh/nvm) is the easy way) and git. pnpm comes through corepack, so nothing is installed globally.

```sh
git clone https://github.com/JWFeatherstone/learning-framework.git
cd learning-framework
nvm use
corepack pnpm install
cp .env.example .env.local   # then choose a provider, below
corepack pnpm dev
```

Open http://localhost:5173 and start a new topic. Topics are saved as files in `bank/` at the repo root (gitignored); set `BANK_DIR` to keep them somewhere else.

## Choose a provider

Set these in `.env.local`. `corepack pnpm lf provider` tells you what is selected.

- **Nothing set: the fake provider.** Every screen works, but the plans, readings and feedback are
  placeholder text. Good for a look around, not for learning.
- **`LF_AUTHOR=claude-code`: if you use Claude Code.** Plans and courses are written by `claude`
  running headless and signed in as you, on your own subscription, with no API key. It reads any
  sources you give a topic and the web, but never writes. The seminar tutor and the grader still use
  the provider below, so they stay fake without a key. `cursor` works the same way through
  `cursor-agent`.
- **`ANTHROPIC_API_KEY`: everything real.** Billed per use through the Anthropic API. Together with
  `LF_AUTHOR`, the harness writes the course and the key powers the tutor and the grader.

| Variable            | Meaning                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Enables the Anthropic adapter. Without it the deterministic fake provider runs            |
| `LF_PROVIDER`       | `anthropic` or `fake`; default `anthropic` when a key is present, else `fake`             |
| `LF_MODEL`          | Model id for the real adapter; default in `packages/runtime/src/env.ts` (`DEFAULT_MODEL`) |
| `LF_AUTHOR`         | `claude-code` or `cursor`: plan, generate and revise with that harness, run headless and signed in as you (`claude` or `cursor-agent` on the PATH). Claude Code gets only its file-reading and web tools; Cursor runs in ask mode. Unset, they use the provider above |
| `LF_PLAN_MODEL`     | With `LF_AUTHOR`: the model that plans and revises, such as `opus`. Unset, the harness's default |
| `LF_WRITE_MODEL`    | With `LF_AUTHOR`: the model that writes modules, such as `sonnet`. Most of the usage is here. Unset, the harness's default |
| `BANK_DIR`          | Where topics live; default `bank/` at the repo root                                       |
