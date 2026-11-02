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

export const SAMPLE_BLOCKS = `A hash table promises constant-time lookup. This unit asks what that promise rests on, and when it breaks.

## How a key finds its place

### Turning keys into places

A hash function turns a key into a number; the number, taken modulo the table's size, picks a bucket.

:::term Load factor
The number of stored keys divided by the number of buckets, written α. It is the single figure that tells you how crowded the table is.
:::

| Load factor α | Successful search (probes) | Unsuccessful search (probes) |
|---|---:|---:|
| 0.5 | 1.5 | 2.5 |
| 0.75 | 2.5 | 8.5 |
| 0.9 | 5.5 | 50.5 |

:::key
Lookup stays fast only while the table stays sparse: past α ≈ 0.75, probe counts climb steeply.
:::

:::example Joining two million trips to three hundred zones
1. **Nested loops.** For each trip, scan every zone: about 6 × 10⁸ comparisons.
2. **Sort and search.** Sort the zones once, then binary-search per trip: about 2 × 10⁷.
3. **Hash join.** Put the zones in a table keyed by id, then one lookup per trip: about 2 × 10⁶.
:::

:::pitfall Treating O(1) as a guarantee
"Average O(1)" assumes a good hash and a sparse table. A poor hash, or keys chosen by an attacker, puts everything in one bucket and every lookup becomes O(n).
:::

:::check Why does a table resize before it is full?
Because the cost of a lookup depends on the load factor, not on whether space remains. Doubling the table at α ≈ 0.75 keeps probe counts near 2, and the cost of copying averages out to O(1) per insert.
:::

:::aside How languages pick their thresholds
Java's HashMap resizes at 0.75; Python's dict at about two thirds; both trade memory for shorter probe sequences.
:::

## Recap

- A hash table is fast while it is sparse.
- It resizes early to stay that way, and the cost of copying averages out.
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

function Blocks() {
  return (
    <div className={styles.column}>
      <Prose markdown={SAMPLE_BLOCKS} lead glossary="Key terms" />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Prose",
  level: "molecule",
  layout: "stacked",
  states: { "Every block": Blocks, Reading, "Inline forms and code": Plain },
}
