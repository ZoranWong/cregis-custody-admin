// v2 API — System Admin (系统管理)
// 使用 fetch 封装（apiRequest），走 /admin 代理到真实后端
// 参考: cregis-custody-manager/docs/cregis-custody-new/frontend/admin/src/api/employeeAccess.ts
import { apiRequest } from '@/utils/http/request'
import type {
  EmployeePageQuery,
  EmployeeRowView,
  EmployeeCreateInput,
  SystemMonitorResponse,
  RoleOverviewView,
  ReviewFlowView,
  ReviewFlowUpdateRequest,
  ReviewFlowApproversVO,
  ReviewerLevelBindRequest,
  RoleUserBatchRequest,
  RoleMemberView,
  ReviewFlowApprover,
  ReviewFlowStep
} from '@/features/system-admin/types'
import type {
  EmployeeAccessBindingView,
  AccessReviewApplyResult,
  AuthorizedDomainId
} from '@/types/models'

// 员工管理 API

export interface EmployeePageResponse {
  records: EmployeeRowView[]
  pagination: { page: number; pageSize: number; totalPages: number; totalCount: number }
}

// ---- 查询请求构建（参考 employeeAccess.ts buildStaffPageQuery） ----

interface StaffPageQueryEnvelope {
  pageIndex: number
  pageSize: number
  queryList: Array<{
    key: string
    oper: ':' | '='
    value: string
    join: 'and'
  }>
}

function mapToolbarStatusToBackendState(status: EmployeePageQuery['status']): string | undefined {
  switch (status) {
    case 'pending_activation':
      return 'PENDING_FIRST_ACTIVATION'
    case 'active':
      return 'LOGIN_ENABLED'
    case 'disabled':
      return 'LOGIN_DISABLED'
    default:
      return undefined
  }
}

function buildStaffPageQuery(query: EmployeePageQuery): StaffPageQueryEnvelope {
  const queryList: StaffPageQueryEnvelope['queryList'] = []
  if (query.searchQuery && query.searchQuery.trim()) {
    const keyword = query.searchQuery.trim()
    queryList.push(
      { key: 'username', oper: ':', value: keyword, join: 'and' },
      { key: 'email', oper: ':', value: keyword, join: 'and' }
    )
  }
  const mappedState = mapToolbarStatusToBackendState(query.status)
  if (mappedState) {
    queryList.push({ key: 'state', oper: '=', value: mappedState, join: 'and' })
  }
  return {
    pageIndex: query.pageNum || 1,
    pageSize: query.pageSize || 20,
    queryList
  }
}

// ---- 响应数据规范化（参考 employeeAccess.ts normalizeEmployeeRow 等） ----

function normalizeEmployeeRow(raw: Record<string, unknown>): EmployeeRowView {
  return {
    accountId: String(readPrimitive(raw, 'account_id') || readPrimitive(raw, 'id') || ''),
    displayName:
      readString(raw, 'display_name') ||
      readString(raw, 'name') ||
      readString(raw, 'username') ||
      'Internal employee',
    email: readRequiredString(raw, 'email'),
    activationStatus: normalizeActivationStatus(readString(raw, 'activation_status')),
    accountStatus: normalizeAccountStatus(readString(raw, 'account_status')),
    initialRole: readString(raw, 'initial_role') || readString(raw, 'role'),
    roleCode: readString(raw, 'role_code') || readString(raw, 'initial_role'),
    authorizedDomainIds: readDomainIds(raw, 'authorized_domain_ids'),
    defaultEntryId: normalizeDomainId(readString(raw, 'default_entry_id')),
    lastSignIn: readString(raw, 'last_sign_in'),
    availableActions: readStringArray(raw, 'available_actions')
  }
}

function normalizeActivationStatus(value?: string | null): EmployeeRowView['activationStatus'] {
  if (value === 'pending_activation' || value === 'expired_activation') return value
  return 'activated'
}

function normalizeAccountStatus(value?: string | null): EmployeeRowView['accountStatus'] {
  return value === 'disabled' ? 'disabled' : 'enabled'
}

function normalizeDomainId(value?: string | null): AuthorizedDomainId | null {
  const valid: AuthorizedDomainId[] = ['operations', 'risk', 'compliance', 'system_administration']
  return valid.includes(value as AuthorizedDomainId) ? (value as AuthorizedDomainId) : null
}

// ---- 低级读取辅助（参考 employeeAccess.ts） ----

function readString(raw: Record<string, unknown>, key: string): string | null {
  return typeof raw[key] === 'string' ? (raw[key] as string) : null
}

function readRequiredString(raw: Record<string, unknown>, key: string): string {
  const value = readString(raw, key)
  if (value == null) throw new Error(`FND-004 contract error: missing ${key}.`)
  return value
}

