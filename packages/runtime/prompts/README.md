# Prompts

One Markdown file per runtime job, sent as the system message. The user message carries the job's
name, its inputs as a ```json block, and for JSON jobs the output schema from `@lf/contracts`. Module
provenance records `<job>@<version>`; the version is the file's line count, so any edit changes it.

Reference verification has no prompt: it is a human act, recorded from the client or the CLI.
