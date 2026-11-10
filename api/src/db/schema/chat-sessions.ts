import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { chatMessages } from "./chat-messages.js"
import { timestamps } from "./columns/timestamps.js"
import { users } from "./users.js"

export const chatSessions = sqliteTable("chat_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label", { length: 256 }).notNull(),
  uid: text("uid", { length: 128 }).notNull().unique(),
  initialMessage: text("initial_message"),
  ...timestamps,
})

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatSessions.userId],
      references: [users.id],
    }),
    chatMessages: many(chatMessages),
  }),
)

export type ChatSession = typeof chatSessions.$inferSelect
export type NewChatSession = typeof chatSessions.$inferInsert
