import { useLayoutEffect, useRef } from "react"
import styles from "./lab.module.css"

type TokenKind = "color" | "length" | "radius"

/** Shows CSS custom properties: a sample drawn with each, its name, and the value it resolves to. */
export function TokenTable({ kind, names }: { kind: TokenKind; names: string[] }) {
  return (
    <table className={styles.tokens}>
      <tbody>
        {names.map((name) => (
          <tr key={name}>
            <td>
              <Sample kind={kind} name={name} />
            </td>
            <td>
              <code>{name}</code>
            </td>
            <td>
              <ResolvedValue name={name} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Sample({ kind, name }: { kind: TokenKind; name: string }) {
  const value = `var(${name})`
  switch (kind) {
    case "color":
      return <span className={styles.swatch} style={{ background: value }} />
    case "length":
      return <span className={styles.bar} style={{ width: value }} />
    case "radius":
      return <span className={styles.corner} style={{ borderRadius: value }} />
  }
}

function ResolvedValue({ name }: { name: string }) {
  const ref = useRef<HTMLElement>(null)
  // Read after layout, so the value is the one the surrounding theme frame resolves to.
  useLayoutEffect(() => {
    const element = ref.current
    if (element) element.textContent = getComputedStyle(element).getPropertyValue(name).trim()
  }, [name])
  return <code ref={ref} className={styles.resolved} />
}
