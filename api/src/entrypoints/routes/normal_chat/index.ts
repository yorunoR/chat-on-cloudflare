import { Hono } from "hono"
import { normalChat } from "#entrypoints/routes/normal_chat/normal-chat.js"

export const normalChatRoute = new Hono().route("/", normalChat)
