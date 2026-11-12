// 接続先はローカルの D1。wrangler の env は CLOUDFLARE_ENV で切り替わる

import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { getPlatformProxy } from "wrangler"
import type { Bindings } from "#types.js"

const MIGRATIONS_DIR = join(import.meta.dirname, "../../drizzle")
const DOWN_DIR = join(MIGRATIONS_DIR, "down")
const MIGRATIONS_TABLE = "d1_migrations"

async function getApplied(db: D1Database): Promise<Map<string, string>> {
  // d1_migrations は初回の db:migrate で作られるので、まだ無いことがある
  const table = await db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(MIGRATIONS_TABLE)
    .first()
  if (!table) return new Map()

  const { results } = await db
    .prepare(`SELECT name, applied_at FROM ${MIGRATIONS_TABLE} ORDER BY id`)
    .all<{ name: string; applied_at: string }>()
  return new Map(results.map((r) => [r.name, r.applied_at]))
}

async function main(db: D1Database): Promise<number> {
  const applied = await getApplied(db)
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  const rows = files.map((name) => ({
    status: applied.has(name) ? "applied" : "pending",
    name,
    appliedAt: applied.get(name) ?? "",
    down: existsSync(join(DOWN_DIR, name)) ? "yes" : "MISSING",
  }))
  for (const [name, appliedAt] of applied) {
    if (!files.includes(name)) {
      rows.push({ status: "no file", name, appliedAt, down: "-" })
    }
  }

  if (rows.length === 0) {
    console.log("マイグレーションはありません")
    return 0
  }
  console.table(
    rows.map((r) => ({
      status: r.status,
      name: r.name,
      "applied at": r.appliedAt,
      down: r.down,
    })),
  )

  const pending = rows.filter((r) => r.status === "pending").length
  console.log(
    `applied: ${applied.size}, pending: ${pending}` +
      (pending > 0 ? "  →  pnpm db:migrate で適用" : ""),
  )
  return 0
}

const { env, dispose } = await getPlatformProxy<Bindings>()
try {
  process.exitCode = await main(env.DB)
} finally {
  await dispose()
}
