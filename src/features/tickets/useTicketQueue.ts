import { computed, onMounted, reactive, ref } from "vue";
import { fetchTicketQueue } from "@/api/tickets";
import { useUiStore } from "@/store/modules/ui";
import type { TicketQueueItem, TicketQueueRequest, TicketQueueResponse } from "@/features/tickets/types";

export function useTicketQueue(initial: TicketQueueRequest = {}) {
  const uiStore = useUiStore();
  const loading = ref(false);
  const errorMessage = ref("");
  const queue = ref<TicketQueueResponse | null>(null);
  const filters = reactive<TicketQueueRequest>({
    center: "operations",
    queue: "all",
    displayStatus: "all_open",
    urgency: "all",
    scope: "all",
    page: 1,
    pageSize: 10,
    ...initial
  });

  const tickets = computed<TicketQueueItem[]>(() => queue.value?.items ?? []);
  const pagination = computed(() => queue.value?.pagination ?? { page: 1, pageSize: 10, totalPages: 0, totalCount: 0 });

  async function load(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      queue.value = await fetchTicketQueue(filters);
    } catch (caught) {
      errorMessage.value = caught instanceof Error ? caught.message : "Ticket queue unavailable.";
      uiStore.showToast("error", "Unable to load tickets", errorMessage.value);
    } finally {
      loading.value = false;
    }
  }

  function updateFilter(next: Partial<TicketQueueRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 });
    void load();
  }

  onMounted(() => {
    void load();
  });

  return {
    filters,
    loading,
    errorMessage,
    queue,
    tickets,
    pagination,
    load,
    updateFilter
  };
}
