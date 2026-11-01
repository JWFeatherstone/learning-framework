import type { LabEntry, LabTheme } from "../lab"
import type { ReactNode } from "react"
import { Avatar } from "../atoms/Avatar"
import { Button } from "../atoms/Button"
import { IconButton } from "../atoms/IconButton"
import { Text } from "../atoms/Text"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { TopBar } from "./TopBar"
import styles from "./molecules.lab.module.css"

// The frame with what will fill it. The app assembles the real bar from its features' pieces.
function Wordmark() {
  return (
    <Text variant="strong" as="span">
      Learning Framework
    </Text>
  )
}

// Offers the theme the frame doesn't show.
function ThemeButton({ theme }: { theme: LabTheme }) {
  const other = theme === "light" ? "dark" : "light"
  return <IconButton icon={other} label={`Switch to ${other} theme`} />
}

function OnThePage({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className={styles.barStage}>{children}</div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "TopBar",
  level: "molecule",
  layout: "stacked",
  states: {
    "In a topic": ({ theme }) => (
      <OnThePage>
        <TopBar
          start={<Wordmark />}
          middle={<Text tone="muted">The Second World War from more than one side</Text>}
          end={
            <>
              <ThemeButton theme={theme} />
              <Avatar name="John Featherstone" />
            </>
          }
        />
      </OnThePage>
    ),
    Home: ({ theme }) => (
      <OnThePage>
        <TopBar
          start={<Wordmark />}
          end={
            <>
              <Button variant="primary" icon="add">
                New topic
              </Button>
              <ThemeButton theme={theme} />
            </>
          }
        />
      </OnThePage>
    ),
  },
}
