<!-- Cregis Operations Dashboard -->
<template>
  <div class="page-content">
    <!-- ═══ KPI 卡片 ═══ -->
    <template v-if="loading">
      <ElRow :gutter="20" class="flex">
        <ElCol v-for="i in 4" :key="i" :sm="12" :md="6" :lg="6">
          <div class="art-card h-35 px-5 mb-4 flex flex-col justify-center">
            <el-skeleton :rows="2" animated />
          </div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <ElRow :gutter="20" class="flex">
        <ElCol v-for="card in kpiCards" :key="card.key" :sm="12" :md="6" :lg="6">
          <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-4">
            <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
            <span class="text-display font-semibold mt-2 text-g-900">{{ card.value }}</span>
            <div class="flex-c mt-1" v-if="card.descKey">
              <span class="text-xs text-g-600">{{ $t(card.descKey) }}: {{ card.descValue }}</span>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </template>

    <!-- ═══ 图表 + 快捷操作 ═══ -->
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12" :lg="14">
        <div class="art-card h-105 p-5 mb-4">
          <div class="art-card-header">
            <div class="title">
              <h4>{{ $t('console.customerStatus') }}</h4>
              <p>{{ $t('console.trend') }} <span class="text-success">+12%</span></p>
            </div>
          </div>
          <template v-if="loading">
            <el-skeleton :rows="6" animated class="mt-4" />
          </template>
          <ArtLineChart
            v-else
            height="calc(100% - 56px)"
            :data="chartData"
            :xAxisData="chartXAxis"
            :showAreaColor="true"
            :showAxisLine="false"
          />
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="10">
        <div class="art-card h-105 p-5 mb-4">
          <div class="art-card-header">
            <div class="title">
              <h4>{{ $t('console.quickActions') }}</h4>
              <p
                >{{ $t('console.shortcuts') }}
                <span class="text-success">{{ $t('console.frequentTasks') }}</span></p
              >
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4">
            <div
              v-for="action in quickActions"
              :key="action.labelKey"
              class="flex-c gap-2.5 p-3 rounded-lg border-full-d cursor-pointer hover:bg-hover-color tad-200"
              @click="router.push(action.target)"
            >
              <div class="size-10 rounded-lg flex-cc bg-theme/10">
                <ArtSvgIcon :icon="action.icon" class="text-lg text-theme-text" />
              </div>
              <span class="text-sm text-g-700">{{ $t(action.labelKey) }}</span>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 最近任务表格 ═══ -->
    <div class="art-card art-table-card overflow-hidden">
      <div class="art-card-header px-5 pt-5">
        <div class="title">
          <h4>{{ $t('console.recentTasks') }}</h4>
          <p
            >{{ $t('console.latest') }}
            <span class="text-tone-progress-text">{{ tasks.length }}</span>
            {{ $t('console.tasks') }}</p
          >
        </div>
        <ElButton size="small" @click="load(true)">{{ $t('console.refresh') }}</ElButton>
      </div>
      <template v-if="loading">
        <el-skeleton :rows="8" animated class="px-5 pb-5" />
      </template>
      <el-table v-else :data="tasks" stripe size="small" class="mt-3">
        <template #empty>
          <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
        </template>
        <el-table-column prop="referenceNo" :label="$t('console.id')" width="120" />
        <el-table-column prop="rowTitle" :label="$t('console.title')" min-width="200" />
        <el-table-column :label="$t('console.priority')" width="90">
          <template #default="{ row }">
            <el-tag
              :type="
                row.priorityLevel === 'P0'
                  ? 'danger'
                  : row.priorityLevel === 'P1'
                    ? 'warning'
                    : 'info'
              "
              size="small"
              >{{ row.priorityLevel || '-' }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="currentStageOrStatus" :label="$t('console.stage')" width="120" />
        <el-table-column :label="$t('console.sla')" width="80">
          <template #default="{ row }">
            <el-tag
              :type="
                row.slaState === 'breached'
                  ? 'danger'
                  : row.slaState === 'warning'
                    ? 'warning'
                    : 'success'
              "
              size="small"
              >{{ row.slaState || '-' }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="owner" :label="$t('console.owner')" width="100" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useOperationsHome } from '@/features/operations-home/useOperationsHome'

  defineOptions({ name: 'Console' })
  const router = useRouter()
  const { loading, summary, taskQueue, customerStatusChart, load } = useOperationsHome()

  const tasks = computed(() => taskQueue.value?.records ?? [])

  const kpiCards = computed(() => [
    {
      key: 'onboarding',
      labelKey: 'console.onboardingPending',
      value: summary.value?.onboardingPendingReviewCount ?? '-',
      descKey: 'console.nearSla',
      descValue: summary.value?.onboardingNearSlaCount ?? '-'
    },
    {
      key: 'tickets',
      labelKey: 'console.openTickets',
      value: summary.value?.openTicketCount ?? '-',
      descKey: 'console.overdue',
      descValue: summary.value?.overdueTicketCount ?? '-'
    },
    {
      key: 'supplements',
      labelKey: 'console.supplements',
      value: summary.value?.onboardingSupplementsCount ?? '-'
    },
    {
      key: 'decision',
      labelKey: 'console.decisionDue',
      value: summary.value?.onboardingDecisionDueCount ?? '-'
    }
  ])

  const quickActions = [
    { labelKey: 'console.merchantList', icon: 'ri:store-line', target: '/operations/merchants' },
    { labelKey: 'console.ticketQueue', icon: 'ri:file-list-3-line', target: '/operations/tickets' },
    { labelKey: 'console.onboarding', icon: 'ri:user-add-line', target: '/operations/onboarding' },
    {
      labelKey: 'console.feeMonitor',
      icon: 'ri:money-dollar-circle-line',
      target: '/operations/fee'
    }
  ]

  const chartData = computed(() => {
    const series = customerStatusChart.value?.trendSeries ?? []
    if (series.length === 0) return []
    return series.map((s: any) => ({
      name: s.label,
      data: s.points?.map((p: any) => p.value) ?? []
    }))
  })
  const chartXAxis = computed(
    () => customerStatusChart.value?.trendSeries?.[0]?.points?.map((p: any) => p.label) ?? []
  )

  onMounted(() => {
    void load()
  })
</script>
