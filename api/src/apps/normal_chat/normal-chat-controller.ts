import type { ChatSession } from "#db/schema/index.js"
import { runInBackground } from "#libs/tasks/background-task.js"
import { sendDone, type WsSender } from "#libs/websocket/sender.js"
import type { FlowData } from "./flows/flow-data.js"
import { NormalChatFlow } from "./flows/normal-chat-flow.js"

/** 回答はノードが ws に送る。ws が null のときは送らずに回答だけを返す */
export async function runNormalChat(
  ws: WsSender | null,
  chatSession: ChatSession,
  text: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<string> {
  console.log(`normal_chat start: session=${chatSession.uid}`)
  try {
    const flow = await NormalChatFlow.create({ ws, chatSession, signal })
    const flowData = await flow.run(text)
    // 後処理でクライアントを待たせず、接続のタイムアウトで止められないよう切り離す
    // done より先に登録し、done の送信に失敗 (切断) しても後処理は行う
    runInBackground(() => postProcess(chatSession, flowData), {
      name: `normal_chat post_process: session=${chatSession.uid}`,
    })
    // 保存は run の中で終わっているので、done を受けたクライアントがすぐ次の質問を送っても履歴に入っている
    sendDone(ws)
    return flowData.content
  } finally {
    console.log(`normal_chat end: session=${chatSession.uid}`)
  }
}

/** flow が終わった後の処理 (ログなど)。例外は runInBackground がログに出す */
async function postProcess(
  _chatSession: ChatSession,
  _flowData: FlowData,
): Promise<void> {
  // TODO: ログなどの後処理を書く
}
