import { apiRequest, ApiError } from "@/utils/http/request";
import type {
  AuthenticatedSession,
  LoginRequest,
  LoginResponse,
  PasswordFallbackResponse,
  PendingMfaState,
  PendingMfaSetup,
  TotpBootstrapResponse,
  TotpSetupCompleteResponse,
  StrongAuthChallengeResponse,
  AuthEntryContext,
  ReentryReasonCode,
  ReentryReasonCodeKey,
  VerificationReasonCode,
  ClearanceState,
  PostAuthRoute,
  StrongAuthSetupPlan,
  StrongAuthChallengePlan,
  RecoveryCodesDeliveryBundle,
} from "@/types/models";
import { normalizeBearer } from "@/utils/format";

const PENDING_AUTH_DESTINATION_KEY = "AUTH_PENDING_DESTINATION";
const PENDING_REGATE_RETURN_TARGET_KEY = "AUTH_PENDING_REGATE_RETURN_TARGET";

export type SessionContinuityState =
  | "restorable_session"
  | "expired_reauth_required"
  | "regate_required"
  | "no_active_session";

export type ReturnTargetState =
  | "target_still_authorized"
  | "target_invalid"
  | "target_permission_lost";

export type SessionRegateReasonCode =
  | "high_risk_action"
  | "security_step_up"
  | "explicit_reauth";

export interface SessionContinuityResponse {
  continuityState: SessionContinuityState;
  reentryReason: AuthEntryContext["reentryReason"];
  verificationReason?: StrongAuthChallengeResponse["verificationReason"];
  clearanceToken?: string;
  postAuthRoute?: PostAuthRoute;
  returnTargetState: ReturnTargetState;
}

export interface SessionRegateStartResponse {
  clearanceToken: string;
  verificationReason: NonNullable<StrongAuthChallengeResponse["verificationReason"]>;
  routeTarget: "strong_auth_gate";
  returnTargetState: ReturnTargetState;
}

export interface PendingAuthDestination {
  postAuthRoute: PostAuthRoute;
  returnTarget: string | null;
}

// --- Canonical passkey-first auth endpoints (FND-001) ---

export async function fetchAuthEntryContext(): Promise<AuthEntryContext> {
  const raw = await apiRequest<Record<string, unknown>>("/v1/auth/entry/context", {
    method: "GET",
    auth: false,
  });
  return normalizeAuthEntryContext(raw);
}

export async function fetchPasskeyAssertionOptions(): Promise<{
  passkeyAttemptId: string;
  assertionOptions: Record<string, unknown>;
  passkeyPrimaryState: "ready" | "retry_available";
  passwordFallbackAllowed: boolean;
}> {
  const raw = await apiRequest<Record<string, unknown>>("/v1/auth/passkey/assertion/options", {
    method: "POST",
    auth: false,
    body: {
      clientCapability: {
        platformAuthenticatorAvailable: typeof PublicKeyCredential !== "undefined" && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable,
      },
      mediationPreference: "conditional",
    },
  });
  return normalizePasskeyAssertionOptions(raw);
}

export async function completePasskeyAssertion(
  passkeyAttemptId: string,
  credential: Record<string, unknown>,
): Promise<{
  result: "authenticated_session_issued";
  session: AuthenticatedSession;
  postAuthRoute: PostAuthRoute;
}> {
  const response = await apiRequest<Record<string, unknown>>("/v1/auth/passkey/assertion/complete", {
    method: "POST",
    auth: false,
    body: { passkey_attempt_id: passkeyAttemptId, credential },
    includeMeta: true,
  }) as { data: Record<string, unknown>; headers: Headers };
  const data = response.data || {};
  const sip = (data.session_issue_payload as Record<string, unknown>) || {};
  const postAuthRoute = normalizePostAuthRoute(data.post_auth_route);
  persistPendingAuthDestination(postAuthRoute);
  return {
    result: "authenticated_session_issued",
    session: buildSessionFromIssuePayload(sip, response.headers),
    postAuthRoute,
  };
}

