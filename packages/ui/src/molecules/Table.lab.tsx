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
  { id: "a", name: "Population density", group: "Population", year: "2024" },
  { id: "b", name: "Median household income", group: "Income", year: "2024" },
  { id: "c", name: "Jobs", group: "Jobs", year: "2022" },
  { id: "d", name: "Asking rents", group: "Housing costs", year: "2026", locked: true },
  { id: "e", name: "Stops", group: "Transit", year: "2026" },
]

const COLUMNS: TableColumn<Item>[] = [
  { key: "name", label: "Name", width: "minmax(0, 1fr)", main: true, text: (item) => item.name },
  { key: "group", label: "Topic", width: "152px", text: (item) => item.group },
  { key: "year", label: "Year", width: "48px", align: "end", text: (item) => item.year },
]

// Live: turn rows on and off, sort by a column, and move with the arrow keys.
function Rows({ items }: { items: Item[] }) {
  const [on, setOn] = useState(["a"])
  return (
    <div className={`${styles.sheet} ${styles.tableSheet}`}>
      <Table
        label="Layers"
        columns={COLUMNS}
        rows={items}
        rowKey={(item) => item.id}
        isOn={(item) => on.includes(item.id)}
        onToggle={(item) =>
          setOn((now) => (now.includes(item.id) ? now.filter((id) => id !== item.id) : [...now, item.id]))
        }
        isLocked={(item) => item.locked ?? false}
        describe={(item) => `${item.name}, ${item.year}`}
        empty="Nothing on the map yet. Turn on a layer to add it."
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
