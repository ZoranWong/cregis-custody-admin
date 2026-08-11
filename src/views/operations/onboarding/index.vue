<!-- Cregis KYB Workbench -->
<template>
  <div class="page-content">
    <!-- ═══ Summary 卡片 ═══ -->
    <template v-if="loading && !caseSummary">
      <ElRow :gutter="20" class="flex">
        <ElCol v-for="i in 4" :key="i" :sm="12" :md="6">
          <div class="art-card h-32 mb-5 flex flex-col justify-center px-5">
            <el-skeleton :rows="3" animated />
          </div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <ElRow :gutter="20" class="flex">
        <ElCol v-for="card in summaryCards" :key="card.key" :sm="12" :md="6">
          <div class="art-card relative flex flex-col justify-center h-32 px-5 mb-5 max-sm:mb-4">
            <span class="text-g-600 text-xs">{{ $t(card.labelKey) }}</span>
            <span class="text-[24px] font-medium mt-1 text-g-900">{{ card.value }}</span>
            <div class="flex gap-3 mt-2" v-if="card.stats">
              <span v-for="s in card.stats" :key="s.label" class="text-xs text-g-500">{{ s.label }}: <b class="text-g-700">{{ s.value }}</b></span>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </template>

    <!-- ═══ Filter + 表格 ═══ -->
    <div class="art-card art-table-card mb-5 overflow-hidden">
      <!-- Filter 栏 -->
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-radio-group v-model="caseFilters.view" @change="(v: string) => router.replace({ query: { ...route.query, view: v, casePageNum: '1' } }).catch(() => {})">
            <el-radio-button v-for="v in caseViews" :key="v.code" :value="v.code">{{ $t(v.labelKey) }}</el-radio-button>
          </el-radio-group>
          <div class="w-px h-6 bg-g-300" />
          <el-select v-model="filterForm.currentStage" :placeholder="$t('kyb.stage')" clearable class="!w-36" @change="onFilterChange">
            <el-option v-for="o in caseFilterOptions?.currentStages" :key="o.code" :value="o.code" :label="o.label" />
          </el-select>
          <el-select v-model="filterForm.priorityLevel" :placeholder="$t('kyb.priority')" clearable class="!w-32" @change="onFilterChange">
            <el-option v-for="o in caseFilterOptions?.priorityLevels" :key="o.code" :value="o.code" :label="o.label" />
          </el-select>
          <el-select v-model="filterForm.slaState" :placeholder="$t('kyb.sla')" clearable class="!w-32" @change="onFilterChange">
            <el-option v-for="o in caseFilterOptions?.slaStates" :key="o.code" :value="o.code" :label="o.label" />
          </el-select>
          <el-input v-model="filterForm.merchantName" :placeholder="$t('kyb.search')" clearable class="!w-48" @clear="onFilterChange" @keyup.enter="onFilterChange">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <ElButton @click="resetCaseFilters">{{ $t('console.refresh') }}</ElButton>
        </div>
      </div>

      <!-- 表格 -->
      <template v-if="loading">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <el-table v-else :data="records" stripe size="small" highlight-current-row style="cursor:pointer" @row-click="openDetail">
        <el-table-column prop="submittedAt" :label="$t('kyb.submitted')" width="160">
          <template #default="{ row }">{{ formatTime(row.submittedAt) }}</template>
        </el-table-column>
        <el-table-column prop="merchantName" :label="$t('kyb.merchant')" min-width="160" />
        <el-table-column :label="$t('kyb.stage')" width="100">
          <template #default="{ row }">
            <el-tag :type="stageTagType(row.currentStage)" size="small">{{ row.currentStageLabel || row.currentStage || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kyb.priority')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.priorityLevel === 'P0' ? 'danger' : row.priorityLevel === 'P1' ? 'warning' : 'info'" size="small">{{ row.priorityLevel || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('kyb.sla')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.slaState === 'breached' ? 'danger' : row.slaState === 'warning' ? 'warning' : 'success'" size="small">{{ row.slaState || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assigneeName" :label="$t('kyb.owner')" width="100" />
        <el-table-column :label="$t('merchantList.action')" width="70" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" @click.stop="openDetail(row)">{{ $t('merchantList.open') }}</ElButton>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="casePage" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">{{ casePage.total }} {{ $t('merchantList.records') }}</span>
        <el-pagination
          v-model:current-page="caseFilters.pageNum"
          v-model:page-size="caseFilters.pageSize"
          :total="casePage.total"
          :page-sizes="[10, 20, 50]"
          background layout="total, sizes, prev, pager, next"
          @current-change="goToCasePage"
          @size-change="(v: number) => submitCaseFilters({ target: { elements: { casePageSize: { value: String(v) }, casePageNum: { value: 1 } } } } as any)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useKybWorkbench } from '@/features/kyb-workbench/useKybWorkbench'
  import { formatTime } from '@/utils/format'

  defineOptions({ name: 'KybWorkbench' })
  const route = useRoute()
  const router = useRouter()
  const { loading, caseSummary, caseFilterOptions, casePage, caseFilters, submitCaseFilters, goToCasePage, resetCaseFilters } = useKybWorkbench()
  const records = computed(() => (casePage.value as any)?.records ?? [])

  const filterForm = reactive({ currentStage: '', priorityLevel: '', slaState: '', merchantName: '' })

  function onFilterChange() { submitCaseFilters({ target: { elements: { currentStage: { value: filterForm.currentStage }, priorityLevel: { value: filterForm.priorityLevel }, slaState: { value: filterForm.slaState }, merchantName: { value: filterForm.merchantName } } } } as any) }
  function openDetail(row: any) { router.push({ name: 'kyb-case-detail', params: { caseId: row.applicationId || row.id } }) }

  const summaryCards = computed(() => {
    const s = caseSummary.value as any
    return [
      { key: 'pending', labelKey: 'kyb.pendingReview', value: s?.pendingReview ?? '-', stats: [{ label: 'Near SLA', value: s?.nearSla ?? '-' }, { label: 'Supplements', value: s?.supplements ?? '-' }] },
      { key: 'review', labelKey: 'kyb.underReview', value: s?.underReview ?? '-', stats: [{ label: 'Manual', value: s?.manualReview ?? '-' }] },
      { key: 'decision', labelKey: 'kyb.decisionDue', value: s?.decisionDue ?? '-', stats: [{ label: 'Approved', value: s?.approved ?? '-' }, { label: 'Rejected', value: s?.rejected ?? '-' }] },
      { key: 'total', labelKey: 'kyb.totalCases', value: s?.totalCases ?? '-' },
    ]
  })

  const caseViews = [
    { code: 'PENDING', labelKey: 'kyb.viewPending' }, { code: 'REVIEW', labelKey: 'kyb.viewReview' },
    { code: 'DECISION', labelKey: 'kyb.viewDecision' }, { code: 'ALL', labelKey: 'merchantList.viewAll' },
  ]

  function stageTagType(s: string) { if (!s) return 'info'; if (/supplement|collecting/i.test(s)) return 'warning'; if (/review|decision/i.test(s)) return 'danger'; return 'info' }
</script>