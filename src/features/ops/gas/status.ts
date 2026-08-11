import type { GasHealthState, GasSourceStatus, GasTopUpStatus } from "@/features/ops/gas/types";

export function gasSourceStatusLabel(status: GasSourceStatus): string {
  switch (status) {
    case "ok":
      return "ok";
    case "degraded":
      return "degraded";
    case "unavailable":
      return "unavailable";
    case "not_revived":
      return "not revived";
    default:
      return "unknown";
  }
}

export function gasSourceStatusTone(status: GasSourceStatus): string {
  if (status === "ok") {
    return "status-tag--success";
  }
  if (status === "unavailable") {
    return "status-tag--danger";
  }
  if (status === "degraded") {
    return "status-tag--warning";
  }
  return "status-tag--neutral";
}

export function gasHealthStateLabel(state: GasHealthState): string {
  return state.replaceAll("_", " ");
}

export function gasHealthStateTone(state: GasHealthState): string {
  if (state === "healthy") {
    return "status-tag--success";
  }
  if (state === "low_balance" || state === "top_up_pending_or_stale" || state === "unknown") {
    return "status-tag--warning";
  }
  if (state === "top_up_failed" || state === "missing_account") {
    return "status-tag--danger";
  }
  return "status-tag--neutral";
}

export function gasTopUpStatusTone(status: GasTopUpStatus, stale = false): string {
  if (stale || status === "failed") {
    return "status-tag--danger";
  }
  if (status === "submitted" || status === "processing" || status === "unknown") {
    return "status-tag--warning";
  }
  if (status === "succeeded" || status === "fulfilled_recorded") {
    return "status-tag--success";
  }
  return "status-tag--neutral";
}

export function gasTopUpStatusLabel(status: GasTopUpStatus, stale = false): string {
  const label = status.replaceAll("_", " ");
  return stale ? `stale ${label}` : label;
}
