// v2 API — Security (个人中心安全)
// 参考: cregis-custody-manager/docs/cregis-custody-new/frontend/admin/src/api/security.ts
import { apiRequest } from '@/utils/http/request'
import type {
  PasskeyStatus,
  PersonalCenterSummary,
  PersonalCenterPasskeyRegistrationOptions,
  PersonalCenterTotpSetupMaterial,
  PersonalCenterTotpSetupResult,
  PersonalCenterPasswordChangeResult,
  RecoveryCodesDeliveryBundle,
  RecoveryCodesRefreshResult,
  FallbackSecurityStatus,
  PasskeyStatusState,
  TotpStatusState,
  RecoveryCodesState,
  PasswordFallbackState,
  PersonalCenterContactSupportEntry
} from '@/types/models'

/** 设备名：用于 passkey registration complete 的 deviceName 字段 */
export function resolveDeviceName(): string {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return nav.userAgentData?.platform || navigator.platform || 'Current device'
}

/*
 * ⚠️ 后端从未实现以下三个端点（openapi 无条目，实测返回 UNKNOWN_ERROR）：
 *   /v1/auth/security/summary
 *   /v1/auth/security/sessions
 *   /v1/auth/security/sessions/{id}/revoke
 * 个人中心改为：账号信息走 /system/staff/list（按登录用户 id 过滤），
 * 状态未知的部分（passkey/TOTP 状态、会话列表）由前端按「未配置」渲染，
 * 待后端补充状态查询与会话管理接口后再恢复。
 */

export interface StaffAccountInfo {
  id: number
  displayName: string
  email: string
  roleCode: string
  accountStatus: string
}

/** 查询当前登录员工的信息（/system/staff/list 全量后按 id 过滤） */
export async function fetchCurrentStaffAccount(userId: number): Promise<StaffAccountInfo | null> {
  const raw = (await apiRequest('/system/staff/list')) as Array<Record<string, unknown>>
  const list = Array.isArray(raw) ? raw : []
  const me = list.find((item) => Number(item.id) === userId)
  if (!me) return null
  return {
    id: Number(me.id),
    displayName: String(me.display_name || me.username || ''),
    email: String(me.email || ''),
    roleCode: String(me.role_code || ''),
    accountStatus: String(me.account_status || '')
  }
}

/**
 * 个人中心概览（前端拼装，不再依赖已下线的 /v1/auth/security/summary）。
 * passkey/TOTP/恢复码状态无查询接口，按「未配置」占位，动作类操作成功后就地更新。
 */
export function buildPersonalCenterSummary(account: StaffAccountInfo): PersonalCenterSummary {
  const notReadyPasskey: PasskeyStatus = { state: 'not_configured', summaryLabel: '' }
  const fallback: FallbackSecurityStatus = {
    totpState: 'not_configured',
    recoveryCodesState: 'unavailable',
    passwordFallbackState: 'available',
    summaryLabel: ''
  }
  return {
    accountSummary: {
      displayName: account.displayName,
      email: account.email,
      roleLabel: account.roleCode
    },
    passkeyStatus: notReadyPasskey,
    fallbackSecurityStatus: fallback,
    sessionRiskStatus: { summaryLabel: '', tone: 'neutral' },
    currentSessionSummary: {
      sessionId: '',
      deviceLabel: '',
      lastActiveAt: '',
      locationHint: ''
    },
    otherSessionSummaries: [],
    managePasskeyEntry: { destinationOrIntent: '' },
    manageRecoveryCodesEntry: { destinationOrIntent: '' },
    manageSessionsEntry: { destinationOrIntent: '' },
    manageTotpEntry: { destinationOrIntent: '' },
    changePasswordEntry: { destinationOrIntent: '' },
    contactSupportEntry: null
  }
}

/*
 * ⚠️ 后端实际返回 camelCase（与 openapi 一致），早期代码按 snake_case 取值，
 * 导致 creationOptions 为空对象、attemptId 为空串，WebAuthn 直接失败。
 * 这里统一用 pick()：camelCase 优先，兼容 snake_case。
 */
export async function fetchPasskeyRegistrationOptions(): Promise<PersonalCenterPasskeyRegistrationOptions> {
  const raw = (await apiRequest('/v1/auth/passkey/registration/options', {
    method: 'POST',
    body: {}
  })) as Record<string, unknown>
  return {
    passkeyRegistrationAttemptId: pickStr(
      raw,
      'passkeyRegistrationAttemptId',
      'passkey_registration_attempt_id'
    ),
    creationOptions: pickRecord(raw, 'creationOptions', 'creation_options')
  }
}

export async function completePasskeyRegistration(
  passkeyRegistrationAttemptId: string,
  credential: Record<string, unknown>
): Promise<PasskeyStatus> {
  const raw = (await apiRequest('/v1/auth/passkey/registration/complete', {
    method: 'POST',
    // 请求体字段同样以 openapi 为准：camelCase，deviceName 在顶层
    body: {
      passkeyRegistrationAttemptId,
      credential,
      deviceName: resolveDeviceName()
    }
  })) as Record<string, unknown>
  return normalizePasskeyStatus(raw)
}

