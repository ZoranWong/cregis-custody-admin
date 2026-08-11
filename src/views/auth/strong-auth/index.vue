<!-- StrongAuth 门禁页面 — Element Plus 组件 -->
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

          <!-- ═══ Setup Mode ═══ -->
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

              <div class="flex justify-center p-4 border-full-d rounded-xl mb-5 bg-box">
                <img :src="qrCodeBase64" class="w-40 h-40" />
              </div>

              <div class="mb-5">
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

              <div v-if="isRecoveryDisplay" class="pt-5 border-t-d mb-5">
                <div class="text-xs font-medium text-g-500 mb-1.5">{{
                  $t('strongAuth.recoveryLabel')
                }}</div>
                <p class="text-xs text-g-400 mb-3">{{ $t('strongAuth.recoveryDesc') }}</p>
                <div class="grid grid-cols-2 gap-2 mb-4">
                  <code
                    v-for="c in recoveryCodes"
                    :key="c"
                    class="px-3 py-2 border-full-d rounded-lg text-[13px] font-mono text-g-700 bg-active-color"
                    >{{ c }}</code
                  >
                </div>
                <div class="flex items-center justify-between">
                  <ElButton size="small" @click="copyRecovery">{{
                    $t('strongAuth.copyAllBtn')
                  }}</ElButton>
                  <ElCheckbox
                    v-model="ackChecked"
                    :label="$t('strongAuth.savedCheckbox')"
                    size="small"
                  />
                </div>
                <ElButton
                  v-if="recoveryAcknowledged"
                  class="w-full !mt-4"
                  type="primary"
                  @click="continueToChallenge"
                  >{{ $t('strongAuth.continueBtn') }}</ElButton
                >
              </div>

              <div v-if="!isRecoveryDisplay">
                <div class="text-xs font-medium text-g-500 mb-1.5">{{
                  $t('strongAuth.verifyCodeLabel')
                }}</div>
                <div
                  v-if="inlineError"
                  class="mb-3 p-3 rounded-lg bg-[var(--el-color-danger-light-9)] border border-[var(--el-color-danger-light-5)] text-[var(--el-color-danger)] text-[13px] flex items-start gap-2"
                >
                  <svg
                    class="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ inlineError }}
                </div>
                <div class="flex gap-3">
                  <ElInput
                    v-model="code"
                    placeholder="000000"
                    maxlength="6"
                    class="!h-12 code-input"
                    :disabled="busy || isChallengeLocked"
                    @keyup.enter="submitTotpSetup"
                  />
                  <ElButton
                    class="!h-12"
                    type="primary"
                    :loading="busy"
                    :disabled="busy || isChallengeLocked || code.trim().length < 6"
                    @click="submitTotpSetup"
                  >
                    {{ busy ? $t('strongAuth.activatingBtn') : $t('strongAuth.activateBtn') }}
                  </ElButton>
                </div>
              </div>
            </template>
          </div>

          <!-- ═══ Challenge Mode ═══ -->
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
              class="mb-4 p-3 rounded-lg bg-[var(--el-color-danger-light-9)] border border-[var(--el-color-danger-light-5)] text-[var(--el-color-danger)] text-[13px] flex items-start gap-2"
            >
              <svg
                class="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
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
  import { ref, watch } from 'vue'
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
    isRecoveryDisplay,
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
