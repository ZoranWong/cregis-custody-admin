<!-- Cregis Compliance Alerts -->
<template>
  <div class="page-content">
    <!-- Tab switcher: All Alerts / Needs My Attention -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <el-radio-group :model-value="filters.tab" @change="switchTab">
        <el-radio-button value="all"
          >{{ $t('compliance.tabAllAlerts') }}
          <span v-if="filters.tab === 'all' && pagination.totalCount" class="ml-1"
            >({{ pagination.totalCount }})</span
          >
        </el-radio-button>
        <el-radio-button value="needs_attention"
          >{{ $t('compliance.tabNeedsAttention') }}
          <span v-if="filters.tab === 'needs_attention'" class="ml-1">({{ pendingCount }})</span>
        </el-radio-button>
      </el-radio-group>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
      <ElButton type="primary" plain>
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
      </ElButton>
    </div>

    <!-- Filter bar: 方向/状态/严重级别/规则 -->
    <div class="art-card mb-5 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <el-select
          v-model="filterForm.direction"
          :placeholder="$t('alerts.direction')"
          clearable
          class="!w-32"
          @change="onFilterChange"
        >
          <el-option :label="$t('alerts.outgoing')" value="outgoing" />
          <el-option :label="$t('alerts.incoming')" value="incoming" />
        </el-select>
        <el-select
          v-model="filterForm.status"
          :placeholder="$t('alerts.status')"
          clearable
          class="!w-40"
          @change="onFilterChange"
        >
          <el-option :label="$t('alerts.statusPending')" value="pending" />
          <el-option :label="$t('alerts.statusApproved')" value="approved" />
          <el-option :label="$t('alerts.statusRejected')" value="rejected" />
        </el-select>
        <el-select
          v-model="filterForm.severity"
          :placeholder="$t('alerts.severity')"
          clearable
          class="!w-36"
          @change="onFilterChange"
        >
          <el-option :label="$t('alerts.sevCritical')" value="critical" />
          <el-option :label="$t('alerts.sevMedium')" value="medium" />
          <el-option :label="$t('alerts.sevRoutine')" value="routine" />
        </el-select>
        <el-select
          v-model="filterForm.rule"
          :placeholder="$t('alerts.rule')"
          clearable
          class="!w-52"
          @change="onFilterChange"
        >
          <el-option v-for="r in ruleOptions" :key="r" :label="r" :value="r" />
        </el-select>
        <el-input
          v-model="filterForm.subjectName"
          :placeholder="$t('compliance.searchSubject')"
          clearable
          class="!w-48"
          @clear="onFilterChange"
          @keyup.enter="onFilterChange"
        >
          <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
        </el-input>
      </div>
    </div>

    <!-- 告警卡片列表 -->
    <template v-if="loading"><el-skeleton :rows="8" animated class="p-5" /></template>
    <template v-else-if="errorMessage">
      <div class="art-card p-10 text-center">
        <p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p>
        <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>
    <template v-else>
      <div v-for="alert in alertCards" :key="alert.caseId" class="art-card mb-4 alert-card">
        <!-- 顶部：金额 + 方向/状态/严重级别 -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg font-semibold text-g-900">{{ alert.amount }}</span>
              <span class="text-sm text-g-400">≈ {{ alert.fiatAmount }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-g-600">{{ alert.caseId }}</span>
              <span class="text-xs text-g-400">· {{ alert.timeAgo }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <el-tag :type="alert.direction === 'outgoing' ? 'warning' : 'success'" size="small">{{
              directionLabel(alert.direction)
            }}</el-tag>
            <el-tag :type="statusTagType(alert.status)" size="small">{{
              alert.statusLabel
            }}</el-tag>
            <el-tag :type="severityTagType(alert.severity)" size="small" effect="light">{{
              alert.severity
            }}</el-tag>
          </div>
        </div>

        <!-- parties 两侧 -->
        <div class="flex items-center gap-3 mb-3 py-2">
          <div class="flex-1 min-w-0">
            <div class="text-xs text-g-400 mb-0.5">{{ $t('alerts.originator') }}</div>
            <div class="text-sm font-medium text-g-800 truncate">{{ alert.originator.name }}</div>
            <div class="text-xs text-g-500 truncate">{{ alert.originator.detail }}</div>
          </div>
          <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400 text-lg flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-xs text-g-400 mb-0.5">{{ $t('alerts.beneficiary') }}</div>
            <div class="text-sm font-medium text-g-800 truncate">{{ alert.beneficiary.name }}</div>
            <div class="text-xs text-g-500 truncate">{{ alert.beneficiary.detail }}</div>
          </div>
        </div>

        <!-- flag reason -->
        <div class="bg-g-50 rounded-lg p-3 mb-3">
          <div class="text-xs text-g-400 mb-1">{{ $t('alerts.flagReason') }}</div>
          <div class="text-sm text-g-700">{{ alert.flagReason }}</div>
        </div>

        <!-- Full Review -->
        <div class="flex justify-end pt-3 border-t border-[var(--default-border)]">
          <el-button size="small" type="primary" @click="openCase(alert)">{{
            $t('alerts.fullReview')
          }}</el-button>
        </div>
      </div>
      <div v-if="alertCards.length === 0" class="art-card py-10 text-center text-g-400 text-sm">{{
        $t('alerts.noResults')
      }}</div>

      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-1 py-3">
        <span class="text-xs text-g-500"
          >Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} ·
          {{ pagination.totalCount }} alerts</span
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
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useComplianceQueue } from '@/features/compliance/useComplianceQueue'
  import type { ComplianceCaseQueueRequest } from '@/features/compliance/types'

  defineOptions({ name: 'ComplianceQueue' })
  const route = useRoute()
  const router = useRouter()

  // 复用真实 API；tab 改为 all / needs_attention
  const initialTab = (route.query.tab === 'needs_attention' ? 'needs_attention' : 'all') as
    'all' | 'needs_attention'
  const { filters, loading, errorMessage, cases, pagination, load, updateFilter } =
    useComplianceQueue({ tab: 'all' as ComplianceCaseQueueRequest['tab'] })

  const filterForm = reactive({
    direction: '',
    status: '',
    severity: '',
    rule: '',
    subjectName: ''
  })
  const filterPage = ref(1)
  const currentTab = ref<'all' | 'needs_attention'>(initialTab)

  const ruleOptions = [
    'Sanctions Hit Block',
    'Large Transaction Review',
    'Tainted Address Block',
    'High-Risk Jurisdiction Block',
    'IVMS101 Mismatch',
    'Unlicensed VASP Counterparty'
  ]

  const pendingCount = computed(
    () => cases.value.filter((c: any) => /pending|review/i.test(c.status || '')).length
  )

  // 真实 case + 告警卡片展示字段(占位)
  interface AlertCard {
    caseId: string
    amount: string
    fiatAmount: string
    timeAgo: string
    direction: 'outgoing' | 'incoming'
    status: string
    statusLabel: string
    severity: string
    originator: { name: string; detail: string }
    beneficiary: { name: string; detail: string }
    flagReason: string
    ticketId: string
  }

  const alertCards = computed<AlertCard[]>(() => {
    let list = cases.value.map((c: any) => toAlertCard(c))
    if (currentTab.value === 'needs_attention') {
      list = list.filter((a) => /pending|review/i.test(a.status))
    }
    if (filterForm.direction) list = list.filter((a) => a.direction === filterForm.direction)
    if (filterForm.status) list = list.filter((a) => a.status.includes(filterForm.status))
    if (filterForm.severity)
      list = list.filter((a) => a.severity.toLowerCase() === filterForm.severity)
    return list
  })

  function toAlertCard(c: any): AlertCard {
    const name = c.subjectName || 'Unknown Subject'
    return {
      caseId: c.caseId || c.ticketNumber || 'CASE-000',
      amount: '3,500 USDT',
      fiatAmount: '12,950 AED',
      timeAgo: c.submittedAt || '2h ago',
      direction: Math.random() > 0.5 ? 'outgoing' : 'incoming',
      status: c.status || 'pending',
      statusLabel: label(c.status),
      severity: ['Critical', 'Medium', 'Routine'][Math.floor(Math.random() * 3)],
      originator: { name, detail: 'Unit A · 0x4f2a...' },
      beneficiary: { name: 'Counterparty VASP', detail: '0x9c1b...' },
      flagReason: c.caseType
        ? label(c.caseType) + ' triggered on this transaction.'
        : 'Compliance rule triggered on this transaction.',
      ticketId: c.ticketId || c.caseId
    }
  }

  function switchTab(tab: 'all' | 'needs_attention') {
    currentTab.value = tab
    router.replace({ query: tab === 'needs_attention' ? { tab } : {} }).catch(() => {})
  }
  function onFilterChange() {
    updateFilter({
      priority: filterForm.severity as any,
      status: filterForm.status as any,
      subjectName: filterForm.subjectName || undefined
    })
  }
  function openCase(alert: AlertCard) {
    router.push(`/compliance/cases/${alert.ticketId}`)
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function directionLabel(d: string): string {
    return d === 'outgoing' ? 'Outgoing' : 'Incoming'
  }
  function statusTagType(s: string) {
    if (/approved|completed/i.test(s)) return 'success'
    if (/rejected|escalat/i.test(s)) return 'danger'
    if (/review|pending/i.test(s)) return 'warning'
    return 'info'
  }
  function severityTagType(s: string) {
    if (s === 'Critical') return 'danger'
    if (s === 'Medium') return 'warning'
    return 'info'
  }
</script>

<style scoped>
  .alert-card {
    cursor: pointer;
  }
</style>
