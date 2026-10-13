<!-- Cregis Rule Governance -->
<template>
  <div class="page-content">
    <!-- Tab switcher -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-radio-group v-model="activeWorkspace" @change="switchWorkspace">
        <el-radio-button value="library"
          >{{ $t('strategy.ruleLibrary') }} ({{ rules.length }})</el-radio-button
        >
        <el-radio-button value="review"
          >{{ $t('strategy.reviewTickets') }} ({{ reviews.length }})</el-radio-button
        >
      </el-radio-group>
      <ElButton @click="refreshAll()">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Rule Library -->
    <div v-if="activeWorkspace === 'library'" class="art-card art-table-card overflow-hidden mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="filterForm.status"
            :placeholder="$t('strategy.status')"
            clearable
            class="!w-40"
            @change="onFilterChange"
          >
            <el-option v-for="o in ruleStatusOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-select
            v-model="filterForm.ruleType"
            :placeholder="$t('strategy.ruleType')"
            clearable
            class="!w-44"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in ruleTypeOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-model="filterForm.keyword"
            :placeholder="$t('strategy.search')"
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
      <template v-else-if="errorMessage">
        <div class="p-10 text-center"
          ><p class="text-tone-error-text mb-4">{{ errorMessage }}</p
          ><ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton></div
        >
      </template>
      <el-table v-else :data="rules" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column :label="$t('strategy.ruleId')" width="140">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.ruleId }}</span></template
          >
        </el-table-column>
        <el-table-column prop="ruleName" :label="$t('strategy.ruleName')" min-width="160" />
        <el-table-column :label="$t('strategy.ruleType')" width="160">
          <template #default="{ row }">{{ label(row.ruleType) }}</template>
        </el-table-column>
        <el-table-column :label="$t('strategy.status')" width="120">
          <template #default="{ row }"
            ><el-tag :type="statusTagType(row.status)" size="small">{{
              label(row.status)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="scopeSummary" :label="$t('strategy.scope')" width="120" />
        <el-table-column prop="currentVersionRef" :label="$t('strategy.version')" width="80" />
        <el-table-column :label="$t('strategy.risk')" width="100">
          <template #default="{ row }">{{ label(row.riskMappingLevel) }}</template>
        </el-table-column>
        <el-table-column prop="updatedBy" :label="$t('strategy.updatedBy')" width="120" />
      </el-table>
      <div
        v-if="pagination.totalCount > 0"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500">{{ pagination.totalCount }} rules</span>
        <el-pagination
          v-model:current-page="rulePage"
          :total="pagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev,pager,next,sizes"
          @current-change="(v: number) => updateFilter({ page: v })"
          @size-change="(v: number) => updateFilter({ pageSize: v, page: 1 })"
        />
      </div>
    </div>

    <!-- Review Tickets -->
    <div v-if="activeWorkspace === 'review'" class="art-card art-table-card overflow-hidden mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="reviewFilterForm.reviewStatus"
            :placeholder="$t('strategy.status')"
            clearable
            class="!w-40"
            @change="onReviewFilterChange"
          >
            <el-option v-for="o in reviewStatusOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-select
            v-model="reviewFilterForm.priority"
            :placeholder="$t('risk.priority')"
            clearable
            class="!w-32"
            @change="onReviewFilterChange"
          >
            <el-option
              v-for="o in priorityOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
        </div>
      </div>
      <template v-if="reviewLoading"><el-skeleton :rows="6" animated class="p-5" /></template>
      <el-table v-else :data="reviews" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column :label="$t('strategy.reviewId')" width="150">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.reviewId }}</span
            ><br /><span class="text-xs text-g-400"
              >{{ row.ruleId }} · {{ row.versionId }}</span
            ></template
          >
        </el-table-column>
        <el-table-column :label="$t('strategy.status')" width="140">
          <template #default="{ row }"
            ><el-tag :type="statusTagType(row.reviewStatus)" size="small">{{
              label(row.reviewStatus)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column :label="$t('strategy.compliance')" width="120">
          <template #default="{ row }">{{
            row.complianceTracker?.complianceStatus || '—'
          }}</template>
        </el-table-column>
        <el-table-column :label="$t('strategy.goLive')" width="100">
          <template #default="{ row }">{{ row.goLivePlan?.goLiveStatus || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('fee.actions')" min-width="200">
          <template #default="{ row }">
            <div class="flex gap-2">
              <ElButton
                size="small"
                type="primary"
                v-if="row.reviewStatus === 'pending_review'"
                @click="approveReview(row)"
                >{{ $t('strategy.approve') }}</ElButton
              >
              <ElButton
                size="small"
                v-if="row.requiresComplianceSubmission"
                @click="submitCompliance(row)"
                >{{ $t('strategy.submitCompliance') }}</ElButton
              >
              <ElButton
                size="small"
                type="success"
                v-if="row.goLivePlan?.confirmButtonEnabled"
                @click="confirmGoLive(row)"
                >{{ $t('strategy.confirmGoLive') }}</ElButton
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useRiskStrategyRules } from '@/features/risk/useRiskStrategyRules'
  import { useRiskStrategyReview } from '@/features/risk/useRiskStrategyReview'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'RuleGovernance' })

  const route = useRoute()
  const router = useRouter()
  const validWorkspaces = ['library', 'review'] as const
  const activeWorkspace = ref<'library' | 'review'>(
    validWorkspaces.includes(route.query.tab as any)
      ? (route.query.tab as 'library' | 'review')
      : 'library'
  )

  function switchWorkspace(ws: 'library' | 'review'): void {
    activeWorkspace.value = ws
    const query: Record<string, string> = {}
    if (ws !== 'library') query.tab = ws
    router.replace({ query }).catch(() => {})
  }

  // Rule library
  const {
    filters,
    loading,
    errorMessage,
    rules,
    pagination,
    load,
    updateFilter,
    selectedRule,
    openRuleDrawer
  } = useRiskStrategyRules()
  const rulesLoad = load
  const rulePage = ref(1)
  const filterForm = reactive({ status: '', ruleType: '', keyword: '' })
  function onFilterChange() {
    updateFilter({
      status: filterForm.status as any,
      ruleType: filterForm.ruleType as any,
      keyword: filterForm.keyword || undefined
    })
  }

  // Review
  const {
    reviewLoading,
    reviews,
    reviewLoad: loadReviews,
    updateReviewFilter
  } = useRiskStrategyReview()
  const reviewFilterForm = reactive({ reviewStatus: '', priority: '' })
  function refreshAll() {
    rulesLoad()
    loadReviews()
  }
  function onReviewFilterChange() {
    updateReviewFilter({
      reviewStatus: reviewFilterForm.reviewStatus as any,
      priority: reviewFilterForm.priority as any
    })
  }

  // Stub mutations
  function approveReview(row: any) {
    alert('Approve review: ' + row.reviewId)
  }
  function submitCompliance(row: any) {
    alert('Submit compliance: ' + row.reviewId)
  }
  function confirmGoLive(row: any) {
    alert('Confirm go-live: ' + row.reviewId)
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function statusTagType(s: string) {
    if (/active|approved|completed/i.test(s)) return 'success'
    if (/draft|testing/i.test(s)) return 'info'
    if (/pending/i.test(s)) return 'warning'
    if (/suspended|archived|rejected/i.test(s)) return 'danger'
    return 'info'
  }

  const ruleStatusOptions = [
    'draft',
    'testing',
    'pending_review',
    'active',
    'suspended',
    'archived'
  ]
  const ruleTypeOptions = [
    { value: 'kyt_screening', label: 'KYT screening' },
    { value: 'transaction_behavior', label: 'Transaction behavior' },
    { value: 'merchant_risk', label: 'Merchant risk' }
  ]
  const reviewStatusOptions = [
    'pending_review',
    'approved_by_manager',
    'rejected_by_manager',
    'supplement_requested'
  ]
  const priorityOptions = [
    { value: 'high', labelKey: 'risk.priorityHigh' },
    { value: 'medium', labelKey: 'risk.priorityMedium' }
  ]
</script>
