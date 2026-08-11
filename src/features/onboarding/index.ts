import type {
  OnboardingApplicationItemView,
  OnboardingDetailView,
  OnboardingHandoffSummaryView,
  OnboardingMerchantManagementLinkView,
  OnboardingRefreshResponse,
  OnboardingTicketLinkView
} from "@/types/models";
import { ApiError } from "@/utils/http/request";

export type OnboardingSemanticCode =
  | "validation_error"
  | "session_expired_or_missing"
  | "account_not_available"
  | "not_found"
  | "state_conflict"
  | "provider_sync_unavailable"
  | "rate_limited"
  | "";

export interface OnboardingSemanticError {
  semanticCode: OnboardingSemanticCode;
  message: string;
}

export interface OnboardingReadState {
  item: OnboardingApplicationItemView;
  detail?: OnboardingDetailView;
  refreshResult?: OnboardingRefreshResponse["refreshResult"];
  ticketLink?: OnboardingTicketLinkView;
  merchantManagementLink?: OnboardingMerchantManagementLinkView;
}

export function readOnboardingSemanticError(caught: unknown, fallbackMessage: string): OnboardingSemanticError {
  if (caught instanceof ApiError) {
    const payloadError = normalizeOnboardingSemanticError(caught.payload, caught.message);
    if (payloadError.semanticCode) {
      return payloadError;
    }
    const messageCode = normalizeSemanticCode(caught.message);
    if (messageCode) {
      return {
        semanticCode: messageCode,
        message: payloadError.message || caught.message || fallbackMessage
      };
    }
    const statusCode = statusCodeFromApiError(caught.code) || statusCodeFromApiError(caught.status);
    if (statusCode) {
      return {
        semanticCode: statusCode,
        message: readOnboardingMessage(caught.payload, caught.message || fallbackMessage)
      };
    }
    return {
      semanticCode: payloadError.semanticCode,
      message: payloadError.message || caught.message || fallbackMessage
    };
  }
  return normalizeOnboardingSemanticError(caught, fallbackMessage);
}

export function readOnboardingSemanticCode(payload: unknown): OnboardingSemanticCode {
  if (typeof payload === "string") {
    return normalizeSemanticCode(payload);
  }
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const raw = payload as Record<string, unknown>;
  if (typeof raw.semanticCode === "string") {
    return normalizeSemanticCode(raw.semanticCode);
  }
  if (typeof raw.semantic_code === "string") {
    return normalizeSemanticCode(raw.semantic_code);
  }
  if (raw.data && typeof raw.data === "object") {
    const nested = raw.data as Record<string, unknown>;
    if (typeof nested.semanticCode === "string") {
      return normalizeSemanticCode(nested.semanticCode);
    }
    if (typeof nested.semantic_code === "string") {
      return normalizeSemanticCode(nested.semantic_code);
    }
  }
  if (typeof raw.code === "string") {
    return normalizeSemanticCode(raw.code) || mapStatusCode(raw.code);
  }
  if (typeof raw.code === "number") {
    return mapStatusCode(raw.code);
  }
  const message = typeof raw.message === "string" ? raw.message : typeof raw.msg === "string" ? raw.msg : "";
  return normalizeSemanticCode(message);
}

export function normalizeOnboardingSemanticError(payload: unknown, fallbackMessage: string): OnboardingSemanticError {
  const semanticCode = readOnboardingSemanticCode(payload);
  const message = readOnboardingMessage(payload, fallbackMessage);
  return { semanticCode, message };
}

export function readOnboardingMessage(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }
  const raw = payload as Record<string, unknown>;
  if (typeof raw.message === "string" && raw.message.trim()) {
    return raw.message;
  }
  if (typeof raw.msg === "string" && raw.msg.trim()) {
    return raw.msg;
  }
  return fallbackMessage;
}

export function isMerchantManagementOpen(link: OnboardingHandoffSummaryView | undefined | null): boolean {
  return !!link?.canOpenMerchantManagement && !!link?.merchantRecordRef;
}

export function normalizeOnboardingRefreshResult(result: OnboardingRefreshResponse): OnboardingRefreshResponse["refreshResult"] {
  return result.refreshResult;
}

export function normalizeOnboardingListItem(item: OnboardingApplicationItemView): OnboardingApplicationItemView {
  return {
    ...item,
    currentStageLabel: item.currentStageLabel || item.currentStage,
    merchantName: item.merchantName || "Unknown merchant"
  };
}

function normalizeSemanticCode(value: string): OnboardingSemanticCode {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  if (normalized.includes("state_conflict")) {
    return "state_conflict";
  }
  if (normalized.includes("session_expired_or_missing")) {
    return "session_expired_or_missing";
  }
  if (normalized.includes("fresh_verification_required")) {
    return "session_expired_or_missing";
  }
  if (normalized.includes("account_not_available")) {
    return "account_not_available";
  }
  if (normalized.includes("not_found")) {
    return "not_found";
  }
  if (normalized.includes("provider_sync_unavailable")) {
    return "provider_sync_unavailable";
  }
  if (normalized.includes("rate_limited")) {
    return "rate_limited";
  }
  if (normalized.includes("validation_error")) {
    return "validation_error";
  }
  return "";
}

function mapStatusCode(value: number | string): OnboardingSemanticCode {
  const normalized = String(value);
  if (normalized === "409") {
    return "state_conflict";
  }
  if (normalized === "401") {
    return "session_expired_or_missing";
  }
  if (normalized === "403") {
    return "account_not_available";
  }
  if (normalized === "404") {
    return "not_found";
  }
  if (normalized === "424") {
    return "provider_sync_unavailable";
  }
  if (normalized === "429") {
    return "rate_limited";
  }
  if (normalized === "400") {
    return "validation_error";
  }
  return "";
}

function statusCodeFromApiError(value: number | string | undefined): OnboardingSemanticCode {
  if (typeof value === "string") {
    return normalizeSemanticCode(value) || mapStatusCode(value);
  }
  if (typeof value === "number") {
    return mapStatusCode(value);
  }
  return "";
}
