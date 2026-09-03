<!-- StrongAuth 门禁页面 — Setup 三步 + Challenge -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1 bg-box">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <div class="mb-8">
            <h1 class="text-[22px] font-semibold text-g-900">{{ $t('strongAuth.title') }}</h1>
            <p v-if="displayName" class="mt-1.5 text-sm text-g-500">{{
              $t('strongAuth.signedInAs', { name: displayName })
            }}</p>
          </div>

          <!-- ═══ Setup Mode（未绑定 TOTP）═══ -->
          <div v-if="isSetupMode">
            <div v-if="!qrCodeBase64" class="text-center py-12 text-sm text-g-400">{{
              $t('strongAuth.preparing')
            }}</div>
            <template v-else>
              <div class="mb-6">
                <h2 class="text-base font-semibold text-g-900">{{
                  $t('strongAuth.setupTitle')
                }}</h2>
                <p class="mt-1 text-sm text-g-500">{{ $t('strongAuth.setupDesc') }}</p>
              </div>

              <!-- Step 1: 扫码 -->
              <template v-if="setupStep === 1">
                <!-- 步骤说明 -->
                <div class="bg-g-50 rounded-lg p-4 mb-5">
                  <div class="text-sm font-medium text-g-700 mb-2">{{
                    $t('strongAuth.setupInstructions')
                  }}</div>
                  <ol class="text-sm text-g-600 space-y-1.5 list-decimal pl-4">
                    <li>{{ $t('strongAuth.setupStep1') }}</li>
                    <li>{{ $t('strongAuth.setupStep2') }}</li>
                    <li>{{ $t('strongAuth.setupStep3') }}</li>
                    <li>{{ $t('strongAuth.setupStep4') }}</li>
                    <li>{{ $t('strongAuth.setupStep5') }}</li>
                  </ol>
                </div>

                <!-- 二维码 -->
                <div class="flex flex-col items-center mb-5">
                  <div class="flex justify-center p-3 border-full-d rounded-xl bg-box">
                    <img :src="qrCodeBase64" class="w-40 h-40" />
                  </div>
                  <p class="text-xs text-g-500 mt-3 text-center">{{ $t('strongAuth.scanHint') }}</p>
                </div>

                <!-- 手动输入密钥（可折叠） -->
                <div class="text-left mb-5" v-if="!showSetupKey">
                  {{ $t('strongAuth.cantScan') }}
                  <span
                    class="text-sm font-medium text-[var(--el-color-primary)] cursor-pointer hover:underline"
                    @click="showSetupKey = true"
                    >{{ $t('strongAuth.showSetupKey') }}</span
                  >
                </div>
                <div v-if="showSetupKey" class="mb-5">
                  <div class="text-xs font-medium text-g-500 mb-1.5">{{
                    $t('strongAuth.secretKeyLabel')
                  }}</div>
                  <div class="flex items-center gap-2">
                    <code
                      class="flex-1 px-3 py-2.5 border-full-d rounded-lg text-[13px] font-mono text-g-700 select-all bg-active-color"
                      >{{ secretKey }}</code
                    >
                    <ElButton size="small" @click="copySecret">{{
                      $t('strongAuth.copyBtn')
                    }}</ElButton>
                  </div>
                </div>

                <ElButton
                  class="w-full !h-[48px] !text-[15px] !font-semibold"
                  type="primary"
                  @click="setupStep = 2"
                >
                  {{ $t('strongAuth.nextStepBtn') }}
                </ElButton>
              </template>

              <!-- Step 2: 输入验证码 -->
              <template v-if="setupStep === 2">
                <div class="bg-g-50 rounded-lg p-4 mb-5">
                  <p class="text-sm text-g-600">
                    {{ $t('strongAuth.setupStep5') }}
                  </p>
                </div>

                <!-- 30s 倒计时 -->
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs font-medium text-g-500">{{
                    $t('strongAuth.verifyCodeLabel')
                  }}</div>
                  <div class="flex text-[var(--el-color-warning)] items-center gap-1 text-xs">
                    <span>{{ $t('strongAuth.codeRefreshIn') }}</span>
                    <span class="font-mono font-medium min-w-[2ch] text-right"
                      >{{ formattedCountdown }}s</span
                    >
                  </div>
                </div>

                <div
                  v-if="inlineError"
                  class="mb-3 p-3 rounded-lg bg-[var(--el-color-danger-light-9)] border border-[var(--el-color-danger-light-5)] text-[var(--el-color-danger)] text-[13px]"
                >
                  {{ inlineError }}
                </div>

                <div class="flex gap-3 mb-5">
                  <ElInput
                    v-model="code"
                    placeholder="000000"
                    maxlength="6"
                    class="!h-12 code-input"
                    :disabled="busy"
                    @keyup.enter="submitTotpSetup"
                  />
                  <ElButton
                    class="!h-12"
                    type="primary"
                    :loading="busy"
                    :disabled="busy || code.trim().length < 6"
                    @click="submitTotpSetup"
                  >
                    {{ busy ? $t('strongAuth.activatingBtn') : $t('strongAuth.activateBtn') }}
                  </ElButton>
                </div>

                <div class="text-center">
                  <ElButton type="primary" link @click="setupStep = 1">
                    {{ $t('strongAuth.backToQr') }}
                  </ElButton>
                </div>
              </template>

              <!-- Step 3: 备份码（enable 成功后自动进入） -->
              <template v-if="setupStep === 3">
                <div
                  class="bg-[var(--el-color-success-light-9)] border border-[var(--el-color-success-light-5)] rounded-lg p-4 mb-5"
                >
                  <div class="text-sm font-medium text-[var(--el-color-success)] mb-1">{{
                    $t('strongAuth.recoveryGenerated')
                  }}</div>
                  <p class="text-xs text-g-600">{{ $t('strongAuth.recoveryDesc') }}</p>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-4">
                  <code
                    v-for="c in recoveryCodes"
                    :key="c"
                    class="px-3 py-2 border-full-d rounded-lg text-[13px] font-mono text-g-700 bg-active-color"
                    >{{ c }}</code
                  >
                </div>

                <div class="flex items-center justify-between mb-4">
                  <div class="flex gap-2">
                    <ElButton size="small" @click="copyRecovery">{{
                      $t('strongAuth.copyAllBtn')
                    }}</ElButton>
                    <ElButton size="small" @click="downloadRecovery">{{
                      $t('strongAuth.downloadBtn')
                    }}</ElButton>
                  </div>
                  <ElCheckbox
                    v-model="ackChecked"
                    :label="$t('strongAuth.savedCheckbox')"
                    size="small"
                  />
                </div>

                <ElButton
                  v-if="recoveryAcknowledged"
                  class="w-full !h-[48px] !text-[15px] !font-semibold"
                  type="primary"
                  @click="continueToChallenge"
                  >{{ $t('strongAuth.continueBtn') }}</ElButton
                >
              </template>
            </template>
          </div>

          <!-- ═══ Challenge Mode（已绑定 TOTP）═══ -->
          <div v-if="isChallengeMode">
            <div class="mb-6">
              <h2 class="text-base font-semibold text-g-900">{{
                isRecoveryMode
                  ? $t('strongAuth.challengeRecoveryTitle')
                  : $t('strongAuth.challengeTitle')
              }}</h2>
              <p class="mt-1 text-sm text-g-500">{{
                isRecoveryMode
                  ? $t('strongAuth.challengeRecoveryDesc')
                  : $t('strongAuth.challengeDesc')
              }}</p>
            </div>

            <div
              v-if="inlineError"
              class="mb-4 p-3 rounded-lg bg-[var(--el-color-danger-light-9)] border border-[var(--el-color-danger-light-5)] text-[var(--el-color-danger)] text-[13px]"
            >
              {{ inlineError }}
            </div>

            <div class="flex gap-3 mb-5">
              <ElInput
                v-model="code"
                :placeholder="isRecoveryMode ? 'Recovery code' : '000000'"
                class="!h-12 code-input"
                :disabled="busy || isChallengeLocked"
                @keyup.enter="isRecoveryMode ? submitRecoveryCode() : submitTotpChallenge()"
              />
              <ElButton
                class="!h-12"
                type="primary"
                :loading="busy"
                :disabled="busy || isChallengeLocked || !code.trim()"
                @click="isRecoveryMode ? submitRecoveryCode() : submitTotpChallenge()"
              >
                {{ busy ? $t('strongAuth.verifyingBtn') : $t('strongAuth.verifyBtn') }}
              </ElButton>
            </div>

            <div class="text-center">
              <ElButton
                type="primary"
                link
                @click="isRecoveryMode ? switchToTotp() : switchToRecovery()"
              >
                {{
                  isRecoveryMode ? $t('strongAuth.switchToApp') : $t('strongAuth.switchToRecovery')
                }}
              </ElButton>
            </div>
          </div>

          <div class="mt-8 text-center">
            <ElButton
              type="primary"
              link
              class="!text-g-500 !text-xs hover:!text-g-900"
              @click="restartSignIn"
              >{{ $t('strongAuth.backToSignIn') }}</ElButton
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useStrongAuthGate } from '@/features/strongauth/useStrongAuthGate'
  defineOptions({ name: 'StrongAuthGate' })
  const ctx = useStrongAuthGate()
  const {
    code,
    busy,
    isSetupMode,
    isChallengeMode,
    displayName,
    inlineError,
    qrCodeBase64,
    secretKey,
    recoveryCodes,
    recoveryAcknowledged,
    isRecoveryMode,
    isChallengeLocked,
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
  } = ctx

  const ackChecked = ref(false)
  watch(ackChecked, (v) => acknowledgeRecovery(!!v))

  // Setup 分步：1=扫码 2=验证码 3=备份码（enable 成功后自动切到 3）
  const setupStep = ref(1)
  const showSetupKey = ref(false)

  watch(recoveryCodes, (codes) => {
    if (codes.length > 0 && isSetupMode.value) {
      setupStep.value = 3
    }
  })

  // 30s TOTP 刷新倒计时（仅 Step 2 运行）
  const countdown = ref(0)
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function updateCountdown() {
    const now = Math.floor(Date.now() / 1000)
    const remaining = 30 - (now % 30)
    countdown.value = remaining === 30 ? 0 : remaining
  }

  function startCountdown() {
    stopCountdown()
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  const formattedCountdown = computed(() =>
    countdown.value < 10 ? `0${countdown.value}` : `${countdown.value}`
  )

  watch(setupStep, (step) => {
    if (step === 2) startCountdown()
    else stopCountdown()
  })

  onMounted(() => {
    if (setupStep.value === 2) startCountdown()
  })

  onUnmounted(stopCountdown)

  // 下载恢复码
  function downloadRecovery() {
    if (recoveryCodes.value.length === 0) return
    const text = recoveryCodes.value.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recovery-codes-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('Recovery codes downloaded')
  }
</script>

<style scoped>
  @import '../login/style.css';
  .code-input :deep(.el-input__inner) {
    font-size: 18px;
    letter-spacing: 0.2em;
    text-align: center;
    font-family: 'SF Mono', monospace;
  }
</style>
