import { onMounted, ref } from 'vue'
import { fetchOpsNotifications } from '@/api/operations'
import type { OpsMerchantNotificationRecordView } from '@/types/models'

export function useMessageNotification() {
  const loading = ref(false)
  const records = ref<OpsMerchantNotificationRecordView[]>([])
  const errorMessage = ref('')

  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      records.value = (await fetchOpsNotifications()) as OpsMerchantNotificationRecordView[]
    } catch (caught) {
      errorMessage.value =
        caught instanceof Error ? caught.message : 'Notification history unavailable.'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return { loading, errorMessage, records, load }
}
