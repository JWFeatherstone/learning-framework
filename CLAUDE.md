# Working on Learning Framework

- Read `ARCHITECTURE.md` before adding or moving a file. It is the contract.
- Read `DESIGN.md` before touching anything under `packages/ui`. Components use colour roles, never scale steps or raw values. Content sits on the page, never in a panel.
- Node 24, from `.nvmrc`: run `nvm use` first. pnpm through `corepack pnpm`; nothing global.
- A new UI element gets its `*.lab.tsx` entry and is designed in the lab (`pnpm lab`) before anything uses it.
- Before committing: `pnpm typecheck`, `pnpm test` and `pnpm build` pass, and `pnpm check <topic>` is clean on the sample bank.
- New dependencies, new directories under `apps/*/src` or `packages/*/src`, and new abstractions need a yes first.
- Keys live in `.env.local` (gitignored) and are read from the environment only. Never print or commit one.
- Commit locally. Never push or open a merge request without explicit permission.
- Commit messages are one short line saying what changed: no body, no trailer.
- Over-engineering is the main risk. Prefer the smallest change that does the job; no speculative options, fallbacks or helpers.
- Keep replies and comments short.
