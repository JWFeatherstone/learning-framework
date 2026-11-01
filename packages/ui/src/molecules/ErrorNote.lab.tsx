import type { LabEntry } from "../lab"
import { ErrorNote } from "./ErrorNote"

const retry = () => undefined

export const lab: LabEntry = {
  name: "ErrorNote",
  level: "molecule",
  states: {
    "In a legend's width": () => (
      <div style={{ width: 208 }}>
        <ErrorNote message="These cells couldn't be loaded." onRetry={retry} />
      </div>
    ),
    "On its own": () => <ErrorNote message="The map's data couldn't be loaded." onRetry={retry} />,
  },
}
