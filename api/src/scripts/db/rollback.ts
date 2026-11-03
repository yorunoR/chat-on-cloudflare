// 接続先はローカルの D1。wrangler の env は CLOUDFLARE_ENV で切り替わる

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { getPlatformProxy } from "wrangler"
import type { Bindings } from "../../types.js"

const DOWN_DIR = join(import.meta.dirname, "../../../drizzle/down")
const MIGRATIONS_TABLE = "d1_migrations"

// D1 の prepare は 1 文ずつしか実行できないため分割する
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

  // 途中で止まって一部だけ取り消された状態にならないよう、実行前にすべて確認する
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
    // batch はトランザクションで実行されるので、スキーマと d1_migrations の記録がずれない
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
