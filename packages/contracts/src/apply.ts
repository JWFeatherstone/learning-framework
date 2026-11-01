import type { Chapter, Plan, Unit } from "./plan"
import type { Revision, RevisionOp } from "./revision"

// Applies accepted revision ops to a plan. Pure: returns a new plan at the next version and never
// changes the tree's shape, because the op set cannot express that.

type Parent = { children: Unit[] } | { children: Chapter[] }

function chapters(plan: Plan): Chapter[] {
  return plan.nodes.flatMap((node) => (node.kind === "part" ? node.children : [node]))
}

/** The array that holds `id` and its index in it, over parts, chapters and units. */
function locate(plan: Plan, id: string): { list: Parent["children"]; index: number } | undefined {
  const topIndex = plan.nodes.findIndex((node) => node.id === id)
  if (topIndex >= 0) return { list: plan.nodes as Parent["children"], index: topIndex }
  for (const node of plan.nodes) {
    const index = node.children.findIndex((child) => child.id === id)
    if (index >= 0) return { list: node.children as Parent["children"], index }
  }
  for (const chapter of chapters(plan)) {
    const index = chapter.children.findIndex((unit) => unit.id === id)
    if (index >= 0) return { list: chapter.children, index }
  }
  return undefined
}

function unit(plan: Plan, id: string): Unit {
  const found = chapters(plan)
    .flatMap((chapter) => chapter.children)
    .find((candidate) => candidate.id === id)
  if (!found) throw new Error(`No unit ${id} in the plan`)
  return found
}

function applyOp(plan: Plan, op: RevisionOp): void {
  switch (op.op) {
    case "insert-after": {
      const at = locate(plan, op.node)
      if (!at) throw new Error(`insert-after: no node ${op.node}`)
      ;(at.list as Unit[]).splice(at.index + 1, 0, op.value)
      return
    }
    case "insert-into": {
      const chapter = chapters(plan).find((candidate) => candidate.id === op.node)
      if (!chapter) throw new Error(`insert-into: no chapter ${op.node}`)
      chapter.children.push(op.value)
      return
    }
    case "remove": {
      const at = locate(plan, op.node)
      if (!at) throw new Error(`remove: no node ${op.node}`)
      if (at.list.length === 1) throw new Error(`remove: ${op.node} is the last child; a node cannot be empty`)
      at.list.splice(at.index, 1)
      return
    }
    case "move": {
      const from = locate(plan, op.node)
      if (!from) throw new Error(`move: no node ${op.node}`)
      const [moved] = from.list.splice(from.index, 1)
      const to = locate(plan, op.after)
      if (!to || !moved) throw new Error(`move: no node ${op.after}`)
      ;(to.list as Unit[]).splice(to.index + 1, 0, moved as Unit)
      return
    }
    case "set-title": {
      const at = locate(plan, op.node)
      if (!at) throw new Error(`set-title: no node ${op.node}`)
      const node = at.list[at.index]
      if (node) node.title = op.value
      return
    }
    case "set-module-state": {
      unit(plan, op.node).modules[op.module].state = op.value
      return
    }
    case "objective-add": {
      unit(plan, op.node).objectives.push(op.value)
      return
    }
    case "objective-remove": {
      const target = unit(plan, op.node)
      target.objectives = target.objectives.filter((objective) => objective.id !== op.objective)
      if (target.objectives.length === 0) throw new Error(`objective-remove: ${op.node} would have no objectives`)
      return
    }
    case "objective-edit": {
      const target = unit(plan, op.node)
      const index = target.objectives.findIndex((objective) => objective.id === op.value.id)
      if (index < 0) throw new Error(`objective-edit: no objective ${op.value.id} in ${op.node}`)
      target.objectives[index] = op.value
      return
    }
  }
}

/** The plan after `revision`, at version + 1. Throws if an op does not fit the plan. */
export function applyRevision(plan: Plan, revision: Revision): Plan {
  if (revision.basedOn !== plan.version)
    throw new Error(`revision is based on v${revision.basedOn}; the plan is v${plan.version}`)
  const next = structuredClone(plan)
  for (const op of revision.changes) applyOp(next, op)
  next.version = plan.version + 1
  return next
}
