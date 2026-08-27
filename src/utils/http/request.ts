import { StorageConfig } from '../storage'

// v2 — HTTP 请求封装（参考 v1 src/api/request.ts）
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE || '/admin'
// const AUTH_STORAGE_KEY = 'cregis.admin.auth'
const MFA_STORAGE_KEY = 'cregis.admin.mfa'

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

function shouldClearAuth(response: Response, payload: unknown): boolean {
  if (response.status === 401) return true
  if (response.status !== 403) return false
  return readSemanticCode(payload) === 'session_expired_or_missing'
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
    if (shouldClearAuth(response, payload)) clearPersistedAuth()
    throw extractError(payload, response.status)
  }
  const data =
    envelope && Object.prototype.hasOwnProperty.call(envelope, 'data')
      ? (envelope.data as T)
      : (payload as T)
  if (options.includeMeta) return { data, headers: response.headers }
  return data
}
