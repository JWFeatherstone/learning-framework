import type { LabEntry } from "../lab"
import { useState } from "react"
import { Table, type TableColumn } from "./Table"
import styles from "./molecules.lab.module.css"

interface Item {
  id: string
  name: string
  group: string
  year: string
  locked?: boolean
}

const ITEMS: Item[] = [
  {
    id: "a",
    name: "The Origins of the Second World War in Asia and the Pacific",
    group: "Book",
    year: "1987",
  },
  { id: "b", name: "Report of the Commission of Enquiry (Lytton)", group: "Primary", year: "1932" },
  { id: "c", name: "Forgotten Ally", group: "Book", year: "2013" },
  { id: "d", name: "Japan's Total Empire", group: "Book", year: "1998", locked: true },
  { id: "e", name: "League of Nations Official Journal, 1931", group: "Primary", year: "1931" },
]

const COLUMNS: TableColumn<Item>[] = [
  { key: "name", label: "Name", width: "minmax(0, 1fr)", main: true, text: (item) => item.name },
  { key: "group", label: "Type", width: "152px", text: (item) => item.group },
  { key: "year", label: "Year", width: "48px", align: "end", text: (item) => item.year },
]

// Live: turn rows on and off, sort by a column, and move with the arrow keys.
function Rows({ items }: { items: Item[] }) {
  const [on, setOn] = useState(["a"])
  return (
    <div className={`${styles.sheet} ${styles.tableSheet}`}>
      <Table
        label="References"
        columns={COLUMNS}
        rows={items}
        rowKey={(item) => item.id}
        isOn={(item) => on.includes(item.id)}
        onToggle={(item) =>
          setOn((now) => (now.includes(item.id) ? now.filter((id) => id !== item.id) : [...now, item.id]))
        }
        isLocked={(item) => item.locked ?? false}
        describe={(item) => `${item.name}, ${item.year}`}
        empty="No references yet. The first reading will add some."
      />
    </div>
  )
}

export const lab: LabEntry = {
  name: "Table",
  level: "molecule",
  states: {
    "Rows to turn on and off": () => <Rows items={ITEMS} />,
    Empty: () => <Rows items={[]} />,
  },
}
