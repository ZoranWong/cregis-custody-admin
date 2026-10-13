# Login Flow Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace old password-fallback login flow with new `/v1/auth/login` + `/v1/auth/mfa/*` endpoints, keeping existing admin UI unchanged.

**Architecture:** Replace API layer functions (`passwordFallbackLogin` → `firstAuthenticate`, `fetchTotpBootstrap` → `setupTotp`, `completeTotpSetup` → `enableTotp`, `verifyTotpChallenge`/`verifyRecoveryCode` → new `/v1/auth/mfa/totp/verify`), rename `clearanceToken` → `mfaToken` throughout, simplify types, keep recovery code support.

**Tech Stack:** Vue 3 + TypeScript + Pinia + Element Plus

---

### Task 1: Update types

**Files:**

- Modify: `src/types/models.ts`

**Step 1: Add new response types, remove old ones**

In `src/types/models.ts`:

1. Add new type after `LoginResponse`:

```typescript
export interface FirstAuthenticateResponse {
  mfaToken: string
  mfaRequired: boolean
  totp: boolean
  passkey: boolean
}
```

2. Add new type after `PendingMfaSetup`:

```typescript
export interface TotpSetupResponse {
  qrCodeBase64: string
  secretKey: string
  accountName: string
}
```

3. Add new type after `TotpSetupResponse`:

```typescript
export interface TotpEnableResponse {
  token: string
  refreshToken: string
  user: Partial<AuthenticatedUser>
  recoveryCode?: string
}
```

4. Update `StrongAuthState` (around line 868): rename `clearanceToken` → `mfaToken`, remove `primaryFactorMode`, `fallbackFactorMode`, `setupPlan`, `challengePlan`, `clearanceState`; add `totpEnrolled: boolean`:

```typescript
export interface StrongAuthState {
  mfaToken: string
  totpEnrolled: boolean
  displayNameOrEmail: string
  identifiedEmail: string
  totpSetupId?: string
  qrCodeBase64?: string
  secretKeyMasked?: string
  accountName?: string
  recoveryDeliveryMode?: string
  issuedSession?: Record<string, unknown>
  postAuthRoute?: Record<string, unknown>
  passkeyFollowUpState?: string
  verificationReason?: { label: string; message: string }
  totpChallengeState:
    | 'ready'
    | 'pending'
    | 'verified'
    | 'recovery'
    | 'expired'
    | 'invalid_code'
    | 'too_many_attempts'
  recoveryModeState: 'totp_primary' | 'recovery_substep'
  recoveryCodes?: string[]
  recoveryAcknowledged?: boolean
  inlineErrorMessage?: string
}
```

5. Remove typings no longer needed (lines 782-808): `ClearanceState`, `PrimaryFactorMode`, `FallbackFactorMode`, `StrongAuthSetupPlan`, `StrongAuthChallengePlan`, `PasswordFallbackResponse`.

6. Remove typings no longer needed (lines 812-834): `VerificationReasonCode`, `VerificationReason`, `PostAuthRoute`.

7. Remove typings no longer needed (lines 836-866): `TotpBootstrapResponse`, `RecoveryCodesDeliveryBundle`, `TotpSetupCompleteResponse`, `StrongAuthChallengeResponse`.

**Step 2: Commit**

```bash
git add src/types/models.ts
git commit -m "feat: update auth types for new login flow

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Update authBootstrap store

**Files:**

- Modify: `src/store/modules/authBootstrap.ts`

**Step 1: Rename `clearanceToken` to `mfaToken`, add `totpEnrolled`, remove old fields**

In `src/store/modules/authBootstrap.ts`:

1. Update `StrongAuthState` interface (~line 24-49):
   - Rename `clearanceToken` → `mfaToken`
   - Remove `clearanceState?`
   - Remove `primaryFactorMode?`
   - Remove `fallbackFactorMode?`
   - Remove `setupPlan?`
   - Remove `challengePlan?`
   - Add `totpEnrolled?: boolean`

2. Update `setStrongAuth` function (~line 88): keep as-is (it assigns the full state)

3. Update `hasStrongAuth` computed (~line 59): `mfaToken` instead of `clearanceToken`

**Step 2: Commit**

```bash
git add src/store/modules/authBootstrap.ts
git commit -m "feat: rename clearanceToken to mfaToken in auth store

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Rewrite auth API layer

