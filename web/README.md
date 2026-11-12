# web

`api/` の API サーバーと会話する Vue のフロントエンドです。

## 起動方法

環境変数の設定とコンテナの起動は、リポジトリルートの [README.md](../README.md) を参照してください。`web` コンテナが起動すると http://localhost:5173 で開けます。

## 使い方

最初にログイン画面でユーザー UID (`users.uid`) を入力します。`pnpm session:create` で作ったユーザーは `uid` が空なので、管理画面 (http://localhost:8787/admin) の users で設定してください。

- ログインは入力した UID をブラウザ (localStorage) に保存するだけで、その場では確かめません。API に UID を確かめるエンドポイントがないためです。セッションの作成で API が 401 を返したら、ログアウトしてログイン画面に戻します。
- ログイン後は、新しいセッションを作って会話を始めます。API に会話履歴を取得するエンドポイントがなく、既存のセッションを開いても過去のやりとりを表示できないため、既存のセッションに入る画面は用意していません。

## API との通信

- `hono/client` の `hc` に `api/` の `AppType` を渡し、パスと入力の型をサーバーと共有しています (`src/lib/client.ts`)。
- 型は `api/` の `pnpm dev` (`watch:types`) が `api/rpc-types/` に出力する `.d.ts` を参照します。`api/rpc-types/` は git 管理外のため、`api` コンテナを一度起動するか、`api/` で `pnpm build:types` を実行するまで `pnpm type` は通りません。
- `web` コンテナには `api/` を読み取り専用でマウントし、リポジトリと同じく `web/` と `api/` を並べています。`web/` からの相対パスで型を import するためです。
- `api/rpc-types/` の型は `hono` を import します。`tsconfig.json` の `paths` で `web/node_modules/hono` に解決させ、`api/node_modules` がなくても型が解決でき、`hc` と同じ `hono` の型を使うようにしています。`api/` と `web/` の `hono` のバージョンは揃えてください。
- `api/rpc-types/` の型は `#types.js` などの `#` 始まりのパスも import します。そのままだと `api/package.json` の `imports` で `api/src/` のソースに解決され、`web/` にない Workers の型 (`D1Database` など) が必要になります。`tsconfig.json` の `paths` で `#*` を `api/rpc-types/` の `.d.ts` に向け、`skipLibCheck` でチェックの対象から外しています。
- API サーバーは CORS に対応していないため、Vite の開発サーバーが `/api` と `/ws` を API サーバー (`API_URL`) へ中継し、ブラウザからは同一オリジンで通信します。
- チャットは 1 つの質問ごとに WebSocket を開き、`done` を受け取ったら閉じます。メッセージの形式は [api/docs/02_チャットアプリ.md](../api/docs/02_チャットアプリ.md#websocket-で送るメッセージ) を参照してください。

## コマンド

`web/` で実行します (`web` コンテナでは `docker compose exec web <コマンド>`)。

| コマンド                      | 内容                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                    | Vite の開発サーバーを起動 (http://localhost:5173)          |
| `pnpm build`                  | 型チェックしてから `dist/` にビルド                        |
| `pnpm preview`                | ビルドした `dist/` を配信                                  |
| `pnpm lint` / `pnpm lint:fix` | Biome によるチェック / 自動修正                            |
| `pnpm type`                   | `vue-tsc` による型チェック (`api/rpc-types/` が必要。前述) |

開発サーバーの中継先は環境変数 `API_URL` で指定します。`web` コンテナでは `compose.yaml` で `http://api:8787` を設定しています。

## パッケージ管理

`api/` と同じく、サプライチェーン攻撃対策として次の設定をしています。

- `.npmrc`: レジストリを `https://npm.flatt.tech/` にしています。
- `pnpm-workspace.yaml`: `minimumReleaseAge` で、公開から 7 日 (10080 分) 経っていないバージョンをインストールしません。`onlyBuiltDependencies` / `allowBuilds` で、インストール時のビルドスクリプトを `esbuild` だけに許可しています。

## Lint

Biome は `.vue` のテンプレートを解析しないため、`<script setup>` でテンプレートからだけ使う変数・import が未使用と判定されます。`biome.jsonc` で `.vue` に限りこの 2 つのルールを無効にしています。
