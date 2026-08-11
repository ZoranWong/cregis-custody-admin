<!-- Cregis Audit Regulatory Report -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.regulatoryReport') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="reports" stripe size="small">
        <template #empty><div class="p-10 text-center text-g-500">{{ $t('audit.noReports') }}</div></template>
        <el-table-column prop="reportId" :label="$t('audit.reportId')" width="160">
          <template #default="{ row }"><span class="font-mono text-xs text-g-700">{{ row.reportId }}</span></template>
        </el-table-column>
        <el-table-column prop="title" :label="$t('audit.reportTitle')" min-width="200" />
        <el-table-column prop="jurisdiction" :label="$t('audit.jurisdiction')" width="140" />
        <el-table-column :label="$t('audit.status')" width="120">
          <template #default="{ row }"><el-tag :type="reportStatusTag(row.status)" size="small">{{ label(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="generatedAt" :label="$t('audit.generatedAt')" width="180" />
        <el-table-column prop="format" :label="$t('audit.format')" width="80">
          <template #default="{ row }">{{ row.format?.toUpperCase() }}</template>
        </el-table-column>
        <el-table-column :label="$t('audit.actions')" width="100">
          <template #default="{ row }">
            <ElButton v-if="row.downloadRef" size="small" @click="downloadReport(row)">{{ $t('audit.download') }}</ElButton>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">{{ pagination.totalCount }} reports</span>
        <el-pagination v-model:current-page="filterPage" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>updatePage(v)" @size-change="(v:number)=>{filterPageSize=v;updatePage(1)}" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAuditRegulatoryReports } from '@/api/audit'
import type { AuditRegulatoryReport } from '@/features/audit/types'

defineOptions({ name: 'AuditRegulatoryReport' })
const loading = ref(false)
const reports = ref<AuditRegulatoryReport[]>([])
const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
const filterPage = ref(1)
const filterPageSize = ref(20)

async function load(): Promise<void> {
  loading.value = true
  try { const r = await fetchAuditRegulatoryReports({ page: filterPage.value, pageSize: filterPageSize.value }); reports.value = r.items; pagination.value = r.pagination }
  catch { /* toast */ }
  finally { loading.value = false }
}
function updatePage(p: number) { filterPage.value = p; load() }
function downloadReport(row: AuditRegulatoryReport) { /* stub */ }

function label(v: string): string { return v ? v.replace(/_/g, ' ') : '-' }
function reportStatusTag(s: string) { if (s === 'submitted') return 'success'; if (s === 'draft') return 'info'; if (s === 'rejected') return 'danger'; return 'warning' }

onMounted(() => { load() })
</script>