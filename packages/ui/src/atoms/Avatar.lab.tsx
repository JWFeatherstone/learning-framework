import type { LabEntry } from "../lab"
import { Avatar } from "./Avatar"
import styles from "./atoms.lab.module.css"

// A photo that fails to load falls back to the initials beneath it.
export const lab: LabEntry = {
  name: "Avatar",
  level: "atom",
  states: {
    Initials: () => (
      <div className={styles.row}>
        <Avatar name="John Featherstone" />
        <Avatar name="Ada" />
        <Avatar name="Broken Photo" photo="/missing.jpg" />
      </div>
    ),
  },
}
