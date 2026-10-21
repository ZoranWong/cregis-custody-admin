import { StorageConfig } from '../storage'

// v2 — HTTP 请求封装（参考 v1 src/api/request.ts）
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || '/admin'

export class ApiError extends Error {
  status: number
  code?: number | string
  payload?: unknown
  constructor(message: string, status: number, code?: number | string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

function getPersistedToken(): string {
  try {
    const raw = localStorage.getItem(StorageConfig.AUTH_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as { token?: string }) : null
    return parsed?.token || ''
  } catch {
    return ''
  }
}

function clearPersistedAuth(): void {
  localStorage.removeItem(StorageConfig.AUTH_STORAGE_KEY)
  localStorage.removeItem(StorageConfig.MFA_STORAGE_KEY)
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()
  if (!text) return null
  // 如果响应不是 JSON，返回标记对象以便 extractError 生成友好错误
  if (!contentType.includes('application/json')) {
    return { _http_raw: text.slice(0, 200) } // 截断避免错误消息过长
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function extractError(payload: unknown, status: number): ApiError {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    // 处理 HTML/纯文本响应
    if (typeof obj._http_raw === 'string') {
      return new ApiError(`Server returned ${status}`, status, undefined, obj._http_raw)
    }
    return new ApiError(
      (obj.msg || obj.message || `Request failed with status ${status}`) as string,
      status,
      obj.code as number | string | undefined,
      payload
    )
  }
  if (typeof payload === 'string' && payload.trim()) {
    return new ApiError(payload.slice(0, 200), status, undefined, payload)
  }
  return new ApiError(`Request failed with status ${status}`, status)
}

function readSemanticCode(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const record = payload as Record<string, unknown>
  if (typeof record.semantic_code === 'string') return record.semantic_code
  if (typeof record.semanticCode === 'string') return record.semanticCode
  const data = record.data
  if (data && typeof data === 'object') return readSemanticCode(data)
  return ''
}

/**
 * 登录过期判定。
 *
 * 后端有两种表达方式：
 *   1. HTTP 401 / 403 + envelope code 401/402/403（网关鉴权失败）；
 *   2. **HTTP 200 + body 内 code: 401/402/403**，message 为
 *      "Login expired, please sign in again!" —— 之前只判断 HTTP 状态码，
 *      这种情况被漏掉，导致 token 过期后仍停留在页面上反复报错。
 */
const AUTH_EXPIRED_MESSAGE_RE =
  /login expired|token (?:is )?expired|session (?:is )?expired|unauthorized|请重新登录|登录已过期|登录失效|token已过期/i

function isAuthExpired(response: Response, payload: unknown): boolean {
  if (response.status === 401) return true
  if (!payload || typeof payload !== 'object') return false
  const record = payload as Record<string, unknown>
  const code = Number(record.code)
  if (code === 401 || code === 402 || code === 403) return true
  // HTTP 403 只有命中登录过期文案才当成 token 问题，避免把真实的权限不足误判为登出
  if (response.status === 403) {
    const message = String(record.message || record.msg || '')
    return AUTH_EXPIRED_MESSAGE_RE.test(message)
  }
  return readSemanticCode(payload) === 'session_expired_or_missing'
}

/** 防重入：多个并发请求同时过期时只登出一次 */
let loggingOut = false

/**
 * 清理本地凭证并跳回登录页。
 * 动态 import 路由与用户 store，避免 request ⇄ router/store 的循环依赖。
 * 走 userStore.logOut() 复用已有的清理逻辑（状态、路由、redirect 参数）。
 */
async function handleAuthExpired(): Promise<void> {
  clearPersistedAuth()
  if (loggingOut) return
  loggingOut = true
  try {
    const [{ useUserStore }, { router }] = await Promise.all([
      import('@/store/modules/user'),
      import('@/router')
    ])
    const userStore = useUserStore()
    if (router.currentRoute.value.name === 'login') return
    userStore.logOut()
  } catch {
    // 动态 import 失败（如应用尚未初始化）时退回整页跳转
    if (typeof window !== 'undefined') window.location.href = '/auth/login'
  } finally {
    // 留出跳转时间后允许下一次过期处理（正常登录后再次过期时仍可生效）
    setTimeout(() => {
      loggingOut = false
    }, 3000)
  }
}

/**
 * 解析 JWT 里的过期时间（毫秒）。
 * 后端 token 用的是业务字段：
 *   - `eff`：毫秒时间戳（本系统实测）
 *   - `exp`：标准 JWT 秒时间戳（兼容其它签发方）
 * payload 非标准或两个字段都没有时返回 null（不拦截）。
 */
function readJwtExpiryMs(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    // JWT 用 base64url，补齐 padding 后按 UTF-8 解码
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    const payload = JSON.parse(json) as { exp?: unknown; eff?: unknown }
    if (typeof payload.eff === 'number') return payload.eff
    if (typeof payload.exp === 'number') return payload.exp * 1000
    return null
  } catch {
    return null
  }
}

/** 请求前校验：本地 token 是否已过期（解析不到过期时间的不拦截） */
function isPersistedTokenExpired(): boolean {
  const token = getPersistedToken()
  if (!token) return false
  const expiry = readJwtExpiryMs(token)
  return expiry != null && Date.now() >= expiry
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string
    auth?: boolean
    body?: unknown
    includeMeta?: boolean
  } = {}
): Promise<T | { data: T; headers: Headers }> {
  // 请求前先看本地 token 是否已过期：已过期就不发请求，直接清凭证回登录页。
  // 避免每个接口都拿死 token 打一次后端、各自弹一遍「Login expired」。
  if (options.auth !== false && isPersistedTokenExpired()) {
    await handleAuthExpired()
    throw new ApiError('Login expired, please sign in again.', 401, 401)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
  if (options.auth !== false) {
    const token = getPersistedToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body)
  })
  const payload = await parseJson(response)
  const envelope =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  const code = envelope?.code
  const success = response.ok && (code == null || code === 0 || code === 200)
  if (!success) {
    // 覆盖三种过期表达：HTTP 401/403、HTTP 200 + code 401/402/403、semantic_code
    if (isAuthExpired(response, payload)) void handleAuthExpired()
    throw extractError(payload, response.status)
  }
  const data =
    envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
      ? (envelope.data as T)
      : (payload as T)
  if (options.includeMeta) return { data, headers: response.headers }
  return data
}
