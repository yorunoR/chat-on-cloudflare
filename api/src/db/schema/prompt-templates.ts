import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { timestamps } from "#db/schema/columns/timestamps.js"

export const promptTemplates = sqliteTable("prompt_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flowName: text("flow_name", { length: 128 }).notNull(),
  nodeName: text("node_name", { length: 128 }).notNull(),
  agentName: text("agent_name", { length: 128 }),
  template: text("template", { mode: "json" }),
  hexdigest: text("hexdigest", { length: 128 }),
  ...timestamps,
})

export type PromptTemplate = typeof promptTemplates.$inferSelect
export type NewPromptTemplate = typeof promptTemplates.$inferInsert
