import type { ModuleKind, Unit } from "@lf/contracts"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import type { ReactNode } from "react"
import { Link } from "react-router"
import { useCourse } from "./Course"
import styles from "./course.module.css"

const LABEL: Record<ModuleKind, string> = { reading: "Reading", exercise: "Exercise", test: "Test" }

interface Props {
  unit: Unit
  kind: ModuleKind
  tags?: ReactNode
}

// Where a module sits: the topic, its unit, then the module; and the module's facts as tags.
export function ModuleHead({ unit, kind, tags }: Props) {
  const { slug, detail } = useCourse()
  return (
    <header className={styles.stackTight}>
      <div className={styles.crumbs}>
        <Link to={`/t/${slug}`}>{detail.topic.title}</Link>
        <Text variant="label">›</Text>
        <Link to={`/t/${slug}/u/${unit.id}`}>{unit.title}</Link>
      </div>
      <Text variant="heading" as="h1">
        {LABEL[kind]}
      </Text>
      {tags && <div className={styles.meta}>{tags}</div>}
    </header>
  )
}

/** A unit page's module routes share this when the module has no file yet. */
export function NotGenerated({ unit, kind }: { unit: Unit; kind: ModuleKind }) {
  const { slug } = useCourse()
  return (
    <Text as="p" tone="muted">
      The {kind} for this unit has not been generated.{" "}
      <Link to={`/t/${slug}/u/${unit.id}`} className={styles.link}>
        Back to the unit
      </Link>{" "}
      to generate it.
    </Text>
  )
}

/** Marks tags shared by every module: approach and plan version. */
export function moduleTags(approach: string, planVersion: number, current: number) {
  return (
    <>
      <Tag>{approach}</Tag>
      <Tag>{planVersion === current ? `plan v${planVersion}` : `plan v${planVersion}, now v${current}`}</Tag>
    </>
  )
}
