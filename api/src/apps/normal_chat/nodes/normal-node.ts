import type { FlowData } from "#apps/normal_chat/flows/flow-data.js"
import type { ChatSession } from "#db/schema/index.js"
import { LLMAgent } from "#libs/agents/llm-agent.js"
import { getHistory } from "#libs/queries/chat-sessions.js"
import { ContentStreamSender, type WsSender } from "#libs/websocket/sender.js"

export type AgentTemplate = {
  model_name: string
  system_message: string
  label: string
}

export type NormalNodeOptions = {
  ws: WsSender | null
  chatSession: ChatSession
  flowData: FlowData
  agentTemplate: AgentTemplate
  signal?: AbortSignal
}

/** 会話履歴を踏まえて、日常会話として回答する */
export class NormalNode {
  readonly ws: WsSender | null
  readonly chatSession: ChatSession
  readonly flowData: FlowData
  readonly agent: LLMAgent
  readonly signal: AbortSignal | undefined

  constructor({
    ws,
    chatSession,
    flowData,
    agentTemplate,
    signal,
  }: NormalNodeOptions) {
    this.ws = ws
    this.chatSession = chatSession
    this.flowData = flowData
    this.signal = signal
    this.agent = new LLMAgent({
      modelName: agentTemplate.model_name,
      systemMessage: agentTemplate.system_message,
      label: agentTemplate.label,
    })
  }

  async run(): Promise<void> {
    const history = await getHistory(this.chatSession)
    const chain = await this.agent.chain({
      chatSession: this.chatSession,
      history,
      metadata: { agent: this.agent.label },
    })
    this.flowData.lastAgentLabel = this.agent.label
    const stream = await chain.stream(
      { input: this.flowData.prompt },
      { signal: this.signal },
    )
    const sender = new ContentStreamSender(this.ws, this.agent.label)
    try {
      // structuredModel を渡していないので、チャンクはテキストになる
      await sender.send(stream as AsyncIterable<{ text: string }>)
    } finally {
      // 途中で切断されても flow がそこまでの回答を保存できるよう、FlowData に移す
      this.flowData.content = sender.content
    }
  }
}
