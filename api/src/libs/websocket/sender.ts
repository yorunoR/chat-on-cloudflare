// 回答をまとめて送るチャンク数。1 チャンクずつ送ると送信回数が多くなりすぎる
const CHUNKS_PER_MESSAGE = 3

/** 送信先。libs/ から Hono を import しないよう、使うメソッドだけを型にする */
export type WsSender = { send(data: string): void }

/** ws が null のときは送らない (テスト・評価・バッチ用) */
export function sendJson(
  ws: WsSender | null,
  data: Record<string, unknown>,
): void {
  ws?.send(JSON.stringify(data))
}

export function sendMessage(
  ws: WsSender | null,
  message: Record<string, unknown>,
): void {
  sendJson(ws, { message })
}

/**
 * 1 つの回答をストリーミングで送り、最後に stop を送る。1 回答につき 1 インスタンス
 *
 * 送信中に例外 (切断・タイムアウト・LLM のエラー) で止まっても、content にそこまでの回答が残る
 */
export class ContentStreamSender {
  readonly ws: WsSender | null
  readonly agent: string
  readonly checkCancel: ((content: string) => boolean) | undefined
  content = ""
  cancel = false

  /** checkCancel は、それまでの回答の全文を受け取り、中断するなら true を返す */
  constructor(
    ws: WsSender | null,
    agent: string,
    { checkCancel }: { checkCancel?: (content: string) => boolean } = {},
  ) {
    this.ws = ws
    this.agent = agent
    this.checkCancel = checkCancel
  }

  async send(stream: AsyncIterable<{ text: string }>): Promise<void> {
    let pendingContent = ""
    let pendingCount = 0
    for await (const chunk of stream) {
      const content = chunk.text
      this.content += content
      pendingContent += content
      pendingCount++
      if (pendingCount >= CHUNKS_PER_MESSAGE) {
        this.#sendContent(pendingContent)
        pendingContent = ""
        pendingCount = 0
      }
    }

    if (pendingContent) this.#sendContent(pendingContent)

    sendMessage(this.ws, {
      agent: this.agent,
      content: "",
      content_key: null,
      stop: true,
      cancel: this.cancel,
    })
  }

  #sendContent(content: string): void {
    this.cancel ||= this.checkCancel?.(this.content) ?? false
    sendMessage(this.ws, {
      agent: this.agent,
      content,
      content_key: "message",
      stop: null,
      cancel: this.cancel,
    })
  }
}

/** 選択肢つきの回答を 1 回で送る。stop も兼ねる */
export function sendContentWithOptions(
  ws: WsSender | null,
  agent: string,
  content: string,
  options: unknown,
): void {
  sendMessage(ws, {
    agent,
    content,
    options,
    content_key: null,
    stop: true,
    cancel: false,
  })
}

/** この接続での処理がすべて終わった合図。クライアントは受け取ったら接続を閉じる */
export function sendDone(ws: WsSender | null): void {
  sendJson(ws, { done: true })
}
