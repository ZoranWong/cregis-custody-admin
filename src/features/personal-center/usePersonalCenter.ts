import { computed, onMounted, ref } from 'vue'
import {
  bootstrapPersonalCenterTotp,
  changePersonalCenterPassword,
  completePasskeyRegistration,
  completePersonalCenterTotp,
  fetchPasskeyRegistrationOptions,
  fetchPersonalCenterSessions,
  fetchPersonalCenterSummary,
  refreshRecoveryCodes,
  revokeAllOtherSecuritySessions,
  revokeSecuritySession
} from '@/api/security'
import type {
  PersonalCenterPendingAction,
  PersonalCenterSessionSummary,
  PersonalCenterSummary,
  PersonalCenterTotpSetupMaterial,
  PersonalCenterTotpSetupResult,
  RecoveryCodesDeliveryBundle
} from '@/features/system-admin/types'
import { runPasskeyRegistration } from '@/utils/webauthn'

const PERSONAL_CENTER_PENDING_ACTION_KEY = 'PERSONAL_CENTER_PENDING_ACTION'

export function usePersonalCenter() {
  const loading = ref(false)
  const refreshingRecoveryCodes = ref(false)
  const registeringPasskey = ref(false)
  const refreshingSessions = ref(false)
  const revokingSessionId = ref('')
  const summary = ref<PersonalCenterSummary | null>(null)
  const recoveryBundle = ref<RecoveryCodesDeliveryBundle | null>(null)
  const totpSetup = ref<PersonalCenterTotpSetupMaterial | null>(null)
  const loadError = ref('')
  const passwordChangeSummary = ref('')
  const activeDialog = ref<
    'passkey' | 'totp' | 'recovery' | 'password' | 'revoke-single' | 'revoke-all' | null
  >(null)
  const revokeTargetSessionId = ref('')
  const pendingAction = ref<PersonalCenterPendingAction | null>(readPendingAction())
  const passkeySupported =
    typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials

  const currentSession = computed(() => summary.value?.currentSessionSummary ?? null)
  const otherSessions = computed(() => summary.value?.otherSessionSummaries ?? [])

  async function load(force = false): Promise<void> {
    if (loading.value && !force) return
    loading.value = true
    loadError.value = ''
    try {
      summary.value = await fetchPersonalCenterSummary()
    } catch (caught) {
      loadError.value = readMessage(caught, 'Unable to load Personal Center.')
    } finally {
      loading.value = false
    }
  }

  async function refreshSessions(): Promise<void> {
    if (!summary.value || refreshingSessions.value) return
    refreshingSessions.value = true
    try {
      const sessions = await fetchPersonalCenterSessions()
      summary.value = {
        ...summary.value,
        currentSessionSummary: sessions.currentSessionSummary,
        otherSessionSummaries: sessions.otherSessionSummaries,
        sessionRiskStatus: sessions.sessionRiskStatus
      }
    } catch {
      /* toast handled elsewhere */
    } finally {
      refreshingSessions.value = false
    }
  }

  function openPasskeyDialog(): void {
    activeDialog.value = 'passkey'
  }

  async function managePasskey(): Promise<void> {
    if (!passkeySupported || registeringPasskey.value) return
    registeringPasskey.value = true
    try {
      const options = await fetchPasskeyRegistrationOptions()
      const credential = await runPasskeyRegistration(
        options.creationOptions,
        summary.value?.accountSummary.email || ''
      )
      const passkeyStatus = await completePasskeyRegistration(
        options.passkeyRegistrationAttemptId,
        credential
      )
      if (summary.value) {
        summary.value = { ...summary.value, passkeyStatus }
      }
      activeDialog.value = null
    } catch {
      /* toast handled elsewhere */
    } finally {
      registeringPasskey.value = false
    }
  }

  function openRecoveryDialog(): void {
    activeDialog.value = 'recovery'
  }

  async function manageRecoveryCodes(): Promise<void> {
    activeDialog.value = 'recovery'
    if (refreshingRecoveryCodes.value) return
    refreshingRecoveryCodes.value = true
    try {
      const result = await refreshRecoveryCodes()
      recoveryBundle.value = result.recoveryCodesDeliveryBundle
      if (summary.value) {
        summary.value = {
          ...summary.value,
          fallbackSecurityStatus: {
            ...summary.value.fallbackSecurityStatus,
            recoveryCodesState: result.recoveryCodesState,
            summaryLabel: 'TOTP and recovery codes are available'
          }
        }
      }
    } catch {
      /* toast handled elsewhere */
    } finally {
      refreshingRecoveryCodes.value = false
    }
  }

  function openRevokeSessionDialog(sessionId: string): void {
    revokeTargetSessionId.value = sessionId
    activeDialog.value = 'revoke-single'
  }

  async function revokeSession(session: PersonalCenterSessionSummary): Promise<boolean> {
    if (!summary.value || !session.sessionId || revokingSessionId.value) return false
    revokingSessionId.value = session.sessionId
    try {
      const result = await revokeSecuritySession(session.sessionId)
      summary.value = {
        ...summary.value,
        otherSessionSummaries: summary.value.otherSessionSummaries.filter(
          (item) => item.sessionId !== result.revokedSessionId
        ),
        sessionRiskStatus: result.sessionRiskStatus
      }
      activeDialog.value = null
      revokeTargetSessionId.value = ''
      return true
    } catch {
      return false
    } finally {
      revokingSessionId.value = ''
    }
  }

  async function confirmRevokeSession(): Promise<boolean> {
    const session = summary.value?.otherSessionSummaries.find(
      (item) => item.sessionId === revokeTargetSessionId.value
    )
    if (!session) {
      revokeTargetSessionId.value = ''
      activeDialog.value = null
      return false
    }
    return revokeSession(session)
  }

  function openPasswordDialog(): void {
    activeDialog.value = 'password'
  }

  function openRevokeAllDialog(): void {
    activeDialog.value = 'revoke-all'
  }

  async function bootstrapTotpDialog(): Promise<void> {
    activeDialog.value = 'totp'
    try {
      totpSetup.value = await bootstrapPersonalCenterTotp()
    } catch {
      /* toast handled elsewhere */
    }
  }

  async function completeTotpDialog(code: string): Promise<PersonalCenterTotpSetupResult | null> {
    if (!totpSetup.value?.totpSetupId) return null
    try {
      const result = await completePersonalCenterTotp(totpSetup.value.totpSetupId, code)
      recoveryBundle.value = result.recoveryCodesDeliveryBundle
      if (summary.value) {
        summary.value = {
          ...summary.value,
          fallbackSecurityStatus: {
            ...summary.value.fallbackSecurityStatus,
            totpState: result.totpState,
            recoveryCodesState: result.recoveryCodesState,
            summaryLabel: 'TOTP and recovery codes are available'
          }
        }
      }
      activeDialog.value = 'recovery'
      return result
    } catch {
      return null
    }
  }

  async function submitPasswordChange(
    currentPassword: string,
    nextPassword: string
  ): Promise<boolean> {
    activeDialog.value = 'password'
    try {
      const result = await changePersonalCenterPassword(currentPassword, nextPassword)
      passwordChangeSummary.value = result.summaryLabel
      if (summary.value) {
        summary.value = {
          ...summary.value,
          fallbackSecurityStatus: {
            ...summary.value.fallbackSecurityStatus,
            passwordFallbackState: result.passwordFallbackState,
            summaryLabel: 'TOTP, recovery codes, and password fallback are available'
          }
        }
      }
      activeDialog.value = null
      return true
    } catch {
      return false
    }
  }

  async function revokeAllOthers(): Promise<boolean> {
    activeDialog.value = 'revoke-all'
    try {
      const result = await revokeAllOtherSecuritySessions()
      if (summary.value) {
        summary.value = {
          ...summary.value,
          otherSessionSummaries: [],
          sessionRiskStatus: result.sessionRiskStatus
        }
      }
      activeDialog.value = null
      return true
    } catch {
      return false
    }
  }

  function clearDialogState(): void {
    const closingDialog = activeDialog.value
    activeDialog.value = null
    totpSetup.value = null
    revokeTargetSessionId.value = ''
    passwordChangeSummary.value = ''
    if (closingDialog === 'recovery') {
      recoveryBundle.value = null
    }
  }

  function restorePendingAction(): void {
    if (!pendingAction.value) return
    const action = pendingAction.value
    pendingAction.value = null
    persistPendingAction(null)
    if (action.kind === 'manage_passkey') {
      activeDialog.value = 'passkey'
      return
    }
    if (action.kind === 'manage_totp') {
      void bootstrapTotpDialog()
      return
    }
    if (action.kind === 'refresh_recovery_codes') {
      activeDialog.value = 'recovery'
      return
    }
    if (action.kind === 'change_password') {
      activeDialog.value = 'password'
      return
    }
    if (action.kind === 'revoke_all_others') {
      activeDialog.value = 'revoke-all'
      return
    }
    if (action.kind === 'revoke_session' && action.sessionId) {
      revokeTargetSessionId.value = action.sessionId
      activeDialog.value = 'revoke-single'
    }
  }

  onMounted(() => {
    void load()
    restorePendingAction()
  })

  return {
    loading,
    refreshingRecoveryCodes,
    registeringPasskey,
    refreshingSessions,
    revokingSessionId,
    summary,
    currentSession,
    otherSessions,
    recoveryBundle,
    totpSetup,
    loadError,
    passkeySupported,
    passwordChangeSummary,
    activeDialog,
    revokeTargetSessionId,
    pendingAction,
    load,
    refreshSessions,
    openPasskeyDialog,
    managePasskey,
    openRecoveryDialog,
    manageRecoveryCodes,
    openRevokeSessionDialog,
    revokeSession,
    confirmRevokeSession,
    bootstrapTotpDialog,
    completeTotpDialog,
    openPasswordDialog,
    submitPasswordChange,
    openRevokeAllDialog,
    revokeAllOthers,
    clearDialogState
  }
}

function persistPendingAction(action: PersonalCenterPendingAction | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!action) {
      window.sessionStorage.removeItem(PERSONAL_CENTER_PENDING_ACTION_KEY)
      return
    }
    window.sessionStorage.setItem(PERSONAL_CENTER_PENDING_ACTION_KEY, JSON.stringify(action))
  } catch {
    /* ignore storage errors */
  }
}

function readPendingAction(): PersonalCenterPendingAction | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(PERSONAL_CENTER_PENDING_ACTION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as PersonalCenterPendingAction
    return value?.kind ? value : null
  } catch {
    return null
  }
}

function readMessage(caught: unknown, fallback: string): string {
  return caught instanceof Error && caught.message ? caught.message : fallback
}
