import * as RadixSelect from "@radix-ui/react-select"
import { Icon } from "../atoms/Icon"
import { useThemedRegion } from "../atoms/themedRegion"
import { useKeyboardReturn } from "./keyboardReturn"
import list from "./list.module.css"
import styles from "./Select.module.css"

export interface SelectOption {
  value: string
  label: string
  /** Needs sign-in to see: disabled, and marked with a lock at the end. */
  locked?: boolean
  disabled?: boolean
}

export interface SelectGroup {
  /** A header over the group's options. A list without groups is one group with no header. */
  label?: string
  options: SelectOption[]
}

interface Props {
  /** Names the choice for screen readers, since the trigger shows only the chosen option. */
  label: string
  value: string
  onValueChange: (value: string) => void
  groups: SelectGroup[]
  /** Forces a state at rest, for the lab. */
  "data-lab-state"?: string
}

function Option({ option }: { option: SelectOption }) {
  return (
    <RadixSelect.Item value={option.value} disabled={option.disabled || option.locked} className={list.item}>
      <span className={list.label}>
        <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
      </span>
      <span className={list.end}>
        {option.locked && (
          <>
            <Icon name="locked" size="sm" />
            <span className={list.hidden}>, needs sign-in</span>
          </>
        )}
        <RadixSelect.ItemIndicator className={list.indicator}>
          <Icon name="chosen" size="sm" />
        </RadixSelect.ItemIndicator>
      </span>
    </RadixSelect.Item>
  )
}

// Chooses one option from a list, shown as its choice in strong type with a chevron, so it can stand
// as a title. The list opens below it as a raised surface.
export function Select({ label, value, onValueChange, groups, ...lab }: Props) {
  const [region, attach] = useThemedRegion()
  const keyboardReturn = useKeyboardReturn()
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger ref={attach} aria-label={label} className={styles.trigger} {...lab}>
        <RadixSelect.Value />
        <RadixSelect.Icon className={styles.chevron}>
          <Icon name="open" size="xs" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal container={region}>
        <RadixSelect.Content
          position="popper"
          align="start"
          sideOffset={4}
          className={`${list.content} ${styles.content}`}
          // Esc closes the list and goes no further, so a panel around the select stays open.
          onEscapeKeyDown={(event) => event.stopPropagation()}
          {...keyboardReturn}
        >
          {/* Shown only while there is more above or below; hovering scrolls the list. */}
          <RadixSelect.ScrollUpButton className={`${list.scroll} ${list.up}`}>
            <Icon name="open" size="xs" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className={list.viewport}>
            {groups.map((group, index) => (
              <RadixSelect.Group key={group.label ?? index} className={list.group}>
                {group.label && (
                  <RadixSelect.Label className={list.groupLabel}>{group.label}</RadixSelect.Label>
                )}
                {group.options.map((option) => (
                  <Option key={option.value} option={option} />
                ))}
              </RadixSelect.Group>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className={list.scroll}>
            <Icon name="open" size="xs" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
