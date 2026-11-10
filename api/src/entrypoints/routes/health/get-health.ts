import { Hono } from "hono"

// プロセスが応答できるかだけを見る (DB には触れない)
export const getHealth = new Hono().get("/", (c) => c.json({ status: "ok" }))
