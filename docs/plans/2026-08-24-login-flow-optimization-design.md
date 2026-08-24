# Login Flow Optimization Design

Date: 2026-08-24

## Background

Replace the old password-fallback login flow with the new `/v1/auth/login` API, and update the TOTP setup/verify flow to use the new `/v1/auth/mfa/*` endpoints. The new API response format is consistent with `cregis-custody-manager`.

## New Login Flow

```
Login Page (password)
  │
  └─ POST /v1/auth/login → { mfaToken, mfaRequired, totp }
       │
       ├─ totp: false → StrongAuth (Setup Mode)
       │     ├─ POST /v1/auth/mfa/settings/totp/setup → QR code + secret
       │     └─ POST /v1/auth/mfa/settings/totp/enable → token → enter system
       │
       └─ totp: true → StrongAuth (Challenge Mode)
             └─ POST /v1/auth/mfa/totp/verify → token → enter system
                   type: GOOGLE_CODE | RECOVERY_CODE
```

## API Endpoints

| Endpoint                            | Method | Purpose                       |
| ----------------------------------- | ------ | ----------------------------- |
| `/v1/auth/login`                    | POST   | Login, get temp mfaToken      |
| `/v1/auth/mfa/settings/totp/setup`  | POST   | Get QR code + secret key      |
| `/v1/auth/mfa/settings/totp/enable` | POST   | Enable TOTP with 6-digit code |
| `/v1/auth/mfa/totp/verify`          | POST   | Verify TOTP/Recovery code     |

## Response Format (consistent with manager)

### Login Response

```json
{
  "mfaToken": "string",
  "mfaRequired": true,
  "totp": false
}
```

### TOTP Setup Response

```json
{
  "qrCodeBase64": "string",
  "secretKey": "string",
  "accountName": "string"
}
```

### TOTP Enable Response

```json
{
  "token": "string",
  "refreshToken": "string",
  "user": { ... },
  "recoveryCode": "string"
}
```

### TOTP Verify Response

```json
{
  "token": "string",
  "refreshToken": "string",
  "user": { ... }
}
```

## Changes

### 1. `src/api/auth.ts`

- **Replace** `passwordFallbackLogin` → `firstAuthenticate` (POST `/v1/auth/login`)
- **Replace** `fetchTotpBootstrap` → `setupTotp` (POST `/v1/auth/mfa/settings/totp/setup`)
- **Replace** `completeTotpSetup` → `enableTotp` (POST `/v1/auth/mfa/settings/totp/enable`)
- **Replace** `verifyTotpChallenge` → `verifyTotpChallenge` (POST `/v1/auth/mfa/totp/verify`, type: GOOGLE_CODE)
- **Replace** `verifyRecoveryCode` → `verifyRecoveryCode` (POST `/v1/auth/mfa/totp/verify`, type: RECOVERY_CODE)
- **Delete** all old `/v1/auth/password-fallback/*` and `/v1/auth/strong-auth/*` related code

### 2. `src/types/models.ts`

- Update `LoginResponse` to match new format
- Add `FirstAuthenticateResponse` type

### 3. `src/store/modules/authBootstrap.ts`

- `clearanceToken` → `mfaToken`
- `clearanceState` → use `totpEnrolled` to determine setup/challenge mode
- Keep `recoveryModeState`, `recoveryCodes`, `recoveryAcknowledged` (for future use)
- Remove `setupPlan`, `challengePlan`, `primaryFactorMode`, `fallbackFactorMode`

### 4. `src/features/auth/useLoginForm.ts`

- Replace `passwordFallbackLogin` call with `firstAuthenticate`
- Simplify state mapping based on `totp` field

### 5. `src/features/strongauth/useStrongAuthGate.ts`

- Replace API calls: `fetchTotpBootstrap` → `setupTotp`, `completeTotpSetup` → `enableTotp`
- `verifyTotpChallenge` and `verifyRecoveryCode` → update to new `/v1/auth/mfa/totp/verify` endpoint
- Keep recovery code flow (switch between GOOGLE_CODE and RECOVERY_CODE)

### 6. `src/views/auth/strong-auth/index.vue`

- Keep existing UI structure (single page, setup/challenge mode switching)
- Keep recovery code UI elements
- No visual changes, only data binding adjustments

### 7. `src/features/auth/usePasskeyLogin.ts`

- No changes (passkey endpoints remain `/v1/auth/passkey/*`)

## Not Changed

- Passkey login flow
- Login page UI
- Other auth-related code (bootstrap, guards, routes)
