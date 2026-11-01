import { createBrowserRouter } from "react-router"
import { Home } from "@features/topics/components/Home"
import { Outline } from "@features/topics/components/Outline"
import { UnitPage } from "@features/topics/components/UnitPage"
import { Shell } from "./Shell"

// Data-driven routes over the bank: nothing here is per topic.
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    children: [
      { index: true, Component: Home },
      { path: "t/:slug", Component: Outline },
      { path: "t/:slug/:unit", Component: UnitPage },
    ],
  },
])
