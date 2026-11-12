import { ref } from "vue";
import { client } from "./client";

/** サーバーが送るメッセージ。形式は api/src/libs/websocket/sender.ts を参照 */
type ServerMessage =
  | {
      message: {
        agent: string;
        content: string;
        content_key: "message" | null;
        stop: true | null;
        cancel: boolean;
        options?: unknown;
      };
    }
  | { done: true };

export type ChatEntry = {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  /** 回答を受信中 */
  streaming?: boolean;
};

/** 初期メッセージはサーバーが会話履歴の先頭に入れるため、画面でも最初の回答として出す */
export function useChat(sessionUid: string, initialMessage: string | null) {
  const entries = ref<ChatEntry[]>(
    initialMessage ? [{ role: "assistant", content: initialMessage }] : [],
  );
  const sending = ref(false);
  const error = ref<string | null>(null);

  /** 1 接続で 1 つの質問を送り、done を受け取ったら閉じる */
  function send(text: string): void {
    if (sending.value) return;
    sending.value = true;
    error.value = null;
    entries.value.push({ role: "user", content: text });

    // 受信中の回答。stop で区切り、次の回答は新しい吹き出しにする
    let current: ChatEntry | null = null;
    let done = false;

    const ws = client.ws.normal_chat[":sessionUid"].$ws({
      param: { sessionUid },
    });

    ws.addEventListener("open", () => ws.send(text));

    ws.addEventListener("message", (event) => {
      const data: ServerMessage = JSON.parse(String(event.data));
      if ("done" in data) {
        done = true;
        ws.close();
        return;
      }
      const { message } = data;
      if (!current) {
        entries.value.push({
          role: "assistant",
          content: "",
          agent: message.agent,
          streaming: true,
        });
        // push した後の要素を取り直し、リアクティブな参照を書き換える
        current = entries.value[entries.value.length - 1] ?? null;
        if (!current) return;
      }
      current.content += message.content;
      if (message.stop) {
        current.streaming = false;
        current = null;
      }
    });

    ws.addEventListener("close", (event) => {
      if (current) current.streaming = false;
      sending.value = false;
      if (done) return;
      error.value ??=
        event.reason === "timeout"
          ? "タイムアウトしました"
          : `接続が切れました (code=${event.code})`;
    });

    ws.addEventListener("error", () => {
      error.value = "接続できませんでした (セッション UID を確認してください)";
    });
  }

  return { entries, sending, error, send };
}
