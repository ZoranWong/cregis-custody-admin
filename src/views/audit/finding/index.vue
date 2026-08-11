<!-- Cregis Audit Finding -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.findingRemediation') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="findings" stripe size="small">
        <template #empty><div class="p-10 text-center text-g-500">{{ $t('audit.noFindings') }}</div></template>
        <el-table-column prop="findingId" :label="$t('audit.findingId')" width="140">
          <template #default="{ row }"><span class="font-mono text-xs text-g-700">{{ row.findingId }}</span></template>
        </el-table-column>
        <el-table-column prop="title" :label="$t('audit.findingTitle')" min-width="200" />
        <el-table-column :label="$t('audit.severity')" width="100">
          <template #default="{ row }"><el-tag :type="severityTag(row.severity)" size="small">{{ label(row.severity) }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('audit.status')" width="120">
          <template #default="{ row }"><el-tag :type="findingStatusTag(row.status)" size="small">{{ label(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="owner" :label="$t('audit.owner')" width="120" />
        <el-table-column prop="dueDate" :label="$t('audit.dueDate')" width="120" />
        <el-table-column prop="description" :label="$t('audit.description')" min-width="200" show-overflow-tooltip />
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">{{ pagination.totalCount }} findings</span>
        <el-pagination v-model:current-page="filterPage" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>updatePage(v)" @size-change="(v:number)=>{filterPageSize=v;updatePage(1)}" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAuditFindings } from '@/api/audit'
import type { AuditFinding } from '@/features/audit/types'

defineOptions({ name: 'AuditFinding' })
const loading = ref(false)
const findings = ref<AuditFinding[]>([])
const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
const filterPage = ref(1)
const filterPageSize = ref(20)

async function load(): Promise<void> {
  loading.value = true
  try { const r = await fetchAuditFindings({ page: filterPage.value, pageSize: filterPageSize.value }); findings.value = r.items; pagination.value = r.pagination }
  catch { /* toast */ }
  finally { loading.value = false }
}
function updatePage(p: number) { filterPage.value = p; load() }

function label(v: string): string { return v ? v.replace(/_/g, ' ') : '-' }
function severityTag(s: string) { if (s === 'high' || s === 'critical') return 'danger'; if (s === 'medium') return 'warning'; return 'info' }
function findingStatusTag(s: string) { if (s === 'open') return 'danger'; if (s === 'in_progress') return 'warning'; if (s === 'resolved' || s === 'closed') return 'success'; return 'info' }

onMounted(() => { load() })
</script>