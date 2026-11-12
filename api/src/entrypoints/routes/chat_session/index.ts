import { Hono } from "hono"
import { postChatSession } from "#entrypoints/routes/chat_session/post-chat-session.js"

export const chatSessionRoute = new Hono().route("/", postChatSession)
