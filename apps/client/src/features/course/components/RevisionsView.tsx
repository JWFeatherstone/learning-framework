import type { Revision, RevisionOp } from "@lf/contracts"
import { Button } from "@lf/ui/atoms/Button"
import { Text } from "@lf/ui/atoms/Text"
import { ErrorNote } from "@lf/ui/molecules/ErrorNote"
import { RevisionList } from "@lf/ui/molecules/RevisionList"
import { useState } from "react"
import { api } from "@data/api"
import { useCourse } from "./Course"
import styles from "./course.module.css"

function describe(op: RevisionOp): string {
  switch (op.op) {
    case "insert-after":
      return `Insert a unit after ${op.node}: ${op.value.title}.`
    case "insert-into":
      return `Add a unit to ${op.node}: ${op.value.title}.`
    case "remove":
      return `Remove ${op.node}.`
    case "move":
      return `Move ${op.node} after ${op.after}.`
    case "set-title":
      return `Retitle ${op.node} to "${op.value}".`
    case "set-module-state":
      return `Mark ${op.node}'s ${op.module} ${op.value}.`
    case "objective-add":
      return `Add an objective to ${op.node}: ${op.value.text}`
    case "objective-remove":
      return `Remove objective ${op.objective} from ${op.node}.`
    case "objective-edit":
      return `Edit objective ${op.value.id} in ${op.node}: ${op.value.text}`
  }
}

function rows(revision: Revision) {
  return revision.changes.map((change, index) => ({
    change: describe(change),
    ...(revision.reasons[index] ? { reason: revision.reasons[index] } : {}),
  }))
}

// The plan's history as proposed changes, newest first. Each is read op by op and then accepted or
// rejected by the learner; nothing changes the plan without that.
export function RevisionsView() {
  const { slug, detail, reload } = useCourse()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key)
    setError(null)
    setNote(null)
    try {
      await work()
      reload()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const propose = () =>
    run("propose", async () => {
      const result = await api.revise(slug)
      if (!result.revision) setNote(result.reason ?? "The planner sees no reason to change the plan.")
    })

  const ordered = [...detail.revisions].sort((a, b) => b.id.localeCompare(a.id))

  return (
    <article className={styles.stack}>
      <header className={styles.stackTight}>
        <Text variant="heading" as="h1">
          Revisions
        </Text>
        <Text as="p" tone="muted">
          The plan is at v{detail.plan.version}. Revisions are proposed after a graded session, or on request; the plan
          only changes when one is accepted.
        </Text>
        <div className={styles.actions}>
          <Button icon="revision" loading={busy === "propose"} onClick={() => void propose()}>
            Ask the planner now
          </Button>
        </div>
        {note && (
          <Text as="p" tone="muted">
            {note}
          </Text>
        )}
      </header>

      {error && <ErrorNote message={error} onRetry={() => setError(null)} />}

      {ordered.length === 0 && <Text tone="muted">No revisions yet.</Text>}

      {ordered.map(({ id, revision }) => (
        <RevisionList
          key={id}
          summary={revision.summary}
          trigger={revision.trigger}
          basedOn={revision.basedOn}
          state={revision.state}
          rows={rows(revision)}
          actions={
            <>
              <Button
                variant="primary"
                loading={busy === `accept:${id}`}
                disabledReason={
                  revision.basedOn !== detail.plan.version ? `Based on v${revision.basedOn}; the plan is v${detail.plan.version}` : undefined
                }
                onClick={() => void run(`accept:${id}`, () => api.acceptRevision(slug, id).then(() => undefined))}
              >
                Accept
              </Button>
              <Button
                loading={busy === `reject:${id}`}
                onClick={() => void run(`reject:${id}`, () => api.rejectRevision(slug, id).then(() => undefined))}
              >
                Reject
              </Button>
            </>
          }
        />
      ))}
    </article>
  )
}
