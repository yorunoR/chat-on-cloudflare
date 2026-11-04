import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "../../src/admin/password.js"

describe("hashPassword / verifyPassword", () => {
  it("同じパスワードなら検証に成功する", async () => {
    const stored = await hashPassword("correct-password")

    expect(await verifyPassword("correct-password", stored)).toBe(true)
  })

  it("異なるパスワードなら検証に失敗する", async () => {
    const stored = await hashPassword("correct-password")

    expect(await verifyPassword("wrong-password", stored)).toBe(false)
  })

  it("同じパスワードでもソルトが異なるのでハッシュは毎回変わる", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"))
  })

  it("上限を超える反復回数の保存値は検証せずに失敗する", async () => {
    const [algorithm, , salt, hash] = (await hashPassword("pw")).split("$")
    const tampered = [algorithm, 100_001, salt, hash].join("$")

    expect(await verifyPassword("pw", tampered)).toBe(false)
  })

  it("形式が不正な保存値なら失敗する", async () => {
    expect(await verifyPassword("pw", "not-a-hash")).toBe(false)
  })
})
