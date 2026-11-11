import { eq } from "drizzle-orm"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import { db } from "#db/index.js"
import { type User, users } from "#db/schema/index.js"

// Authorization: Bearer <users.uid> でユーザーを特定し、c.var.user に入れる
export const requireUser = createMiddleware<{ Variables: { user: User } }>(
  async (c, next) => {
    const uid = c.req.header("Authorization")?.match(/^Bearer (.+)$/)?.[1]
    if (!uid) throw new HTTPException(401)

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1)
    if (!user) throw new HTTPException(401)

    c.set("user", user)
    await next()
  },
)
