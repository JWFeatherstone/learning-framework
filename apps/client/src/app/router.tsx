import { createBrowserRouter } from "react-router"
import { Course } from "@features/course/components/Course"
import { ExerciseView } from "@features/course/components/ExerciseView"
import { ReadingView } from "@features/course/components/ReadingView"
import { ReferencesView } from "@features/course/components/ReferencesView"
import { RevisionsView } from "@features/course/components/RevisionsView"
import { TestView } from "@features/course/components/TestView"
import { TopicHome } from "@features/course/components/TopicHome"
import { UnitPage } from "@features/course/components/UnitPage"
import { Home } from "@features/topics/components/Home"
import { Wizard } from "@features/wizard/components/Wizard"
import { Shell } from "./Shell"

// Data-driven routes over the bank: nothing here is per topic.
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    children: [
      { index: true, Component: Home },
      { path: "new", Component: Wizard },
    ],
  },
  {
    path: "/t/:slug",
    Component: Course,
    children: [
      { index: true, Component: TopicHome },
      { path: "references", Component: ReferencesView },
      { path: "revisions", Component: RevisionsView },
      { path: "u/:unit", Component: UnitPage },
      { path: "u/:unit/reading", Component: ReadingView },
      { path: "u/:unit/exercise", Component: ExerciseView },
      { path: "u/:unit/exercise/:session", Component: ExerciseView },
      { path: "u/:unit/test", Component: TestView },
      { path: "u/:unit/test/:session", Component: TestView },
    ],
  },
])
