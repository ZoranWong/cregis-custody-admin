<!-- Cregis Personal Center -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h2 class="text-base font-semibold text-g-900">Personal Center</h2>
        <p class="text-xs text-g-500 mt-0.5">{{ accountHint }}</p>
      </div>
      <ElButton @click="reload" :disabled="loading">{{ $t('console.refresh') }}</ElButton>
    </div>

    <template v-if="loadError">
      <div class="art-card p-8 text-center">
        <p class="text-g-600 mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="reload">Retry</ElButton>
      </div>
    </template>

    <template v-else>
      <!-- Status Strip -->
      <div class="flex flex-wrap gap-2 mb-5">
        <span class="status-pill" :class="passkeyPillTone"
          ><span class="dot"></span>{{ passkeyPillLabel }}</span
        >
        <span class="status-pill" :class="totpPillTone"
          ><span class="dot"></span>{{ totpPillLabel }}</span
        >
        <span class="status-pill" :class="sessionPillTone"
          ><span class="dot"></span>{{ sessionPillLabel }}</span
        >
      </div>

      <!-- Two-column layout: left stacked, right wider -->
      <ElRow :gutter="20" class="flex">
        <!-- Left: Passkey + Backup Credentials -->
        <ElCol :sm="24" :md="12">
          <div class="art-card mb-4 p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-g-900">Passkey</h3>
                <p class="text-xs text-g-500 mt-0.5"
                  >Primary authentication via device biometrics or PIN.</p
                >
              </div>
              <span class="badge-tag primary">Primary</span>
            </div>
            <div class="cred-row">
              <span class="text-xs text-g-700">Device Passkey</span>
              <span class="text-xs" :class="passkeyStatusClass">{{ passkeyStatusLabel }}</span>
            </div>
            <ElButton
              size="small"
              type="primary"
              class="mt-3"
              :disabled="registeringPasskey || !passkeySupported"
              @click="openPasskey"
            >
              {{ registeringPasskey ? 'Working...' : 'Manage Passkey' }}
            </ElButton>
          </div>

          <div class="art-card mb-4 p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-g-900">Backup Credentials</h3>
                <p class="text-xs text-g-500 mt-0.5"
                  >Fallback methods when passkey is unavailable.</p
                >
              </div>
              <span class="badge-tag fallback">Fallback</span>
            </div>
            <div class="cred-row">
              <span class="text-xs text-g-700">TOTP Authenticator</span>
              <span class="text-xs" :class="totpStatusClass">{{ totpStatusLabel }}</span>
            </div>
            <div class="cred-row">
              <span class="text-xs text-g-700">Recovery Codes</span>
              <span class="text-xs" :class="recoveryStatusClass">{{ recoveryStatusLabel }}</span>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <ElButton size="small" @click="bootstrapTotp">Manage TOTP</ElButton>
              <ElButton size="small" :disabled="refreshingRecoveryCodes" @click="openRecovery">
                {{ refreshingRecoveryCodes ? 'Refreshing...' : 'Refresh Codes' }}
              </ElButton>
              <ElButton size="small" type="warning" text @click="openPassword"
                >Change Password</ElButton
              >
            </div>
          </div>
        </ElCol>

        <!-- Right: Active Sessions -->
        <ElCol :sm="24" :md="12">
          <div class="art-card mb-4 p-5">
            <div class="mb-3">
              <h3 class="text-sm font-semibold text-g-900">Active Sessions</h3>
              <p class="text-xs text-g-500 mt-0.5">Revoke any session you don't recognize.</p>
            </div>
            <div v-if="currentSession" class="session-item">
              <div>
                <div class="text-xs font-medium text-g-800">{{ currentSession.deviceLabel }}</div>
                <div class="text-label text-g-500">{{ sessionMeta(currentSession) }}</div>
              </div>
              <span class="current-tag">Current</span>
            </div>
            <div v-for="session in otherSessions" :key="session.sessionId" class="session-item">
              <div>
                <div class="text-xs font-medium text-g-800">{{ session.deviceLabel }}</div>
                <div class="text-label text-g-500">{{ sessionMeta(session) }}</div>
              </div>
              <ElButton
                size="small"
                :disabled="revokingSessionId === session.sessionId"
                @click="openRevokeSession(session.sessionId)"
              >
                {{ revokingSessionId === session.sessionId ? 'Revoking...' : 'Revoke' }}
              </ElButton>
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
              <ElButton size="small" :disabled="refreshingSessions" @click="refreshSessions">
                {{ refreshingSessions ? 'Refreshing...' : 'Refresh' }}
              </ElButton>
              <ElButton size="small" :disabled="!otherSessions.length" @click="openRevokeAll"
                >Revoke All Others</ElButton
              >
            </div>
          </div>
        </ElCol>
      </ElRow>

      <div class="governance-notice">
        <strong>Security Notice:</strong> High-risk changes may trigger re-authentication. If you
        lose access to all methods, contact support.
      </div>
    </template>
  </div>

  <!-- Dialogs -->
  <el-dialog v-model="showPasskeyDialog" title="Manage Passkey" width="420px">
    <p class="text-sm text-g-600 mb-4"
      >Passkey uses your device biometrics or PIN for phishing-resistant sign-in.</p
    >
    <template #footer>
      <ElButton @click="showPasskeyDialog = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton
        type="primary"
        :disabled="registeringPasskey || !passkeySupported"
        @click="managePasskey"
        >{{ registeringPasskey ? 'Working...' : 'Add Passkey' }}</ElButton
      >
    </template>
  </el-dialog>

  <el-dialog v-model="showTotpDialog" title="TOTP Authenticator" width="420px">
    <div class="flex justify-center mb-4">
      <img
        v-if="totpSetup?.qrCodeBase64"
        :src="totpSetup.qrCodeBase64"
        alt="TOTP QR code"
        class="w-40 h-40 border rounded-lg"
      />
      <span v-else class="text-g-500">Preparing QR Code</span>
    </div>
    <p v-if="totpSetup?.manualKey" class="text-center text-xs text-g-500 mb-4"
      >Or enter manually: <strong>{{ totpSetup.manualKey }}</strong></p
    >
    <div class="mb-4"
      ><label class="text-xs text-g-500">Verification code</label
      ><el-input v-model="totpDialogCode" maxlength="6" placeholder="123456" class="mt-1"
    /></div>
    <template #footer>
      <ElButton @click="showTotpDialog = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" :disabled="totpDialogCode.length !== 6" @click="submitTotpDialog"
        >Verify</ElButton
      >
    </template>
  </el-dialog>

  <el-dialog v-model="showRecoveryDialog" title="Recovery Codes" width="420px">
    <template v-if="recoveryBundle">
      <div class="grid gap-2 mb-4"
        ><code
          v-for="code in recoveryBundle.recoveryCodes"
          :key="code"
          class="block p-2 rounded bg-g-50 text-xs"
          >{{ code }}</code
        ></div
      >
      <p class="text-xs text-g-500">This bundle is displayed once.</p>
    </template>
    <template v-else
      ><p class="text-sm text-g-600 mb-4"
        >Refresh recovery codes to replace the currently stored backup bundle.</p
      ></template
    >
    <template #footer>
      <ElButton @click="showRecoveryDialog = false">{{
        recoveryBundle ? 'Done' : 'Cancel'
      }}</ElButton>
      <ElButton
        v-if="!recoveryBundle"
        type="primary"
        :disabled="refreshingRecoveryCodes"
        @click="manageRecoveryCodes"
        >{{ refreshingRecoveryCodes ? 'Refreshing...' : 'Refresh Codes' }}</ElButton
      >
    </template>
  </el-dialog>

  <el-dialog v-model="showPasswordDialog" title="Change Password" width="420px">
    <div class="space-y-3">
      <div
        ><label class="text-xs text-g-500">Current Password</label
        ><el-input
          v-model="passwordForm.currentPassword"
          type="password"
          autocomplete="current-password"
          class="mt-1"
      /></div>
      <div
        ><label class="text-xs text-g-500">New Password</label
        ><el-input
          v-model="passwordForm.nextPassword"
          type="password"
          autocomplete="new-password"
          class="mt-1"
      /></div>
      <div
        ><label class="text-xs text-g-500">Confirm New Password</label
        ><el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          autocomplete="new-password"
          class="mt-1"
      /></div>
      <p v-if="passwordChangeSummary" class="text-xs text-green-600">{{ passwordChangeSummary }}</p>
    </div>
    <template #footer>
      <ElButton @click="showPasswordDialog = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="primary" :disabled="!canSubmitPassword" @click="submitPasswordDialog">{{
        $t('common.save')
      }}</ElButton>
    </template>
  </el-dialog>

  <el-dialog v-model="showRevokeSingleDialog" title="Revoke Session" width="400px">
    <p class="text-sm text-g-600"
      >Are you sure you want to revoke the session for <strong>{{ revokeTargetLabel }}</strong
      >?</p
    >
    <template #footer>
      <ElButton @click="showRevokeSingleDialog = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton
        type="danger"
        :disabled="!revokeTargetLabel || !!revokingSessionId"
        @click="submitRevokeSessionDialog"
        >{{ revokingSessionId ? 'Revoking...' : 'Revoke Session' }}</ElButton
      >
    </template>
  </el-dialog>

  <el-dialog v-model="showRevokeAllDialog" title="Revoke All Other Sessions" width="400px">
    <p class="text-sm text-g-600"
      >This action cannot be undone. All other active sessions will be
      <strong>immediately terminated</strong>.</p
    >
    <template #footer>
      <ElButton @click="showRevokeAllDialog = false">{{ $t('common.cancel') }}</ElButton>
      <ElButton type="danger" :disabled="!otherSessions.length" @click="submitRevokeAllDialog"
        >Revoke All</ElButton
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { usePersonalCenter } from '@/features/personal-center/usePersonalCenter'
  import type { PersonalCenterSessionSummary } from '@/features/system-admin/types'

  defineOptions({ name: 'PersonalCenter' })

  const {
    loading,
    summary,
    currentSession,
    otherSessions,
    recoveryBundle,
    loadError,
    passkeySupported,
    registeringPasskey,
    refreshingRecoveryCodes,
    refreshingSessions,
    revokingSessionId,
    revokeTargetSessionId,
    totpSetup,
    passwordChangeSummary,
    load,
    refreshSessions,
    managePasskey,
    manageRecoveryCodes,
    confirmRevokeSession,
    completeTotpDialog,
    submitPasswordChange,
    revokeAllOthers
  } = usePersonalCenter()

  const showPasskeyDialog = ref(false)
  const showTotpDialog = ref(false)
  const showRecoveryDialog = ref(false)
  const showPasswordDialog = ref(false)
  const showRevokeSingleDialog = ref(false)
  const showRevokeAllDialog = ref(false)
  const totpDialogCode = ref('')
  const passwordForm = reactive({ currentPassword: '', nextPassword: '', confirmPassword: '' })

  const accountHint = computed(() => {
    const email = summary.value?.accountSummary.email || ''
    const role = summary.value?.accountSummary.roleLabel || ''
    return `${email} · ${role}`
  })

  function openPasskey() {
    showPasskeyDialog.value = true
  }
  function openRecovery() {
    showRecoveryDialog.value = true
  }
  function openPassword() {
    showPasswordDialog.value = true
  }
  function openRevokeAll() {
    showRevokeAllDialog.value = true
  }
  function openRevokeSession(sessionId: string) {
    usePersonalCenter().openRevokeSessionDialog(sessionId)
    showRevokeSingleDialog.value = true
  }
  async function bootstrapTotp() {
    showTotpDialog.value = true
    const { bootstrapTotpDialog } = usePersonalCenter()
    await bootstrapTotpDialog()
  }

  async function submitTotpDialog() {
    const result = await completeTotpDialog(totpDialogCode.value)
    if (result) {
      totpDialogCode.value = ''
      showTotpDialog.value = false
    }
  }
  async function submitPasswordDialog() {
    if (!canSubmitPassword.value) return
    const changed = await submitPasswordChange(
      passwordForm.currentPassword,
      passwordForm.nextPassword
    )
    if (changed) {
      passwordForm.currentPassword = ''
      passwordForm.nextPassword = ''
      passwordForm.confirmPassword = ''
      showPasswordDialog.value = false
    }
  }
  async function submitRevokeSessionDialog() {
    await confirmRevokeSession()
    showRevokeSingleDialog.value = false
  }
  async function submitRevokeAllDialog() {
    await revokeAllOthers()
    showRevokeAllDialog.value = false
  }
  function reload() {
    void load(true)
  }

  const canSubmitPassword = computed(
    () =>
      !!passwordForm.currentPassword.trim() &&
      !!passwordForm.nextPassword.trim() &&
      passwordForm.nextPassword === passwordForm.confirmPassword
  )

  const passkeyPillLabel = computed(() =>
    summary.value?.passkeyStatus.state === 'active' ? 'Passkey Active' : 'Passkey Attention'
  )
  const passkeyPillTone = computed(() =>
    summary.value?.passkeyStatus.state === 'active' ? 'ok' : 'warn'
  )
  const totpPillLabel = computed(() =>
    summary.value?.fallbackSecurityStatus.totpState === 'active' ? 'TOTP Enabled' : 'TOTP Pending'
  )
  const totpPillTone = computed(() =>
    summary.value?.fallbackSecurityStatus.totpState === 'active' ? 'ok' : 'warn'
  )
  const sessionPillLabel = computed(() => {
    const count = otherSessions.value.length + (currentSession.value ? 1 : 0)
    return `${count} Session${count === 1 ? '' : 's'}`
  })
  const sessionPillTone = computed(() => (otherSessions.value.length > 0 ? 'warn' : 'ok'))
  const passkeyStatusLabel = computed(() =>
    summary.value?.passkeyStatus.state === 'active' ? 'Registered' : 'Not ready'
  )
  const passkeyStatusClass = computed(() =>
    summary.value?.passkeyStatus.state === 'active' ? 'text-green-600' : 'text-g-500'
  )
  const totpStatusLabel = computed(() =>
    summary.value?.fallbackSecurityStatus.totpState === 'active' ? 'Enabled' : 'Not configured'
  )
  const totpStatusClass = computed(() =>
    summary.value?.fallbackSecurityStatus.totpState === 'active' ? 'text-green-600' : 'text-g-500'
  )
  const recoveryStatusLabel = computed(() =>
    summary.value?.fallbackSecurityStatus.recoveryCodesState === 'available'
      ? 'Available'
      : 'Needs refresh'
  )
  const recoveryStatusClass = computed(() =>
    summary.value?.fallbackSecurityStatus.recoveryCodesState === 'available'
      ? 'text-green-600'
      : 'text-g-500'
  )
  const revokeTargetLabel = computed(() => {
    const session = otherSessions.value.find(
      (item) => item.sessionId === revokeTargetSessionId.value
    )
    return session?.deviceLabel || ''
  })

  function sessionMeta(session: PersonalCenterSessionSummary): string {
    return `${session.locationHint || 'Unknown network'} · ${session.lastActiveAt}`
  }

  watch(showTotpDialog, (val) => {
    if (!val) totpDialogCode.value = ''
  })
  watch(showPasswordDialog, (val) => {
    if (!val) {
      passwordForm.currentPassword = ''
      passwordForm.nextPassword = ''
      passwordForm.confirmPassword = ''
    }
  })
