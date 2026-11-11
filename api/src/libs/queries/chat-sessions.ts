import { asc, eq } from "drizzle-orm"
import { db as executor } from "#db/index.js"
import {
  type ChatMessage,
  type ChatSession,
  chatMessages,
} from "#db/schema/index.js"

export type HistoryEntry = {
  role: "user" | "assistant"
  content: string
}

/** セッションの会話履歴を、初期メッセージを先頭にして古い順で返す */
export async function getHistory(
  chatSession: ChatSession,
  db = executor,
): Promise<HistoryEntry[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatSessionId, chatSession.id))
    .orderBy(asc(chatMessages.id))

  const history: HistoryEntry[] = []
  if (chatSession.initialMessage) {
    history.push({ role: "assistant", content: chatSession.initialMessage })
  }
  for (const row of rows) {
    history.push({ role: "user", content: row.question })
    history.push({ role: "assistant", content: row.answer })
  }
  return history
}

/** 質問と回答の組をセッションに追加する */
export async function appendQaToSession(
  chatSession: ChatSession,
  question: string,
  answer: string,
  db = executor,
): Promise<ChatMessage> {
  const [chatMessage] = await db
    .insert(chatMessages)
    .values({
      userId: chatSession.userId,
      chatSessionId: chatSession.id,
      question,
      answer,
    })
    .returning()
  if (!chatMessage) throw new Error("メッセージを作成できませんでした")
  return chatMessage
}
