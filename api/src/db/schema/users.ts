import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { timestamps } from "./columns/timestamps.js"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email", { length: 256 }).notNull().unique(),
  uid: text("uid", { length: 256 }).unique(),
  ...timestamps,
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
