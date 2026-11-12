import type { WsSender } from "./sender.js"

/** libs/ から Hono を import しないよう、使うメソッドだけを型にする */
export type WsConnection = WsSender & {
  close(code?: number, reason?: string): void
}

export type QuestionHandler = (
  ws: WsConnection,
  text: string,
  options: { signal: AbortSignal },
) => Promise<unknown>

export type SingleQuestionOptions = {
  /** ログに出す名前 */
  name: string
  timeoutSeconds: number
}

/**
 * 1 接続で 1 つの質問を受けて回答する WebSocket のイベントハンドラを作る。upgradeWebSocket に渡す
 *
 * 切断・タイムアウトでは handleQuestion に渡した signal を abort する
 */
export function singleQuestionEvents(
  { name, timeoutSeconds }: SingleQuestionOptions,
  handleQuestion: QuestionHandler,
) {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let started = false

  return {
    onMessage(event: { data: unknown }, ws: WsConnection) {
      // チャットはテキストのみ扱い、バイナリは無視する
      if (typeof event.data !== "string") return
      // 接続を閉じるのはクライアントの責務なので、2 つ目以降の受信は捨てて閉じられるまで待つ
      if (started) return
      started = true
      // Workers のアダプタは onOpen を呼ばず、サーバー側の ws はイベントでしか受け取れないため、質問を受けた時点から数える
      timer = setTimeout(() => {
        controller.abort()
        ws.close(1000, "timeout")
      }, timeoutSeconds * 1000)
      handleQuestion(ws, event.data, { signal: controller.signal }).catch(
        (err) => {
          // こちらから止めた場合は、接続はすでに閉じているか閉じるところ
          if (controller.signal.aborted) return
          console.error(`${name} failed`, err)
          ws.close(1011)
        },
      )
    },
    onClose() {
      clearTimeout(timer)
      controller.abort()
    },
  }
}
