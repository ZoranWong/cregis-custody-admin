<!-- Cregis Personal Center -->
<!-- 单一根节点：页面容器 + 弹框都在同一 div 内，避免 fragment 根导致
     路由 <Transition> 无法动画、透传 attrs 无法继承的两类 Vue warning -->
<template>
  <div>
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

          <!-- Right: 会话管理已下线（/v1/auth/security/sessions 端点后端未实现），改为账号信息卡 -->
          <ElCol :sm="24" :md="12">
            <div class="art-card mb-4 p-5">
              <div class="mb-3">
                <h3 class="text-sm font-semibold text-g-900">Account</h3>
                <p class="text-xs text-g-500 mt-0.5">Your staff account in this workspace.</p>
              </div>
              <div class="cred-row">
                <span class="text-xs text-g-700">Display Name</span>
                <span class="text-xs text-g-800">{{ accountName || '--' }}</span>
              </div>
              <div class="cred-row">
                <span class="text-xs text-g-700">Email</span>
                <span class="text-xs text-g-800">{{ accountEmail || '--' }}</span>
              </div>
              <div class="cred-row">
                <span class="text-xs text-g-700">Role</span>
                <span class="text-xs text-g-800">{{ accountRole || '--' }}</span>
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
      <p v-if="actionError" class="text-xs text-red-600 mb-4">{{ actionError }}</p>
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
      <p v-if="actionError" class="text-xs text-red-600 mb-2">{{ actionError }}</p>
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
        >
        <p v-if="recoveryCodesUnsupported"
          >Recovery codes require TOTP to be enabled first.</p
        ></template
      >
      <p v-if="actionError" class="text-xs text-red-600 mt-2">{{ actionError }}</p>
      <template #footer>
        <ElButton @click="showRecoveryDialog = false">{{
          recoveryBundle ? 'Done' : 'Cancel'
        }}</ElButton>
        <ElButton
          v-if="!recoveryBundle && !recoveryCodesUnsupported"
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
        <p v-if="passwordChangeSummary" class="text-xs text-green-600">{{
          passwordChangeSummary
        }}</p>
        <p v-if="actionError" class="text-xs text-red-600">{{ actionError }}</p>
      </div>
      <template #footer>
        <ElButton @click="showPasswordDialog = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :disabled="!canSubmitPassword" @click="submitPasswordDialog">{{
          $t('common.save')
        }}</ElButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { usePersonalCenter } from '@/features/personal-center/usePersonalCenter'

  defineOptions({ name: 'PersonalCenter' })

  const {
    loading,
    summary,
    recoveryBundle,
    loadError,
    actionError,
    passkeySupported,
    registeringPasskey,
    refreshingRecoveryCodes,
    totpSetup,
    passwordChangeSummary,
    load,
    managePasskey,
    manageRecoveryCodes,
    bootstrapTotpDialog,
    completeTotpDialog,
    submitPasswordChange
  } = usePersonalCenter()

  const showPasskeyDialog = ref(false)
  const showTotpDialog = ref(false)
  const showRecoveryDialog = ref(false)
  const showPasswordDialog = ref(false)
  const totpDialogCode = ref('')
  const passwordForm = reactive({ currentPassword: '', nextPassword: '', confirmPassword: '' })

  const accountName = computed(() => summary.value?.accountSummary.displayName || '')
  const accountEmail = computed(() => summary.value?.accountSummary.email || '')
  const accountRole = computed(() => summary.value?.accountSummary.roleLabel || '')
  /**
   * 恢复码由 TOTP 启用流程产生；TOTP 未启用时后端 refreshCodes 接口会拒绝，
   * 前端直接禁用入口并说明原因，避免用户点出报错。
   */
  const recoveryCodesUnsupported = computed(
    () => summary.value?.fallbackSecurityStatus.totpState !== 'active'
  )
  const accountHint = computed(() => {
    const email = accountEmail.value
    const role = accountRole.value
    return role ? `${email} · ${role}` : email
  })

  function openPasskey() {
    actionError.value = ''
    showPasskeyDialog.value = true
  }
  function openRecovery() {
    actionError.value = ''
    showRecoveryDialog.value = true
  }
  function openPassword() {
    actionError.value = ''
    showPasswordDialog.value = true
  }
  async function bootstrapTotp() {
    actionError.value = ''
    showTotpDialog.value = true
    // 必须复用页面同一份 composable 实例，否则 totpSetup 写到新实例上，二维码不会出现
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
  function reload() {
    void load(true)
  }

  const canSubmitPassword = computed(
    () =>
      !!passwordForm.currentPassword.trim() &&
      !!passwordForm.nextPassword.trim() &&
      passwordForm.nextPassword === passwordForm.confirmPassword
  )

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
  .badge-tag {
    flex-shrink: 0;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 5px;
  }

  .badge-tag.primary {
    color: var(--tone-info-text);
    background: var(--tone-info-bg);
  }

  .badge-tag.fallback {
    color: var(--tone-secondary-text);
    background: var(--tone-neutral-bg);
  }

  .cred-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    margin-bottom: 4px;
    background: var(--tone-neutral-bg);
    border-radius: 8px;
  }

  .governance-notice {
    max-width: 640px;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--tone-progress-text);
    background: var(--tone-progress-bg);
    border: 1px solid rgb(245 158 11 / 20%);
    border-radius: 8px;
  }

  .governance-notice strong {
    color: var(--tone-progress-text);
  }
</style>
