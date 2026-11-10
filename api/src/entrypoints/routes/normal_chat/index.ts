import { Hono } from "hono"
import { normalChat } from "./normal-chat.js"

export const normalChatRoute = new Hono().route("/", normalChat)
