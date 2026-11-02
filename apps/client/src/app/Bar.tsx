import { Button } from "@lf/ui/atoms/Button"
import { Icon } from "@lf/ui/atoms/Icon"
import { IconButton } from "@lf/ui/atoms/IconButton"
import { Menu, MenuAction, MenuChoices, MenuGroup } from "@lf/ui/molecules/Menu"
import { Text } from "@lf/ui/atoms/Text"
import { TopBar } from "@lf/ui/molecules/TopBar"
import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { useApi, type TopicSummary } from "@data/api"
import { useTheme } from "./useTheme"
import styles from "./Shell.module.css"

// The bar every screen shares: the wordmark home, a way to start a topic, the theme. A course puts the
// navigation's toggle before the wordmark and its title after it.
export function Bar({ lead, topic }: { lead?: ReactNode; topic?: { title: string; slug: string } }) {
  const [theme, toggle] = useTheme()
  const navigate = useNavigate()
  const other = theme === "light" ? "dark" : "light"
  return (
    <TopBar
      start={
        <>
          {lead}
          <Link to="/" className={styles.wordmark}>
            <Text variant="strong">Learning Framework</Text>
          </Link>
          {topic && (
            <>
              <Text tone="muted">/</Text>
              <TopicMenu {...topic} />
            </>
          )}
        </>
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

// The course's title opens the other topics, so moving between them never goes through the list.
function TopicMenu({ title, slug }: { title: string; slug: string }) {
  const topics = useApi<TopicSummary[]>("/topics")
  const navigate = useNavigate()
  const options = topics.state === "ready" ? topics.value : [{ id: slug, title, created: "", units: 0 }]
  return (
    <Menu
      trigger={
        <Button variant="ghost" size="sm" className={styles.topic}>
          <span className={styles.topicTitle}>{title}</span>
          <Icon name="open" size="sm" />
        </Button>
      }
    >
      <MenuChoices
        label="Topics"
        value={slug}
        onValueChange={(id) => navigate(`/t/${id}`)}
        options={options.map((topic) => ({ value: topic.id, label: topic.title }))}
      />
      <MenuGroup>
        <MenuAction label="All topics" onSelect={() => navigate("/")} />
      </MenuGroup>
    </Menu>
  )
}
