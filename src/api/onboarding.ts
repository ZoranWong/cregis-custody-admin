// @ts-nocheck
import { apiRequest } from "@/utils/http/request";
import type {
  OnboardingApplicationItemView,
  OnboardingDetailView,
  OnboardingListResponse,
  OnboardingMerchantManagementLinkView,
  OnboardingRefreshResponse,
  OnboardingTicketLinkView
} from "@/types/models";

export interface OnboardingQuery {
  search?: string;
  stage?: string;
  providerNeutralState?: string;
  responsibilityParty?: string;
  slaState?: string;
  assignee?: string;
  reviewer?: string;
  includeTerminal?: boolean;
  includeHandedOff?: boolean;
  blockingOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface OnboardingCommunicationRequest {
  type: "note" | "call" | "email";
  content: string;
}

function toQueryString(values: Record<string, string | number | boolean | undefined | null>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchOnboardingApplications(query: OnboardingQuery): Promise<OnboardingListResponse> {
  return apiRequest<OnboardingListResponse>(
    `/api/v1/ops/onboarding/cases${toQueryString({
      search: query.search,
      stage: query.stage,
      provider_neutral_state: query.providerNeutralState,
      responsibility_party: query.responsibilityParty,
      sla_state: query.slaState,
      assignee: query.assignee,
      reviewer: query.reviewer,
      include_terminal: query.includeTerminal,
      include_handed_off: query.includeHandedOff,
      blockingOnly: query.blockingOnly,
      page: query.page,
      page_size: query.pageSize
    })}`
  );
}

export function fetchOnboardingApplicationDetail(applicationId: string): Promise<OnboardingDetailView> {
  return apiRequest<OnboardingDetailView>(`/api/v1/ops/onboarding/cases/${encodeURIComponent(applicationId)}`);
}

export function refreshOnboardingCase(applicationId: string): Promise<OnboardingRefreshResponse> {
  return apiRequest<OnboardingRefreshResponse>(`/api/v1/ops/onboarding/cases/${encodeURIComponent(applicationId)}/refresh`, {
    method: "POST",
    body: { knownUpdatedAt: null }
  });
}

export function fetchOnboardingTicketLink(applicationId: string, ticketId: string): Promise<OnboardingTicketLinkView> {
  return apiRequest<OnboardingTicketLinkView>(
    `/api/v1/ops/onboarding/cases/${encodeURIComponent(applicationId)}/tickets/${encodeURIComponent(ticketId)}/link`
  );
}

export function fetchOnboardingMerchantManagementLink(applicationId: string): Promise<OnboardingMerchantManagementLinkView> {
  return apiRequest<OnboardingMerchantManagementLinkView>(
    `/api/v1/ops/onboarding/cases/${encodeURIComponent(applicationId)}/merchant-management-link`
  );
}

export function sendOnboardingSupplementReminder(applicationId: string, message: string): Promise<OnboardingDetailView> {
  return apiRequest<OnboardingDetailView>(
    `/api/v1/operations/onboarding/applications/${encodeURIComponent(applicationId)}/supplement-reminders`,
    {
      method: "POST",
      body: { message }
    }
  );
}

export function createOnboardingCommunication(applicationId: string, request: OnboardingCommunicationRequest): Promise<OnboardingDetailView> {
  return apiRequest<OnboardingDetailView>(
    `/api/v1/operations/onboarding/applications/${encodeURIComponent(applicationId)}/communications`,
    {
      method: "POST",
      body: request
    }
  );
}

export type { OnboardingApplicationItemView };
