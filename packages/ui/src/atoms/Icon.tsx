import { SIZE } from "../tokens/foundation"
import { ICONS, type IconName } from "./icons"

const PIXELS = { xs: SIZE["icon-xs"], sm: SIZE["icon-sm"], md: SIZE["icon-md"] }

interface Props {
  name: IconName
  /** 12px beside labels, 16px in text and controls, 20px in the map toolbar. */
  size?: keyof typeof PIXELS
}

// A fixed 1.5px stroke at every size, so icons match the hairlines. Colour follows the text.
export function Icon({ name, size = "sm" }: Props) {
  const Glyph = ICONS[name].glyph
  return (
    <Glyph size={PIXELS[size]} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" focusable="false" />
  )
}
