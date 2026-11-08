/**
 * KYB 验证链接（Sumsub WebSDK 直达链接）缓存。
 *
 * 后端生成链接的接口不返回过期时间，前端按企业 ecode 缓存链接并默认 30 分钟失效：
 * 有效期内重复进入详情可直接复用；过期后自动清除，需要重新生成。
 * 缓存放在 localStorage，刷新页面 / 重新进入详情后仍能拿到刚生成的链接。
 */
export const KYB_SDK_LINK_TTL_MS = 30 * 60 * 1000

const STORAGE_PREFIX = 'cregis:kyb-sdk-link:'

export interface CachedKybSdkLink {
  url: string
  /** 业务系统用户 ID（商户 ecode） */
  externalUserId: string
  /** 生成时间（毫秒时间戳） */
  createdAt: number
  /** 过期时间（毫秒时间戳） */
  expiresAt: number
}

/** 只依赖 localStorage 的最小接口，方便在无浏览器环境（验收脚本）注入实现 */
export interface KybSdkLinkStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface KybSdkLinkOptions {
  /** 当前时间，默认 Date.now() */
  now?: number
  /** 有效期，默认 KYB_SDK_LINK_TTL_MS */
  ttl?: number
  /** 存储实现，默认浏览器 localStorage */
  storage?: KybSdkLinkStorage | null
}

function defaultStorage(): KybSdkLinkStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // 隐私模式 / 禁用存储时访问 localStorage 会抛错
    return null
  }
}

function storageKey(ecode: string): string {
  return `${STORAGE_PREFIX}${ecode}`
}

function isCachedLink(value: unknown): value is CachedKybSdkLink {
  if (!value || typeof value !== 'object') return false
  const link = value as Partial<CachedKybSdkLink>
  return (
    typeof link.url === 'string' &&
    typeof link.externalUserId === 'string' &&
    typeof link.createdAt === 'number' &&
    typeof link.expiresAt === 'number'
  )
}

/** 读取未过期的缓存；已过期的记录顺手删除并返回 null */
export function readKybSdkLink(
  ecode: string,
  options: KybSdkLinkOptions = {}
): CachedKybSdkLink | null {
  const storage = options.storage === undefined ? defaultStorage() : options.storage
  if (!storage || !ecode) return null

  const raw = storage.getItem(storageKey(ecode))
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isCachedLink(parsed)) {
      storage.removeItem(storageKey(ecode))
      return null
    }
    if (parsed.expiresAt <= (options.now ?? Date.now())) {
      storage.removeItem(storageKey(ecode))
      return null
    }
    return parsed
  } catch {
    storage.removeItem(storageKey(ecode))
    return null
  }
}

/** 写入缓存，返回带 createdAt / expiresAt 的记录 */
export function saveKybSdkLink(
  ecode: string,
  link: { url: string; externalUserId: string },
  options: KybSdkLinkOptions = {}
): CachedKybSdkLink {
  const now = options.now ?? Date.now()
  const cached: CachedKybSdkLink = {
    url: link.url,
    externalUserId: link.externalUserId,
    createdAt: now,
    expiresAt: now + (options.ttl ?? KYB_SDK_LINK_TTL_MS)
  }

  const storage = options.storage === undefined ? defaultStorage() : options.storage
  storage?.setItem(storageKey(ecode), JSON.stringify(cached))
  return cached
}

export function clearKybSdkLink(ecode: string, storage?: KybSdkLinkStorage | null): void {
  const target = storage === undefined ? defaultStorage() : storage
  target?.removeItem(storageKey(ecode))
}
