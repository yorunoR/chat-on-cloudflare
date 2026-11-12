import { waitUntil } from "cloudflare:workers"

/** 接続やリクエストの寿命から切り離して実行する。例外はログに出す */
export function runInBackground(
  fn: () => Promise<unknown>,
  { name }: { name: string },
): void {
  // Workers ではレスポンス後に処理が打ち切られるため、waitUntil でランタイムに完了を待たせる
  waitUntil(
    Promise.resolve()
      .then(fn)
      .then(
        () => {},
        (err) => console.error(`background task failed: ${name}`, err),
      ),
  )
}
