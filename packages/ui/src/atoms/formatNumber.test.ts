import { describe, expect, it } from "vitest"
import { formatNumber } from "./formatNumber"

describe("formatNumber", () => {
  it("drops decimals as numbers grow", () => {
    expect(formatNumber(0.742)).toBe("0.74")
    expect(formatNumber(26.34)).toBe("26.3")
    expect(formatNumber(4993.4)).toBe("4,993")
  })

  it("shows whole numbers without decimals", () => {
    expect(formatNumber(77)).toBe("77")
    expect(formatNumber(20)).toBe("20")
  })

  it("shows zero as a plain zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("uses a true minus sign", () => {
    expect(formatNumber(-207)).toBe("−207")
  })

  it("signs changes on request", () => {
    expect(formatNumber(3.3, { signed: true })).toBe("+3.3")
    expect(formatNumber(-2.4, { signed: true })).toBe("−2.4")
    expect(formatNumber(0, { signed: true })).toBe("0")
  })

  it("adds a percent sign to shares already in percent", () => {
    expect(formatNumber(50.3, { kind: "percent" })).toBe("50.3%")
  })

  it("keeps cents only for small amounts of money", () => {
    expect(formatNumber(15.5, { kind: "currency" })).toBe("$15.50")
    expect(formatNumber(61250, { kind: "currency" })).toBe("$61,250")
  })

  it("abbreviates thousands and millions when compact", () => {
    expect(formatNumber(31200, { compact: true })).toBe("31.2K")
    expect(formatNumber(2_400_000, { compact: true })).toBe("2.4M")
    expect(formatNumber(15_000, { compact: true, digits: 1 })).toBe("15.0K")
  })

  it("honours fixed digits", () => {
    expect(formatNumber(4993, { digits: 1 })).toBe("4,993.0")
  })
})
