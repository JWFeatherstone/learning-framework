import { Text } from "@lf/ui/atoms/Text"
import { Tag } from "@lf/ui/atoms/Tag"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import type { Chapter, Progress } from "@lf/contracts"
import { Link, useParams } from "react-router"
import { useApi, type TopicDetail } from "@data/api"
import styles from "./topics.module.css"

function ChapterList({
  slug,
  chapters,
  progress,
}: {
  slug: string
  chapters: Chapter[]
  progress: Progress
}) {
  return (
    <ol className={styles.chapters}>
      {chapters.map((chapter) => (
        <li key={chapter.id} className={styles.chapter}>
          <Text variant="title" as="h3">
            {chapter.title}
          </Text>
          <ol className={styles.units}>
            {chapter.children.map((unit) => {
              const state = progress.units[unit.id]?.state ?? "not-started"
              return (
                <li key={unit.id} className={styles.unitRow}>
                  <Link to={`/t/${slug}/${unit.id}`} className={styles.rowLink}>
                    <Text as="span">{unit.title}</Text>
                    <span className={styles.meta}>
                      {unit.estimate && <Tag>{unit.estimate}</Tag>}
                      <Tag>{state}</Tag>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}

export function Outline() {
  const { slug = "" } = useParams()
  const detail = useApi<TopicDetail>(`/topics/${slug}`)
  if (detail.state === "loading") return <Text tone="muted">Reading the plan…</Text>
  if (detail.state === "error")
    return <ErrorNote message={`Couldn't read ${slug}: ${detail.error.message}`} onRetry={detail.retry} />

  const { plan, progress } = detail.value
  return (
    <article className={styles.stack}>
      <header className={styles.stackTight}>
        <Text variant="overline" tone="muted" as="p">
          Plan v{plan.version} · {plan.shape}
        </Text>
        <Text variant="heading" as="h1">
          {plan.title}
        </Text>
        <Text variant="prose" as="p" tone="muted">
          {plan.rationale}
        </Text>
      </header>
      {plan.nodes.map((node) =>
        node.kind === "part" ? (
          <section key={node.id} className={styles.stackTight}>
            <Text variant="display" as="h2">
              {node.title}
            </Text>
            <ChapterList slug={slug} chapters={node.children} progress={progress} />
          </section>
        ) : (
          <ChapterList key={node.id} slug={slug} chapters={[node]} progress={progress} />
        ),
      )}
    </article>
  )
}
