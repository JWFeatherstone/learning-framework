import { LAB_LEVELS, LEVEL_HEADINGS, type FoundEntry } from "./types"
import styles from "./lab.module.css"

export function Nav({ entries, currentId }: { entries: FoundEntry[]; currentId: string | undefined }) {
  return (
    <nav className={styles.nav}>
      <p className={styles.brand}>Lab</p>
      {LAB_LEVELS.map((level) => {
        const group = entries.filter((entry) => entry.level === level)
        if (group.length === 0) return null
        return (
          <section key={level}>
            <h2 className={styles.level}>{LEVEL_HEADINGS[level]}</h2>
            <ul className={styles.list}>
              {group.map((entry) => (
                <li key={entry.id}>
                  <a
                    className={styles.link}
                    href={`#${entry.id}`}
                    aria-current={entry.id === currentId ? "page" : undefined}
                  >
                    {entry.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}
