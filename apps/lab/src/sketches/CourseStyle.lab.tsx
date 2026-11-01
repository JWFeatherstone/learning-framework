import { Button } from "@lf/ui/atoms/Button"
import { Tag } from "@lf/ui/atoms/Tag"
import { Text } from "@lf/ui/atoms/Text"
import { TooltipProvider } from "@lf/ui/atoms/TooltipProvider"
import { scale, SOLIDS, type HueSpec } from "@lf/ui/tokens/palette"
import { useState, type CSSProperties } from "react"
import type { LabEntry, LabTheme } from "../types"
import styles from "./CourseStyle.module.css"

// Three deferred decisions, side by side on course-style UI: the accent hue, whether the primary button
// takes the accent or the inverse fill, and the typeface. Nothing here is a component; it is for looking.

const HUE_OPTIONS: Record<string, HueSpec> = {
  "Slate blue (placeholder)": SOLIDS.accent,
  Teal: { hue: 190, light: { lightness: 0.58, chroma: 0.1 }, dark: { lightness: 0.72, chroma: 0.1 } },
  Indigo: { hue: 275, light: { lightness: 0.56, chroma: 0.14 }, dark: { lightness: 0.7, chroma: 0.13 } },
  Moss: { hue: 140, light: { lightness: 0.56, chroma: 0.1 }, dark: { lightness: 0.72, chroma: 0.11 } },
  Clay: { hue: 40, light: { lightness: 0.6, chroma: 0.11 }, dark: { lightness: 0.72, chroma: 0.11 } },
  Rose: { hue: 10, light: { lightness: 0.6, chroma: 0.13 }, dark: { lightness: 0.72, chroma: 0.12 } },
}

const FACE_OPTIONS: Record<string, string> = {
  Geist: '"Geist", system-ui, sans-serif',
  Charter: 'Charter, "Iowan Old Style", Georgia, serif',
  "Iowan Old Style": '"Iowan Old Style", Palatino, Georgia, serif',
  "Avenir Next": '"Avenir Next", "Helvetica Neue", system-ui, sans-serif',
  "System UI": "system-ui, -apple-system, sans-serif",
}

type Fill = "inverse" | "accent"

function accentVars(spec: HueSpec, theme: LabTheme): CSSProperties {
  const steps = scale(spec, theme)
  return Object.fromEntries(steps.map((hex, index) => [`--accent-${index + 1}`, hex])) as CSSProperties
}

function Controls(props: {
  hue: string
  setHue: (hue: string) => void
  fill: Fill
  setFill: (fill: Fill) => void
  face: string
  setFace: (face: string) => void
}) {
  return (
    <div className={styles.controls}>
      <label className={styles.control}>
        <Text variant="label" tone="muted">
          Accent
        </Text>
        <select value={props.hue} onChange={(event) => props.setHue(event.target.value)}>
          {Object.keys(HUE_OPTIONS).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className={styles.control}>
        <Text variant="label" tone="muted">
          Primary button
        </Text>
        <select value={props.fill} onChange={(event) => props.setFill(event.target.value as Fill)}>
          <option value="inverse">Inverse fill</option>
          <option value="accent">Accent fill</option>
        </select>
      </label>
      <label className={styles.control}>
        <Text variant="label" tone="muted">
          Typeface
        </Text>
        <select value={props.face} onChange={(event) => props.setFace(event.target.value)}>
          {Object.keys(FACE_OPTIONS).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

function Mastery({ label, value }: { label: string; value: number }) {
  return (
    <li className={styles.objective}>
      <Text as="p">{label}</Text>
      <div className={styles.mastery} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={1}>
        <span style={{ width: `${value * 100}%` }} />
      </div>
    </li>
  )
}

function UnitPage() {
  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <Text variant="overline" tone="muted" as="p">
          Origins, 1919–1939 · Asia
        </Text>
        <Text variant="heading" as="h1">
          Manchuria and the end of the Washington order
        </Text>
        <div className={styles.meta}>
          <Tag>Unit 1 of 4</Tag>
          <Tag>2 h</Tag>
          <Tag>Plan v2</Tag>
        </div>
        <div className={styles.progress} aria-label="Unit progress: 1 of 3 modules complete">
          <span className={styles.progressDone} />
          <span />
          <span />
        </div>
      </header>

      <section className={styles.objectives}>
        <Text variant="title" as="h2">
          Objectives
        </Text>
        <ul>
          <Mastery
            label="Explain why Japan moved on Manchuria in 1931 from Japanese, Chinese and League perspectives."
            value={0.8}
          />
          <Mastery
            label="Assess what the League's response did and did not show about collective security."
            value={0.4}
          />
        </ul>
      </section>

      <section className={styles.prose}>
        <Text variant="prose-lead" as="p">
          The same eighteen months look different from Tokyo, Nanjing and Geneva, and the point of this unit
          is to hold all three in view at once.
        </Text>
        <Text variant="prose" as="p">
          The Washington system of 1921–22 had rested on three assumptions: that Japan's interests on the
          mainland could be met inside a framework of treaties, that China would remain weak enough not to
          test them, and that Britain and the United States would act together if anyone did. By 1931 each had
          failed in its own way, and the Kwantung Army's officers knew it before their government did.
        </Text>
        <Text variant="prose" as="p">
          Read the Lytton Commission's conclusions not as a verdict but as a measurement of what the League
          could see and what it could not. Its authors travelled for six months; the occupation they described
          was complete before they sailed.
        </Text>
      </section>

      <footer className={styles.actions}>
        <Button variant="primary" icon="generate">
          Generate exercise
        </Button>
        <Button variant="secondary" icon="complete">
          Mark reading complete
        </Button>
        <Button variant="ghost">Back to outline</Button>
      </footer>
    </article>
  )
}

function Sketch({ theme }: { theme: LabTheme }) {
  const [hue, setHue] = useState(Object.keys(HUE_OPTIONS)[0] ?? "")
  const [fill, setFill] = useState<Fill>("inverse")
  const [face, setFace] = useState(Object.keys(FACE_OPTIONS)[0] ?? "")
  const spec = HUE_OPTIONS[hue] ?? SOLIDS.accent
  const vars: CSSProperties = {
    ...accentVars(spec, theme),
    "--family-sans": FACE_OPTIONS[face],
    ...(fill === "accent"
      ? { "--color-inverse": "var(--accent-9)", "--color-text-on-inverse": "var(--gray-1)" }
      : {}),
  } as CSSProperties

  return (
    <TooltipProvider>
      <div className={styles.stage} style={vars}>
        <Controls hue={hue} setHue={setHue} fill={fill} setFill={setFill} face={face} setFace={setFace} />
        <UnitPage />
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Course style",
  level: "sketch",
  layout: "stacked",
  states: { "Accent, button fill and typeface": Sketch },
}
