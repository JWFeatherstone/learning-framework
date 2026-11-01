import { TooltipProvider } from "@lf/ui/atoms/TooltipProvider"
import { Outlet } from "react-router"
import { Bar } from "./Bar"
import styles from "./Shell.module.css"

// Screens outside a course: the bar, then one reading column.
export function Shell() {
  return (
    <TooltipProvider>
      <div className={styles.shell}>
        <Bar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
