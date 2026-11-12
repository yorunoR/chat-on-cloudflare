import { drizzle } from "drizzle-orm/d1"
import * as schema from "#db/schema/index.js"

// Node.js のスクリプトからも使うため cloudflare:workers に依存させない
export function createDB(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Database = ReturnType<typeof createDB>
