import type { ReactNode } from "react"
import { LAB_THEMES, type LabTheme } from "./types"
import styles from "./lab.module.css"

interface Props {
  name: string
  State: (frame: { theme: LabTheme }) => ReactNode
  stacked: boolean
}

export function Specimen({ name, State, stacked }: Props) {
  return (
    <section className={styles.specimen}>
      <h2 className={styles.stateName}>{name}</h2>
      <div className={stacked ? styles.framesStacked : styles.frames}>
        {LAB_THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className={styles.frame}>
            <State theme={theme} />
          </div>
        ))}
      </div>
    </section>
  )
}
