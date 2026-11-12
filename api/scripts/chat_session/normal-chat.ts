// /ws/normal_chat/<sessionUid> にメッセージを 1 回送り、返ってきたメッセージを表示する。
// stop は回答ごとの終わりで、done ですべて終わるので、done を受け取ったら切断する。
// 使い方: pnpm session:normal-chat <sessionUid> [メッセージ]
// 接続先の基点は WS_URL で変更できる (既定: ws://localhost:8787/ws/normal_chat)

const TIMEOUT_MS = 60_000

const [sessionUid, message = "hello"] = process.argv.slice(2)
if (!sessionUid) {
  console.error("Usage: pnpm session:normal-chat <sessionUid> [message]")
  process.exit(1)
}

const baseUrl = process.env.WS_URL ?? "ws://localhost:8787/ws/normal_chat"
const url = `${baseUrl}/${encodeURIComponent(sessionUid)}`

const ws = new WebSocket(url)

// done が届かないままサーバーが黙った場合に終了できるようにする
const timer = setTimeout(() => {
  console.error(
    `タイムアウト: ${TIMEOUT_MS}ms 以内に done を受信できませんでした`,
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
  console.log(`recv: ${event.data}`)
  if (JSON.parse(String(event.data)).done) ws.close()
})

ws.addEventListener("close", (event) => {
  clearTimeout(timer)
  if (event.code !== 1000 && event.code !== 1005) {
    console.error(`closed: code=${event.code} reason=${event.reason}`)
    process.exitCode = 1
  }
})

ws.addEventListener("error", () => {
  console.error(`接続エラー: ${url}`)
  process.exitCode = 1
  clearTimeout(timer)
})
