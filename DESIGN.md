# Design

The product is a course, read like a document. The page body belongs to the content; chrome is a bar
above and a collapsible navigation rail beside it. Nothing floats over the content except overlays:
menus, selects, dialogs, tooltips. Decided 31 Oct 2026.

## Tokens

Everything visible comes from `packages/ui/src/tokens`, emitted as custom properties by `css.ts`.

- **Palette** (`palette.ts`): twelve-step OKLCH scales per hue (`gray`, `accent`, `red`, `amber`), derived from one solid per hue and theme. The accent is Clay (hue 40). `roles.test.ts` guards contrast when a solid changes.
- **Colour roles** (`roles.ts`): `ground` for the page, `surface` for chrome (the bar, the rail, the transcript's composer), `raised` for overlays only. Text in `text`, `text-muted`, `text-faint`. Lines in `line`, `line-strong`, `line-hover`. `accent*` for links, primary actions and focus; `progress` for completion and mastery marks; `warning` for a gap a grader surfaced; `danger` for errors only. Fills are the text colour laid thinly (`fill`, `fill-hover`, `fill-active`).
- **Type** (`foundation.ts`): the system UI stack, no web fonts. Roles `unit`, `overline`, `label`, `body`, `strong`, `code`, `value`, `prose` (17/28), `title`, `prose-lead`, `heading`, `value-large`, `display`. Running text sits at `--measure-prose` (68ch).
- **Space** on a 4px grid (`--space-1` … `--space-24`); **size** for controls, icons, rows and the navigation rail (`--size-nav`, 280px); **radius** `sm`, `md`; one **motion** curve; **layers** `page`, `chrome`, `modal`, `popover`, `tooltip`; one **shadow**, `--shadow-raised`, for overlays.

Components use roles, never scale steps (`--gray-5`) or raw values. A value the foundations lack
becomes a token first.

## Rules

- **Content on the page.** Readings, briefs, transcripts, tests, outcomes, references and revisions are laid out as a document in the page column: headings, running text, lists, rows with hairlines. No cards, no panels, no boxed sections. A row's action sits beside its text.
- **Chrome on a surface.** The bar and the rail are one step off the ground with a hairline. They hold navigation and a few controls, never content.
- **Overlays are the only raised things.** Menus, selects, dialogs and tooltips take `raised` and the one shadow; nothing else does.
- Hierarchy comes from size and grey, not from boxes or colour. The accent marks the primary action, links and focus; `progress` marks what is finished or mastered; nothing else is coloured.
- Hairlines structure the page: a `line` between rows and above sections.
- 4px grid for everything; tabular figures for numbers.
- The focus ring shows for keyboard focus only.
- Loading keeps the frame: a message in place of the content, never a spinner over it.
- Errors take the place of what failed, with a retry, and are never silent.
- One easing curve, one duration scale; reduced motion is respected.
- Not monetised, not gamified. Progress and mastery are shown as information (a figure, a thin bar), never as streaks, nudges or pressure.

## The lab

`pnpm lab` shows every element in each of its states, in a light and a dark frame. An element's entry
sits beside it as `Name.lab.tsx` and exports one `lab` object. Interactive states also answer to
`data-lab-state` so the lab can show them at rest. The template's entries show the whole course shell
on sample data. An element is designed here before an organism uses it.
