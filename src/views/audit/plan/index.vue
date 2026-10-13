<!-- Cregis Audit Plan -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.planManagement') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-4">
      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="plans" stripe size="small">
        <template #empty
          ><div class="p-10 text-center text-g-500">{{ $t('audit.noPlans') }}</div></template
        >
        <el-table-column prop="planId" :label="$t('audit.planId')" width="140">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.planId }}</span></template
          >
        </el-table-column>
        <el-table-column prop="title" :label="$t('audit.planTitle')" min-width="180" />
        <el-table-column prop="scope" :label="$t('audit.scope')" min-width="160" />
        <el-table-column prop="owner" :label="$t('audit.owner')" width="120" />
        <el-table-column :label="$t('audit.status')" width="100">
          <template #default="{ row }"
            ><el-tag :type="planStatusTag(row.status)" size="small">{{
              label(row.status)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="startDate" :label="$t('audit.startDate')" width="120" />
        <el-table-column prop="endDate" :label="$t('audit.endDate')" width="120" />
        <el-table-column :label="$t('audit.progress')" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progress"
              :color="row.progress >= 80 ? '#22c55e' : row.progress >= 50 ? '#f59e0b' : '#3b82f6'"
            />
          </template>
        </el-table-column>
      </el-table>
      <div
        v-if="pagination.totalCount > 0"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500">{{ pagination.totalCount }} plans</span>
        <el-pagination
          v-model:current-page="filterPage"
          :total="pagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updatePage(v)"
          @size-change="
            (v: number) => {
              filterPageSize = v
              updatePage(1)
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchAuditPlans } from '@/api/audit'
  import type { AuditPlan } from '@/features/audit/types'

  defineOptions({ name: 'AuditPlan' })
  const loading = ref(false)
  const plans = ref<AuditPlan[]>([])
  const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
  const filterPage = ref(1)
  const filterPageSize = ref(20)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const r = await fetchAuditPlans({ page: filterPage.value, pageSize: filterPageSize.value })
      plans.value = r.items
      pagination.value = r.pagination
    } catch {
      /* toast */
    } finally {
      loading.value = false
    }
  }
  function updatePage(p: number) {
    filterPage.value = p
    load()
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function planStatusTag(s: string) {
    if (s === 'active') return 'success'
    if (s === 'draft') return 'info'
    if (s === 'completed') return 'success'
    return 'warning'
  }

  onMounted(() => {
    load()
  })
</script>
