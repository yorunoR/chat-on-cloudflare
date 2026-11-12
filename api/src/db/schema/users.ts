import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { chatMessages } from "#db/schema/chat-messages.js"
import { chatSessions } from "#db/schema/chat-sessions.js"
import { timestamps } from "#db/schema/columns/timestamps.js"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email", { length: 256 }).notNull().unique(),
  uid: text("uid", { length: 256 }).unique(),
  ...timestamps,
})

export const usersRelations = relations(users, ({ many }) => ({
  chatSessions: many(chatSessions),
  chatMessages: many(chatMessages),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
