import { Hono } from "hono"
import { getHealth } from "./get-health.js"
import { getHealthDb } from "./get-health-db.js"

export const healthRoute = new Hono()
  .route("/", getHealth)
  .route("/", getHealthDb)
