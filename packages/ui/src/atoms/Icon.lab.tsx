import type { LabEntry } from "../lab"
import { Icon } from "./Icon"
import { ICON_GROUPS, ICONS, type IconName } from "./icons"
import styles from "./atoms.lab.module.css"

const NAMES = Object.keys(ICONS) as IconName[]

const SAMPLE: IconName[] = [
  "topics",
  "plan",
  "reading",
  "exercise",
  "test",
  "complete",
  "generate",
  "send",
  "nav",
]

function Catalogue() {
  return (
    <div className={styles.stack}>
      {ICON_GROUPS.map((group) => (
        <section key={group} className={styles.iconGroup}>
          <h3 className={styles.caption}>{group}</h3>
          <div className={styles.iconGrid}>
            {NAMES.filter((name) => ICONS[name].group === group).map((name) => (
              <div key={name} className={styles.iconCell}>
                <Icon name={name} size="md" />
                <span className={styles.iconName}>{name}</span>
                <span className={styles.iconUse}>{ICONS[name].use}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Sizes() {
  return (
    <div className={styles.stack}>
      {(["sm", "md"] as const).map((size) => (
        <div key={size} className={styles.row}>
          <span className={styles.caption}>
            {size === "sm" ? "16px, in text and controls" : "20px, in module cards and the navigation"}
          </span>
          {SAMPLE.map((name) => (
            <Icon key={name} name={name} size={size} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ColourFollowsText() {
  return (
    <div className={styles.stack}>
      <span className={styles.inline}>
        <Icon name="complete" /> Reading finished
      </span>
      <span className={`${styles.inline} ${styles.muted}`}>
        <Icon name="generate" /> Not generated yet
      </span>
      <span className={`${styles.inline} ${styles.faint}`}>
        <Icon name="locked" /> Finish the reading first
      </span>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Icon",
  level: "atom",
  states: {
    Catalogue,
    Sizes,
    "Colour follows the text": ColourFollowsText,
  },
}