function readPrimitive(raw: Record<string, unknown>, key: string): number | string | null {
  const value = raw[key]
  if (typeof value === 'number' || typeof value === 'string') return value
  return null
}

function readStringArray(raw: Record<string, unknown>, key: string): string[] {
  const value = raw[key]
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function readDomainIds(raw: Record<string, unknown>, key: string): AuthorizedDomainId[] {
  const values = raw[key]
  if (!Array.isArray(values)) return []
  return values
    .map((v) => normalizeDomainId(typeof v === 'string' ? v : null))
    .filter(Boolean) as AuthorizedDomainId[]
}

function readNumber(raw: Record<string, unknown>, key: string, fallback: number): number {
  const value = raw[key]
  return typeof value === 'number' ? value : fallback
}

// ---- 导出 API 函数（参考 employeeAccess.ts） ----

export async function fetchEmployees(query: EmployeePageQuery): Promise<EmployeePageResponse> {
  const raw = (await apiRequest('/system/staff/page', {
    method: 'POST',
    body: buildStaffPageQuery(query)
  })) as Record<string, unknown>
  const records = Array.isArray(raw.records)
    ? (raw.records as Record<string, unknown>[]).map(normalizeEmployeeRow)
    : []
  const pageSize = readNumber(raw, 'size', query.pageSize || 20)
  const total = readNumber(raw, 'total', records.length)
  return {
    records,
    pagination: {
      page: readNumber(raw, 'current', query.pageNum || 1),
      pageSize,
      totalPages: readNumber(
        raw,
        'pages',
        pageSize > 0 ? Math.max(Math.ceil(total / pageSize), 1) : 1
      ),
      totalCount: total
    }
  }
}

export async function createEmployee(input: EmployeeCreateInput): Promise<{ accountId: string }> {
  const raw = (await apiRequest('/system/staff/add', {
    method: 'POST',
    body: {
      display_name: input.displayName,
      email: input.email,
      initial_role_code: input.initialRoleCode,
      authorized_domain_ids: input.authorizedDomainIds,
      default_entry_id: input.defaultEntryId
    }
  })) as Record<string, unknown>
  return {
    accountId: String(readPrimitive(raw, 'account_id') || '')
  }
}

export async function enableEmployee(accountId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(accountId)}/enable`, {
    method: 'POST',
    body: {}
  })
}

export async function disableEmployee(accountId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(accountId)}/disable`, {
    method: 'POST',
    body: {}
  })
}

export async function resetEmployeePassword(
  accountId: string,
  tempPassword: string
): Promise<void> {
  await apiRequest('/system/staff/set/password', {
    method: 'POST',
    body: {
      user_id: accountId,
      temporary_password: tempPassword
    }
  })
}

export async function reissueEmployeeActivation(accountId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(accountId)}/activation/reissue`, {
    method: 'POST',
    body: {}
  })
}

export async function fetchSystemMonitor(): Promise<SystemMonitorResponse> {
  return (await apiRequest('/system/monitor')) as SystemMonitorResponse
}

// 获取员工列表（用于下拉选择等场景）
export async function fetchEmployeeList(): Promise<EmployeeAccessBindingView[]> {
  const raw = (await apiRequest('/system/staff/list')) as Record<string, unknown>[]
  return Array.isArray(raw) ? raw.map(normalizeEmployeeBinding) : []
}

// 申请访问权限审查
export async function applyAccessReview(
  binding: EmployeeAccessBindingView
): Promise<AccessReviewApplyResult> {
  const raw = (await apiRequest('/system/permission-change/apply', {
    method: 'POST',
    body: {
      changeType: 'USER_ROLE',
      userEmail: binding.email,
      roleCode: binding.roleCode || 'SYSTEM_STAFF',
      authorizedDomainIds: binding.authorizedDomainIds,
      defaultEntryId: binding.defaultEntryId
    }
  })) as Record<string, unknown>
  return {
    reviewRequestId: readPrimitive(raw, 'review_request_id') || null,
    reviewState: readString(raw, 'review_state')
  }
}

// ---- 员工绑定视图规范化 ----

function normalizeEmployeeBinding(raw: Record<string, unknown>): EmployeeAccessBindingView {
  return {
    accountId: readPrimitive(raw, 'account_id') || readPrimitive(raw, 'id') || '',
    displayName:
      readString(raw, 'display_name') ||
      readString(raw, 'name') ||
      readString(raw, 'username') ||
      'Internal employee',
    email: readRequiredString(raw, 'email'),
    roleCode: readString(raw, 'role_code'),
    authorizedDomainIds: readDomainIds(raw, 'authorized_domain_ids'),
    defaultEntryId: normalizeDomainId(readString(raw, 'default_entry_id'))
  }
}

// ---- 旧版 API 兼容导出（使用 apiRequest 替代 Axios 封装） ----

// 获取用户列表
export async function fetchGetUserList(params: Record<string, unknown>) {
  return (await apiRequest('/system/user/list', {
    method: 'GET',
    body: params
  })) as Api.SystemManage.UserList
}

// 获取角色列表
export async function fetchGetRoleList(params: Record<string, unknown>) {
  return (await apiRequest('/system/role/list', {
    method: 'GET',
    body: params
  })) as Api.SystemManage.RoleList
}

// 获取菜单列表
export async function fetchGetMenuList() {
  return (await apiRequest('/system/menus')) as import('@/types/router').AppRouteRecord[]
}

// ═══ Staff 管理 API（补充 /system/staff/* 端点）═══

// 按邮箱覆盖更新员工角色
export async function grantStaffRole(email: string, roleCode: string): Promise<void> {
  await apiRequest(`/system/staff/role/grant/${encodeURIComponent(email)}`, {
    method: 'POST',
    body: { roleCode }
  })
}

// 重发激活链接
export async function reissueStaffActivation(userId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(userId)}/activation/reissue`, {
    method: 'POST',
    body: {}
  })
}

