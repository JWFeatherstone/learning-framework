import styles from "./Spinner.module.css"

// Decorative: what is loading is always said in text beside it.
export function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  return <span aria-hidden="true" className={`${styles.spinner} ${styles[size]}`} />
}
