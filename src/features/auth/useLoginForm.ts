import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { passwordFallbackLogin } from '@/api/auth'
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
    busy.value = true
    try {
      const result = await passwordFallbackLogin(form.email.trim(), form.password.trim())
      sessionStore.clearSession()
      authBootstrapStore.clearStrongAuth()
      authBootstrapStore.setStrongAuth({
        clearanceToken: result.clearanceToken,
        clearanceState: result.clearanceState,
        displayNameOrEmail: result.identifiedAccountSummary.displayNameOrEmail,
        identifiedEmail: result.identifiedAccountSummary.email,
        primaryFactorMode: result.primaryFactorMode,
        fallbackFactorMode: result.fallbackFactorMode,
        setupPlan: result.setupPlan,
        challengePlan: result.challengePlan,
        totpChallengeState: 'ready',
        recoveryModeState: 'totp_primary'
      })
      uiStore.showToast(
        'info',
        'Security verification required',
        'Complete strong-auth verification to continue.'
      )
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