// 禁用员工
export async function disableStaff(userId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(userId)}/disable`, {
    method: 'POST',
    body: {}
  })
}

// 启用员工
export async function enableStaff(userId: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(userId)}/enable`, {
    method: 'POST',
    body: {}
  })
}

// 删除员工
export async function deleteStaff(userId: string): Promise<void> {
  await apiRequest(`/system/staff/delete/${encodeURIComponent(userId)}`, {
    method: 'POST',
    body: {}
  })
}

// 启用 2FA
export async function enableStaff2FA(id: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(id)}/2fa/enable`, {
    method: 'POST',
    body: {}
  })
}

// 禁用 2FA
export async function disableStaff2FA(id: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(id)}/2fa/disable`, {
    method: 'POST',
    body: {}
  })
}

// 强制登出
export async function forceLogoutStaff(id: string): Promise<void> {
  await apiRequest(`/system/staff/${encodeURIComponent(id)}/force-logout`, {
    method: 'POST',
    body: {}
  })
}

// ═══ 角色总览 & 三级复核流配置（Team Management — Roles Tab）═══

/**
 * 角色总览
 * GET /system/role/overview
 */
export async function fetchRoleOverview(): Promise<RoleOverviewView[]> {
  const raw = (await apiRequest('/system/role/overview')) as
    | Record<string, unknown>[]
    | Record<string, unknown>
  const items = Array.isArray(raw) ? raw : (raw?.data as Record<string, unknown>[] | undefined)
  if (!Array.isArray(items)) return []
  return items.map(normalizeRoleOverview)
}

function normalizeRoleOverview(raw: Record<string, unknown>): RoleOverviewView {
  const roleCode = raw.roleCode as string
  const users = Array.isArray(raw.users)
    ? (raw.users as Record<string, unknown>[]).map(normalizeRoleMember)
    : []
  const levelsRaw = raw.levels as Record<string, unknown>[] | undefined
  const levels: Record<string, ReviewFlowApprover[]> = {}
  if (levelsRaw && typeof levelsRaw === 'object' && !Array.isArray(levelsRaw)) {
    for (const [key, value] of Object.entries(levelsRaw)) {
      if (Array.isArray(value)) {
        levels[key] = value.map(normalizeApprover)
      }
    }
  }
  return {
    id: Number(raw.id || 0),
    roleCode,
    roleName: (raw.roleName as string) || roleCode,
    users,
    levels: Object.keys(levels).length > 0 ? levels : null
  }
}

function normalizeRoleMember(raw: Record<string, unknown>): RoleMemberView {
  return {
    userId: Number(raw.userId || 0),
    username: (raw.username as string) || '',
    displayName: (raw.displayName as string) || '',
    email: (raw.email as string) || '',
    accountStatus: (raw.accountStatus as 'enabled' | 'disabled') || 'enabled',
    roleCode: (raw.roleCode as string) || ''
  }
}

function normalizeApprover(raw: Record<string, unknown>): ReviewFlowApprover {
  const keyData = raw.key as Record<string, unknown> | undefined
  return {
    sortNo: Number((keyData?.sortNo ?? raw.sortNo) || 0),
    userId: Number((keyData?.userId ?? raw.userId) || 0),
    name: (keyData?.name ?? raw.name ?? '') as string,
    email: (keyData?.email ?? raw.email ?? '') as string,
    accountStatus:
      ((keyData?.accountStatus ?? raw.accountStatus) as 'enabled' | 'disabled') || 'enabled'
  }
}

