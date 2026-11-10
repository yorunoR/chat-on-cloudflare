// /ws/normal_chat にメッセージを 1 回送り、返ってきたエコーを表示する。
// サーバーは 1 回の送信に 3 回エコーを返すので、3 件受け取ったら切断する。
// 使い方: pnpm ws:normal-chat [メッセージ]
// 接続先は WS_URL で変更できる (既定: ws://localhost:8787/ws/normal_chat)

const EXPECTED_COUNT = 3
const TIMEOUT_MS = 5000

const url = process.env.WS_URL ?? "ws://localhost:8787/ws/normal_chat"
const message = process.argv[2] ?? "hello"

const ws = new WebSocket(url)
let received = 0

// 3 件届かないままサーバーが黙った場合に終了できるようにする
const timer = setTimeout(() => {
  console.error(
    `タイムアウト: ${TIMEOUT_MS}ms 以内に ${EXPECTED_COUNT} 件受信できませんでした (${received} 件受信)`,
  )
  process.exitCode = 1
  ws.close()
}, TIMEOUT_MS)

ws.addEventListener("open", () => {
  console.log(`connected: ${url}`)
  console.log(`send: ${message}`)
  ws.send(message)
})

ws.addEventListener("message", (event) => {
  received++
  console.log(`recv ${received}: ${event.data}`)
  if (received >= EXPECTED_COUNT) ws.close()
})

ws.addEventListener("close", () => {
  clearTimeout(timer)
})

ws.addEventListener("error", () => {
  console.error(`接続エラー: ${url}`)
  process.exitCode = 1
  clearTimeout(timer)
})
