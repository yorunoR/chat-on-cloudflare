import { env } from "cloudflare:workers"
import { parse } from "yaml"
import type { NewPromptTemplate, PromptTemplate } from "#db/schema/index.js"
import { getOrCreatePromptTemplate } from "#libs/queries/prompt-templates.js"

type Template = Record<string, unknown>
type Flow = Record<string, Record<string, Template>>

// 全アプリの prompt_templates.yaml をまとめて持つ。キーは flowName
const promptTemplateStore: Record<string, Flow> = {}

// Workers ではファイルを読めないため、YAML の中身を受け取る
export function setStore(yamlText: string): void {
  const templates: Record<string, Flow> = parse(yamlText)
  // 別のアプリと flowName が重なると上書きされるため、エラーにする
  const duplicated = Object.keys(templates)
    .filter((flowName) => flowName in promptTemplateStore)
    .sort()
  if (duplicated.length > 0) {
    throw new Error(`flow_name が重複しています: ${duplicated.join(", ")}`)
  }
  Object.assign(promptTemplateStore, templates)
}

export function getTemplate(
  flowName: string,
  nodeName: string,
  agentName: string,
): Template {
  const template = promptTemplateStore[flowName]?.[nodeName]?.[agentName]
  if (!template) {
    throw new Error(
      `プロンプトテンプレートがありません: ${flowName}.${nodeName}.${agentName}`,
    )
  }
  return template
}

export async function getPromptTemplate(
  flowName: string,
  nodeName: string,
  agentName: string,
): Promise<PromptTemplate | NewPromptTemplate> {
  const template = getTemplate(flowName, nodeName, agentName)
  if (env.SAVE_PROMPT_TEMPLATE?.toLowerCase() === "true") {
    return getOrCreatePromptTemplate(flowName, nodeName, agentName, template)
  }
  return { flowName, nodeName, agentName, template }
}
