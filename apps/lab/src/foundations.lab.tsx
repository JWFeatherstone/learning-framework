import { RADIUS, SIZE, SPACE, TYPE } from "@lf/ui/tokens/foundation"
import { HUES } from "@lf/ui/tokens/palette"
import type { ColorRole, FillRole } from "@lf/ui/tokens/roles"
import { SwatchStrip } from "./SwatchStrip"
import { TokenTable } from "./TokenTable"
import type { LabEntry } from "./types"
import styles from "./foundations.lab.module.css"

const STEPS = Array.from({ length: 12 }, (_, index) => index + 1)

const ROLE_GROUPS: [string, (ColorRole | FillRole)[]][] = [
  ["Surfaces", ["ground", "surface", "raised"]],
  ["Text", ["text", "text-muted", "text-faint", "text-on-inverse"]],
  ["Lines", ["line", "line-strong", "line-hover"]],
  ["Fills", ["fill", "fill-hover", "fill-active", "inverse"]],
  ["Accent", ["accent", "accent-hover", "accent-subtle", "accent-line", "accent-text", "on-accent", "focus"]],
  ["Progress", ["progress"]],
  ["Status", ["danger", "danger-subtle", "danger-text", "warning", "warning-subtle", "warning-text"]],
]

const SAMPLES: Record<string, string> = {
  display: "Origins, 1919–1939",
  "value-large": "0.80",
  heading: "Manchuria and the end of the Washington order",
  "prose-lead": "The same years look different from Tokyo, Nanjing and Geneva.",
  title: "Objectives",
  prose: "The Washington system had rested on three assumptions, and by 1931 each had failed.",
  value: "2 h",
  strong: "Generate reading",
  body: "Explain why Japan moved on Manchuria in 1931.",
  code: "p1.c1.u1/reading",
  label: "Mastery",
  unit: "of 2",
}

function Palette() {
  return (
    <div className={styles.groups}>
      {HUES.map((hue) => (
        <section key={hue}>
          <h3 className={styles.groupName}>{`${hue.charAt(0).toUpperCase()}${hue.slice(1)}`}</h3>
          <SwatchStrip names={STEPS.map((step) => `--${hue}-${step}`)} />
        </section>
      ))}
    </div>
  )
}

function Roles() {
  return (
    <div className={styles.groups}>
      {ROLE_GROUPS.map(([group, roles]) => (
        <section key={group}>
          <h3 className={styles.groupName}>{group}</h3>
          <TokenTable kind="color" names={roles.map((role) => `--color-${role}`)} />
        </section>
      ))}
    </div>
  )
}

function Type() {
  return (
    <div>
      {Object.entries(TYPE).map(([role, text]) => (
        <div key={role} className={styles.typeRow}>
          <span className={styles.roleName}>{role}</span>
          <span style={{ font: `var(--type-${role})`, letterSpacing: `var(--tracking-${role})` }}>
            {SAMPLES[role]}
          </span>
          <span className={styles.spec}>
            {text.size}/{text.line} · {text.weight}
          </span>
        </div>
      ))}
    </div>
  )
}

// The hierarchy, built from tokens alone, as the page shows it: an eyebrow, the unit's title, a lead,
// the body at its measure, and the unit's facts as a list. Nothing boxed; the content is the page.
function Hierarchy() {
  return (
    <article className={styles.excerpt}>
      <p className={styles.eyebrow}>Part 1 · Chapter 1 · Unit 1</p>
      <h3 className={styles.display}>Manchuria</h3>
      <p className={styles.tags}>
        <span className={styles.tag}>
          <i className={styles.marker} />
          Reading complete
        </span>
        <span className={styles.tag}>Plan v2</span>
      </p>
      <p className={styles.lead}>The same years look different from Tokyo, Nanjing and Geneva.</p>
      <p className={styles.prose}>
        The Washington system had rested on three assumptions, and by 1931 each had failed. This reading
        takes the three capitals in turn and asks what each could see, and what each could do.
      </p>
      <dl className={styles.facts}>
        <dt>Objectives</dt>
        <dd>2, mastery 0.60</dd>
        <dt>Estimate</dt>
        <dd>2 h</dd>
        <dt>Approach</dt>
        <dd>Perspectives</dd>
        <dt>Unit</dt>
        <dd>p1.c1.u1</dd>
      </dl>
    </article>
  )
}

function SpaceAndSize() {
  return (
    <div className={styles.groups}>
      <section>
        <h3 className={styles.groupName}>Space</h3>
        <TokenTable kind="length" names={SPACE.map((step) => `--space-${step}`)} />
      </section>
      <section>
        <h3 className={styles.groupName}>Size</h3>
        <TokenTable kind="length" names={Object.keys(SIZE).map((name) => `--size-${name}`)} />
      </section>
    </div>
  )
}

function ShapeAndDepth() {
  return (
    <div className={styles.groups}>
      <section>
        <h3 className={styles.groupName}>Radius</h3>
        <TokenTable kind="radius" names={Object.keys(RADIUS).map((name) => `--radius-${name}`)} />
      </section>
      <section>
        <h3 className={styles.groupName}>Overlays</h3>
        <div className={styles.pageStandIn}>
          <div className={styles.floating}>Raised, with the one shadow: menus, dialogs, tooltips only</div>
        </div>
      </section>
    </div>
  )
}

export const lab: LabEntry = {
  name: "Foundations",
  level: "token",
  states: {
    Palette,
    "Colour roles": Roles,
    Type,
    Hierarchy,
    "Space and size": SpaceAndSize,
    "Shape and depth": ShapeAndDepth,
  },
}
