// 接続先はローカルの D1。wrangler の env は CLOUDFLARE_ENV で切り替わる

import { createInterface } from "node:readline/promises"
import { Writable } from "node:stream"
import { getPlatformProxy } from "wrangler"
import { hashPassword, PASSWORD_MIN_LENGTH } from "#admin/password.js"
import { createDB, type Database } from "#db/client.js"
import { adminUsers } from "#db/schema/index.js"
import type { Bindings } from "#types.js"

async function promptHidden(question: string): Promise<string> {
  let muted = false
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding)
      callback()
    },
  })
  const rl = createInterface({ input: process.stdin, output, terminal: true })
  rl.on("SIGINT", () => {
    process.stdout.write("\n")
    process.exit(130)
  })
  const answer = rl.question(question)
  muted = true
  try {
    return await answer
  } finally {
    muted = false
    process.stdout.write("\n")
    rl.close()
  }
}

async function main(db: Database): Promise<number> {
  const args = process.argv.slice(2)
  const email = args[0]?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+$/.test(email)) {
    console.error("Usage: pnpm admin:create <email>")
    return 1
  }
  if (!process.stdin.isTTY) {
    console.error(
      "パスワードを入力するため、ターミナルから対話的に実行してください",
    )
    return 1
  }

  const password = await promptHidden("パスワード: ")
  if (password.length < PASSWORD_MIN_LENGTH) {
    console.error(`パスワードは ${PASSWORD_MIN_LENGTH} 文字以上にしてください`)
    return 1
  }
  if ((await promptHidden("パスワード (確認): ")) !== password) {
    console.error("パスワードが一致しません")
    return 1
  }

  const hashedPassword = await hashPassword(password)
  const [user] = await db
    .insert(adminUsers)
    .values({ email, hashedPassword, isActive: true })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: { hashedPassword, isActive: true, updatedAt: new Date() },
    })
    .returning({ id: adminUsers.id })

  console.log(`admin user saved: id=${user?.id} email=${email}`)
  return 0
}

const { env, dispose } = await getPlatformProxy<Bindings>()
try {
  process.exitCode = await main(createDB(env.DB))
} finally {
  await dispose()
}
