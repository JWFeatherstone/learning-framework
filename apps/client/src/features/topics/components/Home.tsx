import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { Link, useNavigate } from "react-router"
import { useApi, type TopicSummary } from "@data/api"
import styles from "./topics.module.css"

// The bank's topics, one row each. The only other thing to do here is start a new one.
export function Home() {
  const topics = useApi<TopicSummary[]>("/topics")
  const navigate = useNavigate()
  return (
    <section className={styles.stack}>
      <Text variant="heading" as="h1">
        Topics
      </Text>
      {topics.state === "loading" && <Text tone="muted">Reading the bank…</Text>}
      {topics.state === "error" && (
        <ErrorNote message={`Couldn't read the bank: ${topics.error.message}`} onRetry={topics.retry} />
      )}
      {topics.state === "ready" && topics.value.length === 0 && (
        <div className={styles.stackTight}>
          <Text as="p" tone="muted">
            No topics yet.
          </Text>
          <div>
            <Button variant="primary" icon="add" onClick={() => navigate("/new")}>
              New topic
            </Button>
          </div>
        </div>
      )}
      {topics.state === "ready" && (
        <ul className={styles.list}>
          {topics.value.map((topic) => (
            <li key={topic.id} className={styles.row}>
              <Link to={`/t/${topic.id}`} className={styles.rowLink}>
                <Text variant="title" as="h2">
                  {topic.title}
                </Text>
                <div className={styles.meta}>
                  <Tag>{topic.id}</Tag>
                  <Tag>{`${topic.units} units`}</Tag>
                  <Tag>{`Started ${topic.created}`}</Tag>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
