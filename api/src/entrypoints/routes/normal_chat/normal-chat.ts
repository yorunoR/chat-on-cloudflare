import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { upgradeWebSocket } from "hono/cloudflare-workers"
import { HTTPException } from "hono/http-exception"
import { runNormalChat } from "#apps/normal_chat/normal-chat-controller.js"
import { db } from "#db/index.js"
import { chatSessions } from "#db/schema/index.js"
import { singleQuestionEvents } from "#libs/websocket/single-question.js"

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

  return upgradeWebSocket(
    c,
    singleQuestionEvents(
      { name: "normal_chat", timeoutSeconds: WS_TIMEOUT_SECONDS },
      (ws, text, { signal }) =>
        runNormalChat(ws, chatSession, text, { signal }),
    ),
  )
})
