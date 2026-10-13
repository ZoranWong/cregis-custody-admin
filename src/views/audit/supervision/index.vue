<!-- Cregis Audit Supervision -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.supervision') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <template v-if="loading">
      <ElRow :gutter="20" class="flex mb-5">
        <ElCol v-for="i in 4" :key="i" :sm="12" :md="6">
          <div class="art-card h-28 mb-4 flex flex-col justify-center px-5"
            ><el-skeleton :rows="2" animated
          /></div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <ElRow :gutter="20" class="flex mb-5">
        <ElCol :sm="12" :md="6" v-for="m in metrics" :key="m.key">
          <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-4">
            <span class="text-g-700 text-sm">{{ m.label }}</span>
            <span class="text-display font-semibold mt-1 text-g-900"
              >{{ m.value }}{{ m.unit }}</span
            >
            <span
              class="text-xs mt-1"
              :class="
                m.trend > 0
                  ? 'text-tone-done-text'
                  : m.trend < 0
                    ? 'text-tone-error-text'
                    : 'text-g-400'
              "
              >{{ m.trend > 0 ? '↑' : '↓' }} {{ Math.abs(m.trend) }}% vs last period</span
            >
          </div>
        </ElCol>
      </ElRow>
    </template>

    <div class="art-card art-table-card overflow-hidden mb-4">
      <div class="p-4 border-b border-[var(--default-border)]"
        ><h3 class="text-base font-semibold text-g-900">{{ $t('audit.recentEvents') }}</h3></div
      >
      <el-table :data="recentEvents" stripe size="small">
        <template #empty><div class="p-10 text-center text-g-500">No recent events.</div></template>
        <el-table-column prop="occurredAt" :label="$t('audit.time')" width="180" />
        <el-table-column prop="actorName" :label="$t('audit.actor')" width="140" />
        <el-table-column :label="$t('audit.actionType')" width="140">
          <template #default="{ row }"
            ><el-tag size="small">{{ label(row.actionType) }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="targetLabel" :label="$t('audit.target')" min-width="200" />
        <el-table-column :label="$t('audit.outcome')" width="100">
          <template #default="{ row }"
            ><el-tag :type="row.outcome === 'success' ? 'success' : 'danger'" size="small">{{
              row.outcome
            }}</el-tag></template
          >
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchAuditSupervision } from '@/api/audit'
  import type { AuditSupervisionMetric, AuditTrailEvent } from '@/features/audit/types'

  defineOptions({ name: 'AuditSupervision' })
  const loading = ref(false)
  const metrics = ref<AuditSupervisionMetric[]>([])
  const recentEvents = ref<AuditTrailEvent[]>([])

  async function load(): Promise<void> {
    loading.value = true
    try {
      const result = await fetchAuditSupervision()
      metrics.value = result.metrics ?? []
      recentEvents.value = result.recentEvents ?? []
    } catch {
      /* toast handled elsewhere */
    } finally {
      loading.value = false
    }
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }

  onMounted(() => {
    load()
  })
</script>
