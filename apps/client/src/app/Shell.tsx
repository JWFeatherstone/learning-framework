import { Button } from "@lf/ui/atoms/Button"
import { IconButton } from "@lf/ui/atoms/IconButton"
import { Text } from "@lf/ui/atoms/Text"
import { TooltipProvider } from "@lf/ui/atoms/TooltipProvider"
import { TopBar } from "@lf/ui/molecules/TopBar"
import { Link, Outlet } from "react-router"
import { useTheme } from "./useTheme"
import styles from "./Shell.module.css"

// The one screen: a bar, then whatever the route renders in a reading column.
export function Shell() {
  const [theme, toggle] = useTheme()
  const other = theme === "light" ? "dark" : "light"
  return (
    <TooltipProvider>
      <div className={styles.shell}>
        <TopBar
          start={
            <Link to="/" className={styles.wordmark}>
              <Text variant="strong">Learning Framework</Text>
            </Link>
          }
          end={
            <>
              <Button variant="primary" icon="add" disabledReason="The wizard arrives in pass 2">
                New topic
              </Button>
              <IconButton icon={other} label={`Switch to ${other} theme`} onClick={toggle} />
            </>
          }
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
