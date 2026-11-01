export type NumberKind = "number" | "percent" | "currency"

export interface FormatOptions {
  kind?: NumberKind
  /** Fixed decimal places, compact or not. By default whole numbers have none and the rest fall as they grow. */
  digits?: number
  /** Thousands and millions as K and M, for tight spaces. */
  compact?: boolean
  /** A plus sign on positive numbers, for changes. */
  signed?: boolean
}

// Whole numbers show none. Otherwise two decimals under 1, one under 100, none from 100.
// Currency keeps cents until 100. A table that needs aligned decimals passes `digits`.
export function digitsFor(value: number, kind: NumberKind = "number"): number {
  const size = Math.abs(value)
  if (kind === "currency") return size < 100 ? 2 : 0
  if (Number.isInteger(value) || size >= 100) return 0
  return size < 1 ? 2 : 1
}

/** A number as the interface shows it: separators, a precision that suits its size, a true minus sign. */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { kind = "number", compact = false, signed = false } = options
  const digits = options.digits ?? (compact ? 1 : digitsFor(value, kind))
  const text = new Intl.NumberFormat("en-US", {
    style: kind === "currency" ? "currency" : "decimal",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact && options.digits === undefined ? 0 : digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value)
  return `${text.replace("-", "−")}${kind === "percent" ? "%" : ""}`
}
