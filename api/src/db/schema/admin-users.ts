import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import { timestamps } from "#db/schema/columns/timestamps.js"

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email", { length: 255 }).notNull(),
    hashedPassword: text("hashed_password", { length: 255 }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isSuperuser: integer("is_superuser", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("ix_admin_users_email").on(table.email)],
)

export type AdminUser = typeof adminUsers.$inferSelect
export type NewAdminUser = typeof adminUsers.$inferInsert