export async function passwordFallbackLogin(
  account: string,
  password: string,
): Promise<PasswordFallbackResponse> {
  const response = await apiRequest<Record<string, unknown>>("/v1/auth/password-fallback/login", {
    method: "POST",
    auth: false,
    body: { account, password },
    includeMeta: true,
  }) as { data: Record<string, unknown>; headers: Headers };
  const data = response.data || {};

  const clearanceToken = readClearanceToken(data);
  const clearanceState = readClearanceState(data);
  const accountSummary = normalizeIdentifiedAccountSummary(data.identified_account_summary);
  const primaryFactorMode = normalizePrimaryFactorMode(data.primary_factor_mode);
  const fallbackFactorMode = normalizeFallbackFactorMode(data.fallback_factor_mode);
  const setupPlan = data.setup_plan == null ? undefined : normalizeStrongAuthSetupPlan(data.setup_plan);
  const challengePlan = data.challenge_plan == null ? undefined : normalizeStrongAuthChallengePlan(data.challenge_plan);

  if (clearanceState === "strong_auth_setup_required" && !setupPlan) {
    throw new Error("Authentication contract error: missing setup_plan.");
  }
  if (clearanceState === "strong_auth_challenge_required" && !challengePlan) {
    throw new Error("Authentication contract error: missing challenge_plan.");
  }

  return {
    clearanceToken,
    clearanceState,
    identifiedAccountSummary: accountSummary,
    primaryFactorMode,
    fallbackFactorMode,
    setupPlan,
    challengePlan,
  };
}

export async function fetchTotpBootstrap(clearanceToken: string): Promise<TotpBootstrapResponse> {
  const raw = await apiRequest<Record<string, unknown>>("/v1/auth/strong-auth/setup/totp/bootstrap", {
    method: "POST",
    auth: false,
    body: { clearance_token: clearanceToken },
  });
  return normalizeTotpBootstrap(raw);
}

export async function completeTotpSetup(
  clearanceToken: string,
  totpSetupId: string,
  code: string,
): Promise<TotpSetupCompleteResponse> {
  const response = await apiRequest<Record<string, unknown>>("/v1/auth/strong-auth/setup/totp/complete", {
    method: "POST",
    auth: false,
    body: { clearance_token: clearanceToken, totp_setup_id: totpSetupId, code },
    includeMeta: true,
  }) as { data: Record<string, unknown>; headers: Headers };
  const data = response.data || {};
  const result = normalizeAuthenticatedSessionIssuedResult(data.result);
  const sip = asRecord(data.session_issue_payload);
  const postAuthRoute = normalizePostAuthRouteSafely(data.post_auth_route);
  persistPendingAuthDestination(postAuthRoute);
  return {
    totpState: normalizeTotpState(data.totp_state),
    recoveryCodesDeliveryBundle: data.recovery_codes_delivery_bundle == null
      ? null
      : normalizeRecoveryCodesDeliveryBundle(data.recovery_codes_delivery_bundle),
    result,
    sessionIssued: result === "authenticated_session_issued",
    session: result === "authenticated_session_issued"
      ? buildSessionFromIssuePayload(sip, response.headers)
      : undefined,
    postAuthRoute,
    passkeyFollowUpState: normalizePasskeyFollowUpState((data as any).passkey_follow_up_state),
  };
}

export async function verifyTotpChallenge(
  clearanceToken: string,
  code: string,
): Promise<StrongAuthChallengeResponse> {
  const response = await apiRequest<Record<string, unknown>>("/v1/auth/strong-auth/challenges/totp/verify", {
    method: "POST", auth: false,
    body: { clearance_token: clearanceToken, code },
    includeMeta: true,
  }) as { data: Record<string, unknown>; headers: Headers };
  const data = response.data || {};
  const sip = asRecord(data.session_issue_payload);
  const postAuthRoute = normalizePostAuthRouteSafely(data.post_auth_route);
  persistPendingAuthDestination(postAuthRoute);
  return {
    result: normalizeResult(data.result),
    session: buildSessionFromIssuePayload(sip, response.headers),
    postAuthRoute,
    verificationReason: normalizeVerificationReason(data.verification_reason),
  };
}

export async function verifyRecoveryCode(
  clearanceToken: string,
  recoveryCode: string,
): Promise<StrongAuthChallengeResponse> {
  const response = await apiRequest<Record<string, unknown>>("/v1/auth/strong-auth/challenges/recovery-code/verify", {
    method: "POST",
    auth: false,
    body: { clearance_token: clearanceToken, recovery_code: recoveryCode },
    includeMeta: true,
  }) as { data: Record<string, unknown>; headers: Headers };
  const data = response.data || {};
  const sip = asRecord(data.session_issue_payload);
  const postAuthRoute = normalizePostAuthRouteSafely(data.post_auth_route);
  persistPendingAuthDestination(postAuthRoute);
  return {
    result: normalizeResult(data.result),
    session: buildSessionFromIssuePayload(sip, response.headers),
    postAuthRoute,
    verificationReason: normalizeVerificationReason(data.verification_reason),
  };
}

