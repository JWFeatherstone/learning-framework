import {
  FAMILY,
  LAYER,
  MEASURE,
  MOTION,
  RADIUS,
  SCRIM,
  SHADOW,
  SIZE,
  SPACE,
  TYPE,
  type TextStyle,
} from "./foundation"
import { HUES, SCALES, type Theme } from "./palette"
import { COLOR_ROLES, FILLS, roleRef, type ColorRole } from "./roles"

type Declaration = [name: string, value: string | number]

const declare = (declarations: Declaration[]) =>
  declarations.map(([name, value]) => `  --${name}: ${value};`).join("\n")

// Roles refer to scale steps, so both are declared in each theme block; a themed subtree then
// resolves its roles against its own scales rather than inheriting the root's.
function themeBlock(theme: Theme): string {
  const scales = HUES.flatMap((hue) =>
    SCALES[theme][hue].map((hex, index): Declaration => [`${hue}-${index + 1}`, hex]),
  )
  const roles = (Object.keys(COLOR_ROLES) as ColorRole[]).map((role): Declaration => [
    `color-${role}`,
    `var(--${roleRef(role, theme).replace(".", "-")})`,
  ])
  const fills = Object.entries(FILLS).map(([role, amount]): Declaration => [
    `color-${role}`,
    `color-mix(in oklab, var(--color-text) ${amount * 100}%, transparent)`,
  ])
  return `  color-scheme: ${theme};\n${declare([...scales, ...roles, ...fills, ["color-scrim", SCRIM[theme]], ["shadow-raised", SHADOW[theme]]])}`
}

function baseBlock(): string {
  return declare([
    ["family-sans", FAMILY.sans],
    ["family-mono", FAMILY.mono],
    ...Object.entries(TYPE as Record<string, TextStyle>).flatMap(([role, text]): Declaration[] => [
      [`type-${role}`, `${text.weight} ${text.size}px/${text.line}px var(--family-${text.family ?? "sans"})`],
      [`tracking-${role}`, `${text.tracking}em`],
    ]),
    ...SPACE.map((step): Declaration => [`space-${step}`, `${step * 4}px`]),
    ...Object.entries(SIZE).map(([name, px]): Declaration => [`size-${name}`, `${px}px`]),
    ...Object.entries(RADIUS).map(([name, px]): Declaration => [`radius-${name}`, `${px}px`]),
    ...Object.entries(MEASURE).map(([name, ch]): Declaration => [`measure-${name}`, `${ch}ch`]),
    ...Object.entries(MOTION),
    ...Object.entries(LAYER).map(([name, z]): Declaration => [`layer-${name}`, z]),
  ])
}

/** The stylesheet that declares every token as a CSS custom property. */
export function tokensCss(): string {
  return [
    `:root {\n${baseBlock()}\n}`,
    `:root,\n[data-theme="light"] {\n${themeBlock("light")}\n}`,
    `[data-theme="dark"] {\n${themeBlock("dark")}\n}`,
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n    --duration-fast: 0ms;\n    --duration-base: 0ms;\n  }\n}`,
  ].join("\n\n")
}
