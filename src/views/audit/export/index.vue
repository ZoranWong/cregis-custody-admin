<!-- Cregis Audit Export -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.export') }}</h2>
    </div>

    <div class="art-card p-5 mb-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <span class="text-xs text-g-500">{{ $t('audit.dateRange') }}</span>
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="—"
            :start-placeholder="$t('fee.from')"
            :end-placeholder="$t('fee.to')"
            format="YYYY-MM-DD"
            size="default"
            class="!w-full mt-1"
          />
        </div>
        <div>
          <span class="text-xs text-g-500">{{ $t('audit.modules') }}</span>
          <el-select
            v-model="exportForm.modules"
            multiple
            :placeholder="$t('audit.selectModules')"
            class="!w-full mt-1"
          >
            <el-option v-for="o in moduleOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <span class="text-xs text-g-500">{{ $t('audit.format') }}</span>
          <el-select v-model="exportForm.format" class="!w-full mt-1">
            <el-option v-for="o in formatOptions" :key="o" :label="o.toUpperCase()" :value="o" />
          </el-select>
        </div>
        <div class="flex items-end">
          <ElButton
            type="primary"
            :disabled="exporting || !exportForm.startDate || !exportForm.endDate"
            @click="doExport"
            >{{ $t('audit.exportData') }}</ElButton
          >
        </div>
      </div>
      <div
        v-if="exportResult"
        class="mt-4 p-4 rounded border"
        :class="
          exportResult.status === 'completed'
            ? 'border-[var(--el-color-success)] bg-[var(--el-color-success)]/5'
            : 'border-[var(--el-color-warning)] bg-[var(--el-color-warning)]/5'
        "
      >
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium">{{
            exportResult.status === 'completed'
              ? $t('audit.exportCompleted')
              : $t('audit.exportProcessing')
          }}</span>
          <ElButton
            v-if="exportResult.downloadRef"
            size="small"
            type="primary"
            @click="downloadExport"
            >{{ $t('audit.download') }}</ElButton
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { submitAuditExport } from '@/api/audit'
  import type { AuditExportResult } from '@/features/audit/types'

  defineOptions({ name: 'AuditExport' })
  const exporting = ref(false)
  const exportResult = ref<AuditExportResult | null>(null)
  const exportForm = reactive({
    dateRange: null as [Date, Date] | null,
    startDate: '',
    endDate: '',
    modules: [] as string[],
    format: 'csv' as const
  })

  async function doExport(): Promise<void> {
    exporting.value = true
    try {
      exportResult.value = await submitAuditExport({
        startDate: exportForm.startDate,
        endDate: exportForm.endDate,
        modules: exportForm.modules,
        format: exportForm.format
      })
      ElMessage.success('Export started')
    } catch {
      /* toast handled elsewhere */
    } finally {
      exporting.value = false
    }
  }

  function downloadExport(): void {
    /* stub */
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }

  const moduleOptions = ['operations', 'risk', 'compliance', 'system_admin', 'merchant', 'ticket']
  const formatOptions = ['csv', 'xlsx', 'json']
</script>
