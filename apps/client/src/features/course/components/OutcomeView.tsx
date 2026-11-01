import type { Outcome } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Callout } from "@lf/ui/molecules/Callout"
import { useNavigate } from "react-router"
import type { ProposedRevision } from "@data/api"
import { useCourse } from "./Course"
import styles from "./course.module.css"

interface Props {
  outcome: Outcome
  /** The revision the planner proposed on the back of this outcome, if any. */
  revision?: ProposedRevision | null
}

// What the grader made of a session: a score per item, the gaps it saw, and the plan change it led to.
export function OutcomeView({ outcome, revision }: Props) {
  const { slug, detail } = useCourse()
  const navigate = useNavigate()
  const total = outcome.items.reduce((sum, item) => sum + item.score, 0)
  const of = outcome.items.reduce((sum, item) => sum + item.of, 0)
  const objective = (id: string) =>
    detail.plan.nodes
      .flatMap((node) => (node.kind === "part" ? node.children : [node]))
      .flatMap((chapter) => chapter.children)
      .flatMap((unit) => unit.objectives)
      .find((entry) => entry.id === id)?.text ?? id

  return (
    <section className={styles.stackTight}>
      <div className={styles.meta}>
        <Text variant="title" as="h2">
          Outcome
        </Text>
        <Tag>
          {total} of {of}
        </Tag>
        <Tag>{outcome.confidence} confidence</Tag>
      </div>
      <ul className={styles.list}>
        {outcome.items.map((item) => (
          <li key={item.id} className={styles.row}>
            <div className={styles.rowText}>
              <Text>{objective(item.objective)}</Text>
              {item.note && (
                <Text variant="label" tone="muted">
                  {item.note}
                </Text>
              )}
            </div>
            <span className={styles.score}>
              {item.score}/{item.of}
            </span>
          </li>
        ))}
      </ul>
      {outcome.gaps.length > 0 && (
        <Callout tone="warning" title={outcome.gaps.length === 1 ? "One gap" : `${outcome.gaps.length} gaps`}>
          <ul className={styles.list}>
            {outcome.gaps.map((gap, index) => (
              <li key={index}>
                <Text variant="strong">{objective(gap.objective)}.</Text> {gap.diagnosis}
                {gap.suggestion && <Text tone="muted"> {gap.suggestion}</Text>}
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {revision && (
        <Callout
          tone="info"
          title="The planner proposes a change to the plan"
          actions={
            <Button variant="primary" size="sm" onClick={() => navigate(`/t/${slug}/revisions`)}>
              Review
            </Button>
          }
        >
          {revision.revision.summary}
        </Callout>
      )}
    </section>
  )
}
