import { Hono } from "hono"
import { getHealth } from "#entrypoints/routes/health/get-health.js"
import { getHealthDb } from "#entrypoints/routes/health/get-health-db.js"

export const healthRoute = new Hono()
  .route("/", getHealth)
  .route("/", getHealthDb)
