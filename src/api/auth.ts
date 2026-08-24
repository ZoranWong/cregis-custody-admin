import { apiRequest, ApiError } from '@/utils/http/request'
import type {
  AuthenticatedSession,
  LoginRequest,
  LoginResponse,
  FirstAuthenticateResponse,
  TotpSetupResponse,
  TotpEnableResponse,
  AuthEntryContext,
  ReentryReasonCode,
  ReentryReasonCodeKey
} from '@/types/models'
import { normalizeBearer } from '@/utils/format'

// --- Helper functions ---

function readMfaToken(source: Record<string, unknown>): string {
  return (
    readString(source, 'mfaToken') ||
    readString(source, 'mfa_token') ||
    (() => {
      throw new Error('Authentication contract error: missing mfaToken.')
    })()
  )
}

function readUserFromResponse(data: Record<string, unknown>): Partial<AuthenticatedUser> {
  const user = asRecord(data.user)
  return {
    id: user.id as string | number,
    username: (user.username as string) || (user.email as string) || 'operator',
    email: (user.email as string) || '',
    roles: Array.isArray(user.roles) ? (user.roles as string[]) : []
  }
}

function buildSessionFromResponse(
  data: Record<string, unknown>,
  headers: Headers
): AuthenticatedSession {
  const headerToken = headers.get('Authorization') || headers.get('authorization')
  const token = (data.token as string) || normalizeBearer(headerToken)
  const user = readUserFromResponse(data)
  if (!token) throw new Error('Authentication response did not include a token.')
  return {
    token,
    refreshToken: (data.refreshToken as string) || '',
    tokenTimeout: (data.tokenTimeout as number) ?? null,
    refreshTokenTimeout: (data.refreshTokenTimeout as number) ?? null,
    user: {
      id: user.id,
      username: user.username || 'operator',
      email: user.email || '',
      roles: user.roles || []
    },
    mfa: { totp: true, passkey: false, verified: true }
  }
}

// --- Canonical passkey-first auth endpoints (FND-001) ---

export async function fetchAuthEntryContext(): Promise<AuthEntryContext> {
  const raw = await apiRequest<Record<string, unknown>>('/v1/auth/entry/context', {
    method: 'GET',
    auth: false
  })
  return normalizeAuthEntryContext(raw)
}

export async function fetchPasskeyAssertionOptions(): Promise<{
  passkeyAttemptId: string
  assertionOptions: Record<string, unknown>
  passkeyPrimaryState: 'ready' | 'retry_available'
  passwordFallbackAllowed: boolean
}> {
  const raw = await apiRequest<Record<string, unknown>>('/v1/auth/passkey/assertion/options', {
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
  })
  return normalizePasskeyAssertionOptions(raw)
}

export async function completePasskeyAssertion(
  passkeyAttemptId: string,
  credential: Record<string, unknown>
): Promise<{
  result: 'authenticated_session_issued'
  session: AuthenticatedSession
  postAuthRoute: PostAuthRoute
}> {
  const response = (await apiRequest<Record<string, unknown>>(
    '/v1/auth/passkey/assertion/complete',
    {
      method: 'POST',
      auth: false,
      body: { passkey_attempt_id: passkeyAttemptId, credential },
      includeMeta: true
    }
  )) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  const sip = (data.session_issue_payload as Record<string, unknown>) || {}
  const postAuthRoute = normalizePostAuthRoute(data.post_auth_route)
  persistPendingAuthDestination(postAuthRoute)
  return {
    result: 'authenticated_session_issued',
    session: buildSessionFromIssuePayload(sip, response.headers),
    postAuthRoute
  }
}

// --- New auth endpoints ---

export async function firstAuthenticate(
  account: string,
  password: string
): Promise<FirstAuthenticateResponse> {
  const body: Record<string, string> = { account, password, type: 'PASSWORD' }
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/login', {
    method: 'POST',
    auth: false,
    body,
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return {
    mfaToken: readMfaToken(data),
    mfaRequired: data.mfaRequired === true,
    totp: data.totp === true,
    passkey: data.passkey === true
  }
}

