import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import styles from "./Table.module.css"

export interface TableColumn<Row> {
  key: string
  label: string
  /** A grid track for the column, such as "minmax(0, 1fr)" or "152px". */
  width: string
  /** End-aligned, for numbers and years. */
  align?: "start" | "end"
  /** The row's main column: body text in full colour, where a lock goes. Others are quieter. */
  main?: boolean
  /** What the cell says; also what the column sorts by. */
  text: (row: Row) => string
}

interface Props<Row> {
  /** Names the rows for screen readers, such as "References". */
  label: string
  columns: TableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  isOn: (row: Row) => boolean
  onToggle: (row: Row) => void
  /** Needs sign-in: disabled, faint, and marked with a lock. */
  isLocked?: (row: Row) => boolean
  /** A longer note on the row, shown on hover. */
  describe?: (row: Row) => string
  /** Shown in place of rows when there are none. */
  empty: ReactNode
}

type Sort = { key: string; up: boolean } | null

const STEPS: Record<string, (index: number, count: number) => number> = {
  ArrowDown: (index, count) => Math.min(index + 1, count - 1),
  ArrowUp: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_index, count) => count - 1,
}

function Head<Row>({
  columns,
  sort,
  onSort,
}: {
  columns: TableColumn<Row>[]
  sort: Sort
  onSort: (key: string) => void
}) {
  return (
    <div className={styles.head}>
      <span />
      {columns.map((column) => (
        <button
          key={column.key}
          type="button"
          className={styles.sort}
          data-align={column.align}
          aria-label={`Sort by ${column.label.toLowerCase()}`}
          aria-pressed={sort?.key === column.key}
          onClick={() => onSort(column.key)}
        >
          {column.label}
          {sort?.key === column.key && <Icon name={sort.up ? "ascending" : "descending"} size="xs" />}
        </button>
      ))}
    </div>
  )
}

interface RowProps<Row> {
  row: Row
  columns: TableColumn<Row>[]
  on: boolean
  locked: boolean
  note?: string
  /** Whether this row is the table's one stop in the tab order. */
  stop: boolean
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent) => void
  onToggle: () => void
}

function TableRow<Row>({
  row,
  columns,
  on,
  locked,
  note,
  stop,
  onFocus,
  onKeyDown,
  onToggle,
}: RowProps<Row>) {
  return (
    <button
      type="button"
      className={styles.row}
      aria-pressed={on}
      disabled={locked}
      title={note}
      tabIndex={stop ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={onToggle}
    >
      <span className={styles.box} data-on={on || undefined} aria-hidden="true">
        {on && <Icon name="chosen" size="xs" />}
      </span>
      {columns.map((column) => (
        <span key={column.key} className={column.main ? styles.main : styles.cell} data-align={column.align}>
          {column.text(row)}
          {column.main && locked && <Icon name="locked" size="sm" />}
        </span>
      ))}
    </button>
  )
}

// Rows of things to turn on and off, in sortable columns: a box shows which are on. One row at a time is
// in the tab order; the arrow keys move between rows, Space or Enter turns one on or off. Sorted by the
// first column chosen, then reversed by choosing it again; until then, in the order given.
export function Table<Row>({
  label,
  columns,
  rows,
  rowKey,
  isOn,
  onToggle,
  isLocked,
  describe,
  empty,
}: Props<Row>) {
  const [sort, setSort] = useState<Sort>(null)
  const [stop, setStop] = useState(0)
  const list = useRef<HTMLDivElement>(null)
  const by = columns.find((column) => column.key === sort?.key)
  const shown = by
    ? [...rows].sort(
        (a, b) => by.text(a).localeCompare(by.text(b), undefined, { numeric: true }) * (sort?.up ? 1 : -1),
      )
    : rows
  // The row in the tab order: the last one focused, or the first that isn't locked.
  const open = (index: number) => index >= 0 && index < shown.length && !isLocked?.(shown[index] as Row)
  const tabStop = open(stop) ? stop : shown.findIndex((_, index) => open(index))
  const template = { "--columns": `16px ${columns.map((column) => column.width).join(" ")}` } as CSSProperties

  // Steps run over the rows that can take focus, so a locked row is passed over, not counted.
  const move = (event: KeyboardEvent) => {
    const step = STEPS[event.key]
    if (!step) return
    event.preventDefault()
    const buttons = Array.from(
      list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    )
    const here = buttons.indexOf(event.currentTarget as HTMLButtonElement)
    buttons[step(Math.max(here, 0), buttons.length)]?.focus()
  }

  return (
    <div className={styles.table} style={template}>
      <Head
        columns={columns}
        sort={sort}
        onSort={(key) => setSort((now) => ({ key, up: now?.key === key ? !now.up : true }))}
      />
      <div ref={list} role="group" aria-label={label}>
        {shown.map((row, index) => (
          <TableRow
            key={rowKey(row)}
            row={row}
            columns={columns}
            on={isOn(row)}
            locked={isLocked?.(row) ?? false}
            note={describe?.(row)}
            stop={index === tabStop}
            onFocus={() => setStop(index)}
            onKeyDown={move}
            onToggle={() => onToggle(row)}
          />
        ))}
      </div>
      {shown.length === 0 && <div className={styles.empty}>{empty}</div>}
    </div>
  )
}
