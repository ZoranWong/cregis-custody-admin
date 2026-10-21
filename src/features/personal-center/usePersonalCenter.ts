import { onMounted, ref } from 'vue'
import {
  bootstrapPersonalCenterTotp,
  buildPersonalCenterSummary,
  changePersonalCenterPassword,
  completePasskeyRegistration,
  completePersonalCenterTotp,
  fetchCurrentStaffAccount,
  fetchPasskeyRegistrationOptions,
  refreshRecoveryCodes
} from '@/api/security'
import type {
  PersonalCenterPendingAction,
  PersonalCenterSummary,
  PersonalCenterTotpSetupMaterial,
  PersonalCenterTotpSetupResult,
  RecoveryCodesDeliveryBundle
} from '@/types/models'
import { useUserStore } from '@/store/modules/user'
import { runPasskeyRegistration } from '@/utils/webauthn'

const PERSONAL_CENTER_PENDING_ACTION_KEY = 'PERSONAL_CENTER_PENDING_ACTION'

/*
 * 会话管理已下线：/v1/auth/security/sessions 系列端点后端从未实现，
 * 相关 UI 与逻辑移除，待接口补充后再加回。
 */
export function usePersonalCenter() {
  const userStore = useUserStore()
  const loading = ref(false)
  const refreshingRecoveryCodes = ref(false)
  const registeringPasskey = ref(false)
  const summary = ref<PersonalCenterSummary | null>(null)
  const recoveryBundle = ref<RecoveryCodesDeliveryBundle | null>(null)
  const totpSetup = ref<PersonalCenterTotpSetupMaterial | null>(null)
  /** 最近一次操作失败的原因：页面据此弹出提示，避免失败时毫无反馈 */
  const actionError = ref('')
  const loadError = ref('')
  const passwordChangeSummary = ref('')
  const activeDialog = ref<'passkey' | 'totp' | 'recovery' | 'password' | null>(null)
  const pendingAction = ref<PersonalCenterPendingAction | null>(readPendingAction())
  const passkeySupported =
    typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials

  async function load(force = false): Promise<void> {
    if (loading.value && !force) return
    loading.value = true
    loadError.value = ''
    try {
      // 账号信息改走 /system/staff/list（summary 聚合接口已下线）。
      // 登录时 setSession 写入的 user 形状是 { id, username, email, roles }，
      // userId/userName 是 store computed 上的旧映射，直接读 id。
      const userId = Number(userStore.info?.userId ?? (userStore.info as any)?.id)
      if (!userId) throw new Error('Login session missing user id.')
      const account = await fetchCurrentStaffAccount(userId)
      if (!account) throw new Error('Current account not found in staff directory.')
      summary.value = buildPersonalCenterSummary(account)
    } catch (caught) {
      loadError.value = readMessage(caught, 'Unable to load Personal Center.')
    } finally {
      loading.value = false
    }
  }

  function openPasskeyDialog(): void {
    activeDialog.value = 'passkey'
  }

  async function managePasskey(): Promise<void> {
    if (!passkeySupported || registeringPasskey.value) return
    registeringPasskey.value = true
    actionError.value = ''
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
    } catch (caught) {
      actionError.value = describePasskeyError(caught)
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
    actionError.value = ''
    try {
      const result = await refreshRecoveryCodes(summary.value?.accountSummary.email || '')
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
    } catch (caught) {
      actionError.value = readMessage(caught, 'Unable to refresh recovery codes.')
    } finally {
      refreshingRecoveryCodes.value = false
    }
  }

  function openPasswordDialog(): void {
    activeDialog.value = 'password'
  }

  async function bootstrapTotpDialog(): Promise<void> {
    activeDialog.value = 'totp'
    actionError.value = ''
    try {
      totpSetup.value = await bootstrapPersonalCenterTotp(summary.value?.accountSummary.email || '')
    } catch (caught) {
      actionError.value = readMessage(caught, 'Unable to start TOTP setup.')
    }
  }

  async function completeTotpDialog(code: string): Promise<PersonalCenterTotpSetupResult | null> {
    actionError.value = ''
    try {
      const result = await completePersonalCenterTotp(code)
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
    } catch (caught) {
      actionError.value = readMessage(caught, 'Unable to verify the TOTP code.')
      return null
    }
  }

  async function submitPasswordChange(
    currentPassword: string,
    nextPassword: string
  ): Promise<boolean> {
    activeDialog.value = 'password'
    actionError.value = ''
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
    } catch (caught) {
      actionError.value = readMessage(caught, 'Unable to change password.')
      return false
    }
  }

  function clearDialogState(): void {
    const closingDialog = activeDialog.value
    activeDialog.value = null
    totpSetup.value = null
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
    summary,
    recoveryBundle,
    totpSetup,
    loadError,
    actionError,
    passkeySupported,
    passwordChangeSummary,
    activeDialog,
    pendingAction,
    load,
    openPasskeyDialog,
    managePasskey,
    openRecoveryDialog,
    manageRecoveryCodes,
    bootstrapTotpDialog,
    completeTotpDialog,
    openPasswordDialog,
    submitPasswordChange,
    clearDialogState
  }
}

/** WebAuthn 抛出的 DOMException 文案较生硬，转成可读提示 */
function describePasskeyError(caught: unknown): string {
  const name = caught instanceof DOMException ? caught.name : ''
  switch (name) {
    case 'NotAllowedError':
      // 用户取消 / 超时 / 该设备已注册过同一账号，浏览器都归到 NotAllowedError
      return 'Passkey registration was cancelled or not allowed. If this device already has a passkey for this account, remove it in your system settings and try again.'
    case 'NotSupportedError':
      return 'This device or browser does not support the required passkey type.'
    case 'SecurityError':
      return 'Passkey registration is blocked for this origin (check rp.id / HTTPS).'
    case 'InvalidStateError':
      return 'A passkey for this account already exists on this device.'
    default:
      return readMessage(caught, 'Passkey registration failed.')
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
