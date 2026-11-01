import type { LabEntry } from "../lab"
import { useState } from "react"
import { TooltipProvider } from "../atoms/TooltipProvider"
import { Transcript, type Turn } from "./Transcript"
import styles from "./molecules.lab.module.css"

const OPENING: Turn[] = [
  {
    role: "tutor",
    text: "Let's start with the hardest version of the question. Was the League's failure over Manchuria inevitable, or did its members choose it? Take a side for now; we'll test it.",
  },
  { role: "learner", text: "Chosen. Britain and the US each had the means to act and waited for the other." },
  {
    role: "tutor",
    text: "Good. Now state the Japanese government's case as its foreign ministry would have in October 1931, without endorsing it. What did Tokyo think the League owed it?",
  },
]

// Live: type and send; the stand-in tutor echoes a question back.
function Live() {
  const [turns, setTurns] = useState<Turn[]>(OPENING)
  const [busy, setBusy] = useState(false)
  const send = (text: string) => {
    setTurns((now) => [...now, { role: "learner", text }, { role: "tutor", text: "", pending: true }])
    setBusy(true)
    setTimeout(() => {
      setTurns((now) => [
        ...now.slice(0, -1),
        { role: "tutor", text: `You said "${text.slice(0, 40)}…". What would Nanjing say to that?` },
      ])
      setBusy(false)
    }, 600)
  }
  return (
    <TooltipProvider>
      <div className={styles.session}>
        <Transcript turns={turns} onSend={send} onEnd={() => undefined} busy={busy} />
      </div>
    </TooltipProvider>
  )
}

function Waiting() {
  return (
    <TooltipProvider>
      <div className={styles.session}>
        <Transcript turns={[...OPENING, { role: "tutor", text: "", pending: true }]} onSend={() => undefined} busy />
      </div>
    </TooltipProvider>
  )
}

function Ended() {
  return (
    <TooltipProvider>
      <div className={styles.session}>
        <Transcript turns={OPENING} onSend={() => undefined} ended />
      </div>
    </TooltipProvider>
  )
}

export const lab: LabEntry = {
  name: "Transcript",
  level: "molecule",
  layout: "stacked",
  states: { Live, "Tutor answering": Waiting, Ended },
}
