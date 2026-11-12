import { client } from "./client";

export class UnauthorizedError extends Error {}

// このフロントエンドから作ったセッションだと分かるようにする
const LABEL = "web";

export type ChatSessionInput = {
  userUid: string;
  initialMessage: string | null;
};

/** チャットセッションを作成し、その uid を返す。uid はクライアントが採番する */
export async function createChatSession({
  userUid,
  initialMessage,
}: ChatSessionInput): Promise<string> {
  const uid = crypto.randomUUID();
  const res = await client.api.chat_session.$post(
    { json: { uid, label: LABEL, initialMessage } },
    { headers: { Authorization: `Bearer ${userUid}` } },
  );
  if (res.status === 204) return uid;
  // 401 はミドルウェアの例外で返るため、ルートの型には含まれない
  if ((res.status as number) === 401)
    throw new UnauthorizedError("ユーザー UID が正しくありません");
  throw new Error(`セッションを作成できませんでした (${res.status})`);
}
