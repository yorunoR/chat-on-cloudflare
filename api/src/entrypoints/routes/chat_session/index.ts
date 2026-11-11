import { Hono } from "hono"
import { postChatSession } from "./post-chat-session.js"

export const chatSessionRoute = new Hono().route("/", postChatSession)
