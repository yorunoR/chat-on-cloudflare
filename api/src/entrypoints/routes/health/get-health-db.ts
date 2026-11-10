import { sql } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "#db/index.js"

// DB に接続できるかを見る
export const getHealthDb = new Hono().get("/db", async (c) => {
  await db.run(sql`select 1`)
  return c.json({ status: "ok" })
})
