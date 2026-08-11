<!-- Cregis System Monitor -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('system.systemMonitor') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <template v-if="loading">
      <ElRow :gutter="20" class="flex mb-5">
        <ElCol v-for="i in 4" :key="i" :sm="12" :md="6">
          <div class="art-card h-28 mb-5 flex flex-col justify-center px-5"><el-skeleton :rows="2" animated /></div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <ElRow :gutter="20" class="flex mb-5">
        <ElCol :sm="12" :md="6" v-for="m in metrics" :key="m.key">
          <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-5 max-sm:mb-4">
            <span class="text-g-700 text-sm">{{ m.label }}</span>
            <span class="text-[22px] font-medium mt-1 text-g-900">{{ m.value }}{{ m.unit }}</span>
            <span class="text-xs mt-1" :class="m.trend > 0 ? 'text-[var(--el-color-success)]' : m.trend < 0 ? 'text-[var(--el-color-danger)]' : 'text-g-400'">{{ m.trend > 0 ? '↑' : '↓' }} {{ Math.abs(m.trend) }}% vs last period</span>
          </div>
        </ElCol>
      </ElRow>
    </template>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]"><h3 class="text-base font-semibold text-g-900">{{ $t('system.serviceStatus') }}</h3></div>
      <el-table :data="services" stripe size="small">
        <template #empty><div class="p-10 text-center text-g-500">No services found.</div></template>
        <el-table-column prop="name" :label="$t('system.serviceName')" min-width="200" />
        <el-table-column :label="$t('system.healthStatus')" width="120">
          <template #default="{ row }"><el-tag :type="serviceTagType(row.status)" size="small">{{ serviceStatusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('system.latency')" width="120">
          <template #default="{ row }">{{ row.latency }}ms</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchSystemMonitor } from '@/api/system-manage'
import type { SystemMonitorMetric, SystemMonitorServiceStatus } from '@/features/system-admin/types'

defineOptions({ name: 'SystemMonitor' })
const loading = ref(false)
const metrics = ref<SystemMonitorMetric[]>([])
const services = ref<SystemMonitorServiceStatus[]>([])

async function load(): Promise<void> {
  loading.value = true
  try {
    const result = await fetchSystemMonitor()
    metrics.value = result.metrics ?? []
    services.value = result.services ?? []
  } catch { /* toast handled elsewhere */ }
  finally { loading.value = false }
}

function serviceTagType(s: string) { if (s === 'healthy') return 'success'; if (s === 'degraded') return 'warning'; return 'danger' }
function serviceStatusLabel(s: string) { if (s === 'healthy') return 'Healthy'; if (s === 'degraded') return 'Degraded'; return 'Down' }

onMounted(() => { load() })
</script>