export async function fetchSessionContinuity(returnTarget?: string | null): Promise<SessionContinuityResponse> {
  const raw = await apiRequest<Record<string, unknown>>(withReturnTarget("/v1/auth/session/continuity", returnTarget), {
    method: "GET",
  });
  return normalizeSessionContinuity(raw);
}

export async function startSessionRegate(
  reasonCode: SessionRegateReasonCode,
  returnTarget?: string | null,
): Promise<SessionRegateStartResponse> {
  const raw = await apiRequest<Record<string, unknown>>("/v1/auth/session/regate/start", {
    method: "POST",
    body: {
      reason_code: reasonCode,
      return_target: returnTarget ?? null,
    },
  });
  const result = normalizeSessionRegateStart(raw);
  persistPendingRegateReturnTarget(resolveRegateReturnTarget(returnTarget ?? null, result.returnTargetState));
  return result;
}

export function peekPendingAuthDestination(): PendingAuthDestination | null {
  return readPendingAuthDestination();
}

export function consumePendingAuthDestination(): PendingAuthDestination | null {
  const snapshot = readPendingAuthDestination();
  clearPendingAuthDestination();
  return snapshot;
}

export function clearPendingAuthDestination(): void {
  const storage = getAuthMemoryStorage();
  storage?.removeItem(PENDING_AUTH_DESTINATION_KEY);
  storage?.removeItem(PENDING_REGATE_RETURN_TARGET_KEY);
}

export function stagePendingReturnTarget(returnTarget: string | null): void {
  persistPendingRegateReturnTarget(returnTarget);
}

// --- Canonical response normalizers ---

function normalizeAuthEntryContext(raw: Record<string, unknown>): AuthEntryContext {
  const re = raw.reentry_reason == null ? null : asRecord(raw.reentry_reason);
  const allowPasswordFallback = raw.password_fallback_allowed;
  if (typeof allowPasswordFallback !== "boolean") {
    throw new Error("Authentication contract error: missing password_fallback_allowed.");
  }
  return {
    allowPasswordFallback,
    passkeyState: mapPasskeyPrimaryState(readString(raw, "passkey_primary_state")),
    reentryReason: re ? {
      code: readRequiredString(re, "code") as ReentryReasonCode[ReentryReasonCodeKey],
      label: reentryLabelFromCode(readString(re, "code")),
      message: readString(re, "message") || "",
    } : null,
    operatorSummary: null,
  };
}

function mapPasskeyPrimaryState(raw: string | undefined): "ready" | "retry_available" | "unavailable" {
  if (raw === "ready") return "ready";
  if (raw === "temporarily_unavailable") return "unavailable";
  if (raw === "retry_available") return "retry_available";
  throw new Error("Authentication contract error: missing passkey_primary_state.");
}

function reentryLabelFromCode(code: string | undefined): string {
  switch (code) {
    case "session_expired": return "Session expired";
    case "security_reauth_required": return "Re-auth required";
    case "signed_out_elsewhere": return "Signed out elsewhere";
    case "admin_forced_reauth": return "Admin forced re-auth";
    default: return "Re-entry required";
  }
}

function normalizePasskeyAssertionOptions(raw: Record<string, unknown>): {
  passkeyAttemptId: string;
  assertionOptions: Record<string, unknown>;
  passkeyPrimaryState: "ready" | "retry_available";
  passwordFallbackAllowed: boolean;
} {
  const passkeyPrimaryState = readRequiredString(raw, "passkey_primary_state");
  if (passkeyPrimaryState !== "ready" && passkeyPrimaryState !== "retry_available") {
    throw new Error(`Authentication contract error: unexpected passkey_primary_state ${passkeyPrimaryState}.`);
  }
  const passwordFallbackAllowed = raw.password_fallback_allowed;
  if (typeof passwordFallbackAllowed !== "boolean") {
    throw new Error("Authentication contract error: missing password_fallback_allowed.");
  }
  return {
    passkeyAttemptId: readRequiredString(raw, "passkey_attempt_id"),
    assertionOptions: asRecord(raw.assertion_options),
    passkeyPrimaryState,
    passwordFallbackAllowed,
  };
}

