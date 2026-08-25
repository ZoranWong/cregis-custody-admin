// v2 API — System Admin (系统管理)
// 使用 fetch 封装（apiRequest），走 /admin 代理到真实后端
// 参考: cregis-custody-manager/docs/cregis-custody-new/frontend/admin/src/api/employeeAccess.ts
import { apiRequest } from '@/utils/http/request'
import type {
  EmployeePageQuery,
  EmployeeRowView,
  EmployeeCreateInput,
  SystemMonitorResponse,
  EmployeeAccessBindingView,
  AccessReviewApplyResult,
  AuthorizedDomainId
} from '@/features/system-admin/types'

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
