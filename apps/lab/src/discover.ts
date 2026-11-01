import { LAB_LEVELS, type FoundEntry, type LabEntry } from "./types"

// The design system's entries sit beside their elements; the lab's own entries (foundations, sketches) sit here.
const modules = import.meta.glob<{ lab?: LabEntry }>(
  ["../../../packages/ui/src/**/*.lab.tsx", "./**/*.lab.tsx"],
  {
    eager: true,
  },
)

const toId = (path: string) =>
  path
    .replace(/^.*\/packages\/ui\/src\//, "ui/")
    .replace(/^\.\//, "lab/")
    .replace(/\.lab\.tsx$/, "")

/** Every `*.lab.tsx` the lab knows, in level order, then by name. */
export function discoverEntries(): FoundEntry[] {
  return Object.entries(modules)
    .map(([path, module]) => {
      if (!module.lab) throw new Error(`${path} has no "lab" export`)
      return { ...module.lab, id: toId(path) }
    })
    .sort((a, b) => LAB_LEVELS.indexOf(a.level) - LAB_LEVELS.indexOf(b.level) || a.name.localeCompare(b.name))
}
