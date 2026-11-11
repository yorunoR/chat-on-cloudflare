import {
  OpenAIClient,
  type OpenAIClientOptions,
} from "./models/openai-client.js"

export type LLMClientOptions = OpenAIClientOptions

export class LLMClient {
  readonly modelName
  readonly options
  readonly client
  readonly llm

  constructor(modelName: string, options: LLMClientOptions) {
    this.modelName = modelName
    this.options = options
    this.client = new OpenAIClient(this.modelName, this.options)
    this.llm = this.client.llm
  }
}
