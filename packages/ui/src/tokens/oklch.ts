type Triple = [number, number, number]

const encode = (linear: number) => {
  const value = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}

function toLinearRgb(lightness: number, chroma: number, hueDegrees: number): Triple {
  const hue = (hueDegrees * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const outOfGamut = (rgb: Triple) => rgb.some((channel) => channel < -0.0005 || channel > 1.0005)

/** An OKLCH colour as sRGB hex. A colour outside sRGB keeps its lightness and hue and loses chroma until it fits. */
export function oklchToHex(lightness: number, chroma: number, hueDegrees: number): string {
  let fitted = chroma
  let rgb = toLinearRgb(lightness, fitted, hueDegrees)
  while (fitted > 0 && outOfGamut(rgb)) {
    fitted = Math.max(0, fitted - 0.002)
    rgb = toLinearRgb(lightness, fitted, hueDegrees)
  }
  return `#${rgb.map((channel) => encode(channel).toString(16).padStart(2, "0")).join("")}`
}
