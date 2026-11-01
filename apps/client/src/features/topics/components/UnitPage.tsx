import { Button } from "@lf/ui/atoms/Button"
import { Icon } from "@lf/ui/atoms/Icon"
import { Text } from "@lf/ui/atoms/Text"
import { Tag } from "@lf/ui/atoms/Tag"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { MODULE_KINDS, planUnits, type ModuleKind, type Unit } from "@lf/contracts"
import { Link, useParams } from "react-router"
import { useApi, type TopicDetail } from "@data/api"
import styles from "./topics.module.css"

const KIND_LABEL: Record<ModuleKind, string> = { reading: "Reading", exercise: "Exercise", test: "Test" }

function ModuleCard({ kind, unit }: { kind: ModuleKind; unit: Unit }) {
  const planned = unit.modules[kind]
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <Icon name={kind} size="sm" />
        <Text variant="strong">{KIND_LABEL[kind]}</Text>
        <Tag>{planned.state}</Tag>
        {planned.approach && <Tag>{planned.approach}</Tag>}
      </div>
      {planned.state === "generated" ? (
        <Button variant="secondary" disabledReason="Module views arrive in pass 2">
          Open
        </Button>
      ) : (
        <Button variant="primary" icon="generate" disabledReason="Generation arrives in pass 2">
          Generate
        </Button>
      )}
    </li>
  )
}

export function UnitPage() {
  const { slug = "", unit: unitId = "" } = useParams()
  const detail = useApi<TopicDetail>(`/topics/${slug}`)
  if (detail.state === "loading") return <Text tone="muted">Reading the plan…</Text>
  if (detail.state === "error")
    return <ErrorNote message={`Couldn't read ${slug}: ${detail.error.message}`} onRetry={detail.retry} />

  const unit = planUnits(detail.value.plan).find((candidate) => candidate.id === unitId)
  if (!unit)
    return (
      <Text tone="muted">
        No unit {unitId} in {slug}.
      </Text>
    )
  const mastery = detail.value.progress.mastery

  return (
    <article className={styles.stack}>
      <header className={styles.stackTight}>
        <Link to={`/t/${slug}`} className={styles.back}>
          <Icon name="back" size="xs" />
          <Text variant="label" tone="muted">
            Outline
          </Text>
        </Link>
        <Text variant="heading" as="h1">
          {unit.title}
        </Text>
        <div className={styles.meta}>
          <Tag>{unit.id}</Tag>
          {unit.estimate && <Tag>{unit.estimate}</Tag>}
        </div>
      </header>
      <section className={styles.stackTight}>
        <Text variant="title" as="h2">
          Objectives
        </Text>
        <ul className={styles.objectives}>
          {unit.objectives.map((objective) => (
            <li key={objective.id} className={styles.objective}>
              <Text as="p">{objective.text}</Text>
              <span className={styles.meta}>
                <Tag>{objective.level}</Tag>
                <Tag>
                  {mastery[objective.id] ? `mastery ${mastery[objective.id]?.value}` : "not assessed"}
                </Tag>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ul className={styles.cards}>
        {MODULE_KINDS.map((kind) => (
          <ModuleCard key={kind} kind={kind} unit={unit} />
        ))}
      </ul>
    </article>
  )
}
