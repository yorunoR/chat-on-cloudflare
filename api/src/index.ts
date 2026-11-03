import { sql } from "drizzle-orm"
import { Hono } from "hono"
import { createDB } from "./db"

const app = new Hono()

app.get("/health/db", async (c) => {
  const db = createDB(c.env.DB)
  await db.run(sql`select 1`)
  return c.json({ status: "ok" })
})

export default app
