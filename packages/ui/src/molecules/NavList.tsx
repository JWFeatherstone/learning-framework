import { Text } from "../atoms/Text"
import list from "./list.module.css"
import styles from "./NavList.module.css"

export interface NavItem {
  value: string
  label: string
  /** How many things it holds, shown at the end. */
  count?: number
}

export interface NavGroup {
  /** A header over the group's items. */
  label?: string
  items: NavItem[]
}

interface Props {
  /** Names the navigation for screen readers, such as "Data". */
  label: string
  groups: NavGroup[]
  value: string
  onValueChange: (value: string) => void
}

// A list of places to go within a view, such as the sections of a catalog, in the menus' rows: capital
// headers, full-width rows, the current one filled.
export function NavList({ label, groups, value, onValueChange }: Props) {
  return (
    <nav aria-label={label} className={`${list.viewport} ${styles.nav}`}>
      {groups.map((group, index) => (
        <div key={group.label ?? index} className={list.group}>
          {group.label && (
            <Text variant="overline" as="div" className={list.groupLabel}>
              {group.label}
            </Text>
          )}
          {group.items.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${list.item} ${styles.item}`}
              aria-current={item.value === value ? "true" : undefined}
              onClick={() => onValueChange(item.value)}
            >
              <span className={list.label}>{item.label}</span>
              {item.count !== undefined && <span className={list.end}>{item.count}</span>}
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}
