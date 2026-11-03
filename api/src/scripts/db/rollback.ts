// 適用済みのマイグレーションを新しい順に取り消す。
// drizzle/down/<マイグレーション名>.sql を実行し、d1_migrations から記録を削除する。
// 使い方: pnpm db:rollback [件数]  (省略時は 1 件)
// 接続先はローカルの D1。wrangler の env は CLOUDFLARE_ENV で切り替わる

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { getPlatformProxy } from "wrangler"
import type { Bindings } from "../../types.js"

const DOWN_DIR = join(import.meta.dirname, "../../../drizzle/down")
const MIGRATIONS_TABLE = "d1_migrations"

/** SQL ファイルを文単位に分割する (drizzle の statement-breakpoint と行末の ; で区切る) */
function splitStatements(sql: string): string[] {
  return sql
    .split(/--> statement-breakpoint|;\s*$/m)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0)
}

async function main(db: D1Database): Promise<number> {
  const arg = process.argv[2]
  const count = arg === undefined ? 1 : Number(arg)
  if (!Number.isInteger(count) || count < 1) {
    console.error("Usage: pnpm db:rollback [count]")
    return 1
  }

  const { results } = await db
    .prepare(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT ?`)
    .bind(count)
    .all<{ name: string }>()
  if (results.length === 0) {
    console.log("取り消せるマイグレーションはありません")
    return 0
  }

  // 実行前に down ファイルがすべて揃っているか確認する
  const missing = results.filter(
    ({ name }) => !existsSync(join(DOWN_DIR, name)),
  )
  if (missing.length > 0) {
    for (const { name } of missing) {
      console.error(`down ファイルがありません: drizzle/down/${name}`)
    }
    return 1
  }

  for (const { name } of results) {
    const statements = splitStatements(
      readFileSync(join(DOWN_DIR, name), "utf8"),
    )
    // down の SQL と記録の削除を 1 トランザクションで実行する
    await db.batch([
      ...statements.map((s) => db.prepare(s)),
      db.prepare(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`).bind(name),
    ])
    console.log(`rolled back: ${name}`)
  }
  return 0
}

const { env, dispose } = await getPlatformProxy<Bindings>()
try {
  process.exitCode = await main(env.DB)
} finally {
  await dispose()
}
