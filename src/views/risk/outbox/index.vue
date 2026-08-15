<!-- Cregis Risk Outbox -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('risk.outbox') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Filter bar -->
    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="filterForm.deliveryStatus"
            :placeholder="$t('risk.delivery')"
            clearable
            class="!w-36"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in deliveryOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-select
            v-model="filterForm.type"
            :placeholder="$t('risk.type')"
            clearable
            class="!w-44"
            @change="onFilterChange"
          >
            <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-select
            v-model="filterForm.recipient"
            :placeholder="$t('risk.recipient')"
            clearable
            class="!w-40"
            @change="onFilterChange"
          >
            <el-option v-for="o in recipientOptions" :key="o" :label="o" :value="o" />
          </el-select>
          <el-select
            v-model="filterForm.timeRange"
            :placeholder="$t('risk.time')"
            clearable
            class="!w-32"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in timeOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-model="filterForm.keyword"
            :placeholder="$t('risk.search')"
            clearable
            class="!w-48"
            @clear="onFilterChange"
            @keyup.enter="onFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <ElButton @click="resetFilters">{{ $t('gas.reset') }}</ElButton>
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
      <el-table
        v-else
        :data="notifications"
        stripe
        size="small"
        highlight-current-row
        style="cursor: pointer"
        @row-click="(row: any) => openNotification(row.notificationId)"
      >
        <el-table-column :label="$t('risk.type')" min-width="180">
          <template #default="{ row }"
            ><span class="text-sm font-medium text-g-900">{{ row.type }}</span
            ><br /><span class="text-xs text-g-400">{{ row.notificationId }}</span></template
          >
        </el-table-column>
        <el-table-column :label="$t('risk.relatedCase')" min-width="160">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.caseId }}</span
            ><br /><span class="text-xs text-g-400">{{ row.caseMerchant }}</span></template
          >
        </el-table-column>
        <el-table-column prop="recipient" :label="$t('risk.recipient')" width="160" />
        <el-table-column prop="sentAt" :label="$t('risk.sent')" width="160" />
        <el-table-column :label="$t('risk.delivery')" width="100">
          <template #default="{ row }"
            ><el-tag :type="deliveryTagType(row.deliveryStatus)" size="small">{{
              label(row.deliveryStatus)
            }}</el-tag></template
          >
        </el-table-column>
      </el-table>
      <div
        v-if="pagination.totalCount > 0"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} ·
          {{ pagination.totalCount }} notices</span
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

    <!-- Detail Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="$t('risk.noticeDetail')"
      size="480px"
      direction="rtl"
    >
      <template v-if="detailLoading">
        <el-skeleton :rows="6" animated class="p-5" />
      </template>
      <template v-else-if="selected">
        <div class="px-5">
          <div class="mb-4"
            ><span class="text-xs text-g-500">{{ $t('risk.type') }}</span
            ><p class="text-sm font-medium text-g-900">{{ selected.type }}</p></div
          >
          <div class="mb-4"
            ><span class="text-xs text-g-500">{{ $t('risk.decision') }}</span
            ><p class="text-sm text-g-700"
              >{{ selected.decision }} by {{ selected.decisionBy }} on {{ selected.decidedAt }}</p
            ></div
          >
          <div class="mb-4"
            ><span class="text-xs text-g-500">{{ $t('risk.relatedCase') }}</span
            ><p class="text-sm text-g-700 font-mono"
              >{{ selected.caseId }} — {{ selected.caseMerchant }}</p
            ></div
          >
          <div class="mb-4"
            ><span class="text-xs text-g-500">{{ $t('risk.delivery') }}</span
            ><p class="text-sm text-g-700">{{ label(selected.deliveryStatus) }}</p></div
          >
          <div class="mb-4"
            ><span class="text-xs text-g-500">{{ $t('risk.recipient') }}</span
            ><p class="text-sm text-g-700">{{ selected.recipient }}</p></div
          >
          <div
            ><span class="text-xs text-g-500">{{ $t('risk.body') }}</span
            ><pre class="mt-1 text-sm text-g-700 whitespace-pre-wrap">{{ selected.body }}</pre>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useRiskOutbox } from '@/features/risk/useRiskOutbox'

  defineOptions({ name: 'RiskOutbox' })
  const {
    filters,
    loading,
    detailLoading,
    errorMessage,
    selected,
    notifications,
    pagination,
    load,
    openNotification: doOpenNotification,
    updateFilter
  } = useRiskOutbox()

  const drawerVisible = ref(false)
  const filterForm = reactive({
    deliveryStatus: '',
    type: '',
    recipient: '',
    timeRange: '',
    keyword: ''
  })
  const filterPage = ref(1)

  // Show drawer + open notification
  function openNotification(notificationId: string) {
    drawerVisible.value = true
    doOpenNotification(notificationId)
  }

  function onFilterChange() {
    updateFilter({
      deliveryStatus: filterForm.deliveryStatus as any,
      type: filterForm.type as any,
      recipient: filterForm.recipient as any,
      timeRange: filterForm.timeRange as any,
      keyword: filterForm.keyword || undefined
    })
  }
  function resetFilters() {
    filterForm.deliveryStatus = ''
    filterForm.type = ''
    filterForm.recipient = ''
    filterForm.timeRange = ''
    filterForm.keyword = ''
    updateFilter({
      deliveryStatus: undefined,
      type: undefined,
      recipient: undefined,
      timeRange: undefined,
      keyword: undefined
    })
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function deliveryTagType(s: string) {
    if (s === 'delivered') return 'success'
    if (s === 'failed') return 'danger'
    return 'warning'
  }

  const deliveryOptions = [
    { value: 'delivered', labelKey: 'risk.deliveryDelivered' },
    { value: 'pending', labelKey: 'risk.deliveryPending' },
    { value: 'failed', labelKey: 'risk.deliveryFailed' }
  ]
  const typeOptions = [
    { value: 'Adjudication Result', label: 'Adjudication Result' },
    { value: 'Escalation Notice', label: 'Escalation Notice' },
    { value: 'Supplement Request', label: 'Supplement Request' }
  ]
  const recipientOptions = ['Risk Reviewer', 'Compliance Team', 'Unassigned']
  const timeOptions = [
    { value: 'today', labelKey: 'risk.timeToday' },
    { value: '7d', labelKey: 'risk.time7d' },
    { value: '30d', labelKey: 'risk.time30d' }
  ]
</script>
