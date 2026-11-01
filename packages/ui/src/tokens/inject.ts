import { tokensCss } from "./css"

// Runs before anything renders, so no element paints without its tokens.
document.getElementById("tokens")?.remove()
const style = document.createElement("style")
style.id = "tokens"
style.textContent = tokensCss()
document.head.prepend(style)