function normalizeTotpBootstrap(raw: Record<string, unknown>): TotpBootstrapResponse {
  return {
    totpSetupId: readRequiredString(raw, "totp_setup_id"),
    qrCodeBase64: readRequiredString(raw, "qrCodeBase64"),
    secretKeyMasked: readRequiredString(raw, "secretKeyMasked"),
    accountName: readRequiredString(raw, "accountName"),
    recoveryDeliveryMode: normalizeRecoveryDeliveryMode(raw.recovery_delivery_mode),
  };
}

function verificationReasonLabel(code: string | undefined): string {
  switch (code) {
    case "initial_setup": return "Initial setup";
    case "device_change": return "Device change";
    case "credential_reset": return "Credential reset";
    case "policy_enforcement": return "Policy enforcement";
    case "reentry_after_recovery": return "Re-entry after recovery";
    case "session_restore_reauth": return "Re-auth required";
    case "high_risk_action": return "High-risk action";
    case "security_step_up": return "Security step-up";
    case "other_legal_regate": return "Verification required";
    default: return "Verification required";
  }
}

function normalizeVerificationReason(raw: unknown): StrongAuthChallengeResponse["verificationReason"] {
  const vr = asRecord(raw);
  if (!vr.code) return undefined;
  return {
    code: vr.code as VerificationReasonCode,
    label: verificationReasonLabel(vr.code as string),
    message: readString(vr, "message") || "",
  };
}

function normalizeSessionContinuity(raw: Record<string, unknown>): SessionContinuityResponse {
  const continuityState = normalizeContinuityState(raw.continuity_state);
  const reentryReason = raw.reentry_reason == null ? null : normalizeReentryReason(raw.reentry_reason);
  const verificationReason = raw.verification_reason == null ? undefined : normalizeVerificationReason(raw.verification_reason);
  const clearanceToken = raw.clearance_token == null ? undefined : readClearanceToken(raw);
  const postAuthRoute = raw.post_auth_route == null ? undefined : normalizePostAuthRoute(raw.post_auth_route);
  const returnTargetState = normalizeReturnTargetState(raw.return_target_state);

  if (continuityState === "restorable_session" && !postAuthRoute) {
    throw new Error("Authentication contract error: missing post_auth_route.");
  }
  if (continuityState === "regate_required" && (!clearanceToken || !verificationReason)) {
    throw new Error("Authentication contract error: missing regate continuity payload.");
  }

  return {
    continuityState,
    reentryReason,
    verificationReason,
    clearanceToken,
    postAuthRoute,
    returnTargetState,
  };
}

function normalizeSessionRegateStart(raw: Record<string, unknown>): SessionRegateStartResponse {
  const routeTarget = readRequiredString(raw, "route_target");
  const verificationReason = normalizeVerificationReason(raw.verification_reason);
  if (routeTarget !== "strong_auth_gate" || !verificationReason) {
    throw new Error("Authentication contract error: missing regate start payload.");
  }
  return {
    clearanceToken: readClearanceToken(raw),
    verificationReason: verificationReason as NonNullable<StrongAuthChallengeResponse["verificationReason"]>,
    routeTarget,
    returnTargetState: normalizeReturnTargetState(raw.return_target_state),
  };
}

function resolveRegateReturnTarget(returnTarget: string | null, returnTargetState: ReturnTargetState): string | null {
  if (returnTargetState === "target_still_authorized") {
    return returnTarget;
  }
  return "/auth/controlled-handoff";
}

function normalizeReentryReason(raw: unknown): AuthEntryContext["reentryReason"] {
  const value = asRecord(raw);
  const code = readRequiredString(value, "code");
  return {
    code: code as ReentryReasonCode[ReentryReasonCodeKey],
    label: reentryLabelFromCode(code),
    message: readString(value, "message") || "",
  };
}

