import { computed, onMounted, reactive, ref } from 'vue'
import { fetchComplianceOutbox, fetchComplianceOutboxNotification } from '@/api/compliance'
import type {
  ComplianceOutboxNotification,
  ComplianceOutboxRequest,
  ComplianceOutboxResponse
} from '@/features/compliance/types'

export function useComplianceOutbox(initial: ComplianceOutboxRequest = {}) {
  const loading = ref(false)
  const detailLoading = ref(false)
  const errorMessage = ref('')
  const outbox = ref<ComplianceOutboxResponse | null>(null)
  const selected = ref<ComplianceOutboxNotification | null>(null)
  const filters = reactive<ComplianceOutboxRequest>({
    page: 1,
    pageSize: 20,
    sortField: 'sent_at',
    sortDirection: 'desc',
    ...initial
  })

  const notifications = computed<ComplianceOutboxNotification[]>(() => outbox.value?.items ?? [])
  const pagination = computed(
    () => outbox.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 }
  )

  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      outbox.value = await fetchComplianceOutbox({ ...filters })
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Compliance outbox unavailable.'
    } finally {
      loading.value = false
    }
  }

  async function openNotification(notificationId: string): Promise<void> {
    detailLoading.value = true
    try {
      selected.value = await fetchComplianceOutboxNotification(notificationId)
    } catch {
      /* toast handled by composable */
    } finally {
      detailLoading.value = false
    }
  }

  function closeNotification(): void {
    selected.value = null
  }

  function updateFilter(next: Partial<ComplianceOutboxRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 })
    void load()
  }

  onMounted(() => {
    void load()
  })
  return {
    filters,
    loading,
    detailLoading,
    errorMessage,
    notifications,
    selected,
    pagination,
    load,
    openNotification,
    closeNotification,
    updateFilter
  }
}
