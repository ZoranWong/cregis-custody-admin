// System Admin types — 系统管理类型定义

// ---- 员工管理 ----

export type EmployeeStatus = 'all' | 'pending_activation' | 'active' | 'disabled' | 'expired'

export type AuthorizedDomainId =
  'operations' | 'risk' | 'compliance' | 'audit' | 'system_administration'

export type EmployeeActivationStatus = 'pending_activation' | 'activated' | 'expired_activation'

export type EmployeeAccountStatus = 'enabled' | 'disabled'

export interface EmployeePageQuery {
  pageNum?: number
  pageSize?: number
  status?: EmployeeStatus
  searchQuery?: string
}

export interface EmployeeRowView {
  accountId: number | string
  displayName: string
  email: string
  activationStatus: EmployeeActivationStatus
  accountStatus: EmployeeAccountStatus
  initialRole: string | null
  roleCode: string | null
  authorizedDomainIds: AuthorizedDomainId[]
  defaultEntryId: AuthorizedDomainId | null
  lastSignIn: string | null
  availableActions: string[]
}

export interface EmployeeCreateInput {
  displayName: string
  email: string
  initialRoleCode: string
  authorizedDomainIds: AuthorizedDomainId[]
  defaultEntryId: AuthorizedDomainId
}

export interface EmployeeCreateResult {
  accountId: number | string
  activationStatus: EmployeeActivationStatus
  invitationState: string | null
  issuedAt: string | null
  expiresAt: string | null
  activationToken: string | null
  activationLinkPath: string | null
}

export interface EmployeeActivationReissueResult {
  accountId: number | string
  invitationState: string | null
  issuedAt: string | null
  expiresAt: string | null
  activationToken: string | null
  activationLinkPath: string | null
}

export interface EmployeePasswordResetResult {
  accountId: number | string
  resetMode: string | null
  temporaryResetState: string | null
}

export interface EmployeeAccessBindingView {
  accountId: number | string
  displayName: string
  email: string
  roleCode: string | null
  authorizedDomainIds: AuthorizedDomainId[]
  defaultEntryId: AuthorizedDomainId | null
}

export interface AccessReviewApplyResult {
  reviewRequestId: number | string | null
  reviewState: string | null
}

export interface DomainOption {
  id: AuthorizedDomainId
  label: string
}

export interface RoleOption {
  code: string
  label: string
}

// ---- 系统监控 ----

export interface SystemMonitorMetric {
  key: string
  label: string
  value: number
  trend: number
  unit: string
}

export interface SystemMonitorServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
}

export interface SystemMonitorResponse {
  metrics: SystemMonitorMetric[]
  services: SystemMonitorServiceStatus[]
}

// ---- 个人中心 ----

export type PasskeyStatusState = 'active' | 'not_configured' | 'requires_attention'
export type TotpStatusState = 'active' | 'not_configured' | 'requires_attention'
export type RecoveryCodesState = 'available' | 'needs_refresh' | 'unavailable'
export type PasswordFallbackState = 'available' | 'requires_attention'
export type SessionRiskTone = 'neutral' | 'warning'

export interface PersonalCenterAccountSummary {
  displayName: string
  email: string
  roleLabel: string
}

export interface PasskeyStatus {
  state: PasskeyStatusState
  summaryLabel: string
}

export interface FallbackSecurityStatus {
  totpState: TotpStatusState
  recoveryCodesState: RecoveryCodesState
  passwordFallbackState: PasswordFallbackState
  summaryLabel: string
}

export interface SessionRiskStatus {
  summaryLabel: string
  tone: SessionRiskTone
}

export interface PersonalCenterSessionSummary {
  sessionId: string
  deviceLabel: string
  lastActiveAt: string
  locationHint: string
}

export interface PersonalCenterActionEntry {
  destinationOrIntent: string
}

export interface PersonalCenterContactSupportEntry {
  destinationOrChannel: string
}

export interface PersonalCenterSummary {
  accountSummary: PersonalCenterAccountSummary
  passkeyStatus: PasskeyStatus
  fallbackSecurityStatus: FallbackSecurityStatus
  sessionRiskStatus: SessionRiskStatus
  currentSessionSummary: PersonalCenterSessionSummary
  otherSessionSummaries: PersonalCenterSessionSummary[]
  managePasskeyEntry: PersonalCenterActionEntry
  manageRecoveryCodesEntry: PersonalCenterActionEntry
  manageSessionsEntry: PersonalCenterActionEntry
  manageTotpEntry: PersonalCenterActionEntry
  changePasswordEntry: PersonalCenterActionEntry
  contactSupportEntry: PersonalCenterContactSupportEntry | null
}

export interface PersonalCenterSessionsView {
  currentSessionSummary: PersonalCenterSessionSummary
  otherSessionSummaries: PersonalCenterSessionSummary[]
  sessionRiskStatus: SessionRiskStatus
}

export interface PersonalCenterPasskeyRegistrationOptions {
  passkeyRegistrationAttemptId: string
  creationOptions: Record<string, unknown>
}

export interface PersonalCenterTotpSetupMaterial {
  totpSetupId: string
  qrCodeBase64: string
  manualKey: string
  accountName: string
}

export interface RecoveryCodesDeliveryBundle {
  deliveryMode: 'display_once'
  recoveryCodes: string[]
  mustAcknowledgeSaved: true
  bundleVersion: string
}

export interface PersonalCenterTotpSetupResult {
  totpState: 'active'
  recoveryCodesDeliveryBundle: RecoveryCodesDeliveryBundle
  recoveryCodesState: 'available'
}

export interface PersonalCenterPasswordChangeResult {
  passwordFallbackState: PasswordFallbackState
  summaryLabel: string
}

export interface RecoveryCodesRefreshResult {
  recoveryCodesDeliveryBundle: RecoveryCodesDeliveryBundle
  recoveryCodesState: 'available'
}

export interface SecuritySessionRevokeResult {
  revokedSessionId: string
  remainingOtherSessionCount: number
  sessionRiskStatus: SessionRiskStatus
}

export interface PersonalCenterPendingAction {
  kind:
    | 'manage_passkey'
    | 'manage_totp'
    | 'refresh_recovery_codes'
    | 'change_password'
    | 'revoke_session'
    | 'revoke_all_others'
  sessionId?: string
}
