import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleUser,
  ClipboardCheck,
  FileDiff,
  Info,
  Library,
  ListTree,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Moon,
  PanelLeft,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react"

export const ICON_GROUPS = ["Course", "Actions", "Views", "Disclosure", "Status", "Account"] as const

interface IconSpec {
  glyph: LucideIcon
  group: (typeof ICON_GROUPS)[number]
  use: string
}

// Every icon the app uses, named for what it means. One meaning has one glyph; a glyph may serve two
// meanings in different places. This is the only module that imports Lucide.
export const ICONS = {
  topics: { glyph: Library, group: "Course", use: "All topics" },
  plan: { glyph: ListTree, group: "Course", use: "A topic's plan: parts, chapters, units" },
  reading: { glyph: BookOpen, group: "Course", use: "A unit's reading" },
  exercise: { glyph: MessagesSquare, group: "Course", use: "A unit's exercise: a dialogue or a task" },
  test: { glyph: ClipboardCheck, group: "Course", use: "A unit's test" },
  reference: { glyph: BookMarked, group: "Course", use: "A source a reading cites" },
  revision: { glyph: FileDiff, group: "Course", use: "A proposed change to the plan" },
  complete: { glyph: CircleCheck, group: "Course", use: "A module or unit the learner has finished" },
  generate: { glyph: Sparkles, group: "Course", use: "Generate a planned module" },
  send: { glyph: SendHorizontal, group: "Course", use: "Send a turn to the tutor" },
  back: { glyph: ArrowLeft, group: "Course", use: "Back to the outline" },
  next: { glyph: ArrowRight, group: "Course", use: "On to the next step or unit" },

  search: { glyph: Search, group: "Actions", use: "Search" },
  add: { glyph: Plus, group: "Actions", use: "Add a topic or an item" },
  edit: { glyph: Pencil, group: "Actions", use: "Edit or rename" },
  delete: { glyph: Trash2, group: "Actions", use: "Delete something saved" },
  close: { glyph: X, group: "Actions", use: "Close a dialog; clear a field" },
  comment: { glyph: MessageCircle, group: "Actions", use: "Comment on a plan node" },

  nav: { glyph: PanelLeft, group: "Views", use: "Show or hide the course navigation" },
  settings: { glyph: Settings, group: "Views", use: "Open the settings" },
  light: { glyph: Sun, group: "Views", use: "Switch to the light theme" },
  dark: { glyph: Moon, group: "Views", use: "Switch to the dark theme" },

  open: { glyph: ChevronDown, group: "Disclosure", use: "An open section; a dropdown" },
  closed: { glyph: ChevronRight, group: "Disclosure", use: "A closed section" },
  chosen: { glyph: Check, group: "Disclosure", use: "The chosen option in a list" },

  info: { glyph: Info, group: "Status", use: "A note" },
  warning: { glyph: TriangleAlert, group: "Status", use: "Something needs attention" },
  error: { glyph: CircleAlert, group: "Status", use: "Something failed" },
  locked: { glyph: Lock, group: "Status", use: "Not available yet" },

  signIn: { glyph: LogIn, group: "Account", use: "Sign in" },
  signOut: { glyph: LogOut, group: "Account", use: "Sign out" },
  account: { glyph: CircleUser, group: "Account", use: "Your account" },
  help: { glyph: CircleHelp, group: "Account", use: "Help" },
} as const satisfies Record<string, IconSpec>

export type IconName = keyof typeof ICONS
