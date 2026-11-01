import type { ReactNode } from "react"

export const LAB_LEVELS = ["token", "atom", "molecule", "organism", "template", "sketch"] as const

export type LabLevel = (typeof LAB_LEVELS)[number]

export const LEVEL_HEADINGS: Record<LabLevel, string> = {
  token: "Tokens",
  atom: "Atoms",
  molecule: "Molecules",
  organism: "Organisms",
  template: "Templates",
  sketch: "Sketches",
}

// The lab's one assumption about a project: it switches themes with a data-theme attribute.
export const LAB_THEMES = ["light", "dark"] as const

export type LabTheme = (typeof LAB_THEMES)[number]

/** One element in the lab. Each state renders the element on its own, from props alone. */
export interface LabEntry {
  name: string
  level: LabLevel
  /** A state is told which theme its frame shows, for specimens that compute colours in script. */
  states: Record<string, (frame: { theme: LabTheme }) => ReactNode>
  /** Wide specimens stack their light and dark frames instead of setting them side by side. */
  layout?: "side-by-side" | "stacked"
}
