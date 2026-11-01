import type { LabEntry } from "../lab"
import { Prose, type ResolvedRef } from "./Prose"
import styles from "./molecules.lab.module.css"

export const SAMPLE_READING = `## Framing

The Washington system of 1921–22 rested on three assumptions: that Japan's interests on the mainland could be met inside a framework of treaties, that China would remain weak enough not to test them, and that Britain and the United States would act together if anyone did. By 1931 each had failed.

## Material

On the night of 18 September 1931 officers of the Kwantung Army set a small charge on the South Manchurian Railway near Mukden and blamed Chinese troops. Within a day the army had occupied the city; within five months, the whole of Manchuria. [[ref:iriye-origins]] reads the episode as the end of a system; the Commission's own account in [[ref:lytton-report]] is more careful about who knew what, and when.

Three points matter for the question this unit asks:

1. The army acted before Tokyo did, and Tokyo then **chose** to follow.
2. The League's instruments were designed for a dispute between governments, not for one between a government and its own army.
3. Britain and the United States each waited for the other, as [[ref:mitter-war]] shows from the Washington side.

> "The military operations of the Japanese troops during this night cannot be regarded as measures of legitimate self-defence." — Lytton Commission, *Report*, 1932

## Perspectives

- **Tokyo**: a government losing control of its army and its public.
- **Nanjing**: a government fighting a civil war that could not fight a second one.
- **Geneva**: a body whose strongest members would not act without each other.

## Key terms

\`Kwantung Army\` · \`Washington system\` · \`non-recognition\`

## Go deeper

A short section pointing to [[ref:iriye-origins]] chapter 1 and the first forty pages of the Lytton report.
`

const REFERENCES: Record<string, ResolvedRef> = {
  "iriye-origins": { label: "Iriye, Origins", href: "#ref/iriye-origins" },
  "lytton-report": { label: "Lytton Report", href: "#ref/lytton-report" },
  "mitter-war": { label: "Mitter, Forgotten Ally", unavailable: "Not verified yet" },
}

const resolve = (kind: string, id: string) => (kind === "ref" ? REFERENCES[id] : undefined)

function Reading() {
  return (
    <div className={styles.column}>
      <Prose markdown={SAMPLE_READING} resolveRef={resolve} lead />
    </div>
  )
}

function Plain() {
  return (
    <div className={styles.column}>
      <Prose markdown={"A paragraph with *emphasis*, **weight**, `code`, a [link](https://example.org) and a [[ref:nowhere]] that does not resolve.\n\n```yaml\nid: p1.c1.u1\nkind: reading\n```\n\n---\n\nAfter the rule."} />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Prose",
  level: "molecule",
  layout: "stacked",
  states: { Reading, "Inline forms and code": Plain },
}
