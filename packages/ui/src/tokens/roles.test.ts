import { describe, expect, it } from "vitest"
import { contrast, oklab, seenThrough } from "./perception"
import { SCALES } from "./palette"
import { FILLS, roleColor, type ColorRole } from "./roles"

const SURFACES: ColorRole[] = ["ground", "surface", "raised"]

// These are the promises the roles make; a change to the palette that breaks one fails here.
describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  const on = (foreground: ColorRole, background: ColorRole) =>
    contrast(roleColor(foreground, theme), roleColor(background, theme))

  it.each(SURFACES)("text reads at 7:1 on %s", (surface) => {
    expect(on("text", surface)).toBeGreaterThanOrEqual(7)
  })

  it.each(SURFACES)("muted text reads at 4.5:1 on %s", (surface) => {
    expect(on("text-muted", surface)).toBeGreaterThanOrEqual(4.5)
  })

  it.each<ColorRole>(["accent-text", "danger-text", "warning-text"])(
    "%s reads at 4.5:1 on a surface",
    (role) => {
      expect(on(role, "surface")).toBeGreaterThanOrEqual(4.5)
    },
  )

  it("text on an inverse fill reads at 7:1", () => {
    expect(on("text-on-inverse", "inverse")).toBeGreaterThanOrEqual(7)
  })

  it("marks on the accent meet 3:1", () => {
    expect(on("on-accent", "accent")).toBeGreaterThanOrEqual(3)
  })

  it.each(Object.entries(FILLS).map(([role, amount], index) => [role, amount, index + 3] as const))(
    "%s over a surface looks the same as grey step %s",
    (_role, amount, step) => {
      const fill = oklab(seenThrough(roleColor("text", theme), amount, roleColor("surface", theme)))
      const grey = oklab(SCALES[theme].gray[step - 1] ?? "")
      expect(Math.hypot(...fill.map((value, axis) => value - (grey[axis] ?? 0))) * 100).toBeLessThan(1)
    },
  )

  it("the focus ring and progress marks meet 3:1 against a surface", () => {
    expect(on("focus", "surface")).toBeGreaterThanOrEqual(3)
    expect(on("progress", "surface")).toBeGreaterThanOrEqual(3)
  })
})
