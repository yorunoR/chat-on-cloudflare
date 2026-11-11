import { Hono } from "hono"
import { validator } from "hono/validator"
import { db } from "#db/index.js"
import { chatSessions } from "#db/schema/index.js"
import { requireUser } from "#entrypoints/middlewares/require-user.js"

// uid はクライアントが採番する。既に使われていれば 409 を返す
export const postChatSession = new Hono().post(
  "/",
  requireUser,
  validator("json", (value, c) => {
    const { uid, label, initialMessage } = value
    if (
      typeof uid !== "string" ||
      uid.length === 0 ||
      uid.length > 128 ||
      typeof label !== "string" ||
      label.length === 0 ||
      label.length > 256 ||
      (initialMessage != null && typeof initialMessage !== "string")
    ) {
      return c.json({ error: "Bad Request" }, 400)
    }
    return { uid, label, initialMessage: initialMessage ?? null }
  }),
  async (c) => {
    const user = c.var.user
    const { uid, label, initialMessage } = c.req.valid("json")

    const [created] = await db
      .insert(chatSessions)
      .values({ userId: user.id, uid, label, initialMessage })
      .onConflictDoNothing({ target: chatSessions.uid })
      .returning({ id: chatSessions.id })
    if (!created) return c.json({ error: "Conflict" }, 409)

    return c.body(null, 204)
  },
)
