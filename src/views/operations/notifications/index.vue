<!-- Cregis Message Notifications -->
<template>
  <div class="page-content">
    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h3 class="text-base font-semibold text-g-900">{{ $t('notifications.title') }}</h3>
      </div>
      <template v-if="loading">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center text-[var(--el-color-danger)]">{{ errorMessage }}</div>
      </template>
      <template v-else-if="records.length === 0">
        <div class="p-10 text-center text-g-500">{{ $t('notifications.empty') }}</div>
      </template>
      <el-table v-else :data="records" stripe size="small">
        <el-table-column :label="$t('notifications.titleCol')" min-width="200">
          <template #default="{ row }"><span class="text-sm font-medium text-g-900">{{ row.title }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('notifications.type')" width="140">
          <template #default="{ row }"><span class="text-sm text-g-700">{{ label(row.type) }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('notifications.sentAt')" width="180">
          <template #default="{ row }">{{ row.sentAt }}</template>
        </el-table-column>
        <el-table-column :label="$t('notifications.receivers')" width="100">
          <template #default="{ row }">{{ row.receiverCount }}</template>
        </el-table-column>
        <el-table-column :label="$t('notifications.status')" width="100">
          <template #default="{ row }"><el-tag type="success" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessageNotification } from '@/features/useMessageNotification'

defineOptions({ name: 'MessageNotifications' })
const { loading, errorMessage, records } = useMessageNotification()

function label(value: string): string {
  return value.replace(/_/g, ' ')
}
</script>