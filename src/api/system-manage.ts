// v2 API — System Admin (系统管理)
import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import type {
  EmployeePageQuery, EmployeeRowView, EmployeeCreateInput,
  SystemMonitorResponse
} from "@/features/system-admin/types";

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
  records: EmployeeRowView[]; pagination: { page: number; pageSize: number; totalPages: number; totalCount: number };
}

export async function fetchEmployees(query: EmployeePageQuery): Promise<EmployeePageResponse> {
  const params: Record<string, any> = { pageNum: query.pageNum, pageSize: query.pageSize };
  if (query.status && query.status !== 'all') params.status = query.status;
  if (query.searchQuery) params.searchQuery = query.searchQuery;
  return request.get<EmployeePageResponse>({
    url: '/api/v1/system/employees',
    params
  });
}

export async function createEmployee(input: EmployeeCreateInput): Promise<{ accountId: string }> {
  return request.post<{ accountId: string }>({
    url: '/api/v1/system/employees',
    data: input
  });
}

export async function enableEmployee(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/enable`
  });
}

export async function disableEmployee(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/disable`
  });
}

export async function resetEmployeePassword(accountId: string, tempPassword: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/reset-password`,
    data: { tempPassword }
  });
}

export async function reissueEmployeeActivation(accountId: string): Promise<void> {
  return request.post({
    url: `/api/v1/system/employees/${encodeURIComponent(accountId)}/reissue-activation`
  });
}

export async function fetchSystemMonitor(): Promise<SystemMonitorResponse> {
  return request.get<SystemMonitorResponse>({
    url: '/api/v1/system/monitor'
  });
}