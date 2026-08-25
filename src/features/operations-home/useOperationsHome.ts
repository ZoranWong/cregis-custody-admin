import { onMounted, ref } from 'vue'
import {
  fetchOperationsCustomerStatusChart,
  fetchOperationsServicePulseChart,
  fetchOperationsSummary,
  fetchOperationsTaskQueue
} from '@/api/operations'
import type {
  OperationsCustomerStatusChartView,
  OperationsServicePulseChartView,
  OperationsSummaryView,
  OperationsTaskView,
  PageResult
} from '@/types/models'
import { useUiStore } from '@/store/modules/ui'

export function useOperationsHome() {
  const uiStore = useUiStore()
  const loading = ref(false)
  const summary = ref<OperationsSummaryView | null>(null)
  const taskQueue = ref<PageResult<OperationsTaskView> | null>(null)
  const customerStatusChart = ref<OperationsCustomerStatusChartView | null>(null)
  const servicePulseChart = ref<OperationsServicePulseChartView | null>(null)

  async function load(force = false): Promise<void> {
    if (
      !force &&
      summary.value &&
      taskQueue.value &&
      customerStatusChart.value &&
      servicePulseChart.value
    ) {
      return
    }
    loading.value = true
    try {
      const [nextSummary, nextQueue, nextCustomerStatusChart, nextServicePulseChart] =
        await Promise.all([
          fetchOperationsSummary(),
          fetchOperationsTaskQueue(),
          fetchOperationsCustomerStatusChart(),
          fetchOperationsServicePulseChart()
        ])
      summary.value = nextSummary
      taskQueue.value = nextQueue
      customerStatusChart.value = nextCustomerStatusChart
      servicePulseChart.value = nextServicePulseChart
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load home',
        caught instanceof Error ? caught.message : 'Unable to load operations home.'
      )
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    loading,
    summary,
    taskQueue,
    customerStatusChart,
    servicePulseChart,
    load
  }
}