function normalizePostAuthRoute(raw: unknown): PostAuthRoute {
  const par = asRecord(raw);
  const routeTarget = readRequiredString(par, "route_target") as PostAuthRoute["routeTarget"];
  if (routeTarget !== "workbench_entry" && routeTarget !== "controlled_handoff") {
    throw new Error(`Authentication contract error: unexpected route_target ${routeTarget}.`);
  }
  return {
    routeTarget,
    authorizedEntryIds: readRequiredStringArray(par, "authorized_entry_ids"),
    currentEntryId: readNullableString(par, "current_entry_id"),
    handoffReasonSummary: readNullableString(par, "handoff_reason_summary"),
  };
}

function normalizePostAuthRouteSafely(raw: unknown): PostAuthRoute {
  try {
    return normalizePostAuthRoute(raw);
  } catch {
    const par = asRecord(raw);
    return {
      routeTarget: "controlled_handoff",
      authorizedEntryIds: [],
      currentEntryId: readNullableString(par, "current_entry_id"),
      handoffReasonSummary: readNullableString(par, "handoff_reason_summary") || "Authorized admin entry is ready.",
    };
  }
}

function normalizeContinuityState(raw: unknown): SessionContinuityState {
  switch (raw) {
    case "restorable_session":
    case "expired_reauth_required":
    case "regate_required":
    case "no_active_session":
      return raw;
    default:
      throw new Error("Authentication contract error: missing continuity_state.");
  }
}

function normalizeReturnTargetState(raw: unknown): ReturnTargetState {
  switch (raw) {
    case "target_still_authorized":
    case "target_invalid":
    case "target_permission_lost":
      return raw;
    default:
      throw new Error("Authentication contract error: missing return_target_state.");
  }
}

function buildSessionFromIssuePayload(sip: Record<string, unknown>, headers: Headers): AuthenticatedSession {
  const headerToken = headers.get("Authorization") || headers.get("authorization");
  const token = (sip.token as string) || normalizeBearer(headerToken);
  const user = (sip.user as Record<string, unknown>) || {};
  const mfa = (sip.mfa as Record<string, unknown>) || {};
  if (!token) {
    throw new Error("Authentication response did not include a token.");
  }
  return {
    token,
    refreshToken: (sip.refreshToken as string) || "",
    tokenTimeout: (sip.tokenTimeout as number) ?? null,
    refreshTokenTimeout: (sip.refreshTokenTimeout as number) ?? null,
    user: {
      id: user.id as string | number,
      username: (user.username as string) || (user.email as string) || "operator",
      email: (user.email as string) || "",
      roles: Array.isArray(user.roles) ? user.roles as string[] : []
    },
    mfa: {
      totp: (mfa.totp as boolean) ?? true,
      passkey: (mfa.passkey as boolean) ?? false,
      verified: (mfa.verified as boolean) ?? true
    }
  };
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function readNullableString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (value == null) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
  const value = readString(source, key);
  if (!value) {
    throw new Error(`Authentication contract error: missing ${key}.`);
  }
  return value;
}

function readRequiredTrue(source: Record<string, unknown>, key: string): true {
  const value = source[key];
  if (value !== true) {
    throw new Error(`Authentication contract error: missing ${key}.`);
  }
  return true;
}

function readRequiredStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (!Array.isArray(value)) {
    throw new Error(`Authentication contract error: missing ${key}.`);
  }
  return value.filter((item): item is string => typeof item === "string");
}

