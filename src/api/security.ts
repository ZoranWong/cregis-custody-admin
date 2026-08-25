// v2 API — Security (个人中心安全)
// 参考: cregis-custody-manager/docs/cregis-custody-new/frontend/admin/src/api/security.ts
import { apiRequest } from '@/utils/http/request'
import type {
  PasskeyStatus,
  PersonalCenterSessionSummary,
  PersonalCenterSummary,
  PersonalCenterSessionsView,
  PersonalCenterPasskeyRegistrationOptions,
  PersonalCenterTotpSetupMaterial,
  PersonalCenterTotpSetupResult,
  PersonalCenterPasswordChangeResult,
  RecoveryCodesDeliveryBundle,
  RecoveryCodesRefreshResult,
  SecuritySessionRevokeResult,
  SessionRiskStatus,
  FallbackSecurityStatus,
  PasskeyStatusState,
  TotpStatusState,
  RecoveryCodesState,
  PasswordFallbackState,
  SessionRiskTone,
  PersonalCenterActionEntry,
  PersonalCenterContactSupportEntry
} from '@/features/system-admin/types'

const REVOKE_ALL_OTHERS_SENTINEL = '__all_others__'

<<<<<<< HEAD
=======
// TODO(FND): /v1/auth/security/summary 与 /sessions、/sessions/{id}/revoke 在
// docs/custody-admin.openapi.yaml 中暂无对应端点，待后端补充后对齐。
>>>>>>> worktree-menu-restructure
export async function fetchPersonalCenterSummary(): Promise<PersonalCenterSummary> {
  const raw = (await apiRequest('/v1/auth/security/summary')) as Record<string, unknown>
  return normalizePersonalCenterSummary(raw)
}

export async function fetchPersonalCenterSessions(): Promise<PersonalCenterSessionsView> {
  const raw = (await apiRequest('/v1/auth/security/sessions')) as Record<string, unknown>
  return normalizePersonalCenterSessions(raw)
}

export async function fetchPasskeyRegistrationOptions(): Promise<PersonalCenterPasskeyRegistrationOptions> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/passkey/registration/options', {
=======
  const raw = (await apiRequest('/v1/auth/passkey/registration/options', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {}
  })) as Record<string, unknown>
  return {
    passkeyRegistrationAttemptId: readStr(raw, 'passkey_registration_attempt_id'),
    creationOptions: readRecord(raw, 'creation_options')
  }
}

export async function completePasskeyRegistration(
  passkeyRegistrationAttemptId: string,
  credential: Record<string, unknown>
): Promise<PasskeyStatus> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/passkey/registration/complete', {
=======
  const raw = (await apiRequest('/v1/auth/passkey/registration/complete', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {
      passkey_registration_attempt_id: passkeyRegistrationAttemptId,
      credential
    }
  })) as Record<string, unknown>
  return normalizePasskeyStatus(raw)
}

export async function bootstrapPersonalCenterTotp(): Promise<PersonalCenterTotpSetupMaterial> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/totp/setup/bootstrap', {
=======
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/setup', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {}
  })) as Record<string, unknown>
  return {
    totpSetupId: readStr(raw, 'totp_setup_id'),
    qrCodeBase64: readStr(raw, 'qr_code_base64'),
    manualKey: readStr(raw, 'manual_key'),
    accountName: readStr(raw, 'account_name')
  }
}

export async function completePersonalCenterTotp(
  totpSetupId: string,
  code: string
): Promise<PersonalCenterTotpSetupResult> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/totp/setup/complete', {
=======
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/enable', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {
      totp_setup_id: totpSetupId,
      code
    }
  })) as Record<string, unknown>
  return {
    totpState: 'active',
    recoveryCodesDeliveryBundle: normalizeRecoveryCodesDeliveryBundle(
      readRecord(raw, 'recovery_codes_delivery_bundle')
    ),
    recoveryCodesState: 'available'
  }
}

export async function refreshRecoveryCodes(): Promise<RecoveryCodesRefreshResult> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/recovery-codes/refresh', {
=======
  const raw = (await apiRequest('/v1/auth/mfa/settings/totp/recoveryCodes/refresh', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {}
  })) as Record<string, unknown>
  return {
    recoveryCodesDeliveryBundle: normalizeRecoveryCodesDeliveryBundle(
      readRecord(raw, 'recovery_codes_delivery_bundle')
    ),
    recoveryCodesState: 'available'
  }
}

