import type { ModuleKind, Unit } from "@lf/contracts"
import { Icon } from "@lf/ui/atoms/Icon"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { Link } from "react-router"
import { useCourse } from "./Course"
import styles from "./course.module.css"

const LABEL: Record<ModuleKind, string> = { reading: "Reading", exercise: "Exercise", test: "Test" }

interface Props {
  unit: Unit
  kind: ModuleKind
  /** One fact after the module's name, such as "about 2.5h" or "8 questions". */
  detail?: string
  /** The plan version the module was written for; said only when the plan has moved on. */
  planVersion: number
}

// What the learner is in: the module and one fact about it, then the unit's title as the page's heading,
// a link back to the unit. A module written for an older plan says so.
export function ModuleHead({ unit, kind, detail, planVersion }: Props) {
  const { slug, detail: course } = useCourse()
  const current = course.plan.version
  return (
    <header className={styles.moduleHead}>
      <Text variant="label" tone="muted" as="p" className={styles.moduleKind}>
        <Icon name={kind} size="sm" />
        {LABEL[kind]}
        {detail && `, ${detail}`}
      </Text>
      <Text variant="display" as="h1" className={styles.unitTitle}>
        <Link to={`/t/${slug}/u/${unit.id}`} className={styles.titleLink}>
          {unit.title}
        </Link>
      </Text>
      {planVersion < current && (
        <div className={styles.meta}>
          <Tag>
            Written for plan v{planVersion}; the plan is now v{current}
          </Tag>
        </div>
      )}
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
