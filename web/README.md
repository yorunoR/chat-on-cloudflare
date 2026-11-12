# web

`api/` の API サーバーと会話する Vue のフロントエンドです。

## 起動方法

環境変数の設定とコンテナの起動は、リポジトリルートの [README.md](../README.md) を参照してください。`web` コンテナが起動すると http://localhost:5173 で開けます。

## 使い方

最初にログイン画面でユーザー UID (`users.uid`) を入力します。`pnpm session:create` で作ったユーザーは `uid` が空なので、管理画面 (http://localhost:3000/admin) の users で設定してください。

- ログインは入力した UID をブラウザ (localStorage) に保存するだけで、その場では確かめません。API に UID を確かめるエンドポイントがないためです。セッションの作成で API が 401 を返したら、ログアウトしてログイン画面に戻します。
- ログイン後は、新しいセッションを作って会話を始めます。API に会話履歴を取得するエンドポイントがなく、既存のセッションを開いても過去のやりとりを表示できないため、既存のセッションに入る画面は用意していません。

## API との通信

- `hono/client` の `hc` に `api/` の `AppType` を渡し、パスと入力の型をサーバーと共有しています (`src/lib/client.ts`)。
- 型は `api/` の `pnpm dev` (`watch:types`) が `api/rpc-types/` に出力する `.d.ts` を参照します。`api/rpc-types/` は git 管理外のため、`api` コンテナを一度起動するか、`api/` で `pnpm build:types` を実行するまで `pnpm type` は通りません。
- `web` コンテナには `api/` を読み取り専用でマウントし、リポジトリと同じく `web/` と `api/` を並べています。`web/` からの相対パスで型を import するためです。
- `api/rpc-types/` の型は `hono` を import します。`tsconfig.json` の `paths` で `web/node_modules/hono` に解決させ、`api/node_modules` がなくても型が解決でき、`hc` と同じ `hono` の型を使うようにしています。`api/` と `web/` の `hono` のバージョンは揃えてください。
- API サーバーは CORS に対応していないため、Vite の開発サーバーが `/api` と `/ws` を API サーバー (`API_URL`) へ中継し、ブラウザからは同一オリジンで通信します。
- チャットは 1 つの質問ごとに WebSocket を開き、`done` を受け取ったら閉じます。メッセージの形式は [api/docs/01_構成.md](../api/docs/01_構成.md#チャットの-websocket-通信) を参照してください。

## パッケージ管理

`api/` と同じく、`.npmrc` と `pnpm-workspace.yaml` でサプライチェーン攻撃対策をしています (理由は [api/docs/02_開発環境.md](../api/docs/02_開発環境.md#パッケージ管理-サプライチェーン攻撃対策) を参照)。

## Lint

Biome は `.vue` のテンプレートを解析しないため、`<script setup>` でテンプレートからだけ使う変数・import が未使用と判定されます。`biome.jsonc` で `.vue` に限りこの 2 つのルールを無効にしています。
