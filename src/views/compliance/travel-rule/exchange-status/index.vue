<!-- Cregis Travel Rule Exchange Status -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('compliance.exchangeStatus') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select v-model="filterForm.direction" :placeholder="$t('compliance.direction')" clearable class="!w-36" @change="onFilterChange">
            <el-option v-for="o in directionOptions" :key="o" :label="o" :value="o" />
          </el-select>
          <el-select v-model="filterForm.status" :placeholder="$t('risk.status')" clearable class="!w-40" @change="onFilterChange">
            <el-option v-for="o in exchangeStatusOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-input v-model="filterForm.vasp" :placeholder="$t('compliance.vasp')" clearable class="!w-44" @clear="onFilterChange" @keyup.enter="onFilterChange">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>

      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="exchanges" stripe size="small">
        <el-table-column prop="id" :label="$t('compliance.exchangeId')" width="160">
          <template #default="{ row }"><span class="font-mono text-xs text-g-700">{{ row.id }}</span></template>
        </el-table-column>
        <el-table-column prop="caseRef" :label="$t('compliance.caseRef')" width="140" />
        <el-table-column prop="direction" :label="$t('compliance.direction')" width="80" />
        <el-table-column prop="vasp" :label="$t('compliance.vasp')" width="160" />
        <el-table-column :label="$t('risk.status')" width="120">
          <template #default="{ row }"><el-tag :type="exchangeStatusTagType(row.status)" size="small">{{ label(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="evidence" :label="$t('compliance.evidence')" width="100" />
        <el-table-column prop="retry" :label="$t('compliance.retry')" width="60" />
        <el-table-column prop="initiatedAt" :label="$t('compliance.initiatedAt')" width="160" />
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} · {{ pagination.totalCount }} exchanges</span>
        <el-pagination v-model:current-page="filterPage" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>updateFilter({page:v})" @size-change="(v:number)=>updateFilter({pageSize:v,page:1})" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { fetchTravelRuleExchanges } from '@/api/compliance'
import type { TravelRuleExchange, TravelRuleExchangeRequest } from '@/features/compliance/types'

defineOptions({ name: 'TravelRuleExchange' })
const loading = ref(false)
const exchanges = ref<TravelRuleExchange[]>([])
const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
const filters = reactive<TravelRuleExchangeRequest>({ page: 1, pageSize: 20 })
const filterForm = reactive({ direction: '', status: '', vasp: '' })
const filterPage = ref(1)

async function load(): Promise<void> {
  loading.value = true
  try {
    const result = await fetchTravelRuleExchanges({ ...filters })
    exchanges.value = result.items; pagination.value = result.pagination
  } catch { /* toast */ }
  finally { loading.value = false }
}

function updateFilter(next: Partial<TravelRuleExchangeRequest>): void {
  Object.assign(filters, next, { page: next.page ?? 1 }); load()
}
function onFilterChange() { updateFilter({ direction: filterForm.direction, status: filterForm.status, vasp: filterForm.vasp || undefined }) }

function label(v: string): string { return v ? v.replace(/_/g, ' ') : '-' }
function exchangeStatusTagType(s: string) { if (/delivered|completed/i.test(s)) return 'success'; if (/pending/i.test(s)) return 'warning'; if (/failed/i.test(s)) return 'danger'; return 'info' }

const directionOptions = ['inbound', 'outbound']
const exchangeStatusOptions = ['pending', 'delivered', 'acknowledged', 'failed', 'exception']

import { onMounted } from 'vue'
onMounted(() => { load() })
</script>