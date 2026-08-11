<!-- Cregis Travel Rule Configuration -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('compliance.travelRuleConfig') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <template v-if="loading">
      <div class="art-card p-5"><el-skeleton :rows="6" animated /></div>
    </template>
    <template v-else-if="config">
      <div class="art-card p-5 mb-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-g-900">{{ $t('compliance.currentConfig') }}</h3>
            <p class="text-xs text-g-500">{{ $t('compliance.version') }}: {{ config.version }} · {{ $t('compliance.status') }}: {{ label(config.status) }}</p>
          </div>
          <el-tag :type="config.approvalStatus === 'active' ? 'success' : 'warning'" size="default">{{ label(config.approvalStatus || config.status) }}</el-tag>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div><span class="text-xs text-g-500">{{ $t('compliance.scope') }}</span><p class="text-sm text-g-900">{{ config.scope || '—' }}</p></div>
          <div><span class="text-xs text-g-500">{{ $t('compliance.guardrail') }}</span><p class="text-sm text-g-900">{{ config.guardrail || '—' }}</p></div>
          <div><span class="text-xs text-g-500">{{ $t('compliance.updatedBy') }}</span><p class="text-sm text-g-900">{{ config.updatedBy || '—' }}</p></div>
          <div><span class="text-xs text-g-500">{{ $t('compliance.updatedAt') }}</span><p class="text-sm text-g-900">{{ config.updatedAt }}</p></div>
        </div>
      </div>

      <div class="art-card art-table-card overflow-hidden mb-5" v-if="config.conditions && config.conditions.length > 0">
        <div class="p-4 border-b border-[var(--default-border)]"><h3 class="text-base font-semibold text-g-900">{{ $t('compliance.conditions') }}</h3></div>
        <el-table :data="config.conditions" stripe size="small">
          <el-table-column prop="title" :label="$t('compliance.conditionTitle')" min-width="180" />
          <el-table-column :label="$t('compliance.enabled')" width="80">
            <template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? 'Yes' : 'No' }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="threshold" :label="$t('compliance.threshold')" width="140" />
          <el-table-column prop="scope" :label="$t('compliance.scope')" min-width="200" />
        </el-table>
      </div>
    </template>
    <template v-else>
      <div class="art-card p-10 text-center text-g-500">{{ $t('compliance.noConfig') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fetchTravelRuleConfiguration } from '@/api/compliance'
import type { TravelRuleConfiguration } from '@/features/compliance/types'

defineOptions({ name: 'TravelRuleConfig' })
const loading = ref(false)
const config = ref<TravelRuleConfiguration | null>(null)

async function load(): Promise<void> {
  loading.value = true
  try { config.value = await fetchTravelRuleConfiguration() as TravelRuleConfiguration }
  catch { /* toast */ }
  finally { loading.value = false }
}

function label(v: string): string { return v ? v.replace(/_/g, ' ') : '-' }

import { onMounted } from 'vue'
onMounted(() => { load() })
</script>