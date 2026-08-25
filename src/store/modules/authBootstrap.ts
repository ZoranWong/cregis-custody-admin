// v2 store — 认证引导流程管理
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface PendingMfaSetup {
  qrCodeBase64?: string
  secretKey?: string
  accountName?: string
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
export interface PostAuthRoute {
  routeTarget: string
  authorizedEntryIds: string[]
  currentEntryId?: string | null
}
export interface StrongAuthState {
  mfaToken: string
  totpEnrolled?: boolean
  totpSetupComplete?: boolean
  totpSetupId?: string
  qrCodeBase64?: string
  secretKeyMasked?: string
  accountName?: string
  issuedSession?: Record<string, unknown>
  postAuthRoute?: Record<string, unknown>
  displayNameOrEmail?: string
  identifiedEmail?: string
  totpChallengeState:
    'ready' | 'pending' | 'verified' | 'recovery' | 'expired' | 'invalid_code' | 'too_many_attempts'
  recoveryModeState: 'totp_primary' | 'recovery_substep'
  recoveryCodes?: string[]
  recoveryAcknowledged?: boolean
  inlineErrorMessage?: string
}

export const useAuthBootstrapStore = defineStore(
  'authBootstrap',
  () => {
    const pending = ref<PendingMfaState | null>(null)
    const strongAuth = ref<StrongAuthState | null>(null)
    const postAuthRoute = ref<PostAuthRoute | null>(null)

    const hasPendingMfa = computed(() => !!pending.value?.token)
    const hasStrongAuth = computed(() => !!strongAuth.value?.mfaToken)
    const pendingRouteName = computed(() => {
      if (!pending.value) return 'login'
      if (!pending.value.totp) return 'mfa-setup'
      return 'mfa-challenge'
    })

    function setPending(value: PendingMfaState): void {
      pending.value = value
    }
    function clearPending(): void {
      pending.value = null
    }
    function updateSetup(setup: PendingMfaSetup): void {
      if (!pending.value) return
      pending.value = { ...pending.value, setup }
    }
    function markRecoveryCode(recoveryCode: string): void {
      if (!pending.value) return
      pending.value = { ...pending.value, totp: true, recoveryCode, recoveryAcknowledged: false }
    }
    function acknowledgeRecovery(checked: boolean): void {
      if (!pending.value) return
      pending.value = { ...pending.value, recoveryAcknowledged: checked }
    }
    function rehydrate(): void {
      /* Pinia persist 自动恢复 */
    }

    function setStrongAuth(state: StrongAuthState): void {
      pending.value = null
      strongAuth.value = state
    }
    function clearStrongAuth(): void {
      strongAuth.value = null
    }
    function setPostAuthRoute(route: PostAuthRoute | null | undefined): void {
      postAuthRoute.value = route ?? null
    }
    function clearPostAuthRoute(): void {
      postAuthRoute.value = null
    }

    function updateStrongAuthSetup(partial: Partial<StrongAuthState>): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, ...partial }
    }
    function markStrongAuthRecoveryCodes(codes: string[]): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, recoveryCodes: codes, recoveryAcknowledged: false }
    }
    function acknowledgeStrongAuthRecovery(checked: boolean): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, recoveryAcknowledged: checked }
    }
    function setStrongAuthTotpChallengeState(state: StrongAuthState['totpChallengeState']): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, totpChallengeState: state }
    }
    function switchStrongAuthRecoveryMode(): void {
      if (!strongAuth.value) return
      strongAuth.value = {
        ...strongAuth.value,
        recoveryModeState:
          strongAuth.value.recoveryModeState === 'recovery_substep'
            ? 'totp_primary'
            : 'recovery_substep'
      }
    }
    function setStrongAuthRecoveryMode(state: StrongAuthState['recoveryModeState']): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, recoveryModeState: state }
    }
    function setStrongAuthInlineError(message: string): void {
      if (!strongAuth.value) return
      strongAuth.value = { ...strongAuth.value, inlineErrorMessage: message }
    }

    return {
      pending,
      strongAuth,
      postAuthRoute,
      hasPendingMfa,
      hasStrongAuth,
      pendingRouteName,
      setPending,
      clearPending,
      updateSetup,
      markRecoveryCode,
      acknowledgeRecovery,
      rehydrate,
      setStrongAuth,
      clearStrongAuth,
      setPostAuthRoute,
      clearPostAuthRoute,
      updateStrongAuthSetup,
      markStrongAuthRecoveryCodes,
      acknowledgeStrongAuthRecovery,
      setStrongAuthTotpChallengeState,
      switchStrongAuthRecoveryMode,
      setStrongAuthRecoveryMode,
      setStrongAuthInlineError
    }
  },
  {
    persist: { key: 'authBootstrap', storage: localStorage }
  }
)
