import { useSyncExternalStore } from "react"
import { EntryView } from "./EntryView"
import { Nav } from "./Nav"
import type { FoundEntry } from "./types"
import styles from "./lab.module.css"

const subscribe = (onChange: () => void) => {
  addEventListener("hashchange", onChange)
  return () => removeEventListener("hashchange", onChange)
}

const readHash = () => decodeURIComponent(location.hash.slice(1))

export function Lab({ entries }: { entries: FoundEntry[] }) {
  const hash = useSyncExternalStore(subscribe, readHash)
  const current = entries.find((entry) => entry.id === hash) ?? entries[0]

  return (
    <div className={styles.lab}>
      <Nav entries={entries} currentId={current?.id} />
      <main className={styles.canvas}>
        {current ? <EntryView key={current.id} entry={current} /> : <p>No *.lab.tsx files yet.</p>}
      </main>
    </div>
  )
}
