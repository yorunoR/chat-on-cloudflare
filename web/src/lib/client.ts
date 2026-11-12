import { hc } from "hono/client";
import type { AppType } from "../../../api/rpc-types/entrypoints/app";

// 開発サーバーが /api と /ws を API サーバーへ中継するため、同一オリジンに送る
export const client = hc<AppType>(window.location.origin);