**Files:**

- Modify: `src/api/auth.ts`

**Step 1: Replace passwordFallbackLogin with firstAuthenticate**

Replace the `passwordFallbackLogin` function (~line 115-153) with:

```typescript
export async function firstAuthenticate(
  account: string,
  password: string
): Promise<FirstAuthenticateResponse> {
  const body: Record<string, string> = { account, password, type: 'PASSWORD' }
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/login', {
    method: 'POST',
    auth: false,
    body,
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return {
    mfaToken: readMfaToken(data),
    mfaRequired: data.mfaRequired === true,
    totp: data.totp === true,
    passkey: data.passkey === true
  }
}
```

**Step 2: Replace fetchTotpBootstrap with setupTotp**

Replace `fetchTotpBootstrap` (~line 155-165) with:

```typescript
export async function setupTotp(mfaToken: string): Promise<TotpSetupResponse> {
  const raw = await apiRequest<Record<string, unknown>>('/v1/auth/mfa/settings/totp/setup', {
    method: 'POST',
    auth: false,
    body: { mfaToken }
  })
  return {
    qrCodeBase64: readRequiredString(raw, 'qrCodeBase64'),
    secretKey: readRequiredString(raw, 'secretKey'),
    accountName: readRequiredString(raw, 'accountName')
  }
}
```

**Step 3: Replace completeTotpSetup with enableTotpCode**

Replace `completeTotpSetup` (~line 167-201) with:

```typescript
export async function enableTotpCode(mfaToken: string, code: string): Promise<TotpEnableResponse> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/settings/totp/enable', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return {
    token: readRequiredString(data, 'token'),
    refreshToken: readString(data, 'refreshToken') || '',
    user: readUserFromResponse(data),
    recoveryCode: readString(data, 'recoveryCode')
  }
}
```

**Step 4: Replace verifyTotpChallenge with new endpoint**

Replace `verifyTotpChallenge` (~line 203-226) with:

```typescript
export async function verifyTotpChallenge(
  mfaToken: string,
  code: string
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/totp/verify', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code, type: 'GOOGLE_CODE' },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return buildSessionFromResponse(data, response.headers)
}
```

**Step 5: Replace verifyRecoveryCode with new endpoint**

Replace `verifyRecoveryCode` (~line 228-251) with:

```typescript
export async function verifyRecoveryCode(
  mfaToken: string,
  recoveryCode: string
): Promise<AuthenticatedSession> {
  const response = (await apiRequest<Record<string, unknown>>('/v1/auth/mfa/totp/verify', {
    method: 'POST',
    auth: false,
    body: { mfaToken, code: recoveryCode, type: 'RECOVERY_CODE' },
    includeMeta: true
  })) as { data: Record<string, unknown>; headers: Headers }
  const data = response.data || {}
  return buildSessionFromResponse(data, response.headers)
}
```

**Step 6: Add helper functions and cleanup**

Add these helper functions (place near the top after imports):

```typescript
function readMfaToken(source: Record<string, unknown>): string {
  return (
    readString(source, 'mfaToken') ||
    readString(source, 'mfa_token') ||
    readString(source, 'clearance_token') ||
    (() => {
      throw new Error('Authentication contract error: missing mfaToken.')
    })()
  )
}

function readUserFromResponse(data: Record<string, unknown>): Partial<AuthenticatedUser> {
  const user = asRecord(data.user)
  return {
    id: user.id as string | number,
    username: (user.username as string) || (user.email as string) || 'operator',
    email: (user.email as string) || '',
    roles: Array.isArray(user.roles) ? (user.roles as string[]) : []
  }
}

function buildSessionFromResponse(
  data: Record<string, unknown>,
  headers: Headers
): AuthenticatedSession {
  const headerToken = headers.get('Authorization') || headers.get('authorization')
  const token = (data.token as string) || normalizeBearer(headerToken)
  const user = readUserFromResponse(data)
  if (!token) throw new Error('Authentication response did not include a token.')
  return {
    token,
    refreshToken: (data.refreshToken as string) || '',
    tokenTimeout: (data.tokenTimeout as number) ?? null,
    refreshTokenTimeout: (data.refreshTokenTimeout as number) ?? null,
    user: {
      id: user.id,
      username: user.username || 'operator',
      email: user.email || '',
      roles: user.roles || []
    },
    mfa: { totp: true, passkey: false, verified: true }
  }
}
```

