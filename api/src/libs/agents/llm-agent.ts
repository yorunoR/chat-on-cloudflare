import type { BaseMessageLike } from "@langchain/core/messages"
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts"
import { RunnablePassthrough } from "@langchain/core/runnables"
import type { ChatSession } from "#db/schema/index.js"
import {
  LLMClient,
  type LLMClientOptions,
} from "#libs/external/llm/llm-client.js"

type LLM = LLMClient["llm"]
type Tools = Parameters<LLM["bindTools"]>[0]
type StructuredModel = Parameters<LLM["withStructuredOutput"]>[0]
type Metadata = Record<string, unknown>

export type LLMAgentOptions = {
  modelName?: string
  systemMessage: string
  label: string
  tools?: Tools
}

export type ChainOptions = {
  chatSession?: Pick<ChatSession, "uid" | "userId">
  history?: BaseMessageLike[]
  modelName?: string
  structuredModel?: StructuredModel
  metadata: Metadata
} & Omit<LLMClientOptions, "modelKwargs">

export class LLMAgent {
  readonly modelName: string | undefined
  readonly systemMessage: string
  readonly label: string
  readonly tools: Tools

  constructor({
    modelName,
    systemMessage,
    label,
    tools = [],
  }: LLMAgentOptions) {
    this.modelName = modelName
    this.systemMessage = systemMessage
    this.label = label
    this.tools = tools
  }

  /** history は呼び出し側 (ノード) が用意して渡す。chatSession はトレース用の metadata にだけ使う */
  async chain({
    chatSession,
    history = [],
    modelName = this.modelName,
    structuredModel,
    metadata,
    ...kwargs
  }: ChainOptions) {
    if (!modelName) {
      throw new Error(`modelName がありません: ${this.label}`)
    }
    const client = new LLMClient(modelName, {
      ...kwargs,
      modelKwargs: {
        metadata: chatSession
          ? addChatSessionMetadata(metadata, chatSession)
          : metadata,
      },
    })

    const assigns = RunnablePassthrough.assign({ history: () => history })

    const qaPrompt = await ChatPromptTemplate.fromMessages([
      ["system", "{system_message}"],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]).partial({ system_message: this.systemMessage })

    // withStructuredOutput は独自に tools を設定するため、bindTools した tools より優先される
    const llm = structuredModel
      ? client.llm.withStructuredOutput(structuredModel)
      : this.tools.length > 0
        ? client.llm.bindTools(this.tools)
        : client.llm

    return assigns.pipe(qaPrompt).pipe(llm)
  }
}

// 呼び出し側のオブジェクトを書き換えないよう、コピーして足す
function addChatSessionMetadata(
  metadata: Metadata,
  chatSession: Pick<ChatSession, "uid" | "userId">,
): Metadata {
  return {
    ...metadata,
    session_id: chatSession.uid,
    trace_user_id: chatSession.userId,
  }
}
