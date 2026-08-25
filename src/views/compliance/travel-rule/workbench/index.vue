<!-- Cregis Travel Rule Workbench -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('compliance.travelRuleWorkbench') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="filterForm.lifecycleStatus"
            :placeholder="$t('compliance.lifecycleStatus')"
            clearable
            class="!w-44"
            @change="onFilterChange"
          >
            <el-option v-for="o in lifecycleOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-select
            v-model="filterForm.priority"
            :placeholder="$t('risk.priority')"
            clearable
            class="!w-32"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in priorityOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-model="filterForm.query"
            :placeholder="$t('compliance.searchCase')"
            clearable
            class="!w-48"
            @clear="onFilterChange"
            @keyup.enter="onFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>

      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="travelCases" stripe size="small">
        <el-table-column :label="$t('compliance.caseKey')" width="140">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.caseKey }}</span></template
          >
        </el-table-column>
        <el-table-column prop="subjectName" :label="$t('compliance.subject')" min-width="140" />
        <el-table-column :label="$t('compliance.txHash')" width="160">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{
              compactHash(row.txHash)
            }}</span></template
          >
        </el-table-column>
        <el-table-column :label="$t('compliance.amount')" width="140">
          <template #default="{ row }">{{ row.amount }} {{ row.currency }}</template>
        </el-table-column>
        <el-table-column
          prop="counterpartyVasp"
          :label="$t('compliance.counterpartyVasp')"
          width="160"
        />
        <el-table-column :label="$t('compliance.lifecycleStatus')" width="120">
          <template #default="{ row }"
            ><el-tag :type="lifecycleTagType(row.lifecycleStatus)" size="small">{{
              label(row.lifecycleStatus)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column :label="$t('risk.priority')" width="90">
          <template #default="{ row }"
            ><el-tag :type="priorityTagType(row.priority)" size="small">{{
              label(row.priority)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="updatedAt" :label="$t('compliance.updatedAt')" width="160" />
      </el-table>
      <div
        v-if="pagination.totalCount > 0"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} ·
          {{ pagination.totalCount }} cases</span
        >
        <el-pagination
          v-model:current-page="filterPage"
          :total="pagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updateFilter({ page: v })"
          @size-change="(v: number) => updateFilter({ pageSize: v, page: 1 })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { fetchTravelRuleCases } from '@/api/compliance'
  import type { TravelRuleCase, TravelRuleCaseRequest } from '@/features/compliance/types'

  defineOptions({ name: 'TravelRuleWorkbench' })
  const loading = ref(false)
  const travelCases = ref<TravelRuleCase[]>([])
  const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
  const filters = reactive<TravelRuleCaseRequest>({ page: 1, pageSize: 20 })
  const filterForm = reactive({ lifecycleStatus: '', priority: '', query: '' })
  const filterPage = ref(1)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const result = await fetchTravelRuleCases({ ...filters })
      travelCases.value = result.items
      pagination.value = result.pagination
    } catch {
      /* toast handled by composable */
    } finally {
      loading.value = false
    }
  }

  function updateFilter(next: Partial<TravelRuleCaseRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 })
    load()
  }
  function onFilterChange() {
    updateFilter({
      lifecycleStatus: filterForm.lifecycleStatus,
      priority: filterForm.priority,
      query: filterForm.query || undefined
    })
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function compactHash(h: string): string {
    if (!h) return '-'
    return h.length <= 16 ? h : h.slice(0, 8) + '...' + h.slice(-6)
  }
  function lifecycleTagType(s: string) {
    if (/completed|cleared/i.test(s)) return 'success'
    if (/pending|review/i.test(s)) return 'warning'
    if (/blocked|failed/i.test(s)) return 'danger'
    return 'info'
  }
  function priorityTagType(p: string) {
    if (p === 'high') return 'danger'
    if (p === 'medium') return 'warning'
    return 'info'
  }

  const lifecycleOptions = [
    'pending_review',
    'under_review',
    'completed',
    'supplement_requested',
    'blocked'
  ]
  const priorityOptions = [
    { value: 'high', labelKey: 'risk.priorityHigh' },
    { value: 'medium', labelKey: 'risk.priorityMedium' },
    { value: 'low', labelKey: 'risk.priorityLow' }
  ]

  // init
  import { onMounted } from 'vue'
  onMounted(() => {
    load()
  })
</script>
