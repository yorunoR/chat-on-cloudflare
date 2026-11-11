import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "#db/index.js"
import { chatSessions } from "#db/schema/index.js"
import { requireUser } from "#entrypoints/middlewares/require-user.js"

const postChatSessionSchema = z.object({
  uid: z.string().min(1).max(128),
  label: z.string().min(1).max(256),
  initialMessage: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
})

// uid はクライアントが採番する。既に使われていれば 409 を返す
export const postChatSession = new Hono().post(
  "/",
  requireUser,
  zValidator("json", postChatSessionSchema, (result, c) => {
    if (!result.success) return c.json({ error: "Bad Request" }, 400)
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
