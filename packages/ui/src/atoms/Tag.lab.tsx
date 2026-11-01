import type { LabEntry } from "../lab"
import { Tag } from "./Tag"
import styles from "./atoms.lab.module.css"

export const lab: LabEntry = {
  name: "Tag",
  level: "atom",
  states: {
    Plain: () => (
      <div className={styles.row}>
        <Tag>Reading</Tag>
        <Tag>2 h</Tag>
        <Tag>Plan v2</Tag>
      </div>
    ),
  },
}