export async function setupTotp(mfaToken: string): Promise<TotpSetupResponse> {
  const raw = await apiRequest<Record<string, unknown>>('/v1/auth/mfa/settings/totp/setup', {
    method: 'POST',
    auth: false,
    body: { mfaToken }
  })
  return {
    qrCodeBase64: readRequiredString(raw, 'qrCodeBase64'),
    secretKey: readRequiredString(raw, 'secretKey'),
    accountName: readRequiredString(raw, 'accountName')
  }
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
    token: readRequiredString(data, 'token'),
    refreshToken: readString(data, 'refreshToken') || '',
    user: readUserFromResponse(data),
    recoveryCode: readString(data, 'recoveryCode')
  }
}

export async function verifyTotpChallenge(
  mfaToken: string,
  code: string
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/totp/verify', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code, type: 'GOOGLE_CODE' },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return buildSessionFromResponse(data, response.headers)
}

export async function verifyRecoveryCode(
  mfaToken: string,
  recoveryCode: string
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/totp/verify', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code: recoveryCode, type: 'RECOVERY_CODE' },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return buildSessionFromResponse(data, response.headers)
}

// --- Passkey normalizers ---

function normalizeAuthEntryContext(raw: Record<string, unknown>): AuthEntryContext {
  const re = raw.reentry_reason == null ? null : asRecord(raw.reentry_reason)
  const allowPasswordFallback = raw.password_fallback_allowed
  if (typeof allowPasswordFallback !== 'boolean') {
    throw new Error('Authentication contract error: missing password_fallback_allowed.')
  }
  return {
    allowPasswordFallback,
    passkeyState: mapPasskeyPrimaryState(readString(raw, 'passkey_primary_state')),
    reentryReason: re
      ? {
          code: readRequiredString(re, 'code') as ReentryReasonCode[ReentryReasonCodeKey],
          label: reentryLabelFromCode(readString(re, 'code')),
          message: readString(re, 'message') || ''
        }
      : null,
    operatorSummary: null
  }
}

function mapPasskeyPrimaryState(
  raw: string | undefined
): 'ready' | 'retry_available' | 'unavailable' {
  if (raw === 'ready') return 'ready'
  if (raw === 'temporarily_unavailable') return 'unavailable'
  if (raw === 'retry_available') return 'retry_available'
  throw new Error('Authentication contract error: missing passkey_primary_state.')
}

function reentryLabelFromCode(code: string | undefined): string {
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
  const passkeyPrimaryState = readRequiredString(raw, 'passkey_primary_state')
  if (passkeyPrimaryState !== 'ready' && passkeyPrimaryState !== 'retry_available') {
    throw new Error(
      `Authentication contract error: unexpected passkey_primary_state ${passkeyPrimaryState}.`
    )
  }
  const passwordFallbackAllowed = raw.password_fallback_allowed
  if (typeof passwordFallbackAllowed !== 'boolean') {
    throw new Error('Authentication contract error: missing password_fallback_allowed.')
  }
  return {
    passkeyAttemptId: readRequiredString(raw, 'passkey_attempt_id'),
    assertionOptions: asRecord(raw.assertion_options),
    passkeyPrimaryState,
    passwordFallbackAllowed
  }
}

// --- Internal helpers used by passkey flow ---

function normalizePostAuthRoute(raw: unknown): PostAuthRoute {
  const par = asRecord(raw)
  const routeTarget = readRequiredString(par, 'route_target') as PostAuthRoute['routeTarget']
  if (routeTarget !== 'workbench_entry' && routeTarget !== 'controlled_handoff') {
    throw new Error(`Authentication contract error: unexpected route_target ${routeTarget}.`)
  }
  return {
    routeTarget,
    authorizedEntryIds: readRequiredStringArray(par, 'authorized_entry_ids'),
    currentEntryId: readNullableString(par, 'current_entry_id'),
    handoffReasonSummary: readNullableString(par, 'handoff_reason_summary')
  }
}

