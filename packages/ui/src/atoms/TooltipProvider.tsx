import * as RadixTooltip from "@radix-ui/react-tooltip"
import type { ReactNode } from "react"

// A tooltip waits a moment before opening; once one is open, moving to the next opens it at once.
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={400} skipDelayDuration={300}>
      {children}
    </RadixTooltip.Provider>
  )
}
