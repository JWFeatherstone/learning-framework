import { z } from "zod"
import { IsoDate, Slug } from "./ids"

export const REFERENCE_TYPES = ["book", "article", "chapter", "video", "url", "primary"] as const
export const ACCESS = ["library", "owned", "open", "paywalled", "unknown"] as const
export const VERIFICATION_STATES = ["unverified", "verified", "failed"] as const

/** references/<slug>.md frontmatter. Created first, cited by id; never invented inline. */
export const ReferenceFrontmatter = z.object({
  id: Slug,
  type: z.enum(REFERENCE_TYPES),
  citation: z.string().min(1),
  locator: z.string().optional(),
  url: z.string().optional(),
  access: z.enum(ACCESS),
  verification: z.object({
    state: z.enum(VERIFICATION_STATES),
    by: z.string().optional(),
    at: IsoDate.optional(),
    note: z.string().optional(),
  }),
})
export type ReferenceFrontmatter = z.infer<typeof ReferenceFrontmatter>
