<!-- Cregis Audit Trail Query -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('audit.trailQuery') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="filterForm.actionType"
            :placeholder="$t('audit.actionType')"
            clearable
            class="!w-40"
            @change="onFilterChange"
          >
            <el-option v-for="o in actionOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-select
            v-model="filterForm.targetModule"
            :placeholder="$t('audit.targetModule')"
            clearable
            class="!w-40"
            @change="onFilterChange"
          >
            <el-option v-for="o in moduleOptions" :key="o" :label="label(o)" :value="o" />
          </el-select>
          <el-input
            v-model="filterForm.actor"
            :placeholder="$t('audit.actor')"
            clearable
            class="!w-40"
            @clear="onFilterChange"
            @keyup.enter="onFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="—"
            :start-placeholder="$t('fee.from')"
            :end-placeholder="$t('fee.to')"
            format="YYYY-MM-DD"
            size="default"
            style="width: 260px"
            @change="onFilterChange"
          />
        </div>
      </div>

      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="events" stripe size="small">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column prop="occurredAt" :label="$t('audit.time')" width="180" />
        <el-table-column prop="actorName" :label="$t('audit.actor')" width="140" />
        <el-table-column prop="actorRole" :label="$t('audit.actorRole')" width="120" />
        <el-table-column :label="$t('audit.actionType')" width="140">
          <template #default="{ row }"
            ><el-tag :type="actionTagType(row.actionType)" size="small">{{
              label(row.actionType)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="targetModule" :label="$t('audit.targetModule')" width="140" />
        <el-table-column prop="targetLabel" :label="$t('audit.target')" min-width="180" />
        <el-table-column :label="$t('audit.outcome')" width="100">
          <template #default="{ row }"
            ><el-tag :type="outcomeTagType(row.outcome)" size="small">{{
              label(row.outcome)
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="ipAddress" :label="$t('audit.ipAddress')" width="140" />
      </el-table>
      <div
        v-if="pagination.totalCount > 0"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500"
          >Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} ·
          {{ pagination.totalCount }} events</span
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
  import { reactive, ref, onMounted } from 'vue'
  import { fetchAuditTrailEvents } from '@/api/audit'
  import type { AuditTrailEvent, AuditTrailQuery } from '@/features/audit/types'

  defineOptions({ name: 'AuditTrailQuery' })
  const loading = ref(false)
  const events = ref<AuditTrailEvent[]>([])
  const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
  const filters = reactive<AuditTrailQuery>({ page: 1, pageSize: 20 })
  const filterForm = reactive({ actionType: '', targetModule: '', actor: '' })
  const dateRange = ref<[Date, Date] | null>(null)
  const filterPage = ref(1)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const result = await fetchAuditTrailEvents({ ...filters })
      events.value = result.items
      pagination.value = result.pagination
    } catch {
      /* toast handled elsewhere */
    } finally {
      loading.value = false
    }
  }

  function updateFilter(next: Partial<AuditTrailQuery>): void {
    Object.assign(filters, next, { page: next.page ?? 1 })
    load()
  }

  function onFilterChange(): void {
    filters.startDate = dateRange.value ? formatDate(dateRange.value[0]) : undefined
    filters.endDate = dateRange.value ? formatDate(dateRange.value[1]) : undefined
    filters.actionType = filterForm.actionType || undefined
    filters.targetModule = filterForm.targetModule || undefined
    filters.actor = filterForm.actor || undefined
    load()
  }

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function label(v: string): string {
    return v ? v.replace(/_/g, ' ') : '-'
  }
  function actionTagType(a: string) {
    if (/create|add/i.test(a)) return 'success'
    if (/update|edit/i.test(a)) return 'warning'
    if (/delete|remove/i.test(a)) return 'danger'
    return 'info'
  }
  function outcomeTagType(o: string) {
    if (/success/i.test(o)) return 'success'
    if (/failure|error/i.test(o)) return 'danger'
    return 'info'
  }

  const actionOptions = [
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'approve',
    'reject'
  ]
  const moduleOptions = ['operations', 'risk', 'compliance', 'system_admin', 'merchant', 'ticket']

  onMounted(() => {
    load()
  })
</script>
