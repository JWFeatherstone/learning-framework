import type { LabEntry } from "../lab"
import { useState, type ReactNode } from "react"
import { IconButton } from "../atoms/IconButton"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Menu, MenuAction, MenuChoices, MenuGroup, MenuToggle, type MenuChoice } from "./Menu"
import styles from "./molecules.lab.module.css"

const MODULES: MenuChoice[] = [
  { value: "reading", label: "Reading", icon: "reading", shortcut: ["1"] },
  { value: "exercise", label: "Exercise", icon: "exercise", shortcut: ["2"] },
  { value: "test", label: "Test", icon: "test", shortcut: ["3"] },
]

const THEMES: MenuChoice[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Match the system" },
]

// Live: the button shows the module last chosen.
export function ModuleMenu({ pressed, onChoose }: { pressed?: boolean; onChoose?: () => void }) {
  const [module, setModule] = useState("reading")
  const icon = MODULES.find((option) => option.value === module)?.icon ?? "reading"
  const choose = (next: string) => {
    setModule(next)
    onChoose?.()
  }
  return (
    <Menu trigger={<IconButton icon={icon} label="Go to a module" menu aria-pressed={pressed} />}>
      <MenuChoices label="Module" value={module} onValueChange={choose} options={MODULES} />
    </Menu>
  )
}

export function SettingsMenu() {
  const [theme, setTheme] = useState("system")
  const [mastery, setMastery] = useState(true)
  return (
    <Menu trigger={<IconButton icon="settings" label="Settings" />} align="end">
      <MenuChoices label="Theme" value={theme} onValueChange={setTheme} options={THEMES} />
      <MenuGroup label="Navigation">
        <MenuToggle label="Show mastery per unit" checked={mastery} onCheckedChange={setMastery} />
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
    "Modules, with icons and shortcuts": () => (
      <OnTheBar>
        <ModuleMenu />
      </OnTheBar>
    ),
    "Settings, without icons": () => (
      <OnTheBar>
        <SettingsMenu />
      </OnTheBar>
    ),
  },
}
