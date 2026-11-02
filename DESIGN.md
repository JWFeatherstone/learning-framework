# Design

The product is a course, read like a document. The page body belongs to the content; chrome is a bar
above and a collapsible navigation rail beside it. Nothing floats over the content except overlays:
menus, selects, dialogs, tooltips. Decided 31 Oct 2026; the page's width and second column, 1 Nov 2026.

## Tokens

Everything visible comes from `packages/ui/src/tokens`, emitted as custom properties by `css.ts`.

- **Palette** (`palette.ts`): twelve-step OKLCH scales per hue (`gray`, `accent`, `red`, `amber`), derived from one solid per hue and theme. The accent is Clay (hue 40). `roles.test.ts` guards contrast when a solid changes.
- **Colour roles** (`roles.ts`): `ground` for the page, `surface` for chrome (the bar, the rail, the transcript's composer), `raised` for overlays only. Text in `text`, `text-muted`, `text-faint`. Lines in `line`, `line-strong`, `line-hover`. `accent*` for links, primary actions and focus; `progress` for completion and mastery marks; `warning` for a gap a grader surfaced; `danger` for errors only. Fills are the text colour laid thinly (`fill`, `fill-hover`, `fill-active`).
- **Type** (`foundation.ts`): the system UI stack, no web fonts. Roles `unit`, `overline`, `label`, `body`, `strong`, `code`, `value`, `prose` (17/28), `title`, `prose-lead`, `heading`, `value-large`, `display`. Running text sits at `--measure-prose` (68ch).
- **Space** on a 4px grid (`--space-1` … `--space-24`); **size** for controls, icons, rows, the navigation rail (`--size-nav`, 280px), the side margin the bar and page share (`--size-gutter`, 24px), and the page's second column (`--size-aside`, 320px); **radius** `sm`, `md`; one **motion** curve; **layers** `page`, `chrome`, `modal`, `popover`, `tooltip`; one **shadow**, `--shadow-raised`, for overlays.

Components use roles, never scale steps (`--gray-5`) or raw values. A value the foundations lack
becomes a token first.

## Rules

- **Content on the page.** Readings, briefs, transcripts, tests, outcomes, references and revisions are laid out as a document in the page column: headings, running text, lists, rows with hairlines. No cards, no panels, no boxed sections. A row's action sits beside its text.
- **The page uses the screen.** It runs between the bar's margins, however wide. Where it is wide enough, a page that has something to read its content against takes a second column (`Columns`): the outline beside the next action, the module rows beside the objectives, the plan beside the conversation about it. The second column is on the page too, divided by a hairline, never a panel, and drops below the content on a narrow page. Running text (a reading, a brief, a transcript, a test, a form) stays at the reading measure whatever the width.
- **Chrome on a surface.** The bar and the rail are one step off the ground with a hairline. They hold navigation and a few controls, never content. The rail's toggle sits at the start of the bar, never inside the rail it hides, and a closed rail is gone.
- **The navigation shows the plan's shape.** One chapter is open at a time, the current unit's; the others are a line each with their count.
- **Progress is a line under the bar.** The bar's hairline becomes the course: a segment per chapter, as wide as its units, filled as units finish; the current chapter's segment hangs lower in `accent-line`. A tooltip names each chapter and its count.
- **The page hangs from the bar's margin.** Bar and page share `--size-gutter`; the page's content lines up under the bar's on both sides.
- **A unit is a track.** Its reading, exercise and test are steps on a line (`ModuleTrack`) that fills as each is finished; only the next step's action is primary. Objectives sit under the track, not beside it.
- **A reading is woven, not stacked.** Running text carries it; a small set of blocks gives it rhythm: a key idea hung from a heavy rule, a pitfall on a warning rule, a worked example with its steps on a line, a question to check yourself and an aside, both folded, and a term defined where it is first used and gathered at the end. Tables for comparisons. Blocks sit on the page with rules and folds, never in boxes, and stand a step apart from the text around them. Beside a reading, a map of it (`ReadingProgress`): the column's height stands for the whole text, each section's tick where it starts, the line filled to where the reader is, the time left above.
- **A module is a document in a frame.** A reading, a brief or a test sits centred at its measure, the one place the page does not hang from the bar's margin, and down the right runs a column of chrome the full height of the screen (`DocumentFrame`), mirroring the navigation: the reading's map, the objectives a seminar probes, a test's questions and its submit. Below 1000px the column follows the document, and a reading's map becomes a line across the top.
- **Overlays are the only raised things.** Menus, selects, dialogs and tooltips take `raised` and the one shadow; nothing else does.
- Hierarchy comes from size and grey, not from boxes or colour. The accent marks the primary action, links and focus; `progress` marks what is finished or mastered; nothing else is coloured.
- Hairlines structure the page: a `line` between rows and above sections.
- 4px grid for everything; tabular figures for numbers.
- The focus ring shows for keyboard focus only.
- Loading keeps the frame: a message in place of the content, never a spinner over it.
- Long work (anything a model writes) locks what started it and takes the place of its action (`Working`): what is being done, the time it has taken, and the last thing it reported reading.
- Errors take the place of what failed, with a retry, and are never silent.
- One easing curve, one duration scale; reduced motion is respected.
- Not monetised, not gamified. Progress and mastery are shown as information (a figure, a thin bar), never as streaks, nudges or pressure.

## The lab

`pnpm lab` shows every element in each of its states, in a light and a dark frame. An element's entry
sits beside it as `Name.lab.tsx` and exports one `lab` object. Interactive states also answer to
`data-lab-state` so the lab can show them at rest. The template's entries show the whole course shell
on sample data. An element is designed here before an organism uses it.
