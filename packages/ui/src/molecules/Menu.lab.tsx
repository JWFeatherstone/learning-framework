import type { LabEntry } from "../lab"
import { useState, type ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Menu, MenuAction, MenuChoices, MenuGroup, MenuToggle, type MenuChoice } from "./Menu"
import styles from "./molecules.lab.module.css"

const SHAPES: MenuChoice[] = [
  { value: "polygon", label: "Polygon", icon: "drawPolygon", shortcut: ["P"] },
  { value: "rectangle", label: "Rectangle", icon: "drawRectangle", shortcut: ["R"] },
  { value: "circle", label: "Circle", icon: "drawCircle", shortcut: ["C"] },
]

const THEMES: MenuChoice[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match the system" },
]

// Live: the button shows the shape last chosen.
export function DrawMenu({ pressed, onDraw }: { pressed?: boolean; onDraw?: () => void }) {
  const [shape, setShape] = useState("polygon")
  const icon = SHAPES.find((option) => option.value === shape)?.icon ?? "drawPolygon"
  const choose = (next: string) => {
    setShape(next)
    onDraw?.()
  }
  return (
    <Menu trigger={<IconButton icon={icon} label="Draw an area" menu aria-pressed={pressed} />}>
      <MenuChoices label="Draw an area" value={shape} onValueChange={choose} options={SHAPES} />
    </Menu>
  )
}

export function SettingsMenu() {
  const [theme, setTheme] = useState("system")
  const [names, setNames] = useState(true)
  return (
    <Menu trigger={<IconButton icon="settings" label="Settings" />} align="end">
      <MenuChoices label="Theme" value={theme} onValueChange={setTheme} options={THEMES} />
      <MenuGroup label="Map">
        <MenuToggle label="Place names" checked={names} onCheckedChange={setNames} />
      </MenuGroup>
      <MenuGroup>
        <MenuAction label="Keyboard shortcuts" shortcut={["?"]} onSelect={() => undefined} />
        <MenuAction label="Help" onSelect={() => undefined} />
      </MenuGroup>
    </Menu>
  )
}

function OnTheBar({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className={styles.barStage}>
        <div className={styles.bar}>{children}</div>
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Menu",
  level: "molecule",
  states: {
    "Draw, with icons and shortcuts": () => (
      <OnTheBar>
        <DrawMenu />
      </OnTheBar>
    ),
    "Settings, without icons": () => (
      <OnTheBar>
        <SettingsMenu />
      </OnTheBar>
    ),
  },
}