function buildSessionFromIssuePayload(
  sip: Record<string, unknown>,
  headers: Headers
): AuthenticatedSession {
  const headerToken = headers.get('Authorization') || headers.get('authorization')
  const token = (sip.token as string) || normalizeBearer(headerToken)
  const user = (sip.user as Record<string, unknown>) || {}
  const mfa = (sip.mfa as Record<string, unknown>) || {}
  if (!token) {
    throw new Error('Authentication response did not include a token.')
  }
  return {
    token,
    refreshToken: (sip.refreshToken as string) || '',
    tokenTimeout: (sip.tokenTimeout as number) ?? null,
    refreshTokenTimeout: (sip.refreshTokenTimeout as number) ?? null,
    user: {
      id: user.id as string | number,
      username: (user.username as string) || (user.email as string) || 'operator',
      email: (user.email as string) || '',
      roles: Array.isArray(user.roles) ? (user.roles as string[]) : []
    },
    mfa: {
      totp: (mfa.totp as boolean) ?? true,
      passkey: (mfa.passkey as boolean) ?? false,
      verified: (mfa.verified as boolean) ?? true
    }
  }
}

// --- Storage helpers for passkey flow ---

const PENDING_AUTH_DESTINATION_KEY = 'AUTH_PENDING_DESTINATION'

function getAuthMemoryStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function persistPendingAuthDestination(postAuthRoute: PostAuthRoute): void {
  const storage = getAuthMemoryStorage()
  if (!storage) {
    return
  }
  const snapshot: PendingAuthDestination = {
    postAuthRoute,
    returnTarget: null
  }
  storage.setItem(PENDING_AUTH_DESTINATION_KEY, JSON.stringify(snapshot))
}

function readPendingAuthDestination(): PendingAuthDestination | null {
  const storage = getAuthMemoryStorage()
  if (!storage) {
    return null
  }
  const raw = storage.getItem(PENDING_AUTH_DESTINATION_KEY)
  if (!raw) {
    return null
  }
  try {
    const value = JSON.parse(raw) as PendingAuthDestination
    if (!value?.postAuthRoute?.routeTarget) {
      return null
    }
    return {
      postAuthRoute: value.postAuthRoute,
      returnTarget: value.returnTarget ?? null
    }
  } catch {
    return null
  }
}

export function peekPendingAuthDestination(): PendingAuthDestination | null {
  return readPendingAuthDestination()
}

export function consumePendingAuthDestination(): PendingAuthDestination | null {
  const snapshot = readPendingAuthDestination()
  clearPendingAuthDestination()
  return snapshot
}

export function clearPendingAuthDestination(): void {
  const storage = getAuthMemoryStorage()
  storage?.removeItem(PENDING_AUTH_DESTINATION_KEY)
}

// --- Utility functions ---

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

function readNullableString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key]
  if (value == null) {
    return null
  }
  return typeof value === 'string' ? value : null
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
  const value = readString(source, key)
  if (!value) {
    throw new Error(`Authentication contract error: missing ${key}.`)
  }
  return value
}

function readRequiredTrue(source: Record<string, unknown>, key: string): true {
  const value = source[key]
  if (value !== true) {
    throw new Error(`Authentication contract error: missing ${key}.`)
  }
  return true
}

function readRequiredStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key]
  if (!Array.isArray(value)) {
    throw new Error(`Authentication contract error: missing ${key}.`)
  }
  return value.filter((item): item is string => typeof item === 'string')
}

// --- Types ---

export interface PendingAuthDestination {
  postAuthRoute: PostAuthRoute
  returnTarget: string | null
}

export type PostAuthRoute = {
  routeTarget: 'workbench_entry' | 'controlled_handoff'
  authorizedEntryIds: string[]
  currentEntryId: string | null
  handoffReasonSummary: string | null
}

export type AuthenticatedUser = {
  id?: number | string
  username: string
  email: string
  roles: string[]
}

export { ApiError }
