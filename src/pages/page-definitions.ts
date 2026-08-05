export type FeaturePageDefinition = {
  slug: string
  title: string
  description: string
  details: string
}

export const featurePages: FeaturePageDefinition[] = [
  {
    slug: "smart-monitoring",
    title: "智能监盘",
    description: "集中查看平台运行状态与关键指标。",
    details: "后续可在这里接入实时监控、异常提醒和趋势概览。",
  },
  {
    slug: "smart-operations",
    title: "智能运维",
    description: "统一管理日常运维任务和自动化流程。",
    details: "后续可在这里配置巡检、告警处理和任务编排。",
  },
  {
    slug: "data-analysis",
    title: "数据分析",
    description: "对业务数据进行整理、分析与可视化。",
    details: "后续可在这里增加分析报表、筛选器和数据洞察。",
  },
  {
    slug: "knowledge-base",
    title: "知识库",
    description: "沉淀和检索团队共享的知识内容。",
    details: "后续可在这里接入文档管理、标签和语义检索。",
  },
  {
    slug: "agent-team",
    title: "Agent团队",
    description: "查看和管理协作中的智能 Agent。",
    details: "后续可在这里配置 Agent、角色、权限与协作关系。",
  },
  {
    slug: "project-documents",
    title: "项目文档",
    description: "集中管理项目相关文档和资料。",
    details: "后续可在这里增加上传、版本管理和文档协作。",
  },
  {
    slug: "database",
    title: "数据库",
    description: "管理平台可用的数据源和数据库连接。",
    details: "后续可在这里配置连接、查看状态和管理数据权限。",
  },
  {
    slug: "operations-reports",
    title: "运维报告",
    description: "查看系统运行和运维工作的阶段性报告。",
    details: "后续可在这里生成、导出和定时发送运维报告。",
  },
  {
    slug: "settings",
    title: "Settings",
    description: "管理平台偏好设置与访问权限。",
    details: "后续可在这里配置个人偏好、通知和团队权限。",
  },
  {
    slug: "search",
    title: "Search",
    description: "快速查找平台中的项目、文档和知识内容。",
    details: "后续可在这里接入全局搜索和智能检索能力。",
  },
]

export function getFeaturePage(slug: string) {
  return featurePages.find((page) => page.slug === slug)
}
