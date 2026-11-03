import { env } from "cloudflare:workers"
import { createDB } from "./client.js"

// クライアントを作るだけで、D1 への問い合わせはクエリ実行時 (リクエスト中) に行われる
export const db = createDB(env.DB)
