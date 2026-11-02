import type { Theme } from "./palette"

// The system stacks, decided 2026-10-31; FAMILY is the one place a typeface changes.
export const FAMILY = {
  sans: "system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const

export interface TextStyle {
  size: number
  line: number
  weight: 400 | 600
  tracking: number
  family?: keyof typeof FAMILY
}

/** Text roles in px, with tracking in em. Line heights sit on the 4px grid. */
export const TYPE = {
  unit: { size: 11, line: 16, weight: 400, tracking: 0 },
  overline: { size: 11, line: 16, weight: 600, tracking: 0.04 },
  label: { size: 12, line: 16, weight: 400, tracking: 0 },
  body: { size: 13, line: 20, weight: 400, tracking: 0 },
  strong: { size: 13, line: 20, weight: 600, tracking: 0 },
  code: { size: 13, line: 20, weight: 400, tracking: 0, family: "mono" },
  value: { size: 16, line: 20, weight: 400, tracking: 0 },
  prose: { size: 17, line: 28, weight: 400, tracking: 0 },
  title: { size: 18, line: 24, weight: 600, tracking: -0.01 },
  "prose-lead": { size: 20, line: 30, weight: 400, tracking: -0.01 },
  heading: { size: 24, line: 32, weight: 600, tracking: -0.02 },
  "value-large": { size: 28, line: 32, weight: 400, tracking: -0.02 },
  display: { size: 40, line: 44, weight: 600, tracking: -0.03 },
} as const satisfies Record<string, TextStyle>

/** The names of the text roles, such as "label" or "prose". */
export type TypeRole = keyof typeof TYPE

/** Spacing steps; `--space-n` is n × 4px. */
export const SPACE = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const

export const SIZE = {
  "control-sm": 24,
  "control-md": 32,
  "control-lg": 40,
  "icon-xs": 12,
  "icon-sm": 16,
  "icon-md": 20,
  "hit-min": 24,
  row: 28,
  /** The navigation rail, open. */
  nav: 280,
  /** The page's second column, beside the content on a wide screen. */
  aside: 320,
  /** The side margin the bar and the page share, so the page's content lines up under the bar's. */
  gutter: 24,
} as const

/** Line length for running text, in ch. */
export const MEASURE = { prose: 68 } as const

export const RADIUS = { sm: 2, md: 4 } as const

export const MOTION = {
  "duration-fast": "120ms",
  "duration-base": "200ms",
  "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
} as const

/** Stacking order, from the page up. Nothing floats over the content but overlays. */
export const LAYER = { page: 0, chrome: 10, modal: 30, popover: 40, tooltip: 50 } as const

/** Behind a modal: the screen dimmed, more in the dark theme, where a lighter dim would read as fog. */
export const SCRIM: Record<Theme, string> = {
  light: "rgb(0 0 0 / 0.32)",
  dark: "rgb(0 0 0 / 0.6)",
}

/** The one shadow, for overlays only: menus, popovers, dialogs, tooltips. */
export const SHADOW: Record<Theme, string> = {
  light: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.08)",
  dark: "0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.5)",
}
