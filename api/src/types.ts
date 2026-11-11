export type Bindings = {
  DB: D1Database
  // 管理画面 (/admin) の Cookie 署名用。.dev.vars (ローカル) か wrangler secret で設定する
  ADMIN_SECRET: string
  // "true" のとき、使ったプロンプトテンプレートを prompt_templates に保存する (ローカル開発用)
  SAVE_PROMPT_TEMPLATE?: string
}

export type AppEnv = {
  Bindings: Bindings
}

// `import { env } from "cloudflare:workers"` の env にも同じ型を付ける
declare global {
  namespace Cloudflare {
    interface Env extends Bindings {}
  }
}