**Step 7: Remove all old/unused code**

Delete these functions and all their associated normalizers:

- `passwordFallbackLogin` + all its normalizers (`normalizeIdentifiedAccountSummary`, `normalizePrimaryFactorMode`, `normalizeFallbackFactorMode`, `normalizeStrongAuthSetupPlan`, `normalizeStrongAuthChallengePlan`, `readClearanceState`, `readClearanceToken`)
- `fetchTotpBootstrap` + `normalizeTotpBootstrap`, `normalizeRecoveryDeliveryMode`
- `completeTotpSetup` + `normalizeTotpState`, `normalizeAuthenticatedSessionIssuedResult`, `normalizePasskeyFollowUpState`, `normalizeRecoveryCodesDeliveryBundle`
- `fetchSessionContinuity` + `normalizeSessionContinuity`, `normalizeContinuityState`, `normalizeReturnTargetState`, `normalizeReentryReason`, `withReturnTarget`
- `startSessionRegate` + `normalizeSessionRegateStart`, `resolveRegateReturnTarget`
- `peekPendingAuthDestination`, `consumePendingAuthDestination`, `clearPendingAuthDestination`, `stagePendingReturnTarget` + all storage helpers (`getAuthMemoryStorage`, `persistPendingRegateReturnTarget`, `readPendingRegateReturnTarget`, `persistPendingAuthDestination`, `readPendingAuthDestination`)
- `normalizePostAuthRoute`, `normalizePostAuthRouteSafely`, `normalizeVerificationReason`, `verificationReasonLabel`
- `buildAuthenticatedSession`, `loginWithPassword`, `fetchTotpSetup`, `enableTotp`, `verifyTotp`, `fetchPendingPasskeyOptions`, `verifyPasskey`, `fetchGetUserInfo`
- All type exports: `SessionContinuityState`, `ReturnTargetState`, `SessionRegateReasonCode`, `SessionContinuityResponse`, `SessionRegateStartResponse`, `PendingAuthDestination`

**Step 8: Update imports**

Update the import at the top to only import what's still needed:

```typescript
import { apiRequest, ApiError } from '@/utils/http/request'
import type {
  AuthenticatedSession,
  FirstAuthenticateResponse,
  TotpSetupResponse,
  TotpEnableResponse,
  AuthEntryContext,
  ReentryReasonCode,
  ReentryReasonCodeKey
} from '@/types/models'
import { normalizeBearer } from '@/utils/format'
```

**Step 9: Keep passkey functions unchanged**

Ensure these functions remain untouched:

- `fetchAuthEntryContext`
- `fetchPasskeyAssertionOptions`
- `completePasskeyAssertion`
- All their normalizers (`normalizeAuthEntryContext`, `normalizePasskeyAssertionOptions`, `mapPasskeyPrimaryState`, `reentryLabelFromCode`)

