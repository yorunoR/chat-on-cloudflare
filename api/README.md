# api

Cloudflare Workers 上で動く [Hono](https://hono.dev/) の API サーバー。
DB は Cloudflare D1 (SQLite) で、[Drizzle ORM](https://orm.drizzle.team/) を使ってアクセスする。
`/admin` には [drizzle-admin](https://www.npmjs.com/package/@sson0-er/drizzle-admin) による管理画面がある。

構成の詳細は [docs/01_構成.md](docs/01_構成.md) を参照。

## 起動

### Docker Compose で起動する

リポジトリのルートで実行する。

```sh
cp .env.api.local.sample .env.api.local   # 初回のみ
cp api/.dev.vars.example api/.dev.vars    # 初回のみ。ADMIN_SECRET と OPENAI_API_KEY を設定する
make up                                   # docker compose up
```

`api` コンテナが `pnpm install && pnpm dev` を実行し、http://localhost:8787 で待ち受ける。

### 直接起動する

```sh
cd api
cp .dev.vars.example .dev.vars   # 初回のみ。ADMIN_SECRET と OPENAI_API_KEY を設定する
pnpm install
pnpm dev                         # http://localhost:8787
```

`ADMIN_SECRET` は 32 文字以上のランダムな値にする (例: `openssl rand -base64 48`)。
`OPENAI_API_KEY` はチャット (`/ws/normal_chat`) の回答生成に使う。未設定でもサーバーは起動するが、チャットは失敗する。

### DB と管理者の準備 (初回のみ)

```sh
pnpm db:migrate                    # ローカル D1 にマイグレーションを適用
pnpm admin:create you@example.com  # 管理者を作成 (パスワードは対話入力)
```

Compose で起動している場合は、`docker compose exec api` を付けて実行する。

起動後の確認:

- http://localhost:8787/health — `{ "status": "ok" }` が返ればサーバーが応答している
- http://localhost:8787/health/db — `{ "status": "ok" }` が返れば DB に接続できている
- http://localhost:8787/admin — 管理画面 (作成した管理者のメールアドレスでログイン)

## 主なコマンド

| コマンド                                               | 内容                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `pnpm dev`                                             | 開発サーバーを起動                                                         |
| `pnpm lint` / `pnpm lint:fix`                          | Biome によるチェック / 自動修正                                            |
| `pnpm type`                                            | 型チェック (先に `cf-typegen` を実行して型定義を作り直す)                  |
| `pnpm test` / `pnpm test:watch`                        | テストの実行 / 監視実行                                                    |
| `pnpm cf-typegen`                                      | `wrangler.jsonc` から型定義 (`worker-configuration.d.ts`) を生成           |
| `pnpm db:generate`                                     | スキーマからマイグレーションを生成                                         |
| `pnpm db:migrate` / `db:rollback` / `db:status`        | マイグレーションの適用 / 取り消し / 状態表示                               |
| `pnpm session:create <email> <label> [initialMessage]` | 既存ユーザーに ChatSession を作成                                          |
| `pnpm session:normal-chat <sessionUid> [メッセージ]`   | `/ws/normal_chat/<sessionUid>` に WebSocket でメッセージを送り、応答を表示 |
| `pnpm deploy`                                          | Cloudflare へデプロイ                                                      |