function withReturnTarget(path: string, returnTarget?: string | null): string {
  if (!returnTarget) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}return_target=${encodeURIComponent(returnTarget)}`;
}

function getAuthMemoryStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function persistPendingRegateReturnTarget(returnTarget: string | null): void {
  const storage = getAuthMemoryStorage();
  if (!storage) {
    return;
  }
  if (!returnTarget) {
    storage.removeItem(PENDING_REGATE_RETURN_TARGET_KEY);
    return;
  }
  storage.setItem(PENDING_REGATE_RETURN_TARGET_KEY, returnTarget);
}

function readPendingRegateReturnTarget(): string | null {
  const storage = getAuthMemoryStorage();
  return storage?.getItem(PENDING_REGATE_RETURN_TARGET_KEY) || null;
}

function persistPendingAuthDestination(postAuthRoute: PostAuthRoute): void {
  const storage = getAuthMemoryStorage();
  if (!storage) {
    return;
  }
  const snapshot: PendingAuthDestination = {
    postAuthRoute,
    returnTarget: readPendingRegateReturnTarget(),
  };
  storage.setItem(PENDING_AUTH_DESTINATION_KEY, JSON.stringify(snapshot));
  storage.removeItem(PENDING_REGATE_RETURN_TARGET_KEY);
}

function readPendingAuthDestination(): PendingAuthDestination | null {
  const storage = getAuthMemoryStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(PENDING_AUTH_DESTINATION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as PendingAuthDestination;
    if (!value?.postAuthRoute?.routeTarget) {
      return null;
    }
    return {
      postAuthRoute: value.postAuthRoute,
      returnTarget: value.returnTarget ?? null,
    };
  } catch {
    return null;
  }
}

function readClearanceToken(source: Record<string, unknown>): string {
  return readString(source, "clearance_token")
    || readString(source, "mfa_token")
    || readString(source, "mfaToken")
    || (() => { throw new Error("Authentication contract error: missing clearance_token."); })();
}

function readClearanceState(source: Record<string, unknown>): ClearanceState {
  const value = readRequiredString(source, "clearance_state");
  if (value !== "strong_auth_setup_required" && value !== "strong_auth_challenge_required") {
    throw new Error(`Authentication contract error: unexpected clearance_state ${value}.`);
  }
  return value;
}

function normalizeIdentifiedAccountSummary(raw: unknown): PasswordFallbackResponse["identifiedAccountSummary"] {
  const value = asRecord(raw);
  return {
    email: readRequiredString(value, "email"),
    displayNameOrEmail: readRequiredString(value, "display_name_or_email"),
  };
}

function normalizePrimaryFactorMode(raw: unknown): PasswordFallbackResponse["primaryFactorMode"] {
  if (raw !== "passkey_preferred") {
    throw new Error("Authentication contract error: missing primary_factor_mode.");
  }
  return "passkey_preferred";
}

function normalizeFallbackFactorMode(raw: unknown): PasswordFallbackResponse["fallbackFactorMode"] {
  if (raw !== "password_then_totp_or_recovery") {
    throw new Error("Authentication contract error: missing fallback_factor_mode.");
  }
  return "password_then_totp_or_recovery";
}

function normalizeStrongAuthSetupPlan(raw: unknown): StrongAuthSetupPlan {
  const value = asRecord(raw);
  const recommendedFirstStep = readRequiredString(value, "recommended_first_step");
  if (recommendedFirstStep !== "passkey" && recommendedFirstStep !== "totp") {
    throw new Error(`Authentication contract error: unexpected recommended_first_step ${recommendedFirstStep}.`);
  }
  return {
    recommendedFirstStep,
    totpRequiredBeforeClear: readRequiredTrue(value, "totp_required_before_clear"),
    recoveryCodesIssuedAfterTotpEnable: readRequiredTrue(value, "recovery_codes_issued_after_totp_enable"),
  };
}

function normalizeStrongAuthChallengePlan(raw: unknown): StrongAuthChallengePlan {
  const value = asRecord(raw);
  const primaryChallenge = readRequiredString(value, "primary_challenge");
  if (primaryChallenge !== "totp") {
    throw new Error(`Authentication contract error: unexpected primary_challenge ${primaryChallenge}.`);
  }
  return {
    primaryChallenge,
    recoveryAllowed: readRequiredTrue(value, "recovery_allowed"),
  };
}

function normalizeRecoveryDeliveryMode(raw: unknown): TotpBootstrapResponse["recoveryDeliveryMode"] {
  if (raw !== "bundle_after_enable") {
    throw new Error("Authentication contract error: missing recovery_delivery_mode.");
  }
  return "bundle_after_enable";
}

function normalizeRecoveryCodesDeliveryBundle(raw: unknown): RecoveryCodesDeliveryBundle {
  const value = asRecord(raw);
  const deliveryMode = readRequiredString(value, "delivery_mode");
  if (deliveryMode !== "display_once") {
    throw new Error(`Authentication contract error: unexpected delivery_mode ${deliveryMode}.`);
  }
  return {
    deliveryMode,
    recoveryCodes: readRequiredStringArray(value, "recovery_codes"),
    mustAcknowledgeSaved: readRequiredTrue(value, "must_acknowledge_saved"),
    bundleVersion: readRequiredString(value, "bundle_version"),
  };
}

function normalizeTotpState(raw: unknown): "active" {
  if (raw !== "active") {
    throw new Error("Authentication contract error: missing totp_state.");
  }
  return "active";
}

function normalizeResult(raw: unknown): "authenticated_session_issued" | "challenge_failed" {
  if (raw !== "authenticated_session_issued" && raw !== "challenge_failed") {
    throw new Error("Authentication contract error: missing result.");
  }
  return raw;
}

function normalizeAuthenticatedSessionIssuedResult(raw: unknown): "authenticated_session_issued" {
  if (raw !== "authenticated_session_issued") {
    throw new Error("Authentication contract error: missing result.");
  }
  return raw;
}

function normalizePasskeyFollowUpState(raw: unknown): TotpSetupCompleteResponse["passkeyFollowUpState"] {
  if (raw == null) {
    return undefined;
  }
  if (raw === "active" || raw === "not_configured_can_manage_later") {
    return raw;
  }
  throw new Error(`Authentication contract error: unexpected passkey_follow_up_state ${String(raw)}.`);
}

// --- Legacy endpoints (migration compatibility) ---

function buildAuthenticatedSession(authData: LoginResponse, headers: Headers, pending?: PendingMfaState | null): AuthenticatedSession {
  const headerToken = headers.get("Authorization") || headers.get("authorization");
  const token = authData.token || normalizeBearer(headerToken);
  const user = authData.user || authData;
  if (!token) {
    throw new Error("Authentication response did not include a token.");
  }
  return {
    token,
    refreshToken: authData.refreshToken || "",
    tokenTimeout: authData.tokenTimeout ?? null,
    refreshTokenTimeout: authData.refreshTokenTimeout ?? null,
    user: {
      id: user.id,
      username: user.username || user.email || "operator",
      email: user.email || "",
      roles: Array.isArray(user.roles) ? user.roles : []
    },
    mfa: {
      totp: pending?.totp !== false,
      passkey: !!pending?.passkey,
      verified: true
    }
  };
}

export async function loginWithPassword(payload: LoginRequest): Promise<{ kind: "mfa"; pending: PendingMfaState } | { kind: "authenticated"; session: AuthenticatedSession }> {
  const response = await apiRequest<LoginResponse>("/v1/auth/login", { method: "POST", auth: false, body: payload, includeMeta: true }) as { data: LoginResponse; headers: Headers };
  const data = response.data || {};
  if (data.mfaRequired) {
    return { kind: "mfa", pending: { token: data.mfaToken || "", totp: !!data.totp, passkey: !!data.passkey, email: payload.account, setup: null, recoveryCode: "", recoveryAcknowledged: false } };
  }
  return { kind: "authenticated", session: buildAuthenticatedSession(data, response.headers, null) };
}

export function fetchTotpSetup(mfaToken: string, email: string): Promise<PendingMfaSetup> {
  return apiRequest<PendingMfaSetup>("/v1/auth/mfa/settings/totp/setup", { method: "POST", auth: false, body: { mfaToken, email } }) as any;
}

export function enableTotp(mfaToken: string, code: string): Promise<{ recoveryCode?: string }> {
  return apiRequest<{ recoveryCode?: string }>("/v1/auth/mfa/settings/totp/enable", { method: "POST", auth: false, body: { mfaToken, code } }) as any;
}

export async function verifyTotp(mfaToken: string, code: string, pending: PendingMfaState): Promise<AuthenticatedSession> {
  const response = await apiRequest<LoginResponse>("/v1/auth/mfa/totp/verify", { method: "POST", auth: false, body: { mfaToken, code }, includeMeta: true }) as { data: LoginResponse; headers: Headers };
  return buildAuthenticatedSession(response.data || {}, response.headers, pending);
}

export function fetchPendingPasskeyOptions(mfaToken: string): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>("/v1/auth/mfa/passkey/options", { method: "POST", auth: false, body: { mfaToken } }) as any;
}

export async function verifyPasskey(mfaToken: string, credential: Record<string, string>, pending: PendingMfaState): Promise<AuthenticatedSession> {
  const response = await apiRequest<LoginResponse>("/v1/auth/mfa/passkey/verify", { method: "POST", auth: false, body: { mfaToken, credential: JSON.stringify(credential) }, includeMeta: true }) as { data: LoginResponse; headers: Headers };
  return buildAuthenticatedSession(response.data || {}, response.headers, pending);
}

// ★ Art Design Pro 兼容
export async function fetchGetUserInfo(): Promise<Record<string, unknown>> {
  return apiRequest("/api/user/info", { method: "GET" }) as any;
}

export { ApiError };
