import { SCALES, type Hue, type Step, type Theme } from "./palette"

type Ref = `${Hue}.${Step}`

// A role names a job. Its step is the same in both themes, except raised surfaces: light raises
// towards white, while dark keeps the panel step and lifts with border and shadow, because a
// lighter step would collide with the resting fill (step 3) of the controls on it.
export const COLOR_ROLES = {
  ground: "gray.1",
  panel: "gray.2",
  raised: { light: "gray.1", dark: "gray.2" },

  text: "gray.12",
  "text-muted": "gray.11",
  "text-faint": "gray.9",
  "text-on-inverse": "gray.1",

  line: "gray.6",
  "line-strong": "gray.7",
  "line-hover": "gray.8",

  inverse: "gray.12",

  accent: "accent.9",
  "accent-hover": "accent.10",
  "accent-subtle": "accent.3",
  "accent-line": "accent.7",
  "accent-text": "accent.11",
  "on-accent": "gray.1",
  focus: "accent.9",

  // Completion and mastery marks share the accent; the shell carries no second brand colour.
  progress: "accent.9",

  danger: "red.9",
  "danger-subtle": "red.3",
  "danger-text": "red.11",
  warning: "amber.9",
  "warning-subtle": "amber.3",
  "warning-text": "amber.11",
} as const satisfies Record<string, Ref | Record<Theme, Ref>>

export type ColorRole = keyof typeof COLOR_ROLES

/** Fills are the text colour laid thinly over whatever is behind, never a fixed grey. On a panel
    they come out exactly as grey steps 3, 4 and 5. */
export const FILLS = { fill: 0.04, "fill-hover": 0.08, "fill-active": 0.12 } as const

export type FillRole = keyof typeof FILLS

/** The scale step a role uses in a theme, as "hue.step". */
export function roleRef(role: ColorRole, theme: Theme): Ref {
  const spec: Ref | Record<Theme, Ref> = COLOR_ROLES[role]
  return typeof spec === "string" ? spec : spec[theme]
}

/** A role's colour as hex, for consumers that can't read CSS. */
export function roleColor(role: ColorRole, theme: Theme): string {
  const [hue, step] = roleRef(role, theme).split(".") as [Hue, string]
  const color = SCALES[theme][hue][Number(step) - 1]
  if (!color) throw new Error(`No ${hue} step ${step} in the ${theme} palette`)
  return color
}
