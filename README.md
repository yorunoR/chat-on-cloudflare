# chat-on-cloudflare

Cloudflare Workers 上で動くチャットサービスです。
API サーバーは [Hono](https://hono.dev/) + [Drizzle ORM](https://orm.drizzle.team/) + Cloudflare D1 (SQLite)、フロントエンドは Vue + Vite で構成しています。

- `api/`: API サーバー。詳細は [api/README.md](./api/README.md) と [api/docs/](./api/docs/01_構成.md) を参照してください。
- `web/`: API サーバーと会話するフロントエンド。詳細は [web/README.md](./web/README.md) を参照してください。
- `chat-on-hono/`: 参照用のリポジトリ (git サブモジュール)。
- `containers/`, `compose.yaml`, `Makefile`: Docker Compose による開発環境。

開発環境は `api` (API サーバー)、`web` (フロントエンドの開発サーバー)、`ai` (AI エージェント作業用) の 3 つのコンテナで構成されます。
AI エージェントは `ai` コンテナ内で動き、専用のローカル D1 (`api_ai`) にのみ接続します。

## 起動方法

以下はリポジトリルートで実行します。

### 1. 設定ファイルを用意する (初回のみ)

```sh
cp .env.api.local.sample .env.api.local
cp .env.ai.local.sample .env.ai.local    # ANTHROPIC_API_KEY を設定する
cp api/.dev.vars.example api/.dev.vars   # ADMIN_SECRET を設定する
```

`ADMIN_SECRET` は 32 文字以上のランダムな値にします (例: `openssl rand -base64 48`)。

### 2. コンテナを起動する

```sh
make up
```

`api` コンテナと `web` コンテナがそれぞれ `pnpm install && pnpm dev` を実行します。

- `api`: http://localhost:8787 で待ち受けます。あわせて RPC 用の型を `api/rpc-types/` に出力します。
- `web`: http://localhost:5173 で待ち受けます。`/api` と `/ws` へのリクエストは `api` コンテナへ中継します。

### 3. DB と管理者を準備する (初回のみ)

別のターミナルで実行します。

```sh
docker compose exec api pnpm db:migrate                    # ローカル D1 にマイグレーションを適用
docker compose exec api pnpm admin:create you@example.com  # 管理者を作成 (パスワードは対話入力)
```

### 4. 動作を確認する

- http://localhost:8787/health/db — `{ "status": "ok" }` が返れば DB に接続できている
- http://localhost:8787/admin — 管理画面 (作成した管理者のメールアドレスでログイン)
- `docker compose exec api pnpm session:normal-chat <sessionUid>` — WebSocket (`/ws/normal_chat`) の送受信を確認
- http://localhost:5173 — フロントエンド (ログインにはユーザーの `users.uid` を使う。[web/README.md](./web/README.md#使い方) を参照)

## make コマンド

| コマンド     | 内容                                        |
| ------------ | ------------------------------------------- |
| `make up`    | コンテナを起動 (`docker compose up`)        |
| `make b`     | `ai` コンテナに bash で入る                 |
| `make cl`    | `ai` コンテナで Claude Code を起動          |
| `make cx`    | `ai` コンテナで Codex を起動                |
| `make stop`  | コンテナを停止                              |
| `make down`  | コンテナを停止して削除                      |
| `make build` | イメージをビルド                            |