**Step 10: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: replace old auth API with new /v1/auth/* endpoints

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Update useLoginForm

**Files:**

- Modify: `src/features/auth/useLoginForm.ts`

**Step 1: Replace passwordFallbackLogin with firstAuthenticate**

In `src/features/auth/useLoginForm.ts`:

1. Update import:

```typescript
import { firstAuthenticate } from '@/api/auth'
```

2. Replace the `submit` function (~line 21-52):

```typescript
async function submit(): Promise<void> {
  error.value = ''
  busy.value = true
  try {
    const result = await firstAuthenticate(form.email.trim(), form.password.trim())
    sessionStore.clearSession()
    authBootstrapStore.clearStrongAuth()
    authBootstrapStore.setStrongAuth({
      mfaToken: result.mfaToken,
      totpEnrolled: result.totp,
      displayNameOrEmail: form.email.trim(),
      identifiedEmail: form.email.trim(),
      totpChallengeState: 'ready',
      recoveryModeState: 'totp_primary'
    })
    uiStore.showToast(
      'info',
      'Security verification required',
      'Complete verification to continue.'
    )
    await router.push({ name: 'strong-auth-gate' })
  } catch (caught) {
    error.value = mapLoginError(caught)
    uiStore.showToast('error', 'Sign-in failed', error.value)
  } finally {
    busy.value = false
  }
}
```

**Step 2: Commit**

```bash
git add src/features/auth/useLoginForm.ts
git commit -m "feat: use firstAuthenticate in login form

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Update useStrongAuthGate

**Files:**

- Modify: `src/features/strongauth/useStrongAuthGate.ts`

**Step 1: Update imports**

Replace:

```typescript
import {
  completeTotpSetup,
  fetchTotpBootstrap,
  verifyRecoveryCode,
  verifyTotpChallenge
} from '@/api/auth'
```

With:

```typescript
import { setupTotp, enableTotpCode, verifyRecoveryCode, verifyTotpChallenge } from '@/api/auth'
```

**Step 2: Update clearanceState computed**

Replace `clearanceState` computed (~line 25) with:

```typescript
const totpEnrolled = computed(() => strongAuth.value?.totpEnrolled ?? false)
```

**Step 3: Update isSetupMode and isChallengeMode**

Replace (~line 26-34):

```typescript
const isSetupMode = computed(
  () =>
    clearanceState.value === 'strong_auth_setup_required' && !strongAuth.value?.totpSetupComplete
)
const isChallengeMode = computed(
  () =>
    clearanceState.value === 'strong_auth_challenge_required' || strongAuth.value?.totpSetupComplete
)
```

With:

```typescript
const isSetupMode = computed(() => !totpEnrolled.value)
const isChallengeMode = computed(() => totpEnrolled.value)
```

**Step 4: Update all `clearanceToken` references to `mfaToken`**

Replace all occurrences of `sa.clearanceToken` with `sa.mfaToken` in:

- `loadTotpBootstrap` (~line 63)
- `submitTotpSetup` (~line 89)
- `submitTotpChallenge` (~line 142)
- `submitRecoveryCode` (~line 168)

**Step 5: Replace loadTotpBootstrap**

Replace the function body (~line 62-86):

```typescript
async function loadTotpBootstrap(): Promise<void> {
  if (!strongAuth.value?.mfaToken) return
  busy.value = true
  try {
    const result = await setupTotp(strongAuth.value.mfaToken)
    authBootstrapStore.updateStrongAuthSetup({
      qrCodeBase64: result.qrCodeBase64,
      secretKeyMasked: result.secretKey,
      accountName: result.accountName
    })
  } catch (caught) {
    if (await handleTerminalStrongAuthError(caught, 'Security session expired')) return
    uiStore.showToast(
      'error',
      'Setup unavailable',
      caught instanceof Error ? caught.message : 'Unable to prepare setup.'
    )
  } finally {
    busy.value = false
  }
}
```

**Step 6: Replace submitTotpSetup**

Replace the function body (~line 88-138):

```typescript
async function submitTotpSetup(): Promise<void> {
  const sa = strongAuth.value
  if (!sa?.mfaToken || !code.value.trim() || isChallengeLocked.value) return
  busy.value = true
  try {
    const result = await enableTotpCode(sa.mfaToken, code.value.trim())
    // Store recovery code if returned
    const recoveryCode = result.recoveryCode
    authBootstrapStore.updateStrongAuthSetup({
      totpSetupComplete: true,
      recoveryCodes: recoveryCode ? [recoveryCode] : [],
      recoveryAcknowledged: false,
      inlineErrorMessage: '',
      totpChallengeState: 'ready',
      recoveryModeState: 'totp_primary'
    })
    // Set session and enter
    const session: AuthenticatedSession = {
      token: result.token,
      refreshToken: result.refreshToken,
      tokenTimeout: null,
      refreshTokenTimeout: null,
      user: {
        id: result.user.id,
        username: result.user.username || 'operator',
        email: result.user.email || '',
        roles: result.user.roles || []
      },
      mfa: { totp: true, passkey: false, verified: true }
    }
    sessionStore.setSession(session)
    authBootstrapStore.clearStrongAuth()
    uiStore.showToast('success', 'TOTP enabled', 'Authentication completed.')
    code.value = ''
    await router.push({ name: 'home' })
  } catch (caught) {
    if (await handleTerminalStrongAuthError(caught, 'Security session expired')) return
    const mapped = mapTotpError(caught, 'Unable to activate TOTP.')
    authBootstrapStore.setStrongAuthTotpChallengeState(mapped.state)
    authBootstrapStore.setStrongAuthInlineError(mapped.message)
    uiStore.showToast('error', 'Activation failed', mapped.message)
  } finally {
    busy.value = false
  }
}
```

**Step 7: Update submitTotpChallenge**

Replace `sa.clearanceToken` → `sa.mfaToken` in the function, and update the session handling (~line 140-164):

```typescript
async function submitTotpChallenge(): Promise<void> {
  const sa = strongAuth.value
  if (!sa?.mfaToken || !code.value.trim() || isChallengeLocked.value) return
  busy.value = true
  try {
    const result = await verifyTotpChallenge(sa.mfaToken, code.value.trim())
    sessionStore.setSession(result)
    authBootstrapStore.clearStrongAuth()
    uiStore.showToast('success', 'Admin session ready', 'Multi-factor verification completed.')
    await router.push({ name: 'home' })
  } catch (caught) {
    if (await handleTerminalStrongAuthError(caught, 'Security session expired')) return
    const mapped = mapTotpError(caught, 'Unable to verify code.')
    authBootstrapStore.setStrongAuthTotpChallengeState(mapped.state)
    authBootstrapStore.setStrongAuthInlineError(mapped.message)
    uiStore.showToast('error', 'Verification failed', mapped.message)
  } finally {
    busy.value = false
  }
}
```

**Step 8: Update submitRecoveryCode**

Replace `sa.clearanceToken` → `sa.mfaToken` (~line 166-192):

```typescript
async function submitRecoveryCode(): Promise<void> {
  const sa = strongAuth.value
  if (!sa?.mfaToken || !code.value.trim() || isChallengeLocked.value) return
  busy.value = true
  try {
    const result = await verifyRecoveryCode(sa.mfaToken, code.value.trim())
    sessionStore.setSession(result)
    authBootstrapStore.clearStrongAuth()
    uiStore.showToast('success', 'Admin session ready', 'Recovery code verification completed.')
    await router.push({ name: 'home' })
  } catch (caught) {
    if (await handleTerminalStrongAuthError(caught, 'Security session expired')) return
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
```

**Step 9: Update continueToChallenge**

Replace `clearanceState: 'strong_auth_challenge_required'` → `totpEnrolled: true` (~line 229-238):

```typescript
async function continueToChallenge(): Promise<void> {
  const sa = strongAuth.value
  if (!sa || !sa.recoveryAcknowledged) return
  if (sa.issuedSession) {
    sessionStore.setSession(sa.issuedSession as any)
    authBootstrapStore.clearStrongAuth()
    uiStore.showToast('success', 'Admin session ready', 'Authentication completed.')
    await router.push({ name: 'home' })
    return
  }
  authBootstrapStore.setStrongAuth({
    ...sa,
    totpEnrolled: true,
    totpSetupComplete: true,
    inlineErrorMessage: '',
    totpChallengeState: 'ready',
    recoveryModeState: 'totp_primary'
  })
  code.value = ''
}
```

**Step 10: Update handleTerminalStrongAuthError**

Replace `clearance_token_invalid_or_expired` → `mfa_token_invalid_or_expired` (~line 267-286):

```typescript
async function handleTerminalStrongAuthError(caught: unknown, title: string): Promise<boolean> {
  const semanticCode = readSemanticCode(caught)
  if (semanticCode === 'mfa_token_invalid_or_expired' || semanticCode === 'state_conflict') {
    const message =
      semanticCode === 'mfa_token_invalid_or_expired'
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
```

**Step 11: Update return statement**

Replace `clearanceState` with `totpEnrolled` in the return (~line 294-327).

**Step 12: Commit**

```bash
git add src/features/strongauth/useStrongAuthGate.ts
git commit -m "feat: update StrongAuth gate to use new MFA APIs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Update StrongAuth page

**Files:**

- Modify: `src/views/auth/strong-auth/index.vue`

**Step 1: No visual changes needed**

The `useStrongAuthGate` composable exposes the same interface (`isSetupMode`, `isChallengeMode`, `code`, `busy`, etc.). The page template should work without changes. Verify the bindings still work.

**Step 2: Commit**

```bash
# Verify no visual changes needed, template bindings unchanged
git add src/views/auth/strong-auth/index.vue
git commit -m "feat: verify StrongAuth page works with new gate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Verify and build

**Step 1: Run TypeScript check**

```bash
npx vue-tsc --noEmit 2>&1 | head -50
```

Expected: No new type errors related to auth changes.

**Step 2: Run build**

```bash
npm run build:test
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git commit -m "chore: verify build passes after login flow changes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
