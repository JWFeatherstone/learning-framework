import { describe, expect, it } from "vitest"
import { oklchToHex } from "./oklch"
import { oklab } from "./perception"

const channels = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))

describe("oklchToHex", () => {
  it("maps the ends of the lightness axis to white and black", () => {
    expect(oklchToHex(1, 0, 0)).toBe("#ffffff")
    expect(oklchToHex(0, 0, 0)).toBe("#000000")
  })

  it("reproduces a known green from its OKLCH coordinates", () => {
    const actual = channels(oklchToHex(0.59, 0.14, 156.9))
    channels("#02955a").forEach((expected, index) => {
      expect(Math.abs((actual[index] ?? 0) - expected)).toBeLessThanOrEqual(2)
    })
  })

  it("keeps the hue of a colour outside sRGB, giving up chroma instead", () => {
    const [, a, b] = oklab(oklchToHex(0.7, 0.4, 150))
    const hue = (Math.atan2(b, a) * 180) / Math.PI
    expect(Math.abs(hue - 150)).toBeLessThan(2)
  })
})
