import "@lf/ui/tokens/inject"
import "@lf/ui/base.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { discoverEntries } from "./discover"
import { Lab } from "./Lab"

const root = document.getElementById("root")
if (!root) throw new Error("index.html has no #root element")

createRoot(root).render(
  <StrictMode>
    <Lab entries={discoverEntries()} />
  </StrictMode>,
)