/**
 * 批量调整角色成员（不处理 COMPLIANCE_REVIEWER）
 * PUT /system/role/{roleCode}/users
 */
export async function batchUpdateRoleUsers(
  roleCode: string,
  request: RoleUserBatchRequest
): Promise<RoleMemberView[]> {
  const raw = (await apiRequest(`/system/role/${encodeURIComponent(roleCode)}/users`, {
    method: 'PUT',
    body: {
      addUserIds: request.addUserIds,
      removeUserIds: request.removeUserIds
    }
  })) as Record<string, unknown>[] | Record<string, unknown>
  const items = Array.isArray(raw) ? raw : (raw?.data as Record<string, unknown>[] | undefined)
  return Array.isArray(items) ? items.map(normalizeRoleMember) : []
}

/**
 * 查询三级复核流
 * GET /system/review-flow/list
 */
export async function fetchReviewFlows(): Promise<ReviewFlowView[]> {
  const raw = (await apiRequest('/system/review-flow/list')) as
    | Record<string, unknown>[]
    | Record<string, unknown>
  const items = Array.isArray(raw) ? raw : (raw?.data as Record<string, unknown>[] | undefined)
  return Array.isArray(items) ? items.map(normalizeReviewFlow) : []
}

function normalizeReviewFlow(raw: Record<string, unknown>): ReviewFlowView {
  const steps = Array.isArray(raw.steps)
    ? (raw.steps as Record<string, unknown>[]).map(normalizeFlowStep)
    : []
  return {
    severity: (raw.severity as ReviewFlowView['severity']) || 'ROUTINE',
    flowName: (raw.flowName as string) || '',
    timeoutMinutes: Number(raw.timeoutMinutes || 0),
    timeoutAction: (raw.timeoutAction as 'AUTO_RESOLVE' | 'ESCALATE') || 'AUTO_RESOLVE',
    status: (raw.status as string) || '',
    description: raw.description as string | undefined,
    steps
  }
}

function normalizeFlowStep(raw: Record<string, unknown>): ReviewFlowStep {
  return {
    stepNo: Number(raw.stepNo || 0),
    roleCode: (raw.roleCode as string) || '',
    roleName: raw.roleName as string | undefined,
    assigneeUserId: Number(raw.assigneeUserId || 0),
    assigneeName: (raw.assigneeName as string) || '',
    assigneeEmail: (raw.assigneeEmail as string) || '',
    assigneeStatus: (raw.assigneeStatus as 'enabled' | 'disabled') || 'enabled'
  }
}

/**
 * 保存单个级别的复核流
 * PUT /system/review-flow/{severity}
 */
export async function updateReviewFlow(
  severity: string,
  request: ReviewFlowUpdateRequest
): Promise<ReviewFlowView> {
  const raw = (await apiRequest(`/system/review-flow/${encodeURIComponent(severity)}`, {
    method: 'PUT',
    body: {
      timeoutMinutes: request.timeoutMinutes,
      timeoutAction: request.timeoutAction,
      steps: request.steps
    }
  })) as Record<string, unknown>
  const data = raw?.data ? (raw.data as Record<string, unknown>) : raw
  if (!data) throw new Error('No data returned from updateReviewFlow')
  return normalizeReviewFlow(data)
}

/**
 * 整体覆盖某等级的复核人（COMPLIANCE_REVIEWER 角色）
 * PUT /system/review-flow/{severity}/reviewers
 */
export async function updateReviewersForLevel(
  severity: string,
  request: ReviewerLevelBindRequest
): Promise<ReviewFlowApproversVO> {
  const raw = (await apiRequest(`/system/review-flow/${encodeURIComponent(severity)}/reviewers`, {
    method: 'PUT',
    body: { userIds: request.userIds }
  })) as Record<string, unknown> | Record<string, unknown>[]
  const data = Array.isArray(raw)
    ? raw[0]
    : (raw?.data as Record<string, unknown> | undefined) || raw
  if (!data) throw new Error('No data returned from updateReviewersForLevel')
  return {
    severity: (data.severity as string) || severity,
    approvers: Array.isArray(data.approvers)
      ? (data.approvers as Record<string, unknown>[]).map(normalizeApprover)
      : []
  }
}

// Dev-only: 创建待激活测试账号
export async function createTestActivationAccount(payload: {
  email: string
  displayName?: string
}): Promise<{ userId: string }> {
  return (await apiRequest('/system/staff/test/activation', {
    method: 'POST',
    body: payload
  })) as { userId: string }
}
