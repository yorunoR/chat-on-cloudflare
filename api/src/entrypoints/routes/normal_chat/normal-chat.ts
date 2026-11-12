import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { upgradeWebSocket } from "hono/cloudflare-workers"
import { HTTPException } from "hono/http-exception"
import { runNormalChat } from "#apps/normal_chat/normal-chat-controller.js"
import { db } from "#db/index.js"
import { chatSessions } from "#db/schema/index.js"

const WS_TIMEOUT_SECONDS = 300

// 会話はパスの chat_sessions.uid で判別し、存在しなければ upgrade せず 404 を返す
export const normalChat = new Hono().get("/:sessionUid", async (c) => {
  // upgradeWebSocket(c, events) は upgrade でないリクエストで例外を投げるため、先に弾く。
  // Workers のアダプタと同じく大文字小文字を区別して比べる
  if (c.req.header("Upgrade") !== "websocket") {
    throw new HTTPException(404)
  }

  const [chatSession] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.uid, c.req.param("sessionUid")))
    .limit(1)
  if (!chatSession) throw new HTTPException(404)

  // 切断・タイムアウトで回答の生成を止める
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let started = false

  return upgradeWebSocket(c, {
    onMessage(event, ws) {
      // チャットはテキストのみ扱い、バイナリは無視する
      if (typeof event.data !== "string") return
      // 1 接続で受け付ける質問は 1 つ。接続を閉じるのはクライアントの責務なので、以降の受信は捨てて閉じられるまで待つ
      if (started) return
      started = true
      // Workers のアダプタは onOpen を呼ばず、サーバー側の ws はイベントでしか受け取れないため、質問を受けた時点から数える
      timer = setTimeout(() => {
        controller.abort()
        ws.close(1000, "timeout")
      }, WS_TIMEOUT_SECONDS * 1000)
      runNormalChat(ws, chatSession, event.data, {
        signal: controller.signal,
      }).catch((err) => {
        // こちらから止めた場合は、接続はすでに閉じているか閉じるところ
        if (controller.signal.aborted) return
        console.error("normal_chat failed", err)
        ws.close(1011)
      })
    },
    onClose() {
      clearTimeout(timer)
      controller.abort()
    },
  })
})
