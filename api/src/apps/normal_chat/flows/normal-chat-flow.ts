import { Annotation, END, START, StateGraph } from "@langchain/langgraph"
import {
  type AgentTemplate,
  NormalNode,
} from "#apps/normal_chat/nodes/normal-node.js"
import type { ChatSession } from "#db/schema/index.js"
import {
  getPromptTemplate,
  setStore,
} from "#libs/prompts/prompt-template-store.js"
import { appendQaToSession } from "#libs/queries/chat-sessions.js"
import type { WsSender } from "#libs/websocket/sender.js"
import promptTemplatesYaml from "../prompt_templates.yaml"

const FLOW_NAME = "normal_chat_flow"

setStore(promptTemplatesYaml)

const Node = {
  normal: "normal_node",
} as const
type Node = (typeof Node)[keyof typeof Node]

const State = Annotation.Root({
  history: Annotation<Node[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
})

export type FlowData = {
  prompt: string
  content: string
  lastAgentLabel: string
}

export type NormalChatFlowOptions = {
  /** null を渡すと、クライアントへ送らずに回答だけを返す */
  ws: WsSender | null
  chatSession: ChatSession
  /** abort されると LLM の呼び出しを止める。そこまでの回答は保存する */
  signal?: AbortSignal
}

export class NormalChatFlow {
  readonly ws: WsSender | null
  readonly chatSession: ChatSession
  readonly signal: AbortSignal | undefined
  readonly normalAgentTemplate: AgentTemplate
  readonly graph
  flowData: FlowData = { prompt: "", content: "", lastAgentLabel: "" }

  // プロンプトテンプレートの取得が非同期のため、インスタンスは create で作る
  private constructor(
    { ws, chatSession, signal }: NormalChatFlowOptions,
    normalAgentTemplate: AgentTemplate,
  ) {
    this.ws = ws
    this.chatSession = chatSession
    this.signal = signal
    this.normalAgentTemplate = normalAgentTemplate
    this.graph = this.#createGraph()
  }

  static async create(options: NormalChatFlowOptions): Promise<NormalChatFlow> {
    const normalAgentPromptTemplate = await getPromptTemplate(
      FLOW_NAME,
      Node.normal,
      "normal_agent",
    )
    return new NormalChatFlow(
      options,
      normalAgentPromptTemplate.template as AgentTemplate,
    )
  }

  async run(prompt: string): Promise<FlowData> {
    this.flowData = { prompt, content: "", lastAgentLabel: "" }
    try {
      await this.graph.invoke({ history: [] }, { signal: this.signal })
    } finally {
      // 途中で切断されても、そこまでの内容を残す
      await this.#save()
    }
    return this.flowData
  }

  async #save(): Promise<void> {
    if (this.flowData.content) {
      await appendQaToSession(
        this.chatSession,
        this.flowData.prompt,
        this.flowData.content,
      )
    }
  }

  #createGraph() {
    return new StateGraph(State)
      .addNode(Node.normal, () => this.#normalNode())
      .addEdge(START, Node.normal)
      .addEdge(Node.normal, END)
      .compile()
  }

  async #normalNode(): Promise<typeof State.Update> {
    const normalNode = new NormalNode({
      ws: this.ws,
      chatSession: this.chatSession,
      flowData: this.flowData,
      agentTemplate: this.normalAgentTemplate,
      signal: this.signal,
    })
    await normalNode.run()
    return { history: [Node.normal] }
  }
}
