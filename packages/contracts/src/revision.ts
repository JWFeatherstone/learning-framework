import { z } from "zod"
import { Objective, Unit } from "./plan"

// Ops cannot change the tree's shape: a revision inserts, removes or moves units and chapters, edits
// objectives, and sets module state or titles. There is no op that adds a level or a module kind.
const NodeId = z.string().min(1)

export const RevisionOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("insert-after"), node: NodeId, value: Unit }),
  z.object({ op: z.literal("insert-into"), node: NodeId, value: Unit }),
  z.object({ op: z.literal("remove"), node: NodeId }),
  z.object({ op: z.literal("move"), node: NodeId, after: NodeId }),
  z.object({ op: z.literal("set-title"), node: NodeId, value: z.string().min(1) }),
  z.object({
    op: z.literal("set-module-state"),
    node: NodeId,
    module: z.enum(["reading", "exercise", "test"]),
    value: z.enum(["planned", "stale"]),
  }),
  z.object({ op: z.literal("objective-add"), node: NodeId, value: Objective }),
  z.object({ op: z.literal("objective-remove"), node: NodeId, objective: z.string() }),
  z.object({ op: z.literal("objective-edit"), node: NodeId, value: Objective }),
])
export type RevisionOp = z.infer<typeof RevisionOp>

/** revisions/<date>-<slug>.yaml: the only way the plan changes after v1. */
export const Revision = z.object({
  basedOn: z.number().int().positive(),
  trigger: z.string().min(1),
  summary: z.string().min(1),
  changes: z.array(RevisionOp).min(1),
  reasons: z.array(z.string()).default([]),
  state: z.enum(["proposed", "accepted", "rejected"]),
})
export type Revision = z.infer<typeof Revision>
