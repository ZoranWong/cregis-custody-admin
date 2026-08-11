import { computed, onMounted, reactive, ref } from "vue";
import { fetchRiskCaseQueue } from "@/api/risk";
import type { RiskCaseQueueItem, RiskCaseQueueRequest, RiskCaseQueueResponse } from "@/features/risk/types";

export function useRiskQueue(initial: RiskCaseQueueRequest = {}) {
  const loading = ref(false);
  const errorMessage = ref("");
  const queue = ref<RiskCaseQueueResponse | null>(null);
  const filters = reactive<RiskCaseQueueRequest>({ tab: "disposition", page: 1, pageSize: 20, ...initial });

  const cases = computed<RiskCaseQueueItem[]>(() => queue.value?.items ?? []);
  const pagination = computed(() => queue.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });

  async function load(): Promise<void> {
    loading.value = true; errorMessage.value = "";
    try { queue.value = await fetchRiskCaseQueue(filters); }
    catch (e) { errorMessage.value = e instanceof Error ? e.message : "Risk queue unavailable."; }
    finally { loading.value = false; }
  }

  function updateFilter(next: Partial<RiskCaseQueueRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 });
    void load();
  }

  onMounted(() => { void load(); });

  return { filters, loading, errorMessage, cases, pagination, load, updateFilter };
}