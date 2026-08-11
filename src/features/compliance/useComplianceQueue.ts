import { computed, onMounted, reactive, ref } from "vue";
import { fetchComplianceCases } from "@/api/compliance";
import type { ComplianceCaseQueueItem, ComplianceCaseQueueRequest, ComplianceCaseQueueResponse } from "@/features/compliance/types";

export function useComplianceQueue(initial: ComplianceCaseQueueRequest = {}) {
  const loading = ref(false);
  const errorMessage = ref("");
  const queue = ref<ComplianceCaseQueueResponse | null>(null);
  const filters = reactive<ComplianceCaseQueueRequest>({ tab: "all", page: 1, pageSize: 20, sortField: "priority", sortDirection: "desc", ...initial });

  const cases = computed<ComplianceCaseQueueItem[]>(() => queue.value?.items ?? []);
  const pagination = computed(() => queue.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });

  async function load(): Promise<void> {
    loading.value = true; errorMessage.value = "";
    try { queue.value = await fetchComplianceCases({ ...filters }); }
    catch (e) { errorMessage.value = e instanceof Error ? e.message : "Compliance queue unavailable."; }
    finally { loading.value = false; }
  }

  function updateFilter(next: Partial<ComplianceCaseQueueRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 });
    void load();
  }

  onMounted(() => { void load(); });
  return { filters, loading, errorMessage, cases, pagination, load, updateFilter };
}