import { env } from "cloudflare:workers"
import { parse } from "yaml"
import type { NewPromptTemplate, PromptTemplate } from "#db/schema/index.js"
import { getOrCreatePromptTemplate } from "#libs/queries/prompt-templates.js"

type Template = Record<string, unknown>
type Flow = Record<string, Record<string, Template>>

export type PromptTemplateStore = {
  get(
    flowName: string,
    nodeName: string,
    agentName: string,
  ): Promise<PromptTemplate | NewPromptTemplate>
}

// Workers ではファイルを読めないため、YAML の中身を受け取る
export function createPromptTemplateStore(
  yamlText: string,
): PromptTemplateStore {
  const templates: Record<string, Flow> = parse(yamlText)

  return {
    async get(flowName, nodeName, agentName) {
      const template = templates[flowName]?.[nodeName]?.[agentName]
      if (!template) {
        throw new Error(
          `プロンプトテンプレートがありません: ${flowName}.${nodeName}.${agentName}`,
        )
      }
      if (env.SAVE_PROMPT_TEMPLATE?.toLowerCase() === "true") {
        return getOrCreatePromptTemplate(
          flowName,
          nodeName,
          agentName,
          template,
        )
      }
      return { flowName, nodeName, agentName, template }
    },
  }
}
