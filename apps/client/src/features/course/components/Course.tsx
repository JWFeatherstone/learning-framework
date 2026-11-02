import { IconButton } from "@lf/ui/atoms/IconButton"
import { Text } from "@lf/ui/atoms/Text"
import { TooltipProvider } from "@lf/ui/atoms/TooltipProvider"
import { CourseNav } from "@lf/ui/molecules/CourseNav"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { CourseShell } from "@lf/ui/templates/CourseShell"
import { useEffect, useRef, useState } from "react"
import { Outlet, useNavigate, useOutletContext, useParams } from "react-router"
import { Bar } from "@app/Bar"
import shellStyles from "@app/Shell.module.css"
import { api, useApi, type ChapterJob, type TopicDetail } from "@data/api"
import { navParts } from "../nav"

export interface CourseContext {
  slug: string
  detail: TopicDetail
  reload: () => void
  generation: ChapterJob | null
  generateChapter: (chapter: string) => void
  dismissGeneration: () => void
}

export const useCourse = () => useOutletContext<CourseContext>()

const NAV_KEY = "lf-nav"

// A topic's screens share the shell: the bar, the navigation rail, and the page the route renders.
export function Course() {
  const { slug = "", unit } = useParams()
  const navigate = useNavigate()
  const detail = useApi<TopicDetail>(`/topics/${slug}`)
  const [navOpen, setNavOpen] = useState(() => localStorage.getItem(NAV_KEY) !== "closed")
  const [generation, setGeneration] = useState<ChapterJob | null>(null)
  const reload = detail.state === "ready" ? detail.reload : undefined
  const following = Boolean(generation && !generation.error)
  const seen = useRef(0)

  // The server holds the chapter being written, so a page arriving mid-write finds it, then follows it
  // until it ends, reloading as each module lands.
  useEffect(() => {
    api.generation(slug).then(setGeneration, () => undefined)
  }, [slug])

  useEffect(() => {
    if (!following) return
    const timer = setInterval(() => {
      api.generation(slug).then((job) => {
        if (!job || job.written !== seen.current) reload?.()
        seen.current = job?.written ?? 0
        setGeneration(job)
      }, () => undefined)
    }, 2000)
    return () => clearInterval(timer)
  }, [following, slug, reload])

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
  const generateChapter = (chapter: string) =>
    api.generateChapter(slug, chapter).then(setGeneration, (cause: Error) =>
      setGeneration({ chapter, since: Date.now(), line: "", written: 0, of: 0, error: cause.message }),
    )
  const context: CourseContext = {
    slug,
    detail: detail.value,
    reload: detail.reload,
    generation,
    generateChapter,
    dismissGeneration: () => setGeneration(null),
  }
  const parts = navParts(plan, progress)
  return (
    <TooltipProvider>
      <div className={shellStyles.course}>
        <CourseShell
          bar={
            <Bar
              lead={
                <IconButton
                  icon="nav"
                  variant="ghost"
                  label={navOpen ? "Hide the navigation" : "Show the navigation"}
                  shortcut={["["]}
                  aria-expanded={navOpen}
                  onClick={() => setNavOpen(!navOpen)}
                />
              }
              topic={{ title: topic.title, slug }}
            />
          }
          chapters={parts.flatMap((part) =>
            part.chapters.map((chapter) => ({
              id: chapter.id,
              title: chapter.title,
              done: chapter.units.filter((member) => member.state === "complete" || member.state === "assessed").length,
              of: chapter.units.length,
              current: chapter.units.some((member) => member.id === unit),
            })),
          )}
          nav={<CourseNav parts={parts} currentId={unit} onSelect={(id) => navigate(`/t/${slug}/u/${id}`)} />}
          navOpen={navOpen}
        >
          <Outlet context={context} />
        </CourseShell>
      </div>
    </TooltipProvider>
  )
}
