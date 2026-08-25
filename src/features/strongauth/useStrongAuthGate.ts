import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  completeTotpSetup,
  fetchTotpBootstrap,
  verifyRecoveryCode,
  verifyTotpChallenge
} from '@/api/auth'
import { ApiError } from '@/utils/http/request'
import { useAuthBootstrapStore } from '@/store/modules/authBootstrap'
import { useUserStore } from '@/store/modules/user'
import { useUiStore } from '@/store/modules/ui'
import { mergeWorkbenchPostAuthRoute } from '@/features/workbench/workbenchEntry'

export function useStrongAuthGate() {
  const router = useRouter()
  const authBootstrapStore = useAuthBootstrapStore()
  const sessionStore = useUserStore()
  const uiStore = useUiStore()

  const code = ref('')
  const busy = ref(false)

  const strongAuth = computed(() => authBootstrapStore.strongAuth)
  const clearanceState = computed(() => strongAuth.value?.clearanceState ?? null)
  const isSetupMode = computed(
    () =>
      clearanceState.value === 'strong_auth_setup_required' && !strongAuth.value?.totpSetupComplete
  )
  const isChallengeMode = computed(
    () =>
      clearanceState.value === 'strong_auth_challenge_required' ||
      strongAuth.value?.totpSetupComplete
  )

  const displayName = computed(() => strongAuth.value?.displayNameOrEmail ?? '')
  const email = computed(() => strongAuth.value?.identifiedEmail ?? '')
  const avatarInitials = computed(() => {
    const name = displayName.value || email.value
    if (!name) return '?'
    const parts = name.split(/[@\s]+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })

  const verificationReason = computed(() => strongAuth.value?.verificationReason)
  const inlineError = computed(() => strongAuth.value?.inlineErrorMessage)

  const totpChallengeState = computed(() => strongAuth.value?.totpChallengeState ?? 'ready')
  const isChallengeLocked = computed(() => totpChallengeState.value === 'too_many_attempts')
  const recoveryModeState = computed(() => strongAuth.value?.recoveryModeState ?? 'totp_primary')
  const isRecoveryMode = computed(() => recoveryModeState.value === 'recovery_substep')

  const totpSetupId = computed(() => strongAuth.value?.totpSetupId ?? '')
  const qrCodeBase64 = computed(() => strongAuth.value?.qrCodeBase64 ?? '')
  const secretKey = computed(() => strongAuth.value?.secretKeyMasked ?? '')
  const accountName = computed(() => strongAuth.value?.accountName ?? '')
  const recoveryCodes = computed(() => strongAuth.value?.recoveryCodes ?? [])
  const recoveryAcknowledged = computed(() => strongAuth.value?.recoveryAcknowledged ?? false)
  const isRecoveryDisplay = computed(() => recoveryCodes.value.length > 0)

  async function loadTotpBootstrap(): Promise<void> {
    if (!strongAuth.value?.clearanceToken) return
    busy.value = true
    try {
      const result = await fetchTotpBootstrap(strongAuth.value.clearanceToken)
      authBootstrapStore.updateStrongAuthSetup({
        totpSetupId: result.totpSetupId,
        qrCodeBase64: result.qrCodeBase64,
        secretKeyMasked: result.secretKeyMasked,
        accountName: result.accountName,
        recoveryDeliveryMode: result.recoveryDeliveryMode
      })
    } catch (caught) {
      if (await handleTerminalStrongAuthError(caught, 'Security session expired')) {
        return
      }
      uiStore.showToast(
        'error',
        'Setup unavailable',
        caught instanceof Error ? caught.message : 'Unable to prepare the authenticator setup.'
      )
    } finally {
      busy.value = false
    }
  }

  async function submitTotpSetup(): Promise<void> {
    const sa = strongAuth.value
    if (!sa?.clearanceToken || !totpSetupId.value || !code.value.trim() || isChallengeLocked.value)
      return
    busy.value = true
    try {
      const result = await completeTotpSetup(
        sa.clearanceToken,
        totpSetupId.value,
        code.value.trim()
      )
      const bundle = result.recoveryCodesDeliveryBundle
      authBootstrapStore.updateStrongAuthSetup({
        recoveryCodes: bundle?.recoveryCodes ?? [],
        recoveryAcknowledged: false,
        issuedSession: result.session as any,
        postAuthRoute: result.postAuthRoute as any,
        passkeyFollowUpState: result.passkeyFollowUpState,
        inlineErrorMessage: '',
        totpChallengeState: 'ready',
        recoveryModeState: 'totp_primary'
      })
      uiStore.showToast('success', 'TOTP enabled', 'Save the recovery codes before continuing.')
      code.value = ''
      if (bundle?.mustAcknowledgeSaved) {
        return
      }
      if (result.sessionIssued && result.session) {
        sessionStore.setSession(result.session as any)
        authBootstrapStore.setPostAuthRoute(
          mergeWorkbenchPostAuthRoute(
            result.postAuthRoute as any,
            (result.session as any).user.roles
          )
        )
        authBootstrapStore.clearStrongAuth()
        uiStore.showToast('success', 'Admin session ready', 'Authentication completed.')
        await router.push({ name: 'home' })
      }
    } catch (caught) {
      if (await handleTerminalStrongAuthError(caught, 'Security session expired')) {
        return
      }
      const mapped = mapTotpError(caught, 'Unable to activate TOTP.')
      authBootstrapStore.setStrongAuthTotpChallengeState(mapped.state)
      authBootstrapStore.setStrongAuthInlineError(mapped.message)
      uiStore.showToast('error', 'Activation failed', mapped.message)
    } finally {
      busy.value = false
    }
  }

  async function submitTotpChallenge(): Promise<void> {
    const sa = strongAuth.value
    if (!sa?.clearanceToken || !code.value.trim() || isChallengeLocked.value) return
    busy.value = true
    try {
      const result = await verifyTotpChallenge(sa.clearanceToken, code.value.trim())
      sessionStore.setSession(result.session as any)
      authBootstrapStore.setPostAuthRoute(
        mergeWorkbenchPostAuthRoute(result.postAuthRoute as any, (result.session as any).user.roles)
      )
      authBootstrapStore.clearStrongAuth()
      uiStore.showToast('success', 'Admin session ready', 'Multi-factor verification completed.')
      await router.push({ name: 'home' })
    } catch (caught) {
      if (await handleTerminalStrongAuthError(caught, 'Security session expired')) {
        return
      }
      const mapped = mapTotpError(caught, 'Unable to verify code.')
      authBootstrapStore.setStrongAuthTotpChallengeState(mapped.state)
      authBootstrapStore.setStrongAuthInlineError(mapped.message)
      uiStore.showToast('error', 'Verification failed', mapped.message)
    } finally {
      busy.value = false
    }
  }

  async function submitRecoveryCode(): Promise<void> {
    const sa = strongAuth.value
    if (!sa?.clearanceToken || !code.value.trim() || isChallengeLocked.value) return
    busy.value = true
    try {
      const result = await verifyRecoveryCode(sa.clearanceToken, code.value.trim())
      sessionStore.setSession(result.session)
      authBootstrapStore.setPostAuthRoute(
        mergeWorkbenchPostAuthRoute(result.postAuthRoute, result.session.user.roles)
      )
      authBootstrapStore.clearStrongAuth()
      uiStore.showToast('success', 'Admin session ready', 'Recovery code verification completed.')
      await router.push({ name: 'home' })
    } catch (caught) {
      if (await handleTerminalStrongAuthError(caught, 'Security session expired')) {
        return
      }
      const mapped = mapRecoveryError(caught, 'Unable to verify recovery code.')
      if (mapped.state === 'too_many_attempts') {
        authBootstrapStore.setStrongAuthTotpChallengeState(mapped.state)
      }
      authBootstrapStore.setStrongAuthInlineError(mapped.message)
      uiStore.showToast('error', 'Verification failed', mapped.message)
    } finally {
      busy.value = false
    }
  }

  function acknowledgeRecovery(checked: boolean): void {
    authBootstrapStore.acknowledgeStrongAuthRecovery(checked)
  }

  function switchToRecovery(): void {
    authBootstrapStore.setStrongAuthRecoveryMode('recovery_substep')
    if (!isChallengeLocked.value) {
      authBootstrapStore.setStrongAuthInlineError('')
    }
    code.value = ''
  }

  function switchToTotp(): void {
    authBootstrapStore.setStrongAuthRecoveryMode('totp_primary')
    if (!isChallengeLocked.value) {
      authBootstrapStore.setStrongAuthInlineError('')
    }
    code.value = ''
  }

  async function continueToChallenge(): Promise<void> {
    const sa = strongAuth.value
    if (!sa || !sa.recoveryAcknowledged) {
      return
    }
    if (sa.issuedSession) {
      sessionStore.setSession(sa.issuedSession as any)
      authBootstrapStore.setPostAuthRoute(
        mergeWorkbenchPostAuthRoute(sa.postAuthRoute as any, (sa.issuedSession as any).user.roles)
      )
      authBootstrapStore.clearStrongAuth()
      uiStore.showToast('success', 'Admin session ready', 'Authentication completed.')
      await router.push({ name: 'home' })
      return
    }
    authBootstrapStore.setStrongAuth({
      ...sa,
      clearanceState: 'strong_auth_challenge_required',
      totpSetupComplete: true,
      inlineErrorMessage: '',
      totpChallengeState: 'ready',
      recoveryModeState: 'totp_primary'
    })
    code.value = ''
  }

  async function restartSignIn(): Promise<void> {
    sessionStore.clearSession()
    authBootstrapStore.clearStrongAuth()
    authBootstrapStore.clearPending()
    authBootstrapStore.clearPostAuthRoute()
    uiStore.showToast('error', 'Security session expired', 'Sign in again to continue.')
    await router.replace({ name: 'login' })
  }

  async function copySecret(): Promise<void> {
    try {
      await navigator.clipboard.writeText(secretKey.value || '')
      uiStore.showToast('info', 'Copied', 'Secret key copied to clipboard.')
    } catch {
      uiStore.showToast('error', 'Copy failed', 'Unable to copy to clipboard.')
    }
  }

  async function copyRecovery(): Promise<void> {
    try {
      await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
      uiStore.showToast('info', 'Copied', 'Recovery codes copied to clipboard.')
    } catch {
      uiStore.showToast('error', 'Copy failed', 'Unable to copy to clipboard.')
    }
  }

  async function handleTerminalStrongAuthError(caught: unknown, title: string): Promise<boolean> {
    const semanticCode = readSemanticCode(caught)
    if (
      semanticCode === 'clearance_token_invalid_or_expired' ||
      semanticCode === 'state_conflict'
    ) {
      const message =
        semanticCode === 'clearance_token_invalid_or_expired'
          ? 'Sign in again to continue.'
          : 'The security flow changed. Sign in again to refresh context.'
      sessionStore.clearSession()
      authBootstrapStore.clearStrongAuth()
      authBootstrapStore.clearPending()
      authBootstrapStore.clearPostAuthRoute()
      uiStore.showToast('error', title, message)
      await router.replace({ name: 'login' })
      return true
    }
    return false
  }

  onMounted(() => {
    if (isSetupMode.value && !qrCodeBase64.value && !busy.value) {
      void loadTotpBootstrap()
    }
  })

  return {
    code,
    busy,
    strongAuth,
    clearanceState,
    isSetupMode,
    isChallengeMode,
    displayName,
    email,
    avatarInitials,
    verificationReason,
    inlineError,
    totpChallengeState,
    isChallengeLocked,
    recoveryModeState,
    isRecoveryMode,
    totpSetupId,
    qrCodeBase64,
    secretKey,
    accountName,
    recoveryCodes,
    recoveryAcknowledged,
    isRecoveryDisplay,
    submitTotpSetup,
    submitTotpChallenge,
    submitRecoveryCode,
    acknowledgeRecovery,
    switchToRecovery,
    switchToTotp,
    continueToChallenge,
    restartSignIn,
    copySecret,
    copyRecovery
  }
}

function readSemanticCode(caught: unknown): string {
  if (!(caught instanceof ApiError) || !caught.payload || typeof caught.payload !== 'object') {
    return ''
  }
  const payload = caught.payload as Record<string, unknown>
  return typeof payload.semantic_code === 'string' ? payload.semantic_code : ''
}

function readErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError && caught.payload && typeof caught.payload === 'object') {
    const payload = caught.payload as Record<string, unknown>
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }
  }
  return caught instanceof Error ? caught.message : fallback
}

function mapTotpError(
  caught: unknown,
  fallback: string
): { state: 'invalid_code' | 'too_many_attempts'; message: string } {
  const semanticCode = readSemanticCode(caught)
  if (semanticCode === 'totp_invalid_or_expired') {
    return {
      state: 'invalid_code',
      message: 'The verification code is invalid or expired. Try a fresh code.'
    }
  }
  if (semanticCode === 'rate_limited') {
    return {
      state: 'too_many_attempts',
      message: 'Too many attempts. Wait briefly before trying again.'
    }
  }
  return {
    state: 'invalid_code',
    message: readErrorMessage(caught, fallback)
  }
}

function mapRecoveryError(
  caught: unknown,
  fallback: string
): { state: 'too_many_attempts' | null; message: string } {
  const semanticCode = readSemanticCode(caught)
  if (semanticCode === 'recovery_code_invalid') {
    return {
      state: null,
      message: 'The recovery code is invalid or already used.'
    }
  }
  if (semanticCode === 'rate_limited') {
    return {
      state: 'too_many_attempts',
      message: 'Too many attempts. Wait briefly before trying again.'
    }
  }
  return {
    state: null,
    message: readErrorMessage(caught, fallback)
  }
}
