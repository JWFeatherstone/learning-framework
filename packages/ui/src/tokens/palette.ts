import { oklchToHex } from "./oklch"

export type Theme = "light" | "dark"

export const HUES = ["gray", "accent", "red", "amber"] as const

export type Hue = (typeof HUES)[number]

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/*
 * Every scale has twelve steps, each with one job: 1–2 grounds, 3–5 fills (rest, hover, pressed),
 * 6–8 lines (subtle, strong, hover), 9–10 solid colour (rest, hover), 11–12 text (muted, default).
 * Lightness per step is Radix Colors' gray measured in OKLCH, so every hue steps evenly.
 */
const LIGHTNESS: Record<Theme, number[]> = {
  light: [0.991, 0.982, 0.955, 0.931, 0.907, 0.885, 0.851, 0.792, 0.643, 0.61, 0.503, 0.244],
  dark: [0.178, 0.213, 0.252, 0.285, 0.313, 0.348, 0.402, 0.489, 0.538, 0.583, 0.77, 0.949],
}

// The share of a hue's solid chroma each step carries: a trace in the grounds, all of it at 9 and 10.
const CHROMA: Record<Theme, number[]> = {
  light: [0.03, 0.07, 0.14, 0.21, 0.28, 0.36, 0.46, 0.62, 1, 1, 0.85, 0.45],
  dark: [0.1, 0.14, 0.22, 0.28, 0.34, 0.42, 0.52, 0.68, 1, 1, 0.8, 0.35],
}

export interface Solid {
  lightness: number
  chroma: number
}

export interface HueSpec {
  hue: number
  light: Solid
  dark: Solid
}

// Step 9 of each hue is its solid; the rest of the scale is derived from it.
// The accent is Clay, chosen in the lab on 2026-10-31.
export const SOLIDS: Record<Hue, HueSpec> = {
  gray: { hue: 0, light: { lightness: 0.643, chroma: 0 }, dark: { lightness: 0.538, chroma: 0 } },
  accent: { hue: 40, light: { lightness: 0.6, chroma: 0.11 }, dark: { lightness: 0.72, chroma: 0.11 } },
  red: { hue: 21, light: { lightness: 0.595, chroma: 0.159 }, dark: { lightness: 0.595, chroma: 0.159 } },
  amber: { hue: 51, light: { lightness: 0.68, chroma: 0.176 }, dark: { lightness: 0.68, chroma: 0.176 } },
}

/** The twelve steps of one hue in one theme, as hex; index 0 is step 1. */
export function scale(spec: HueSpec, theme: Theme): string[] {
  const lightness = LIGHTNESS[theme]
  const solid = spec[theme]
  // Step 10 sits as far from 9 as gray's does.
  const hoverShift = (lightness[9] ?? 0) - (lightness[8] ?? 0)

  return lightness.map((stepLightness, index) => {
    if (index === 8) return oklchToHex(solid.lightness, solid.chroma, spec.hue)
    if (index === 9) return oklchToHex(solid.lightness + hoverShift, solid.chroma, spec.hue)
    return oklchToHex(stepLightness, solid.chroma * (CHROMA[theme][index] ?? 0), spec.hue)
  })
}

/** Every scale as hex, by theme and hue; index 0 is step 1. */
export const SCALES: Record<Theme, Record<Hue, string[]>> = {
  light: Object.fromEntries(HUES.map((hue) => [hue, scale(SOLIDS[hue], "light")])) as Record<Hue, string[]>,
  dark: Object.fromEntries(HUES.map((hue) => [hue, scale(SOLIDS[hue], "dark")])) as Record<Hue, string[]>,
}
