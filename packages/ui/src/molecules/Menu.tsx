import * as RadixMenu from "@radix-ui/react-dropdown-menu"
import type { ReactElement, ReactNode } from "react"
import { Icon } from "../atoms/Icon"
import type { IconName } from "../atoms/icons"
import { useThemedRegion } from "../atoms/themedRegion"
import { useKeyboardReturn } from "./keyboardReturn"
import list from "./list.module.css"
import styles from "./Menu.module.css"

// A menu of actions and settings, opened from a button. It shares the select's list: give every row in a
// menu an icon, or none.

interface RowProps {
  label: string
  icon?: IconName
  /** The keys that do the same thing, such as ["⌘", "K"]. */
  shortcut?: string[]
  /** Needs sign-in: disabled, and marked with a lock. */
  locked?: boolean
  /** A tick, for choices and toggles. */
  indicator?: ReactNode
}

function Row({ label, icon, shortcut, locked, indicator }: RowProps) {
  return (
    <>
      {icon && <Icon name={icon} size="sm" />}
      <span className={list.label}>{label}</span>
      <span className={list.end}>
        {shortcut && (
          <span className={list.keys} aria-hidden="true">
            {shortcut.join("")}
          </span>
        )}
        {locked && (
          <>
            <Icon name="locked" size="sm" />
            <span className={list.hidden}>, needs sign-in</span>
          </>
        )}
        {indicator}
      </span>
    </>
  )
}

const tick = (
  <RadixMenu.ItemIndicator className={list.indicator}>
    <Icon name="chosen" size="sm" />
  </RadixMenu.ItemIndicator>
)

interface MenuProps {
  /** The button that opens the menu, such as an IconButton with `menu`. It must take a ref. */
  trigger: ReactElement
  align?: "start" | "center" | "end"
  /** Groups of rows: MenuGroup and MenuChoices. */
  children: ReactNode
}

export function Menu({ trigger, align = "start", children }: MenuProps) {
  const [region, attach] = useThemedRegion()
  const keyboardReturn = useKeyboardReturn()
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild ref={attach}>
        {trigger}
      </RadixMenu.Trigger>
      <RadixMenu.Portal container={region}>
        <RadixMenu.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          className={`${list.content} ${styles.content}`}
          // Esc closes the menu and goes no further, so a panel around it stays open.
          onEscapeKeyDown={(event) => event.stopPropagation()}
          {...keyboardReturn}
        >
          <div className={list.viewport}>{children}</div>
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  )
}

/** A block at the top of a menu that says whose or what it is, such as who is signed in. Not a row. */
export function MenuHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className={`${list.group} ${list.header}`}>
      <span className={list.headerTitle}>{title}</span>
      {detail && <span className={list.headerDetail}>{detail}</span>}
    </div>
  )
}

/** Rows that belong together, under an optional header. */
export function MenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <RadixMenu.Group className={list.group}>
      {label && <RadixMenu.Label className={list.groupLabel}>{label}</RadixMenu.Label>}
      {children}
    </RadixMenu.Group>
  )
}

export interface MenuChoice extends Omit<RowProps, "indicator"> {
  value: string
}

interface ChoicesProps {
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: MenuChoice[]
}

/** A group whose rows choose one value, with a tick by the current one. */
export function MenuChoices({ label, value, onValueChange, options }: ChoicesProps) {
  return (
    <RadixMenu.RadioGroup value={value} onValueChange={onValueChange} className={list.group}>
      {label && <RadixMenu.Label className={list.groupLabel}>{label}</RadixMenu.Label>}
      {options.map(({ value: choice, ...row }) => (
        <RadixMenu.RadioItem key={choice} value={choice} disabled={row.locked} className={list.item}>
          <Row {...row} indicator={tick} />
        </RadixMenu.RadioItem>
      ))}
    </RadixMenu.RadioGroup>
  )
}

interface ActionProps extends Omit<RowProps, "indicator"> {
  onSelect: () => void
  disabled?: boolean
}

export function MenuAction({ onSelect, disabled, ...row }: ActionProps) {
  return (
    <RadixMenu.Item onSelect={onSelect} disabled={disabled || row.locked} className={list.item}>
      <Row {...row} />
    </RadixMenu.Item>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** A setting that is on or off, with a tick while it is on. Flipping one leaves the menu open, so
    several can be set in turn; a choice or an action closes it. */
export function MenuToggle({ label, checked, onCheckedChange, disabled }: ToggleProps) {
  return (
    <RadixMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(event) => event.preventDefault()}
      disabled={disabled}
      className={list.item}
    >
      <Row label={label} indicator={tick} />
    </RadixMenu.CheckboxItem>
  )
}
