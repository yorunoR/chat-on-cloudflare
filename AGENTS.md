# AGENTS.md

## リポジトリ

- `api/`: Hono + Drizzle ORM + Cloudflare D1 の API サーバー (Cloudflare Workers)。構成は `api/docs/01_構成.md` から読む。
- `containers/`, `compose.yaml`, `Makefile`: 開発環境。

## 作業環境

- AI エージェントは `ai` コンテナ内で動き、`CLOUDFLARE_ENV=ai` が設定されている。wrangler やスクリプトの接続先はローカル D1 の `api_ai` で、人間用の `api_dev` には触れない。`CLOUDFLARE_ENV` を外したり上書きしたりしない。
- リモート (本番) の D1 に対する操作 (`--remote`)、`pnpm deploy`、`wrangler secret` は依頼されたときだけ行う。
- `api/` を変更したら `api/` で `pnpm lint` と `pnpm type` を通す。

## api/ の編集ルール

### Workers とスクリプトの分離

- `src/` は Workers で動く。`node:*` を import しない。`tsconfig.json` は Node の型を含めないので `pnpm type` で検出される。
- `scripts/` は Node.js (tsx) で動く運用スクリプト。D1 には `wrangler` の `getPlatformProxy()` で接続し、`createDB(env.DB)` でクライアントを作る。
- Workers とスクリプトの両方から使うモジュール (`src/db/client.ts`, `src/db/schema/`, `src/admin/password.ts` など) では `node:*` も `cloudflare:workers` も import しない。`cloudflare:workers` を使ってよいのは Workers 専用のモジュール (`src/db/index.ts`, `src/admin/index.ts` など) だけ。
- import パスには `.js` 拡張子を付ける (tsx で実行するスクリプトと共有するため)。
- `src/` 配下のモジュールは `package.json` の `imports` により `#db/index.js` のように `src/` 基準のパスで import できる。`../../../` のように階層をさかのぼる相対パスを書かずにこちらを使う。

### バインディング・環境変数

- バインディングやシークレットを追加したら `src/types.ts` の `Bindings` に型を足す (`c.env` と `cloudflare:workers` の `env` の両方に反映される)。
- D1 などのバインディングは `wrangler.jsonc` のデフォルトと `env.ai` の両方に追加する。
- ローカルで必要なシークレットは `.dev.vars.example` に説明付きで追記する。実際の値はコミットしない。

### DB

- テーブルは `src/db/schema/` に 1 ファイル 1 テーブルで定義し、`src/db/schema/index.ts` から export する。
- `created_at` / `updated_at` は `columns/timestamps.ts` の `timestamps` をスプレッドして付ける。
- 単純なクエリはルートなどの呼び出し側で `db` に直接書く。複雑なクエリや複数箇所で使うクエリだけ `src/libs/queries/` に置く。repository 層は作らない。
- マイグレーション (`pnpm db:generate` と `drizzle/down/` の SQL) は依頼されたときだけ作る。スキーマを変更しても自分からは生成しない。
- マイグレーションを作るときは、同名の down SQL を `drizzle/down/` に手書きで用意する (`pnpm db:rollback` が使う)。`drizzle/` 配下の生成物 (`*.sql`, `meta/`) は手で編集しない。

### ルーティング・管理画面

- ルートは `src/entrypoints/routes/<機能>/` に、エンドポイント 1 つにつき 1 ファイルで `Hono` インスタンスとして作り、`routes/<機能>/index.ts` で `.route()` をつないでまとめる。
- 機能の接頭辞は `src/index.ts` で付け、`routes` の `.route()` チェーンに追加する。RPC クライアント (`hc`) が型を拾えるよう、チェーンの型を `AppType` として export しているので、チェーンから外れた `app.get()` などでルートを足さない。
- 想定外のエラーは `src/index.ts` の `app.onError` がログに出して 500 を返す。ルート側で握りつぶさず、意図したエラーレスポンスは `HTTPException` で投げる。
- drizzle-admin はリクエストボディのサイズを制限しないので、`/admin/*` の前段の `bodyLimit` を外さない。
- 管理画面に出すテーブルは `src/admin/index.ts` で `admin.register()` する。drizzle-admin は値をハッシュ化しないので、パスワードなどは `hooks.beforeSave` で変換してから保存する。
- パスワードのハッシュは `src/admin/password.ts` を使う。Workers の PBKDF2 は 100,000 回が上限なので `ITERATIONS` を上げない。

## コメント

- コメントを詳しく書くより、変数名・関数名をわかりやすくすることを優先する。
- ひと目でわかるコードにはコメントを書かない (コードをなぞるだけの docstring・コメントも書かない)。
- コメントを書くのは、コードから読み取れない理由 (なぜそうしているか、意図的な例外など) だけにする。

## ドキュメント

- `api/` を変更したら `api/docs/` を確認し、必要なら同じ変更内で更新する。起動手順が変わったら `api/README.md` も更新する。
- `api/docs/` のファイル名は `01_構成.md` のように、読む順番の 2 桁番号 + `_` + 日本語名にする。

## コミット

- コミットメッセージは `changelog.config.js` (git-cz) の形式 `{emoji}{type}: {subject}` に従う (例: `🎸 feat: admin_users テーブル追加`)。subject は日本語で簡潔に書く。
