import type { LabEntry } from "@lf/ui/lab"

export { LAB_LEVELS, LAB_THEMES, LEVEL_HEADINGS } from "@lf/ui/lab"
export type { LabEntry, LabLevel, LabTheme } from "@lf/ui/lab"

/** An entry as the lab found it. `id` is its path, which is also its URL hash. */
export interface FoundEntry extends LabEntry {
  id: string
}