</script>

<style scoped>
  .status-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
  }
  .status-pill.ok {
    background: var(--success-50, #f0fdf4);
    color: var(--success-700, #15803d);
  }
  .status-pill.warn {
    background: var(--warning-50, #fffbeb);
    color: var(--warning-700, #b45309);
  }
  .status-pill .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  .status-pill.ok .dot {
    background: var(--success-500, #22c55e);
  }
  .status-pill.warn .dot {
    background: var(--warning-500, #f59e0b);
  }

  .badge-tag {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 5px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-tag.primary {
    background: var(--accent-50, #eff6ff);
    color: var(--accent-700, #1d4ed8);
  }
  .badge-tag.fallback {
    background: var(--g-50, #f9fafb);
    color: var(--g-700, #374151);
  }

  .cred-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--g-50, #f9fafb);
    margin-bottom: 4px;
  }
  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--g-50, #f9fafb);
    margin-bottom: 4px;
    gap: 8px;
  }
  .current-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--accent-50, #eff6ff);
    color: var(--accent-700, #1d4ed8);
    flex-shrink: 0;
  }

  .governance-notice {
    max-width: 640px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(245, 158, 11, 0.2);
    background: var(--warning-50, #fffbeb);
    font-size: 12px;
    color: var(--warning-700, #b45309);
    line-height: 1.5;
  }
  .governance-notice strong {
    color: var(--warning-800, #92400e);
  }
</style>
