import { env } from "cloudflare:workers"
import { ChatOpenAI, type ChatOpenAIFields } from "@langchain/openai"

export type OpenAIClientOptions = {
  modelKwargs: Omit<ChatOpenAIFields, "model" | "timeout" | "maxRetries">
}

export class OpenAIClient {
  readonly modelName: string
  readonly llm: ChatOpenAI

  constructor(modelName: string, options: OpenAIClientOptions) {
    this.modelName = modelName
    this.llm = new ChatOpenAI({
      model: this.modelName,
      apiKey: env.OPENAI_API_KEY,
      timeout: 30_000,
      // NOTE: llm 呼び出しの通信リトライによる最大待ち時間 (1 + 2 + 4 + 8) × 最大 2 倍 (ランダム) = 30 秒
      maxRetries: 4,
      ...options.modelKwargs,
    })
  }
}
