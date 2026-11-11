import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { upgradeWebSocket } from "hono/cloudflare-workers"
import { HTTPException } from "hono/http-exception"
import { db } from "#db/index.js"
import { chatSessions } from "#db/schema/index.js"

const ECHO_COUNT = 3

// クライアントからの 1 回の送信に対し、同じ内容を ECHO_COUNT 回返す。
// 会話はパスの chat_sessions.uid で判別し、存在しなければ upgrade せず 404 を返す
export const normalChat = new Hono().get(
  "/:sessionUid",
  upgradeWebSocket(async (c) => {
    // upgradeWebSocket の c にはパスの型が付かないため、undefined を除いておく
    const sessionUid = c.req.param("sessionUid")
    if (!sessionUid) throw new HTTPException(404)

    const [chatSession] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.uid, sessionUid))
      .limit(1)
    if (!chatSession) throw new HTTPException(404)

    return {
      onMessage(event, ws) {
        // チャットはテキストのみ扱い、バイナリは無視する
        if (typeof event.data !== "string") return
        for (let i = 0; i < ECHO_COUNT; i++) {
          ws.send(event.data)
        }
      },
    }
  }),
)
