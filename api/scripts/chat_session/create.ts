// 指定したメールアドレスのユーザーに ChatSession を作成する。ユーザーがいなければエラーにする。
// uid はランダムな UUID を割り当てる。
// 使い方: pnpm session:create <email> <label> [initialMessage]
// 接続先はローカルの D1。wrangler の env は CLOUDFLARE_ENV で切り替わる

import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { getPlatformProxy } from "wrangler"
import { createDB, type Database } from "#db/client.js"
import { chatSessions, users } from "#db/schema/index.js"
import type { Bindings } from "#types.js"

async function main(db: Database): Promise<number> {
  const [rawEmail, rawLabel, initialMessage] = process.argv.slice(2)
  const email = rawEmail?.trim()
  const label = rawLabel?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+$/.test(email) || !label) {
    console.error("Usage: pnpm session:create <email> <label> [initialMessage]")
    return 1
  }

  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.email, email),
  })
  if (!user) {
    console.error(`ユーザーが見つかりません: ${email}`)
    return 1
  }

  const [session] = await db
    .insert(chatSessions)
    .values({ userId: user.id, label, uid: randomUUID(), initialMessage })
    .returning({ id: chatSessions.id, uid: chatSessions.uid })

  console.log(
    `chat session created: id=${session?.id} uid=${session?.uid} user_id=${user.id} email=${email}`,
  )
  return 0
}

const { env, dispose } = await getPlatformProxy<Bindings>()
try {
  process.exitCode = await main(createDB(env.DB))
} finally {
  await dispose()
}
