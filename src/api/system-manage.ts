// v2 API — System Admin (系统管理)
import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import type {
  EmployeePageQuery,
  EmployeeRowView,
  EmployeeCreateInput,
  SystemMonitorResponse
} from '@/features/system-admin/types'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus'
  })
}

// 员工管理 API
export interface EmployeePageResponse {
  records: EmployeeRowView[]
  pagination: { page: number; pageSize: number; totalPages: number; totalCount: number }
}

export async function fetchEmployees(query: EmployeePageQuery): Promise<EmployeePageResponse> {
  const params: Record<string, any> = { pageNum: query.pageNum, pageSize: query.pageSize }
  if (query.status && query.status !== 'all') params.status = query.status
  if (query.searchQuery) params.searchQuery = query.searchQuery
  return request.get<EmployeePageResponse>({
    url: '/api/v1/system/employees',
    params
  })
}

export async function createEmployee(input: EmployeeCreateInput): Promise<{ accountId: string }> {
  return request.post<{ accountId: string }>({
    url: '/api/v1/system/employees',
    data: input
  })
}

export async function enableEmployee(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/enable`
  })
}

export async function disableEmployee(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/disable`
  })
}

export async function resetEmployeePassword(
  accountId: string,
  tempPassword: string
): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/reset-password`,
    data: { tempPassword }
  })
}

export async function reissueEmployeeActivation(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/reissue-activation`
  })
}

export async function fetchSystemMonitor(): Promise<SystemMonitorResponse> {
  return request.get<SystemMonitorResponse>({
    url: '/api/v1/system/monitor'
  })
}

// ═══ 新版 Staff API（对应 /system/staff/* 端点）═══

// 添加系统员工（邀请成员）
export async function addStaff(payload: {
  displayName: string
  email: string
  initialRoleCode: string
}): Promise<{ userId: string }> {
  return request.post<{ userId: string }>({
    url: '/system/staff/add',
    data: payload
  })
}

// 按邮箱覆盖更新员工角色
export async function grantStaffRole(email: string, roleCode: string): Promise<void> {
  return request.post({
    url: `/system/staff/role/grant/${encodeURIComponent(email)}`,
    data: { roleCode }
  })
}

// 重置员工密码
export async function setStaffPassword(email: string, newPassword: string): Promise<void> {
  return request.post({
    url: '/system/staff/set/password',
    data: { email, newPassword }
  })
}

// 重发激活链接
export async function reissueStaffActivation(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/activation/reissue`
  })
}

// 禁用员工
export async function disableStaff(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/disable`
  })
}

// 启用员工
export async function enableStaff(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/enable`
  })
}

// 删除员工
export async function deleteStaff(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/delete/${encodeURIComponent(userId)}`
  })
}

// 启用 2FA
export async function enableStaff2FA(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/2fa/enable`
  })
}

// 禁用 2FA
export async function disableStaff2FA(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/2fa/disable`
  })
}

// 强制登出
export async function forceLogoutStaff(userId: string): Promise<void> {
  return request.post({
    url: `/system/staff/${encodeURIComponent(userId)}/force-logout`
  })
}
