import { useCallback, useState } from "react"

/** Overlays mount inside their trigger's themed region, so a tooltip or menu takes that region's theme.
    Returns the region to portal into, and a ref for the trigger. */
export function useThemedRegion() {
  const [region, setRegion] = useState<HTMLElement | null>(null)
  const attach = useCallback((node: HTMLElement | null) => {
    const themed = node?.closest<HTMLElement>("[data-theme]") ?? null
    setRegion(themed === document.documentElement ? null : themed)
  }, [])
  return [region, attach] as const
}
