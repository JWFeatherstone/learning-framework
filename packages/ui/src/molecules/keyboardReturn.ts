import { useRef } from "react"

/** When a menu or select closes, focus goes back to its button only if it was used from the keyboard.
    After a choice made with the pointer, the button would otherwise wear a focus ring no one asked for.
    Spread the result on the Radix content. */
export function useKeyboardReturn() {
  const pointer = useRef(false)
  return {
    onPointerDown: () => {
      pointer.current = true
    },
    onKeyDown: () => {
      pointer.current = false
    },
    onCloseAutoFocus: (event: Event) => {
      if (pointer.current) event.preventDefault()
      pointer.current = false
    },
  }
}