export async function bootstrapPersonalCenterTotp(
  email: string
): Promise<PersonalCenterTotpSetupMaterial> {
  // TOTP setup 需要在强认证上下文中携带 mfaToken；普通登录态下后端会拒绝。
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/setup', {
    method: 'POST',
    body: { email }
  })) as Record<string, unknown>
  return {
    totpSetupId: pickStr(raw, 'totpSetupId', 'totp_setup_id'),
    qrCodeBase64: pickStr(raw, 'qrCodeBase64', 'qr_code_base64'),
    manualKey: pickStr(raw, 'manualKey', 'manual_key'),
    accountName: pickStr(raw, 'accountName', 'account_name')
  }
}

export async function completePersonalCenterTotp(
  code: string
): Promise<PersonalCenterTotpSetupResult> {
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/enable', {
    method: 'POST',
    // 以 openapi MfaTotpCodeRequest 为准：只收 code（mfaToken 属于强认证流程，普通登录态不传）
    body: { code }
  })) as Record<string, unknown>
  return {
    totpState: 'active',
    recoveryCodesDeliveryBundle: normalizeRecoveryCodesDeliveryBundle(
      pickRecord(raw, 'recoveryCodesDeliveryBundle', 'recovery_codes_delivery_bundle')
    ),
    recoveryCodesState: 'available'
  }
}

export async function refreshRecoveryCodes(email: string): Promise<RecoveryCodesRefreshResult> {
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/recoveryCodes/refresh', {
    method: 'POST',
    // openapi MfaSetupTotpRequest：{ mfaToken?, email? }
    body: { email }
  })) as Record<string, unknown>
  return {
    recoveryCodesDeliveryBundle: normalizeRecoveryCodesDeliveryBundle(
      pickRecord(raw, 'recoveryCodesDeliveryBundle', 'recovery_codes_delivery_bundle')
    ),
    recoveryCodesState: 'available'
  }
}

export async function changePersonalCenterPassword(
  currentPassword: string,
  nextPassword: string
): Promise<PersonalCenterPasswordChangeResult> {
  // 以 openapi ResetPasswordDto 为准：{ password, oldPassword, code? }
  const raw = (await apiRequest('/system/staff/update/password', {
    method: 'POST',
    body: {
      password: nextPassword,
      oldPassword: currentPassword
    }
  })) as Record<string, unknown>
  return {
    passwordFallbackState: normalizePasswordFallbackState(
      pickStr(raw, 'passwordFallbackState', 'password_fallback_state')
    ),
    summaryLabel: pickStr(raw, 'summaryLabel', 'summary_label')
  }
}

// ---- 规范化函数 ----

function normalizePasskeyStatus(raw: Record<string, unknown>): PasskeyStatus {
  return {
    state: normalizePasskeyStatusState(pickStr(raw, 'state')),
    summaryLabel: pickStr(raw, 'summaryLabel', 'summary_label')
  }
}

function normalizeRecoveryCodesDeliveryBundle(
  raw: Record<string, unknown>
): RecoveryCodesDeliveryBundle {
  const codes = pickStringArray(raw, 'recoveryCodes', 'recovery_codes')
  return {
    deliveryMode: 'display_once',
    // refreshCodes 接口可能返回空 bundle，此时用空数组占位（UI 显示空列表而不是崩溃）
    recoveryCodes: codes,
    mustAcknowledgeSaved: true,
    bundleVersion: pickStr(raw, 'bundleVersion', 'bundle_version')
  }
}

export function normalizeContactSupportEntry(
  raw: unknown
): PersonalCenterContactSupportEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  return {
    destinationOrChannel: pickStr(record, 'destinationOrChannel', 'destination_or_channel')
  }
}

function normalizePasskeyStatusState(value: string): PasskeyStatusState {
  return value === 'active' || value === 'requires_attention' ? value : 'not_configured'
}

export function normalizeTotpStatusState(value: string): TotpStatusState {
  return value === 'active' || value === 'requires_attention' ? value : 'not_configured'
}

export function normalizeRecoveryCodesState(value: string): RecoveryCodesState {
  return value === 'available' || value === 'needs_refresh' ? value : 'unavailable'
}

export function normalizePasswordFallbackState(value: string): PasswordFallbackState {
  return value === 'requires_attention' ? 'requires_attention' : 'available'
}

// ---- 低级读取辅助 ----

/** 后端字段命名以 camelCase 为准，同时兼容早期 snake_case 写法 */
function pickValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

function pickStr(source: Record<string, unknown>, ...keys: string[]): string {
  const value = pickValue(source, keys)
  return typeof value === 'string' ? value : ''
}

function pickRecord(source: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  const value = pickValue(source, keys)
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function pickStringArray(source: Record<string, unknown>, ...keys: string[]): string[] {
  const value = pickValue(source, keys)
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
}
