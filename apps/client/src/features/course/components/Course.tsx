import { topicCompletion } from "@lf/contracts"
import { Text } from "@lf/ui/atoms/Text"
import { TooltipProvider } from "@lf/ui/atoms/TooltipProvider"
import { CourseNav } from "@lf/ui/molecules/CourseNav"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { CourseShell } from "@lf/ui/templates/CourseShell"
import { useEffect, useState } from "react"
import { Outlet, useNavigate, useOutletContext, useParams } from "react-router"
import { Bar } from "@app/Bar"
import shellStyles from "@app/Shell.module.css"
import { useApi, type TopicDetail } from "@data/api"
import { navParts } from "../nav"

export interface CourseContext {
  slug: string
  detail: TopicDetail
  reload: () => void
}

export const useCourse = () => useOutletContext<CourseContext>()

const NAV_KEY = "lf-nav"

// A topic's screens share the shell: the bar, the navigation rail, and the page the route renders.
export function Course() {
  const { slug = "", unit } = useParams()
  const navigate = useNavigate()
  const detail = useApi<TopicDetail>(`/topics/${slug}`)
  const [navOpen, setNavOpen] = useState(() => localStorage.getItem(NAV_KEY) !== "closed")

  useEffect(() => {
    localStorage.setItem(NAV_KEY, navOpen ? "open" : "closed")
  }, [navOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key === "[" && !target?.closest("input, textarea, [contenteditable]")) setNavOpen((now) => !now)
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [])

  if (detail.state === "loading") {
    return (
      <TooltipProvider>
        <div className={shellStyles.shell}>
          <Bar />
          <main className={shellStyles.main}>
            <Text tone="muted">Reading the plan…</Text>
          </main>
        </div>
      </TooltipProvider>
    )
  }
  if (detail.state === "error") {
    return (
      <TooltipProvider>
        <div className={shellStyles.shell}>
          <Bar />
          <main className={shellStyles.main}>
            <ErrorNote message={`Couldn't read ${slug}: ${detail.error.message}`} onRetry={detail.retry} />
          </main>
        </div>
      </TooltipProvider>
    )
  }

  const { plan, progress, topic } = detail.value
  const context: CourseContext = { slug, detail: detail.value, reload: detail.reload }
  return (
    <TooltipProvider>
      <div className={shellStyles.course}>
        <CourseShell
          bar={<Bar />}
          title={topic.title}
          completion={topicCompletion(plan, progress)}
          nav={<CourseNav parts={navParts(plan, progress)} currentId={unit} onSelect={(id) => navigate(`/t/${slug}/u/${id}`)} />}
          navOpen={navOpen}
          onToggleNav={() => setNavOpen(!navOpen)}
        >
          <Outlet context={context} />
        </CourseShell>
      </div>
    </TooltipProvider>
  )
}
