import { z } from "zod"

/** The version of these contracts. A topic records the version it was written against. */
export const CONTRACTS_VERSION = 1

// Ids are path-like and stable: p1, p1.c1, p1.c1.u1. Module directories mirror unit ids.
export const PART_ID = /^p\d+$/
export const CHAPTER_ID = /^(p\d+\.)?c\d+$/
export const UNIT_ID = /^(p\d+\.)?c\d+\.u\d+$/
export const OBJECTIVE_ID = /^obj\.[a-z0-9][a-z0-9.-]*$/
export const SLUG = /^[a-z0-9][a-z0-9-]*$/

export const PartId = z.string().regex(PART_ID, "a part id looks like p1")
export const ChapterId = z
  .string()
  .regex(CHAPTER_ID, "a chapter id looks like p1.c1, or c1 in a plan without parts")
export const UnitId = z.string().regex(UNIT_ID, "a unit id looks like p1.c1.u1")
export const ObjectiveId = z.string().regex(OBJECTIVE_ID, "an objective id looks like obj.manchuria.causes")
export const Slug = z.string().regex(SLUG, "a slug is lower-case letters, digits and hyphens")

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "an ISO date")

export const MODULE_KINDS = ["reading", "exercise", "test"] as const
export const ModuleKind = z.enum(MODULE_KINDS)
export type ModuleKind = z.infer<typeof ModuleKind>

/** A unit's module id: "<unit>/<kind>". */
export const ModuleId = z
  .string()
  .regex(/^(p\d+\.)?c\d+\.u\d+\/(reading|exercise|test)$/, "a module id looks like p1.c1.u1/reading")

export const Provenance = z.object({
  generatedAt: z.string(),
  model: z.string(),
  prompt: z.string(),
  inputs: z.array(z.string()).default([]),
  by: z.enum(["server", "cli", "human"]),
  cost: z
    .object({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() })
    .optional(),
  reviewed: z.boolean().default(false),
})
export type Provenance = z.infer<typeof Provenance>
