import { topicCompletion } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { ProgressBar } from "@lf/ui/atoms/ProgressBar"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Callout } from "@lf/ui/molecules/Callout"
import { PlanOutline } from "@lf/ui/molecules/PlanOutline"
import { Columns } from "@lf/ui/templates/Columns"
import { Link, useNavigate } from "react-router"
import { nextUnit, outlineParts } from "../nav"
import { useCourse } from "./Course"
import styles from "./course.module.css"

// The topic's front page: the whole plan to scan and open, and beside it how far it has gone, what to
// do next, and anything that needs an answer (a proposed revision, a check that found problems).
export function TopicHome() {
  const { slug, detail } = useCourse()
  const navigate = useNavigate()
  const { plan, progress, topic, revisions, issues, references } = detail
  const completion = topicCompletion(plan, progress)
  const next = nextUnit(plan, progress)
  const proposed = revisions.filter((entry) => entry.revision.state === "proposed")
  const errors = issues.filter((issue) => issue.level === "error")
  const unverified = references.filter((reference) => reference.verification.state !== "verified")

  const aside = (
    <>
      <section className={styles.stackTight}>
        <Text variant="label" tone="muted">
          {completion.done} of {completion.of} units finished
        </Text>
        <ProgressBar value={completion.of ? completion.done / completion.of : 0} label="Units finished" />
        {next ? (
          <>
            <Text as="p">
              <Text variant="strong">Next:</Text> {next.title}
            </Text>
            <div className={styles.actions}>
              <Button variant="primary" icon="next" onClick={() => navigate(`/t/${slug}/u/${next.id}`)}>
                {completion.done === 0 ? "Start" : "Continue"}
              </Button>
            </div>
          </>
        ) : (
          <Text tone="muted">Every unit is finished.</Text>
        )}
      </section>

      {proposed.length > 0 && (
        <Callout
          tone="info"
          title={proposed.length === 1 ? "A revision is proposed" : `${proposed.length} revisions are proposed`}
          actions={
            <Button variant="primary" size="sm" onClick={() => navigate(`/t/${slug}/revisions`)}>
              Review
            </Button>
          }
        >
          {proposed[0]?.revision.summary}
        </Callout>
      )}

      {errors.length > 0 && (
        <Callout tone="warning" title={`check found ${errors.length} problem${errors.length === 1 ? "" : "s"}`}>
          <ul className={styles.list}>
            {errors.slice(0, 5).map((issue, index) => (
              <li key={index}>
                <Text variant="code">{issue.path}</Text>: {issue.message}
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <section className={styles.stackTight}>
        <Text variant="title" as="h2">
          Also in this topic
        </Text>
        <Link to={`/t/${slug}/references`} className={styles.link}>
          References ({references.length}
          {unverified.length ? `, ${unverified.length} unverified` : ""})
        </Link>
        <Link to={`/t/${slug}/revisions`} className={styles.link}>
          Revisions ({revisions.length})
        </Link>
      </section>
    </>
  )

  return (
    <Columns aside={aside} asideLabel="Progress and next steps">
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

      <PlanOutline parts={outlineParts(plan, progress)} onSelect={(id) => navigate(`/t/${slug}/u/${id}`)} />

      <section className={styles.stackTight}>
        <Text variant="title" as="h2">
          About this topic
        </Text>
        <Text as="p">
          <Text variant="strong">Goals.</Text> {topic.learner.goals}
        </Text>
        <Text as="p">
          <Text variant="strong">Prior knowledge.</Text> {topic.learner.prior}
        </Text>
        {topic.learner.preferences && (
          <Text as="p">
            <Text variant="strong">Preferences.</Text> {topic.learner.preferences}
          </Text>
        )}
        <div className={styles.meta}>
          <Tag>Started {topic.created}</Tag>
          {topic.learner.hoursPerWeek && <Tag>{topic.learner.hoursPerWeek} h/week</Tag>}
          {topic.learner.weeks && <Tag>{topic.learner.weeks} weeks</Tag>}
        </div>
      </section>
    </Columns>
  )
}
