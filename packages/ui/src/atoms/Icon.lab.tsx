import type { LabEntry } from "../lab"
import { Icon } from "./Icon"
import { ICON_GROUPS, ICONS, type IconName } from "./icons"
import styles from "./atoms.lab.module.css"

const NAMES = Object.keys(ICONS) as IconName[]

const SAMPLE: IconName[] = [
  "search",
  "select",
  "drawPolygon",
  "catalog",
  "add",
  "close",
  "visible",
  "table",
  "download",
  "locked",
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
            {size === "sm" ? "16px, in text and controls" : "20px, in the map toolbar"}
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
        <Icon name="locked" /> This export needs you to sign in.
      </span>
      <span className={`${styles.inline} ${styles.muted}`}>
        <Icon name="search" /> Search places
      </span>
      <span className={`${styles.inline} ${styles.faint}`}>
        <Icon name="hidden" /> Hidden layer
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
