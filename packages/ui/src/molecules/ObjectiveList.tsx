import { ProgressBar } from "../atoms/ProgressBar"
import { Tag } from "../atoms/Tag"
import { Text } from "../atoms/Text"
import styles from "./ObjectiveList.module.css"

export interface ObjectiveRow {
  id: string
  text: string
  level: string
  /** 0 to 1 once assessed. */
  mastery?: number
}

interface Props {
  objectives: ObjectiveRow[]
}

// What a unit is for, as a list: the objective, its level, and a bar for mastery where a test has
// measured it. Unassessed objectives say so in words rather than showing an empty bar.
export function ObjectiveList({ objectives }: Props) {
  return (
    <ul className={styles.list}>
      {objectives.map((objective) => (
        <li key={objective.id} className={styles.row}>
          <div className={styles.text}>
            <Text as="p">{objective.text}</Text>
            <Tag>{objective.level}</Tag>
          </div>
          <div className={styles.mastery}>
            {objective.mastery === undefined ? (
              <Text variant="label" tone="muted">
                Not assessed
              </Text>
            ) : (
              <>
                <Text variant="label" tone="muted">
                  Mastery {Math.round(objective.mastery * 100)}%
                </Text>
                <ProgressBar value={objective.mastery} label={`Mastery of ${objective.id}`} size="sm" />
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
