<!-- Cregis Compliance Outbox -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('compliance.outbox') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

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
            class="!w-52"
            @change="onFilterChange"
          >
            <el-option v-for="o in typeOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
      </div>

      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center"
          ><p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p
          ><ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton></div
        >
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
        <el-table-column :label="$t('compliance.relatedCase')" min-width="160">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.caseId }}</span
            ><br /><span class="text-xs text-g-400">{{ row.caseSubject }}</span></template
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
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { useComplianceOutbox } from '@/features/compliance/useComplianceOutbox'

  defineOptions({ name: 'ComplianceOutbox' })
  const {
    loading,
    errorMessage,
    notifications,
    selected,
    pagination,
    load,
    openNotification,
    updateFilter
  } = useComplianceOutbox()

  const filterForm = reactive({ deliveryStatus: '', type: '' })
  const filterPage = ref(1)

  function onFilterChange() {
    updateFilter({ deliveryStatus: filterForm.deliveryStatus as any, type: filterForm.type as any })
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
  const typeOptions = ['Rule Review Result', 'Escalation Final Decision', 'Execution Notice']
</script>
