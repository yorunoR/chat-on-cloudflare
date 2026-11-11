import { and, eq } from "drizzle-orm"
import { db as executor } from "#db/index.js"
import { type PromptTemplate, promptTemplates } from "#db/schema/index.js"

/** 同じ内容のテンプレートがあればそれを返し、なければ作成して返す */
export async function getOrCreatePromptTemplate(
  flowName: string,
  nodeName: string,
  agentName: string,
  template: Record<string, unknown>,
  db = executor,
): Promise<PromptTemplate> {
  const hexdigest = await dictChecksum(template)
  const [existing] = await db
    .select()
    .from(promptTemplates)
    .where(
      and(
        eq(promptTemplates.hexdigest, hexdigest),
        eq(promptTemplates.flowName, flowName),
        eq(promptTemplates.nodeName, nodeName),
        eq(promptTemplates.agentName, agentName),
      ),
    )
    .limit(1)
  if (existing) return existing

  const [created] = await db
    .insert(promptTemplates)
    .values({ hexdigest, flowName, nodeName, agentName, template })
    .returning()
  if (!created) throw new Error("プロンプトテンプレートを作成できませんでした")
  return created
}

// Workers では node:crypto を使えないため Web Crypto で計算する (そのため async)
export async function dictChecksum(
  d: Record<string, unknown>,
  algorithm = "SHA-256",
  ensureAscii = true,
): Promise<string> {
  let json = JSON.stringify(sortKeys(d))
  if (ensureAscii) {
    json = json.replace(
      /[\u007f-￿]/g,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
    )
  }
  const digest = await crypto.subtle.digest(
    algorithm,
    new TextEncoder().encode(json),
  )
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}
