import styles from "./lab.module.css"

/** A row of colour swatches, one per CSS custom property, each labelled with the last part of its name. */
export function SwatchStrip({ names }: { names: string[] }) {
  return (
    <div className={styles.strip}>
      {names.map((name) => (
        <div key={name} className={styles.stripItem} title={name}>
          <span className={styles.stripSwatch} style={{ background: `var(${name})` }} />
          <span className={styles.stripLabel}>{name.split("-").at(-1)}</span>
        </div>
      ))}
    </div>
  )
}
