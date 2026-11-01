// How colours are seen: contrast, colour-vision deficiency and perceptual distance. Used to check
// the tokens' promises in tests and to compare candidates in the lab.

type Triple = [number, number, number]

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

const toGamma = (channel: number) =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055

const hexToLinear = (hex: string): Triple => [
  toLinear(parseInt(hex.slice(1, 3), 16) / 255),
  toLinear(parseInt(hex.slice(3, 5), 16) / 255),
  toLinear(parseInt(hex.slice(5, 7), 16) / 255),
]

const linearToHex = (rgb: Triple) =>
  `#${rgb
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, toGamma(channel))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`

/** A colour in OKLab: lightness, then the green–red and blue–yellow axes. */
export function oklab(hex: string): Triple {
  const [r, g, b] = hexToLinear(hex)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** A colour seen through another: the top colour at an opacity over what is behind, mixed as
    browsers composite, in gamma-encoded sRGB. */
export function seenThrough(top: string, opacity: number, behind: string): string {
  const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16)
  return `#${[0, 1, 2]
    .map((index) => Math.round(opacity * channel(top, index) + (1 - opacity) * channel(behind, index)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`
}

/** The WCAG contrast ratio between two colours. */
export function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = hexToLinear(hex)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

// Machado, Oliveira and Fernandes (2009), at full severity, applied in linear RGB.
const DEFICIENCIES: Record<"deuteranopia" | "protanopia", [Triple, Triple, Triple]> = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
}

export type Vision = "normal" | keyof typeof DEFICIENCIES

export const VISIONS: Vision[] = ["normal", "deuteranopia", "protanopia"]

/** How a colour looks with a colour-vision deficiency. */
export function simulate(hex: string, vision: Vision): string {
  if (vision === "normal") return hex
  const rgb = hexToLinear(hex)
  return linearToHex(DEFICIENCIES[vision].map(([r, g, b]) => r * rgb[0] + g * rgb[1] + b * rgb[2]) as Triple)
}

/** Perceptual distance between two colours: Euclidean distance in OKLab, times 100. */
export function distance(a: string, b: string, vision: Vision = "normal"): number {
  const [x, y] = [oklab(simulate(a, vision)), oklab(simulate(b, vision))]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100
}

/** The smallest distance between neighbouring colours in a ramp. */
export const closestNeighbours = (colors: string[], vision: Vision) =>
  Math.min(...colors.slice(1).map((color, index) => distance(colors[index] ?? color, color, vision)))

/** The smallest distance between any two colours in a set. */
export const closestPair = (colors: string[], vision: Vision) =>
  Math.min(...colors.flatMap((a, index) => colors.slice(index + 1).map((b) => distance(a, b, vision))))

/** The smallest distance from any colour in a set to one other colour. */
export const closestTo = (colors: string[], target: string) =>
  Math.min(...colors.map((color) => distance(color, target)))
