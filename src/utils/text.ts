const UI_TEXT_MAP = Object.freeze<Record<string, string>>({
  新提交: 'New',
  已激活: 'Active',
  待补件: 'Supplements',
  队列流入: 'Queue inflow',
  审核触达: 'Review touched',
  已决策: 'Decisioned',
  待审核: 'Pending review',
  审核中: 'Under review',
  人工复核: 'Manual review',
  待决策: 'Decision due',
  已通过: 'Approved',
  已拒绝: 'Rejected',
  已关闭: 'Closed',
  已分派: 'Assigned',
  未分派: 'Unassigned',
  已查看: 'Viewed',
  未查看: 'Unviewed',
  高优先级: 'High',
  中优先级: 'Medium',
  低优先级: 'Low',
  '近 SLA': 'Near SLA',
  超时: 'Overdue',
  正常: 'On track',
  运营: 'Operations',
  合规: 'Compliance',
  风控: 'Risk',
  审计: 'Audit',
  系统管理员: 'System Admin'
})

const UI_TEXT_REPLACEMENTS: Array<[string, string]> = [
  ['待补件', 'Supplements'],
  ['待审核', 'Pending review'],
  ['审核中', 'Under review'],
  ['人工复核', 'Manual review'],
  ['待决策', 'Decision due'],
  ['已分派', 'Assigned'],
  ['未分派', 'Unassigned'],
  ['已查看', 'Viewed'],
  ['未查看', 'Unviewed'],
  ['近 SLA', 'Near SLA'],
  ['超时', 'Overdue'],
  ['正常', 'On track']
]

export function translateUiText(value: string | undefined | null): string {
  if (value == null || value === '') {
    return value ?? ''
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }
  if (trimmed in UI_TEXT_MAP) {
    return UI_TEXT_MAP[trimmed]
  }
  return UI_TEXT_REPLACEMENTS.reduce(
    (output, [source, target]) => output.split(source).join(target),
    value
  )
}
