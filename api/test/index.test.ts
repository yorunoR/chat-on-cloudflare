import { describe, expect, it } from "vitest"
import app from "#index.js"

describe("GET /health/db", () => {
  it("D1 に接続できれば ok を返す", async () => {
    const res = await app.request("/health/db")

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: "ok" })
  })
})
