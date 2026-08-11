<!-- Cregis Risk Queue -->
<template>
  <div class="page-content">
    <!-- Tab switcher -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <el-radio-group :model-value="filters.tab" @change="switchTab">
        <el-radio-button value="disposition">{{ $t('risk.dispositionQueue') }} <span v-if="filters.tab === 'disposition' && pagination.totalCount" class="ml-1">({{ pagination.totalCount }})</span></el-radio-button>
        <el-radio-button value="approval">{{ $t('risk.approvalQueue') }} <span v-if="filters.tab === 'approval' && pagination.totalCount" class="ml-1">({{ pagination.totalCount }})</span></el-radio-button>
      </el-radio-group>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Filter bar -->
    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select v-model="filterForm.priority" :placeholder="$t('risk.priority')" clearable class="!w-32" @change="onFilterChange">
            <el-option v-for="o in priorityOptions" :key="o.value" :label="$t(o.labelKey)" :value="o.value" />
          </el-select>
          <el-select v-model="filterForm.status" :placeholder="$t('risk.status')" clearable class="!w-40" @change="onFilterChange">
            <el-option v-for="o in statusOptions" :key="o.value" :label="$t(o.labelKey)" :value="o.value" />
          </el-select>
          <el-input v-model="filterForm.merchantName" :placeholder="$t('risk.searchMerchant')" clearable class="!w-48" @clear="onFilterChange" @keyup.enter="onFilterChange">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>

      <template v-if="loading">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center">
          <p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p>
          <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
        </div>
      </template>
      <el-table v-else :data="cases" stripe size="small" highlight-current-row style="cursor:pointer" @row-click="openCase">
        <el-table-column :label="$t('risk.ticketId')" width="140">
          <template #default="{ row }"><span class="font-mono text-xs text-g-700">{{ row.caseId }}</span><br><span class="text-xs text-g-400">{{ row.ticketNumber }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('risk.type')" width="100">
          <template #default>Risk Case</template>
        </el-table-column>
        <el-table-column :label="$t('risk.priority')" width="90">
          <template #default="{ row }"><el-tag :type="priorityTagType(row.priority)" size="small">{{ label(row.priority) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="merchantName" :label="$t('risk.merchant')" min-width="160" />
        <el-table-column :label="$t('risk.riskExtension')" width="140">
          <template #default="{ row }">{{ label(row.riskType) }}</template>
        </el-table-column>
        <el-table-column prop="submittedAt" :label="$t('risk.submitted')" width="160" />
        <el-table-column :label="$t('risk.sla')" width="100">
          <template #default="{ row }"><el-tag :type="slaTagType(row.sla?.severity)" size="small">{{ row.sla?.remainingText || 'No SLA' }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('risk.status')" width="120">
          <template #default="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ label(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('risk.assignee')" width="100">
          <template #default="{ row }">{{ row.assigneeInitials || row.assigneeName || '-' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} · {{ pagination.totalCount }} cases</span>
        <el-pagination v-model:current-page="filterPage" v-model:page-size="filterSize" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>updateFilter({page:v})" @size-change="(v:number)=>updateFilter({pageSize:v,page:1})" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRiskQueue } from '@/features/risk/useRiskQueue'
import type { RiskCaseQueueRequest } from '@/features/risk/types'

defineOptions({ name: 'RiskQueue' })
const route = useRoute()
const router = useRouter()
const validTabs: RiskCaseQueueRequest['tab'][] = ['disposition', 'approval']
const initialTab = (validTabs.includes(route.query.tab as any) ? route.query.tab : 'disposition') as RiskCaseQueueRequest['tab']
const { filters, loading, errorMessage, cases, pagination, load, updateFilter } = useRiskQueue({ tab: initialTab })

const filterForm = reactive({ priority: '', status: '', merchantName: '' })
const filterPage = ref(1)
const filterSize = ref(20)

function switchTab(tab: RiskCaseQueueRequest['tab']) {
  updateFilter({ tab })
  const query: Record<string, string> = {}
  if (tab && tab !== 'disposition') query.tab = tab
  router.replace({ query }).catch(() => {})
}
function onFilterChange() { updateFilter({ priority: filterForm.priority as any, status: filterForm.status as any, merchantName: filterForm.merchantName || undefined }) }

function openCase(row: any) { router.push(`/risk/cases/${row.ticketId}`) }

function label(v: string): string { return v ? v.replace(/_/g, ' ') : '-' }
function priorityTagType(p: string) { if (p === 'high') return 'danger'; if (p === 'medium') return 'warning'; return 'info' }
function slaTagType(s?: string) { if (s === 'critical') return 'danger'; if (s === 'warning') return 'warning'; return 'success' }
function statusTagType(s: string) { if (/completed|approved/i.test(s)) return 'success'; if (/rejected|escalated/i.test(s)) return 'danger'; if (/review/i.test(s)) return 'warning'; return 'info' }

const priorityOptions = [
  { value: 'high', labelKey: 'risk.priorityHigh' }, { value: 'medium', labelKey: 'risk.priorityMedium' }, { value: 'low', labelKey: 'risk.priorityLow' }
]
const statusOptions = [
  { value: 'pending', labelKey: 'risk.statusPending' }, { value: 'reviewing', labelKey: 'risk.statusReviewing' },
  { value: 'pending_approval', labelKey: 'risk.statusPendingApproval' }, { value: 'escalated', labelKey: 'risk.statusEscalated' }
]
</script>