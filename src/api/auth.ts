// v2 API — Auth (认证)
// 对接 docs/custody-admin.openapi.yaml 中的 /v1/auth/* 端点
import { apiRequest, ApiError } from '@/utils/http/request'
import type {
  AuthenticatedSession,
  AuthenticatedUser,
  AuthEntryContext,
  ReentryReasonCode,
  ReentryReasonCodeKey
} from '@/types/models'
import { normalizeBearer } from '@/utils/format'

// --- 登录（密码第一步，获取 mfaToken 临时令牌） ---

export interface FirstAuthenticateResponse {
  mfaToken: string
  mfaRequired: boolean
  totp: boolean // false: 未绑定 Google Authenticator，需先 setup
  passkey: boolean // false: 未绑定 Passkey
}

export async function firstAuthenticate(
  account: string,
  password: string
): Promise<FirstAuthenticateResponse> {
  const body: Record<string, string> = { account, password, type: 'PASSWORD' }
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/login', {
    method: 'POST',
    auth: false,
    body
  })) as Record<string, unknown>
  return {
    mfaToken: readMfaToken(response),
    mfaRequired: readBool(response, 'mfaRequired'),
    totp: readBool(response, 'totp'),
    passkey: readBool(response, 'passkey')
  }
}

// --- TOTP 设置（首次绑定 Google Authenticator） ---

export interface TotpSetupResponse {
  qrCodeBase64: string
  secretKey: string
  accountName: string
}

export async function setupTotp(mfaToken: string): Promise<TotpSetupResponse> {
  const raw = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/settings/totp/setup', {
    method: 'POST',
    auth: false,
    body: { mfaToken }
  })) as Record<string, unknown>
  return {
    qrCodeBase64: readRequired(raw, 'qrCodeBase64'),
    secretKey: readRequired(raw, 'secretKey'),
    accountName: readRequired(raw, 'accountName')
  }
}

// --- TOTP 启用（验证 6 位码，完成绑定） ---

export interface TotpEnableResponse {
  token: string
  refreshToken: string
  user: Partial<AuthenticatedUser>
  recoveryCode?: string
}

export async function enableTotpCode(mfaToken: string, code: string): Promise<TotpEnableResponse> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/settings/totp/enable', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return {
    token: readRequired(data, 'token'),
    refreshToken: readStr(data, 'refreshToken'),
    user: readUser(data),
    recoveryCode: readStr(data, 'recoveryCode') || undefined
  }
}

// --- 二次验证（已绑定 TOTP，登录时验证；支持恢复码） ---

export type MfaVerifyType = 'GOOGLE_CODE' | 'RECOVERY_CODE'

export async function verifyTotpChallenge(
  mfaToken: string,
  code: string,
  type: MfaVerifyType = 'GOOGLE_CODE'
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/totp/verify', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code, type },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  return buildSession(response.data || {}, response.headers)
}

export async function verifyRecoveryCode(
  mfaToken: string,
  recoveryCode: string
): Promise<AuthenticatedSession> {
  return verifyTotpChallenge(mfaToken, recoveryCode, 'RECOVERY_CODE')
}

// --- Passkey 登录（登录页入口） ---

export async function fetchAuthEntryContext(): Promise<AuthEntryContext> {
  const raw = (await apiRequest<Record<string, unknown>>('/v1/auth/entry/context', {
    method: 'GET',
    auth: false
  })) as Record<string, unknown>
  return normalizeAuthEntryContext(raw)
}

export async function fetchPasskeyAssertionOptions(): Promise<{
  passkeyAttemptId: string
  assertionOptions: Record<string, unknown>
  passkeyPrimaryState: 'ready' | 'retry_available'
  passwordFallbackAllowed: boolean
}> {
  const raw = (await apiRequest<Record<string, unknown>>('/v1/auth/passkey/assertion/options', {
    method: 'POST',
    auth: false,
    body: {
      clientCapability: {
        platformAuthenticatorAvailable:
          typeof PublicKeyCredential !== 'undefined' &&
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      },
      mediationPreference: 'conditional'
    }
  })) as Record<string, unknown>
  return normalizePasskeyAssertionOptions(raw)
}

export async function completePasskeyAssertion(
  passkeyAttemptId: string,
  credential: Record<string, unknown>
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>(
    '/v1/auth/passkey/assertion/complete',
    {
      method: 'POST',
      auth: false,
      body: { passkeyAttemptId, credential },
      includeMeta: true
    }
  )) as { data: Record<string, unknown>; headers: Headers }
  return buildSession(response.data || {}, response.headers)
}

