export interface AuthenticatedUser {
  id?: number | string
  username: string
  email: string
  roles: string[]
}

export interface AuthenticatedSession {
  token: string
  refreshToken: string
  tokenTimeout: number | null
  refreshTokenTimeout: number | null
  user: AuthenticatedUser
  mfa: {
    totp: boolean
    passkey: boolean
    verified: boolean
  }
}

export interface PendingMfaSetup {
  qrCodeBase64?: string
  secretKey?: string
  accountName?: string
}

export interface TotpSetupResponse {
  qrCodeBase64: string
  secretKey: string
  accountName: string
}

export interface TotpEnableResponse {
  token: string
  refreshToken: string
  user: Partial<AuthenticatedUser>
  recoveryCode?: string
}

export interface PendingMfaState {
  token: string
  totp: boolean
  passkey: boolean
  email: string
  setup: PendingMfaSetup | null
  recoveryCode: string
  recoveryAcknowledged: boolean
}

export interface LoginRequest {
  account: string
  password: string
  type: 'PASSWORD'
}

export interface LoginResponse {
  mfaRequired?: boolean
  mfaToken?: string
  totp?: boolean
  passkey?: boolean
  token?: string
  refreshToken?: string
  tokenTimeout?: number | null
  refreshTokenTimeout?: number | null
  user?: Partial<AuthenticatedUser>
  id?: number | string
  username?: string
  email?: string
  roles?: string[]
}

export interface FirstAuthenticateResponse {
  mfaToken: string
  mfaRequired: boolean
  totp: boolean
  passkey: boolean
}

export interface StaffOption {
  id: number | string
  username?: string
  email?: string
  name?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  pageNum?: number
  pageSize?: number
  pages?: number
}

export interface OperationsSummaryView {
  onboardingPendingReviewCount?: number
  onboardingNearSlaCount?: number
  onboardingSupplementsCount?: number
  onboardingDecisionDueCount?: number
  openTicketCount?: number
  overdueTicketCount?: number
  complaintCount?: number
  renewalPendingCount?: number
  renewalExpiringSoonCount?: number
  renewalChurnRiskCount?: number
  collaborationPendingCount?: number
  collaborationOverdueCount?: number
  collaborationCrossModuleCount?: number
}

export interface OperationsTaskView {
  id: number | string
  queueTime?: string
  taskType?: string
  taskTypeLabel?: string
  merchantOrItemName?: string
  rowTitle?: string
  rowSummary?: string
  currentStageOrStatus?: string
  taskStateSummary?: string
  priorityLevel?: string
  priorityLevelLabel?: string
  slaState?: string
  slaStateLabel?: string
  actionTarget?: string
  referenceNo?: string
  owner?: string
  contextSummary?: string
}

export interface OperationsChartPointView {
  key?: string
  label?: string
  value?: number
}

export interface OperationsChartSeriesView {
  key?: string
  label?: string
  points?: OperationsChartPointView[]
}

export interface OperationsCustomerStatusChartView {
  generatedAt?: string
  trendWindowDays?: number
  trendSeries?: OperationsChartSeriesView[]
  statusDistribution?: OperationsChartPointView[]
}

export interface OperationsServicePulseChartView {
  generatedAt?: string
  trendWindowDays?: number
  trendSeries?: OperationsChartSeriesView[]
  stageMix?: OperationsChartPointView[]
  slaWatch?: OperationsChartPointView[]
}

export interface OpsHomeSummaryCardsView {
  onboardingCount: number
  supplementPendingCount: number
  slaWarningCount: number
  expiryCount: number
}

export interface OpsHomeTodoItemView {
  title: string
  sourceModule: 'onboarding' | 'merchant'
  priority: 'P0' | 'P1' | 'P2'
  viewAction: string
  processAction: string
  context?: string
}

export interface OpsHomeTodoListView {
  totalCount: number
  items: OpsHomeTodoItemView[]
}

