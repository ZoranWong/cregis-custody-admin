import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { firstAuthenticate } from '@/api/auth'
import { ApiError } from '@/utils/http/request'
import { useAuthBootstrapStore } from '@/store/modules/authBootstrap'
import { useUserStore } from '@/store/modules/user'
import { useUiStore } from '@/store/modules/ui'

export function useLoginForm() {
  const router = useRouter()
  const authBootstrapStore = useAuthBootstrapStore()
  const sessionStore = useUserStore()
  const uiStore = useUiStore()
  const form = reactive({
    email: '',
    password: ''
  })
  const busy = ref(false)
  const error = ref('')

  async function submit(): Promise<void> {
    error.value = ''

    const email = form.email.trim()
    const password = form.password.trim()
    if (!email || !password) {
      error.value = 'Please enter account and password.'
      return
    }

    busy.value = true
    try {
      const result = await firstAuthenticate(email, password)
      sessionStore.clearSession()
      authBootstrapStore.clearStrongAuth()

      // mfaRequired=false：无需 MFA，登录直接完成
      if (!result.mfaRequired) {
        uiStore.showToast('success', 'Signed in', 'Login completed.')
        await router.push({ name: 'home' })
        return
      }

      // mfaRequired=true：进入 MFA 门禁（totp=false 自动进入 Setup 模式）
      authBootstrapStore.setStrongAuth({
        mfaToken: result.mfaToken,
        totpEnrolled: result.totp,
        displayNameOrEmail: email,
        identifiedEmail: email,
        totpChallengeState: 'ready',
        recoveryModeState: 'totp_primary'
      })
      await router.push({ name: 'strong-auth-gate' })
    } catch (caught) {
      error.value = mapLoginError(caught)
      uiStore.showToast('error', 'Sign-in failed', error.value)
    } finally {
      busy.value = false
    }
  }

  return {
    form,
    busy,
    error,
    submit
  }
}

function mapLoginError(caught: unknown): string {
  if (caught instanceof ApiError && caught.payload && typeof caught.payload === 'object') {
    const payload = caught.payload as Record<string, unknown>
    const semanticCode = typeof payload.semantic_code === 'string' ? payload.semantic_code : ''
    switch (semanticCode) {
      case 'invalid_credentials':
        return 'Account or password is incorrect.'
      case 'account_not_available':
        return 'Account is not available for admin access.'
      case 'rate_limited':
        return 'Too many attempts. Try again shortly.'
      default:
        break
    }
  }
  return caught instanceof Error ? caught.message : 'Sign-in failed.'
}
