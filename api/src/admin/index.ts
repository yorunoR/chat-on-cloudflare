import { env } from "cloudflare:workers"
import { createAdmin } from "@sson0-er/drizzle-admin"
import { eq } from "drizzle-orm"
import { db } from "../db/index.js"
import { adminUsers } from "../db/schema/index.js"
import {
  hashPassword,
  PASSWORD_MIN_LENGTH,
  verifyPassword,
} from "./password.js"

export const admin = createAdmin({
  db,
  dialect: "sqlite",
  basePath: "/admin",
  secret: env.ADMIN_SECRET, // 32 文字以上。未設定・不足ならライブラリが生成時にエラーにする
  auth: {
    // ログイン画面の Username にはメールアドレスを入力する
    verifyCredentials: async (email, password) => {
      const [user] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1)
      if (!user?.isActive) return null
      if (!(await verifyPassword(password, user.hashedPassword))) return null
      return { id: String(user.id), name: user.email }
    },
  },
})

admin.register(adminUsers, {
  listDisplay: ["id", "email", "isActive", "createdAt"],
  searchFields: ["email"],
  readonlyFields: ["createdAt", "updatedAt"],
  // 入力欄は常に空で表示され、変更画面で空のまま保存すると現在のパスワードを維持する
  widgets: { hashedPassword: "password" },
  toString: (row) => row.email,
  validate: ({ hashedPassword }) =>
    typeof hashedPassword === "string" &&
    hashedPassword.length < PASSWORD_MIN_LENGTH
      ? { hashedPassword: `${PASSWORD_MIN_LENGTH} 文字以上にしてください` }
      : undefined,
  hooks: {
    // drizzle-admin はハッシュ化しないので、保存前に平文をハッシュへ置き換える
    beforeSave: async (data) =>
      typeof data.hashedPassword === "string"
        ? { ...data, hashedPassword: await hashPassword(data.hashedPassword) }
        : data,
  },
})
