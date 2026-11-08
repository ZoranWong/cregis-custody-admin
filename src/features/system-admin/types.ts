// System Admin types — 系统管理类型定义

export type EmployeeStatus = 'all' | 'pending_activation' | 'active' | 'disabled' | 'expired'

export interface EmployeePageQuery {
  pageNum?: number
  pageSize?: number
  status?: EmployeeStatus
  searchQuery?: string
}

export interface EmployeeRowView {
  accountId: string
  displayName: string
  email: string
  activationStatus: 'pending' | 'completed' | 'expired'
  accountStatus: 'enabled' | 'disabled'
  roleCode: string
  lastSignInAt?: string
  authorizedDomainIds: string[]
  defaultEntryId: string
}

export interface EmployeeCreateInput {
  displayName: string
  email: string
  initialRoleCode: string
  authorizedDomainIds: string[]
  defaultEntryId: string
}

// ─── Role & Review Flow types (Team Management — Roles Tab) ───

/** 复核流步骤 */
export interface ReviewFlowStep {
  stepNo: number
  roleCode: string
  roleName?: string
  assigneeUserId: number
  assigneeName: string
  assigneeEmail: string
  assigneeStatus: 'enabled' | 'disabled'
}

/** 三级复核流 */
export interface ReviewFlowView {
  severity: 'ROUTINE' | 'MEDIUM' | 'CRITICAL'
  flowName: string
  timeoutMinutes: number
  timeoutAction: 'AUTO_RESOLVE' | 'ESCALATE'
  status: string
  description?: string
  steps: ReviewFlowStep[]
}

/** 复核流步骤（保存请求） */
export interface ReviewFlowStepRequest {
  stepNo: number
  roleCode: string
  assigneeUserId: number
}

/** 复核流保存请求 */
export interface ReviewFlowUpdateRequest {
  timeoutMinutes?: number
  timeoutAction?: string
  steps?: ReviewFlowStepRequest[]
}

/** 复核人（用于 /system/review-flow/{severity}/reviewers） */
export interface ReviewFlowApprover {
  sortNo: number
  userId: number
  name: string
  email: string
  accountStatus: 'enabled' | 'disabled'
}

/** 某等级复核人列表 */
export interface ReviewFlowApproversVO {
  severity: string
  approvers: ReviewFlowApprover[]
}

/** 某等级的复核人绑定请求 */
export interface ReviewerLevelBindRequest {
  userIds: number[]
}

/** 角色成员 */
export interface RoleMemberView {
  userId: number
  username: string
  displayName: string
  email: string
  accountStatus: 'enabled' | 'disabled'
  roleCode: string
}

/** 角色总览：一个角色及其成员 */
export interface RoleOverviewView {
  id: number
  roleCode: string
  roleName: string
  users: RoleMemberView[]
  /** 复核角色（COMPLIANCE_REVIEWER）按 ROUTINE/MEDIUM/CRITICAL 分组；普通角色为 null */
  levels: Record<string, ReviewFlowApprover[]> | null
}

/** 批量调整角色成员请求 */
export interface RoleUserBatchRequest {
  addUserIds: number[]
  removeUserIds: number[]
}

export interface SystemMonitorMetric {
  key: string
  label: string
  value: number
  trend: number
  unit: string
}

export interface SystemMonitorServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
}

export interface SystemMonitorResponse {
  metrics: SystemMonitorMetric[]
  services: SystemMonitorServiceStatus[]
}
