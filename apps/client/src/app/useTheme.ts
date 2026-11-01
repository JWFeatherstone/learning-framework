import type { Theme } from "@lf/ui/tokens/palette"
import { useEffect, useState } from "react"

const KEY = "lf-theme"

const initial = (): Theme => {
  const stored = localStorage.getItem(KEY)
  if (stored === "light" || stored === "dark") return stored
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** The theme on the page, kept on the device. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])
  return [theme, () => setTheme(theme === "light" ? "dark" : "light")]
}
