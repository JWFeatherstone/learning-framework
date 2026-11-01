import { Button } from "@lf/ui/atoms/Button"
import { IconButton } from "@lf/ui/atoms/IconButton"
import { Text } from "@lf/ui/atoms/Text"
import { TopBar } from "@lf/ui/molecules/TopBar"
import { Link, useNavigate } from "react-router"
import { useTheme } from "./useTheme"
import styles from "./Shell.module.css"

// The bar every screen shares: the wordmark home, a way to start a topic, the theme.
export function Bar() {
  const [theme, toggle] = useTheme()
  const navigate = useNavigate()
  const other = theme === "light" ? "dark" : "light"
  return (
    <TopBar
      start={
        <Link to="/" className={styles.wordmark}>
          <Text variant="strong">Learning Framework</Text>
        </Link>
      }
      end={
        <>
          <Button variant="primary" icon="add" size="sm" onClick={() => navigate("/new")}>
            New topic
          </Button>
          <IconButton icon={other} label={`Switch to ${other} theme`} onClick={toggle} />
        </>
      }
    />
  )
}
