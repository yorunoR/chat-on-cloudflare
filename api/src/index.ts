import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { admin } from "#admin/index.js"
import { chatSessionRoute } from "#entrypoints/routes/chat_session/index.js"
import { healthRoute } from "#entrypoints/routes/health/index.js"
import { normalChatRoute } from "#entrypoints/routes/normal_chat/index.js"
import type { AppEnv } from "#types.js"

const app = new Hono<AppEnv>()

app.use(logger())

// 想定外のエラーはログに残し、詳細をクライアントに返さない
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: "Internal Server Error" }, 500)
})

// drizzle-admin はリクエストボディのサイズを制限しないため前段で制限する
app.use("/admin/*", bodyLimit({ maxSize: 1024 * 1024 }))
app.route("/admin", admin.app)

// RPC クライアント (hc) が型を拾えるよう、ルートはチェーンでつないで AppType として export する。
// 機能の接頭辞はここで付け、機能内のルートは routes/<機能>/index.ts でまとめる
const routes = app
  .route("/health", healthRoute)
  .route("/api/chat_session", chatSessionRoute)
  .route("/ws/normal_chat", normalChatRoute)

export type AppType = typeof routes
export default app
