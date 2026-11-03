import { sql } from "drizzle-orm"
import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { admin } from "./admin"
import { db } from "./db"
import type { AppEnv } from "./types"

const app = new Hono<AppEnv>()

app.get("/health/db", async (c) => {
  await db.run(sql`select 1`)
  return c.json({ status: "ok" })
})

// drizzle-admin はリクエストボディのサイズを制限しないため前段で制限する
app.use("/admin/*", bodyLimit({ maxSize: 1024 * 1024 }))
app.route("/admin", admin.app)

export default app
