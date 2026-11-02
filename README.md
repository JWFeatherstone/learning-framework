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

Pick one and put it in `.env.local`. `corepack pnpm lf provider` shows what is selected.

- **Claude Code**: `LF_AUTHOR=claude-code`. Uses your Claude subscription through `claude`, which
  must be installed and signed in; no API key. It plans, writes and grades the course, reading any
  sources you give a topic and the web, never writing. The seminar tutor is not on it yet, so
  seminars give placeholder replies. (`LF_AUTHOR=cursor` does the same through `cursor-agent`.)
- **Anthropic API**: `ANTHROPIC_API_KEY=…`. Everything real, including the tutor, billed per use.

With neither, the app runs on placeholder text: fine for a look around, not for learning.

Optional:

| Variable         | Meaning                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `LF_PLAN_MODEL`  | Claude Code: the model that plans, grades and revises, such as `opus`             |
| `LF_WRITE_MODEL` | Claude Code: the model that writes modules, such as `sonnet`; most of the usage   |
| `LF_MODEL`       | API: the model; default `claude-opus-5-5`                                         |
| `BANK_DIR`       | Where topics live; default `bank/` at the repo root                               |

Working on the code: start with `CLAUDE.md`.
