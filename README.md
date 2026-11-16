# Learning Framework

A framework for structured, agent-guided self-learning. In short:

1. The user specifies a topic, learning goals and preferences and pre-existing knowledge.
2. The agent develops a high-level learning plan consisting of a hierarchy of topics, chapters, and modules.
3. Content is generated chapter-by-chapter in response to developments in the users' learning process in previous chapters.

## Install

Needs Node 24 and git.

```sh
git clone https://github.com/JWFeatherstone/learning-framework.git
cd learning-framework
nvm use
corepack pnpm install
```

## Configure

```sh
cp .env.example .env.local
```

In `.env.local`, uncomment one provider:

- `LF_AUTHOR=claude-code`: your Claude subscription (`claude` installed and signed in)
- `ANTHROPIC_API_KEY=…`: the API, billed per use

The other settings in `.env.example` are optional.

## Run

```sh
corepack pnpm dev           # open http://localhost:5173
corepack pnpm lf provider   # check which provider is in use
```

Topics are saved in `bank/`.
