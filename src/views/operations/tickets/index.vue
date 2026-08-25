<!-- Cregis Ticket Queue -->
<template>
  <div class="page-content">
    <!-- ═══ Summary 卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="6" v-for="card in summaryCards" :key="card.key">
        <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-5 max-sm:mb-4">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[22px] font-medium mt-1" :class="card.color">{{ card.value }}</span>
        </div>
      </ElCol>
    </ElRow>

    <div class="art-card art-table-card overflow-hidden">
      <!-- ═══ Filter 栏 ═══ -->
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select
            v-model="filterForm.queue"
            :placeholder="$t('ticket.queue')"
            clearable
            class="!w-40"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in queueOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-select
            v-model="filterForm.displayStatus"
            :placeholder="$t('ticket.status')"
            clearable
            class="!w-36"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in statusOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-select
            v-model="filterForm.urgency"
            :placeholder="$t('ticket.urgency')"
            clearable
            class="!w-32"
            @change="onFilterChange"
          >
            <el-option
              v-for="o in urgencyOptions"
              :key="o.value"
              :label="$t(o.labelKey)"
              :value="o.value"
            />
          </el-select>
          <el-input
            v-model="filterForm.search"
            :placeholder="$t('ticket.search')"
            clearable
            class="!w-48"
            @clear="onFilterChange"
            @keyup.enter="onFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <ElButton @click="load()">{{ $t('console.refresh') }}</ElButton>
        </div>
      </div>

      <!-- ═══ 表格 ═══ -->
      <template v-if="loading">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <template v-else-if="errorMessage">
        <div class="p-10 text-center text-[var(--el-color-danger)]">{{ errorMessage }}</div>
      </template>
      <el-table
        v-else
        :data="tickets"
        stripe
        size="small"
        highlight-current-row
        style="cursor: pointer"
        @row-click="openTicket"
      >
        <el-table-column prop="ticketNumber" :label="$t('ticket.id')" width="110">
          <template #default="{ row }"
            ><span class="font-mono text-xs text-g-700">{{ row.ticketNumber }}</span></template
          >
        </el-table-column>
        <el-table-column prop="title" :label="$t('ticket.title')" min-width="200">
          <template #default="{ row }">
            <div class="text-sm text-g-900">{{ row.title }}</div>
            <div class="text-xs text-g-500" v-if="row.merchant?.displayName">{{
              row.merchant.displayName
            }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('ticket.type')" width="120">
          <template #default="{ row }">{{ label(row.ticketType) }}</template>
        </el-table-column>
        <el-table-column :label="$t('ticket.source')" width="100">
          <template #default="{ row }">{{ label(row.upstreamTriggerSource) }}</template>
        </el-table-column>
        <el-table-column :label="$t('ticket.urgency')" width="90">
          <template #default="{ row }">
            <el-tag :type="urgencyTagType(row.urgency)" size="small">{{
              label(row.urgency)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('ticket.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.displayStatus)" size="small">{{
              label(row.displayStatus)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('ticket.sla')" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.sla?.breached
                  ? 'danger'
                  : row.sla?.severity === 'warning'
                    ? 'warning'
                    : 'success'
              "
              size="small"
              >{{ row.sla?.remainingText || '-' }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column :label="$t('ticket.assignee')" width="110">
          <template #default="{ row }">{{ row.assignee?.displayName || 'Unassigned' }}</template>
        </el-table-column>
      </el-table>

      <!-- ═══ 分页 ═══ -->
      <div
        v-if="pagination"
        class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <span class="text-xs text-g-500">{{
          $t('ticket.pageInfo', {
            page: pagination.page,
            total: pagination.totalPages,
            count: pagination.totalCount
          })
        }}</span>
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          :total="pagination.totalCount"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev, pager, next, sizes"
          @current-change="(v: number) => updateFilter({ page: v })"
          @size-change="(v: number) => updateFilter({ pageSize: v, page: 1 })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTicketQueue } from '@/features/tickets/useTicketQueue'

  defineOptions({ name: 'TicketQueue' })
  const router = useRouter()
  const { filters, loading, errorMessage, tickets, pagination, load, updateFilter } =
    useTicketQueue()

  const summaryCards = computed(() => {
    const items = tickets.value
    const total = items.length || pagination.value?.totalCount || 0
    const inProgress = items.filter((t) => t.displayStatus === 'in_progress').length
    const completed = items.filter(
      (t) => t.displayStatus === 'completed' || t.displayStatus === 'closed'
    ).length
    const pending = total - inProgress - completed
    return [
      { key: 'total', labelKey: 'ticket.summaryTotal', value: total, color: 'text-g-900' },
      {
        key: 'pending',
        labelKey: 'ticket.summaryPending',
        value: pending,
        color: 'text-[var(--el-color-warning)]'
      },
      {
        key: 'progress',
        labelKey: 'ticket.summaryProgress',
        value: inProgress,
        color: 'text-[var(--el-color-primary)]'
      },
      {
        key: 'done',
        labelKey: 'ticket.summaryDone',
        value: completed,
        color: 'text-[var(--el-color-success)]'
      }
    ]
  })

  const filterForm = reactive({ queue: '', displayStatus: '', urgency: '', search: '' })

  function onFilterChange() {
    updateFilter({
      queue: filterForm.queue as any,
      displayStatus: filterForm.displayStatus as any,
      urgency: filterForm.urgency as any,
      search: filterForm.search,
      page: 1
    })
  }
  function openTicket(row: any) {
    router.push(`/operations/tickets/${row.ticketId}`)
  }
  function label(v: string) {
    return v ? v.replace(/_/g, ' ') : '-'
  }

  function urgencyTagType(u: string) {
    if (u === 'critical') return 'danger' as const
    if (u === 'high') return 'warning' as const
    return 'info' as const
  }
  function statusTagType(s: string) {
    if (!s) return 'info' as const
    if (/new|open/i.test(s)) return 'danger' as const
    if (/progress/i.test(s)) return 'warning' as const
    if (/completed|closed/i.test(s)) return 'success' as const
    return 'info' as const
  }

  const queueOptions = [
    { value: 'all', labelKey: 'ticket.queueAll' },
    { value: 'triage', labelKey: 'ticket.queueTriage' },
    { value: 'domain_processing', labelKey: 'ticket.queueProcessing' },
    { value: 'supervisor_escalation', labelKey: 'ticket.queueEscalation' }
  ]
  const statusOptions = [
    { value: 'all_open', labelKey: 'ticket.statusAll' },
    { value: 'new', labelKey: 'ticket.statusNew' },
    { value: 'in_progress', labelKey: 'ticket.statusProgress' },
    { value: 'pending_review', labelKey: 'ticket.statusReview' },
    { value: 'completed', labelKey: 'ticket.statusCompleted' },
    { value: 'closed', labelKey: 'ticket.statusClosed' }
  ]
  const urgencyOptions = [
    { value: 'all', labelKey: 'ticket.urgencyAll' },
    { value: 'critical', labelKey: 'ticket.urgencyCritical' },
    { value: 'high', labelKey: 'ticket.urgencyHigh' },
    { value: 'medium', labelKey: 'ticket.urgencyMedium' },
    { value: 'low', labelKey: 'ticket.urgencyLow' }
  ]
</script>