export interface OpsHomeQuickActionModuleView {
  moduleId: string
  label: string
  target: string
}

export interface OpsHomeQuickActionsView {
  modules: OpsHomeQuickActionModuleView[]
}

export interface OpsHomeDataSourceStatusView {
  name: string
  label: string
  state: 'ok' | 'degraded' | 'unavailable' | 'deferred'
}

export interface OpsHomeSurfaceView {
  summaryCards: OpsHomeSummaryCardsView
  todoList: OpsHomeTodoListView
  quickActions: OpsHomeQuickActionsView
  dataSourceStatus: OpsHomeDataSourceStatusView[]
}

export interface OnboardingOptionView {
  code: string
  label: string
}

export interface OnboardingPaginationView {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface OnboardingListSummaryView {
  total: number
  blocked: number
  supplements: number
  handoffPending: number
}

export interface OnboardingFilterOptionsView {
  providerNeutralStateOptions: OnboardingOptionView[]
  responsibilityPartyOptions: OnboardingOptionView[]
  slaStateOptions: OnboardingOptionView[]
  assigneeOptions: OnboardingOptionView[]
  reviewerOptions: OnboardingOptionView[]
}

export interface OnboardingTicketContextView {
  ticketId: string
  ticketNumber: string
  displayStatus: string
  queue: string
  assignee: string
  sla: string
}

export interface OnboardingApplicationItemView {
  applicationId: string
  caseCode?: string
  merchantName: string
  merchantType: string
  currentStage: string
  currentStageLabel: string
  responsibilityParty?: string
  ageMinutes?: number
  slaState?: string
  assigneeName?: string
  reviewerName?: string
  handoffState?: string
  updatedAt?: string
  merchantManagementRef?: string
  merchantManagementLinkEnabled?: boolean
  blockingSignal?: string
  blockingReason?: string
  suggestedAction?: string
  submittedAt: string
  ticketContext?: OnboardingTicketContextView
}

export interface OnboardingListResponse {
  records: OnboardingApplicationItemView[]
  pagination: OnboardingPaginationView
  summary: OnboardingListSummaryView
  stageOptions: OnboardingOptionView[]
  filterOptions?: OnboardingFilterOptionsView
  defaultVisibilityRule?: string
}

export interface OnboardingWorkflowStatusView {
  currentStage: string
  currentStageLabel: string
  blockingSignal?: string
  blockingReason?: string
  suggestedAction?: string
}

export interface OnboardingVasDueDiligenceView {
  status: string
  currentState: string
}

export interface OnboardingCommunicationRecordView {
  timestamp: string
  type: string
  content: string
  author: string
}

export interface OnboardingFollowUpActionView {
  actionId: string
  label: string
  enabled: boolean
  disabledReason?: string
}

export interface OnboardingHandoffTraceView {
  timestamp: string
  eventType: string
  summary: string
}

export interface OnboardingManualReviewTaskView {
  taskKey?: string
  taskStatus?: 'OPEN' | 'CLOSED' | null
  assignedRole?: string
  assigneeName?: string
  reviewSummary?: string
  disabledReason?: string
}

export interface OnboardingReviewCoordinationView {
  manualReviewTask?: OnboardingManualReviewTaskView
  currentOwnerLabel: string
  nextInternalAction?: string
}

export interface OnboardingHandoffSummaryView {
  handoffState: string
  merchantRecordRef?: string
  canOpenMerchantManagement: boolean
  eligibilityNote: string
  blockedReason?: string
}

export interface OnboardingRefreshResponse {
  refreshResult: 'updated' | 'unchanged' | 'deferred'
  caseSummary: OnboardingApplicationItemView
  latestTraceEvents: OnboardingHandoffTraceView[]
}

export interface OnboardingTicketLinkView {
  ticketKey: string
  ticketCode: string
  openUrlRef: string
  returnUrlRef: string
}

export interface OnboardingMerchantManagementLinkView {
  caseKey: string
  handoffState: string
  merchantRecordRef?: string
  openUrlRef?: string
  disabledReason?: string
}

export interface OnboardingDetailView {
  application: OnboardingApplicationItemView
  workflowStatus: OnboardingWorkflowStatusView
  vasDueDiligence?: OnboardingVasDueDiligenceView
  ticketContext?: OnboardingTicketContextView
  reviewCoordination?: OnboardingReviewCoordinationView
  handoffSummary?: OnboardingHandoffSummaryView
  communicationRecords: OnboardingCommunicationRecordView[]
  followUpActions: OnboardingFollowUpActionView[]
  handoffTrace: OnboardingHandoffTraceView[]
}

export interface OpsMerchantOptionView {
  code: string
  label: string
}

export interface OpsMerchantPaginationView {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface OpsMerchantListSummaryView {
  total: number
  renewalWarning: number
  expired: number
}

export interface OpsMerchantFilterOptionsView {
  statusOptions: OpsMerchantOptionView[]
  tierOptions: OpsMerchantOptionView[]
  expiryRangeOptions: OpsMerchantOptionView[]
  sortOptions: OpsMerchantOptionView[]
}

export interface OpsMerchantListItemView {
  merchantId: string
  name: string
  type: string
  status: string
  statusLabel: string
  tier: string
  activityLevel: string
  expiryDate: string
}

export interface OpsMerchantListResponse {
  records: OpsMerchantListItemView[]
  pagination: OpsMerchantPaginationView
  summary: OpsMerchantListSummaryView
  filterOptions: OpsMerchantFilterOptionsView
}

export interface OpsMerchantGroupChatView {
  id: string
  name: string
  owner: string
}

export interface OpsMerchantOnboardingSourceView {
  applicationId: string
  kybCaseId: string
  handoffState: string
  handoffAt: string
  summary: string
}

export interface OpsMerchantTraceRecordView {
  timestamp: string
  type: string
  description: string
}

export interface OpsMerchantNotificationRecordView {
  id: string
  title: string
  type: string
  sentAt: string
  receiverCount: number
  status: string
}

export interface OpsMerchantProcessingActionView {
  actionId: string
  label: string
  targetUrl: string
  enabled: boolean
}

export interface OpsMerchantDetailView {
  merchant: OpsMerchantListItemView
  email?: string
  owner?: string
  groupChat?: OpsMerchantGroupChatView
  onboardingSource?: OpsMerchantOnboardingSourceView
  traceRecords: OpsMerchantTraceRecordView[]
  notificationRecords: OpsMerchantNotificationRecordView[]
  processingActions: OpsMerchantProcessingActionView[]
}

export interface FilterOptionView {
  code: string
  label: string
}

export interface CaseFilterOptionsView {
  views?: FilterOptionView[]
  currentStages?: FilterOptionView[]
  providerCodes?: FilterOptionView[]
  priorityLevels?: FilterOptionView[]
  slaStates?: FilterOptionView[]
  assignedRoles?: FilterOptionView[]
  processingStatuses?: FilterOptionView[]
  decisionStatuses?: FilterOptionView[]
}

export interface TaskFilterOptionsView {
  taskStatuses?: FilterOptionView[]
  currentStages?: FilterOptionView[]
  priorityLevels?: FilterOptionView[]
  slaStates?: FilterOptionView[]
  assignedRoles?: FilterOptionView[]
}

export interface MerchantFilterOptionsView {
  views?: FilterOptionView[]
  statuses?: FilterOptionView[]
  merchantTypes?: FilterOptionView[]
  watchBuckets?: FilterOptionView[]
}

export interface MerchantListSummaryView {
  totalCount: number
  activeCount: number
  inactiveCount: number
  onboardingCount: number
  renewalFollowUpCount?: number
  serviceWatchCount?: number
  vaspHandoffCount?: number
  overviewSummary?: string
}

export interface MerchantListItemView {
  id: number | string
  code?: string
  merchantName?: string
  rowTitle?: string
  rowSummary?: string
  statusLabel?: string
  merchantTypeLabel?: string
  email?: string
  industryType?: string
  updatedAt?: string
  onboardingCaseId?: number | string
  onboardingCaseNo?: string
  onboardingStatusLabel?: string
  onboardingSummary?: string
  detailTarget?: string
  onboardingTarget?: string
  copyValue?: string
}

export interface MerchantDetailView {
  id: number | string
  pageTitle?: string
  pageSummary?: string
  code?: string
  merchantName?: string
  statusLabel?: string
  merchantTypeLabel?: string
  industryType?: string
  email?: string
  creatorId?: number | string
  createTime?: string
  updateTime?: string
  overviewSummary?: string
  profileSummary?: string
  onboardingCaseId?: number | string
  onboardingCaseNo?: string
  onboardingStatusLabel?: string
  onboardingSummary?: string
  onboardingTarget?: string
  backToListTarget?: string
  copyValue?: string
}

export interface SummaryBucketView {
  code?: string
  label?: string
  count?: number
}

export interface CaseQueueSummaryView {
  pendingReview?: number
  nearSla?: number
  supplements?: number
  decisionDue?: number
  overviewSummary?: string
  stageBuckets?: SummaryBucketView[]
  slaBuckets?: SummaryBucketView[]
}

export interface TaskQueueSummaryView {
  open?: number
  assigned?: number
  unassigned?: number
  viewed?: number
  unviewed?: number
  nearSla?: number
  overviewSummary?: string
  taskStatusBuckets?: SummaryBucketView[]
  stageBuckets?: SummaryBucketView[]
  slaBuckets?: SummaryBucketView[]
}

export interface KybCaseListItemView {
  id: number | string
  reviewId?: string
  caseNo?: string
  merchantName?: string
  submittedAt?: string
  currentStageLabel?: string
  processingStatusLabel?: string
  decisionStatusLabel?: string
  priorityLevelLabel?: string
  slaStateLabel?: string
  owner?: string
  rowTitle?: string
  rowSummary?: string
}

export interface KybTaskListItemView {
  id: number | string
  caseId?: number | string
  caseTarget?: string
  rowTitle?: string
  rowSummary?: string
  taskStatusLabel?: string
  priorityLevelLabel?: string
  slaStateLabel?: string
  viewed?: boolean
}

export interface WorkbenchOverviewView {
  bootstrap?: {
    caseQueueSummary?: CaseQueueSummaryView
    taskQueueSummary?: TaskQueueSummaryView
    caseFilterOptions?: CaseFilterOptionsView
    taskFilterOptions?: TaskFilterOptionsView
  }
  casePage?: PageResult<KybCaseListItemView>
  taskPage?: PageResult<KybTaskListItemView>
}

export interface DetailInfoBlock {
  label?: string
  value?: string
}

export interface MerchantSummaryView {
  merchantName?: string
  statusLabel?: string
  summary?: string
}

export interface MerchantProfileView {
  profileCompletenessSummary?: string
  registrationSummary?: string
  contactSummary?: string
  legalRepresentative?: string
  contactEmail?: string
  licenseStatusLabel?: string
  licensingSummary?: string
  missingFieldCount?: number
}

export interface SessionView {
  providerLabel?: string
  flowModeLabel?: string
  sessionStatusLabel?: string
  providerReferenceSummary?: string
  lastLaunchedAt?: string
  lastCallbackAt?: string
  expireAt?: string
  nextActionHint?: string
  activitySummary?: string
}

export interface ChecklistItemView {
  typeLabel?: string
  statusLabel?: string
  itemSummary?: string
}

export interface DocumentChecklistView {
  overallStatusLabel?: string
  summary?: string
  submittedCount?: number
  missingCount?: number
  reviewPendingCount?: number
  submittedItems?: ChecklistItemView[]
  missingItems?: ChecklistItemView[]
  reviewPendingItems?: ChecklistItemView[]
}

export interface OwnershipComplianceNotesView {
  ownershipSummaryLabel?: string
  ownershipSummary?: string
  complianceSummaryLabel?: string
  complianceSummary?: string
  ownershipItems?: Array<{ label?: string; value?: string }>
  complianceItems?: Array<{ label?: string; value?: string }>
}

export interface DecisionPanelView {
  readinessStatusLabel?: string
  readinessSummary?: string
  primaryActionLabel?: string
  primaryActionReason?: string
  canApprove?: boolean
  canAssign?: boolean
  canRequestDocuments?: boolean
  canReject?: boolean
  requestDocumentsHint?: string
  assignHint?: string
  approveHint?: string
  rejectHint?: string
  blockingReason?: string
}

export interface ManualReviewTaskView {
  id: number | string
  taskNo?: string
  taskStatusLabel?: string
  assignedRoleLabel?: string
  assignedUserId?: number | string
  owner?: string
  assignAvailable?: boolean
  claimAvailable?: boolean
  taskStateSummary?: string
  viewed?: boolean
  markViewedAvailable?: boolean
  viewedByName?: string
  assignmentSummary?: string
  decisionSummary?: string
}

export interface ReviewLogItemView {
  sourceTypeLabel?: string
  actionCategoryLabel?: string
  displayAction?: string
  displayResult?: string
  actorName?: string
  createdAt?: string
  content?: string
}

export interface ProviderBindingView {
  providerLabel?: string
  bindingTypeLabel?: string
  providerObjectSummary?: string
  bindingStatusSummary?: string
}

export interface ProviderBackofficeLinkView {
  providerLabel?: string
  providerObjectTypeLabel?: string
  linkSummary?: string
  backofficeUrl?: string
}

export interface ProviderEventView {
  providerLabel?: string
  displayEventType?: string
  eventSummary?: string
  processingSummary?: string
  integritySummary?: string
  createdAt?: string
}

export interface KybCaseDetailView {
  id: number | string
  pageTitle?: string
  pageSummary?: string
  providerLabel?: string
  processingStatusLabel?: string
  decisionStatusLabel?: string
  reviewId?: string
  caseNo?: string
  subjectName?: string
  submittedAt?: string
  currentStageLabel?: string
  contextSummary?: string
  copyValue?: string
  object?: {
    merchantName?: string
    reviewId?: string
    jurisdiction?: string
    entityTypeLabel?: string
    submittedAt?: string
    merchantStatusLabel?: string
  }
  handlingContext?: {
    currentStageLabel?: string
    owner?: string
    latestEventAt?: string
    ownerSummary?: string
    slaStateLabel?: string
    slaSummary?: string
    gapSummary?: string
    decisionStateLabel?: string
    decisionRequirement?: string
    contextSummary?: string
  }
  merchant?: MerchantSummaryView
  merchantProfile?: MerchantProfileView
  latestSession?: SessionView
  documentChecklist?: DocumentChecklistView
  ownershipComplianceNotes?: OwnershipComplianceNotesView
  decisionPanel?: DecisionPanelView
  manualReviewTasks?: ManualReviewTaskView[]
  reviewLogs?: ReviewLogItemView[]
  providerBindings?: ProviderBindingView[]
  providerBackofficeLinks?: ProviderBackofficeLinkView[]
  providerEvents?: ProviderEventView[]
}

export interface ReentryReasonCode {
  PASSKEY_DEVICE_MIGRATION: 'passkey_device_migration'
  CREDENTIAL_RESET: 'credential_reset'
  SECURITY_POLICY_ENFORCEMENT: 'security_policy_enforcement'
  STRONG_AUTH_REQUIRED: 'strong_auth_required'
}
export type ReentryReasonCodeKey = keyof ReentryReasonCode

export interface ReentryReason {
  code: ReentryReasonCode[ReentryReasonCodeKey]
  label: string
  message: string
}

export type PasskeyPrimaryState = 'ready' | 'retry_available' | 'unavailable'
export type PasswordRevealState = 'collapsed' | 'expanded'

export interface AuthEntryContext {
  allowPasswordFallback: boolean
  passkeyState: PasskeyPrimaryState
  reentryReason: ReentryReason | null
  operatorSummary: {
    displayNameOrEmail: string
    identifiedEmail: string
  } | null
}

export interface RecoveryCodesDeliveryBundle {
  deliveryMode: 'display_once'
  recoveryCodes: string[]
  mustAcknowledgeSaved: true
  bundleVersion: string
}

export interface StrongAuthState {
  mfaToken: string
  totpEnrolled: boolean
  displayNameOrEmail: string
  identifiedEmail: string
  totpSetupId?: string
  qrCodeBase64?: string
  secretKeyMasked?: string
  accountName?: string
  recoveryDeliveryMode?: string
  issuedSession?: Record<string, unknown>
  postAuthRoute?: Record<string, unknown>
  passkeyFollowUpState?: string
  verificationReason?: { label: string; message: string }
  totpChallengeState:
    'ready' | 'pending' | 'verified' | 'recovery' | 'expired' | 'invalid_code' | 'too_many_attempts'
  recoveryModeState: 'totp_primary' | 'recovery_substep'
  recoveryCodes?: string[]
  recoveryAcknowledged?: boolean
  inlineErrorMessage?: string
}

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

export type EmployeeActivationStatus = 'pending_activation' | 'activated' | 'expired_activation'

export type EmployeeAccountStatus = 'enabled' | 'disabled'

export type AuthorizedDomainId =
  'operations' | 'risk' | 'compliance' | 'audit' | 'system_administration'

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

export interface EmployeePageQuery {
  pageNum: number
  pageSize: number
  status: 'all' | 'pending_activation' | 'active' | 'disabled' | 'expired'
  searchQuery: string
}

export interface EmployeeCreateInput {
  displayName: string
  email: string
  initialRoleCode: string
  authorizedDomainIds: AuthorizedDomainId[]
  defaultEntryId: AuthorizedDomainId | null
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

export type ActivationLinkStatus = 'valid' | 'expired' | 'already_activated' | 'invalid_token'

export type PasswordValidationState = 'idle' | 'valid' | 'invalid'
export type TotpVerificationInputState = 'idle' | 'verifying' | 'verified' | 'invalid'
export type PasskeyRegistrationState = 'idle' | 'registering' | 'registered' | 'failed'

export interface ActivationContextView {
  displayName: string
  email: string
  activationLinkStatus: ActivationLinkStatus
  currentStepIndex: number
  activationClearanceToken: string | null
  passwordRuleSet: string[]
  supportContactEntry: string | null
}

export interface ActivationPasswordResult {
  activationClearanceToken: string
  currentStepIndex: number
}

export interface ActivationTotpSetupMaterial {
  qrCodeUri: string
  manualKey: string
  currentStepIndex: number
}

export interface RecoveryCodesPayload {
  codes: string[]
  acknowledged: boolean
}

export interface ActivationTotpCompleteResult {
  recoveryCodesPayload: RecoveryCodesPayload
  currentStepIndex: number
}

export interface ActivationRecoveryAcknowledgeResult {
  acknowledged: boolean
  currentStepIndex: number
}

export interface ActivationPasskeyOptionsResult {
  passkeyRegistrationAttemptId: string | null
  registrationOptions: Record<string, unknown> | null
  passkeyCapabilityHint: {
    available: boolean
  }
  currentStepIndex: number
}

export interface ActivationPasskeyCompleteResult {
  passkeySetupState: 'configured'
  currentStepIndex: number
}

export interface ActivationCompleteResult {
  activationCompleted: boolean
  passkeySetupState: 'configured' | 'skipped'
  nextRoute: 'internal_auth_entry'
  signInHint: string | null
}
