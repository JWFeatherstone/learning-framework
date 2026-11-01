// The one seam between the runtime and a model provider. Prompts are Markdown; outputs are validated
// against @lf/contracts by the caller. Nothing provider-specific leaks past this file.

export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CompleteOptions {
  model: string
  messages: Message[]
  /** A JSON Schema the response must satisfy; providers that support structured output use it directly. */
  schema?: Record<string, unknown>
  maxTokens?: number
}

export interface Completion {
  text: string
  usage: { inputTokens: number; outputTokens: number }
}

export interface Provider {
  complete(options: CompleteOptions): Promise<Completion>
  stream(options: CompleteOptions): AsyncIterable<string>
}

/** Stands in until a provider is chosen (open question 1). Every call fails loudly. */
export function unconfiguredProvider(): Provider {
  const fail = () => {
    throw new Error("No model provider is configured. Set one in @lf/runtime before generating.")
  }
  return {
    complete: async () => fail(),
    // eslint-disable-next-line require-yield
    async *stream() {
      fail()
    },
  }
}
