import { Specimen } from "./Specimen"
import type { FoundEntry } from "./types"
import styles from "./lab.module.css"

export function EntryView({ entry }: { entry: FoundEntry }) {
  return (
    <article className={styles.entry}>
      <header className={styles.entryHead}>
        <h1>{entry.name}</h1>
        <span className={styles.badge}>{entry.level}</span>
        <code className={styles.path}>{entry.id}.lab.tsx</code>
      </header>
      {Object.entries(entry.states).map(([name, State]) => (
        <Specimen key={name} name={name} State={State} stacked={entry.layout === "stacked"} />
      ))}
    </article>
  )
}
