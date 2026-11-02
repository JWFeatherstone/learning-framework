// The one seam between the runtime and a model provider. Prompts are Markdown; outputs are validated
// against @lf/contracts by the caller. Nothing provider-specific leaks past this file.

export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CompleteOptions {
  messages: Message[]
  maxTokens?: number
  /** For a harness: the learner's sources (it may read the directories among them), the conversation to
      resume, and a line per tool call while it works. Other providers ignore these. */
  sources?: string[]
  session?: string
  onProgress?: (line: string) => void
}

export interface Completion {
  text: string
  usage?: { inputTokens: number; outputTokens: number }
  /** A harness's conversation, to resume on the next call. */
  session?: string
  /** The model that answered, when the provider reports it. */
  model?: string
}

export interface Provider {
  name: string
  model: string
  complete(options: CompleteOptions): Promise<Completion>
  stream(options: CompleteOptions): AsyncIterable<string>
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

function split(messages: Message[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n")
  const rest = messages.filter((message) => message.role !== "system").map(({ role, content }) => ({ role, content }))
  return { system, messages: rest }
}

/** Anthropic's Messages API over fetch. The key is read once and never logged. */
export function anthropicProvider(apiKey: string, model: string): Provider {
  const request = (options: CompleteOptions, stream: boolean) =>
    fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: options.maxTokens ?? 8192, stream, ...split(options.messages) }),
    })

  const fail = async (response: Response): Promise<never> => {
    const body = await response.text()
    throw new Error(`Anthropic ${response.status}: ${body.slice(0, 400)}`)
  }

  return {
    name: "anthropic",
    model,
    async complete(options) {
      const response = await request(options, false)
      if (!response.ok) return fail(response)
      const data = (await response.json()) as {
        content: { type: string; text?: string }[]
        usage: { input_tokens: number; output_tokens: number }
      }
      return {
        text: data.content.map((block) => block.text ?? "").join(""),
        usage: { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens },
      }
    },
    async *stream(options) {
      const response = await request(options, true)
      if (!response.ok || !response.body) return fail(response)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) return
        buffer += decoder.decode(value, { stream: true })
        let boundary = buffer.indexOf("\n\n")
        while (boundary >= 0) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const data = event
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("")
          if (data) {
            const parsed = JSON.parse(data) as { type: string; delta?: { type: string; text?: string }; error?: { message: string } }
            if (parsed.type === "error") throw new Error(parsed.error?.message ?? "stream error")
            if (parsed.type === "content_block_delta" && parsed.delta?.text) yield parsed.delta.text
          }
          boundary = buffer.indexOf("\n\n")
        }
      }
    },
  }
}
