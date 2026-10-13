<!-- 登录页面 — Cregis 定制版（i18n 支持） -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1 bg-box">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <div
            v-if="reentryReason"
            class="mb-5 p-3 rounded-lg border border-warning-100 bg-warning-50 text-warning-700 text-sm"
          >
            <strong class="block mb-0.5 text-caption uppercase tracking-wider">{{
              $t('login.reentryReason')
            }}</strong>
            <span>{{ reentryReason }}</span>
          </div>

          <h3 class="text-hero font-semibold text-g-900 leading-tight">{{ $t('login.title') }}</h3>
          <p class="mt-2 text-sm text-g-500">{{ $t('login.subTitle') }}</p>

          <ElButton
            class="w-full !h-[48px] !text-title !font-semibold mt-8"
            type="primary"
            @click="invokePasskey"
            :loading="passkeyState === 'invoking'"
            :disabled="passkeyState === 'unavailable'"
          >
            {{
              passkeyState === 'invoking' ? $t('login.passkeyVerifying') : $t('login.passkeyBtn')
            }}
          </ElButton>

          <div
            v-if="passkeyInlineError"
            class="mt-3 p-3 rounded-lg border border-danger-100 bg-danger-50 text-danger-700 text-sm"
          >
            {{ passkeyInlineError }}
          </div>

          <div
            class="flex items-center gap-3 my-6 text-label text-g-500 before:content-[''] before:flex-1 before:h-px before:bg-g-300 after:content-[''] after:flex-1 after:h-px after:bg-g-300"
            >{{ $t('login.passwordSeparator') }}</div
          >

          <div class="grid gap-3 mt-5 mb-4">
            <div class="grid gap-1.5">
              <label class="text-sm font-medium text-g-700">{{ $t('login.accountLabel') }}</label>
              <ElInput
                v-model="form.email"
                :placeholder="$t('login.accountPlaceholder')"
                class="!h-[44px]"
              />
            </div>
            <div class="grid gap-1.5">
              <label class="text-sm font-medium text-g-700">{{ $t('login.passwordLabel') }}</label>
              <ElInput
                v-model="form.password"
                type="password"
                :placeholder="$t('login.passwordPlaceholder')"
                show-password
                class="!h-[44px]"
                @keyup.enter="submit"
              />
            </div>
          </div>

          <ElButton
            class="w-full !h-[48px] !text-title !font-semibold"
            type="primary"
            :loading="busy"
            @click="submit"
          >
            {{ busy ? $t('login.passwordBtnLoading') : $t('login.passwordBtn') }}
          </ElButton>

          <div
            v-if="error"
            class="mt-4 p-3 rounded-lg border border-danger-100 bg-danger-50 text-danger-700 text-sm"
            >{{ error }}</div
          >

          <p class="mt-4 text-xs text-g-500">{{ $t('login.passwordHint') }}</p>

          <div class="mt-8 text-xs text-g-500 text-center">{{ $t('login.footerSlogan') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useLoginForm } from '@/features/auth/useLoginForm'
  import { usePasskeyLogin } from '@/features/auth/usePasskeyLogin'
  import { useUiStore } from '@/store/modules/ui'
  defineOptions({ name: 'Login' })
  const { form, busy, error, submit } = useLoginForm()
  const { passkeyState, inlineError, reentryReason, invokePasskey } = usePasskeyLogin()
  const uiStore = useUiStore()
  const passkeyInlineError = inlineError
</script>

<style scoped>
  @import './style.css';
</style>