export async function changePersonalCenterPassword(
  currentPassword: string,
  nextPassword: string
): Promise<PersonalCenterPasswordChangeResult> {
<<<<<<< HEAD
  const raw = (await apiRequest('/v1/auth/security/password/change', {
=======
  const raw = (await apiRequest('/system/staff/update/password', {
>>>>>>> worktree-menu-restructure
    method: 'POST',
    body: {
      current_password: currentPassword,
      next_password: nextPassword
    }
  })) as Record<string, unknown>
  return {
    passwordFallbackState: normalizePasswordFallbackState(readStr(raw, 'password_fallback_state')),
    summaryLabel: readStr(raw, 'summary_label')
  }
}

export async function revokeSecuritySession(
  sessionId: string
): Promise<SecuritySessionRevokeResult> {
  const raw = (await apiRequest(
    `/v1/auth/security/sessions/${encodeURIComponent(sessionId)}/revoke`,
    { method: 'POST', body: {} }
  )) as Record<string, unknown>
  return {
    revokedSessionId: readStr(raw, 'revoked_session_id'),
    remainingOtherSessionCount: readNum(raw, 'remaining_other_session_count'),
    sessionRiskStatus: normalizeSessionRiskStatus(readRecord(raw, 'session_risk_status'))
  }
}

export async function revokeAllOtherSecuritySessions(): Promise<SecuritySessionRevokeResult> {
  return revokeSecuritySession(REVOKE_ALL_OTHERS_SENTINEL)
}

// ---- 规范化函数 ----

function normalizePersonalCenterSummary(raw: Record<string, unknown>): PersonalCenterSummary {
  return {
    accountSummary: {
      displayName: readStr(readRecord(raw, 'account_summary'), 'display_name'),
      email: readStr(readRecord(raw, 'account_summary'), 'email'),
      roleLabel: readStr(readRecord(raw, 'account_summary'), 'role_label')
    },
    passkeyStatus: normalizePasskeyStatus(readRecord(raw, 'passkey_status')),
    fallbackSecurityStatus: normalizeFallbackSecurityStatus(
      readRecord(raw, 'fallback_security_status')
    ),
    sessionRiskStatus: normalizeSessionRiskStatus(readRecord(raw, 'session_risk_status')),
    currentSessionSummary: normalizeSessionSummary(readRecord(raw, 'current_session_summary')),
    otherSessionSummaries: readRecordArray(raw, 'other_session_summaries').map(
      normalizeSessionSummary
    ),
    managePasskeyEntry: normalizeActionEntry(readRecord(raw, 'manage_passkey_entry')),
    manageRecoveryCodesEntry: normalizeActionEntry(readRecord(raw, 'manage_recovery_codes_entry')),
    manageSessionsEntry: normalizeActionEntry(readRecord(raw, 'manage_sessions_entry')),
    manageTotpEntry: normalizeActionEntry(readRecord(raw, 'manage_totp_entry')),
    changePasswordEntry: normalizeActionEntry(readRecord(raw, 'change_password_entry')),
    contactSupportEntry: normalizeContactSupportEntry(raw.contact_support_entry)
  }
}

function normalizePersonalCenterSessions(raw: Record<string, unknown>): PersonalCenterSessionsView {
  return {
    currentSessionSummary: normalizeSessionSummary(readRecord(raw, 'current_session_summary')),
    otherSessionSummaries: readRecordArray(raw, 'other_session_summaries').map(
      normalizeSessionSummary
    ),
    sessionRiskStatus: normalizeSessionRiskStatus(readRecord(raw, 'session_risk_status'))
  }
}

function normalizePasskeyStatus(raw: Record<string, unknown>): PasskeyStatus {
  return {
    state: normalizePasskeyStatusState(readStr(raw, 'state')),
    summaryLabel: readStr(raw, 'summary_label')
  }
}

function normalizeFallbackSecurityStatus(raw: Record<string, unknown>): FallbackSecurityStatus {
  return {
    totpState: normalizeTotpStatusState(readStr(raw, 'totp_state')),
    recoveryCodesState: normalizeRecoveryCodesState(readStr(raw, 'recovery_codes_state')),
    passwordFallbackState: normalizePasswordFallbackState(readStr(raw, 'password_fallback_state')),
    summaryLabel: readStr(raw, 'summary_label')
  }
}

function normalizeSessionRiskStatus(raw: Record<string, unknown>): SessionRiskStatus {
  return {
    summaryLabel: readStr(raw, 'summary_label'),
    tone: normalizeSessionRiskTone(readStr(raw, 'tone'))
  }
}

function normalizeSessionSummary(raw: Record<string, unknown>): PersonalCenterSessionSummary {
  return {
    sessionId: readStr(raw, 'session_id'),
    deviceLabel: readStr(raw, 'device_label'),
    lastActiveAt: readStr(raw, 'last_active_at'),
    locationHint: readStr(raw, 'location_hint')
  }
}

function normalizeRecoveryCodesDeliveryBundle(
  raw: Record<string, unknown>
): RecoveryCodesDeliveryBundle {
  return {
    deliveryMode: 'display_once',
    recoveryCodes: readStringArray(raw, 'recovery_codes'),
    mustAcknowledgeSaved: true,
    bundleVersion: readStr(raw, 'bundle_version')
  }
}

function normalizeActionEntry(raw: Record<string, unknown>): PersonalCenterActionEntry {
  return {
    destinationOrIntent: readStr(raw, 'destination_or_intent')
  }
}

function normalizeContactSupportEntry(raw: unknown): PersonalCenterContactSupportEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  return {
    destinationOrChannel: readStr(record, 'destination_or_channel')
  }
}

function normalizePasskeyStatusState(value: string): PasskeyStatusState {
  return value === 'active' || value === 'requires_attention' ? value : 'not_configured'
}

function normalizeTotpStatusState(value: string): TotpStatusState {
  return value === 'active' || value === 'requires_attention' ? value : 'not_configured'
}

function normalizeRecoveryCodesState(value: string): RecoveryCodesState {
  return value === 'available' || value === 'needs_refresh' ? value : 'unavailable'
}

function normalizePasswordFallbackState(value: string): PasswordFallbackState {
  return value === 'requires_attention' ? 'requires_attention' : 'available'
}

function normalizeSessionRiskTone(value: string): SessionRiskTone {
  return value === 'warning' ? 'warning' : 'neutral'
}

// ---- 低级读取辅助 ----

function readStr(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function readNum(source: Record<string, unknown>, key: string): number {
  const value = source[key]
  return typeof value === 'number' ? value : Number(value || 0)
}

function readRecord(source: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = source[key]
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readRecordArray(source: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = source[key]
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object' && !Array.isArray(item)
      )
    : []
}

function readStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key]
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
}
