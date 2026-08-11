import { computed, onMounted, reactive, ref } from "vue";
import { fetchRiskOutbox, fetchRiskOutboxNotification } from "@/api/risk";
import type { RiskOutboxNotification, RiskOutboxRequest, RiskOutboxResponse } from "@/features/risk/types";

export function useRiskOutbox(initial: RiskOutboxRequest = {}) {
  const loading = ref(false);
  const detailLoading = ref(false);
  const errorMessage = ref("");
  const outbox = ref<RiskOutboxResponse | null>(null);
  const selected = ref<RiskOutboxNotification | null>(null);
  const filters = reactive<RiskOutboxRequest>({ page: 1, pageSize: 20, ...initial });

  const notifications = computed<RiskOutboxNotification[]>(() => outbox.value?.items ?? []);
  const pagination = computed(() => outbox.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });

  async function load(): Promise<void> {
    loading.value = true; errorMessage.value = "";
    try { outbox.value = await fetchRiskOutbox(filters); }
    catch (e) { errorMessage.value = e instanceof Error ? e.message : "Risk outbox unavailable."; }
    finally { loading.value = false; }
  }

  async function openNotification(notificationId: string): Promise<void> {
    detailLoading.value = true;
    try { selected.value = await fetchRiskOutboxNotification(notificationId); }
    catch { /* toast handled by composable */ }
    finally { detailLoading.value = false; }
  }

  function updateFilter(next: Partial<RiskOutboxRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 });
    void load();
  }

  onMounted(() => { void load(); });

  return { filters, loading, detailLoading, errorMessage, notifications, selected, pagination, load, openNotification, updateFilter };
}