// --- 规范化 ---

function buildSession(data: Record<string, unknown>, headers: Headers): AuthenticatedSession {
  const headerToken = headers.get('Authorization') || headers.get('authorization')
  const token = readStr(data, 'token') || normalizeBearer(headerToken)
  if (!token) throw new Error('Authentication response did not include a token.')
  const user = readUser(data)
  return {
    token,
    refreshToken: readStr(data, 'refreshToken'),
    tokenTimeout: readNum(data, 'tokenTimeout'),
    refreshTokenTimeout: readNum(data, 'refreshTokenTimeout'),
    user: {
      id: user.id,
      username: user.username || 'operator',
      email: user.email || '',
      roles: user.roles || []
    },
    mfa: { totp: true, passkey: false, verified: true }
  }
}

function readUser(data: Record<string, unknown>): Partial<AuthenticatedUser> {
  const user = asRecord(data.user)
  return {
    id: (user.id as string | number) ?? (data.id as string | number),
    username: readStr(user, 'username') || readStr(data, 'username') || readStr(user, 'email'),
    email: readStr(user, 'email') || readStr(data, 'email'),
    roles: Array.isArray(user.roles) ? (user.roles as string[]) : []
  }
}

function normalizeAuthEntryContext(raw: Record<string, unknown>): AuthEntryContext {
  return {
    allowPasswordFallback: readBool(raw, 'passwordFallbackAllowed'),
    passkeyState: mapPasskeyPrimaryState(readStr(raw, 'passkeyPrimaryState')),
    reentryReason: normalizeReentryReason(raw.reentryReason),
    operatorSummary: null
  }
}

function mapPasskeyPrimaryState(raw: string): 'ready' | 'retry_available' | 'unavailable' {
  if (raw === 'ready') return 'ready'
  if (raw === 'retry_available') return 'retry_available'
  return 'unavailable'
}

function normalizeReentryReason(raw: unknown): AuthEntryContext['reentryReason'] {
  const value = asRecord(raw)
  const code = readStr(value, 'code')
  if (!code) return null
  return {
    code: code as ReentryReasonCode[ReentryReasonCodeKey],
    label: reentryLabelFromCode(code),
    message: readStr(value, 'message')
  }
}

function reentryLabelFromCode(code: string): string {
  switch (code) {
    case 'session_expired':
      return 'Session expired'
    case 'security_reauth_required':
      return 'Re-auth required'
    case 'signed_out_elsewhere':
      return 'Signed out elsewhere'
    case 'admin_forced_reauth':
      return 'Admin forced re-auth'
    default:
      return 'Re-entry required'
  }
}

function normalizePasskeyAssertionOptions(raw: Record<string, unknown>): {
  passkeyAttemptId: string
  assertionOptions: Record<string, unknown>
  passkeyPrimaryState: 'ready' | 'retry_available'
  passwordFallbackAllowed: boolean
} {
  const state = readStr(raw, 'passkeyPrimaryState')
  if (state !== 'ready' && state !== 'retry_available') {
    throw new Error(`Authentication contract error: unexpected passkeyPrimaryState ${state}.`)
  }
  return {
    passkeyAttemptId: readRequired(raw, 'passkeyAttemptId'),
    assertionOptions: asRecord(raw.assertionOptions),
    passkeyPrimaryState: state,
    passwordFallbackAllowed: readBool(raw, 'passwordFallbackAllowed')
  }
}

// --- 低级读取辅助 ---

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function readStr(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function readBool(source: Record<string, unknown>, key: string): boolean {
  return source[key] === true
}

function readNum(source: Record<string, unknown>, key: string): number | null {
  const value = source[key]
  return typeof value === 'number' ? value : null
}

function readRequired(source: Record<string, unknown>, key: string): string {
  const value = readStr(source, key)
  if (!value) {
    throw new Error(`Authentication contract error: missing ${key}.`)
  }
  return value
}

function readMfaToken(source: Record<string, unknown>): string {
  return (
    readStr(source, 'mfaToken') ||
    readStr(source, 'mfa_token') ||
    (() => {
      throw new Error('Authentication contract error: missing mfaToken.')
    })()
  )
}

export { ApiError }
