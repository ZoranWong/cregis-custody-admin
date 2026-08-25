<!-- Business Analytics — 业务分析 -->
<template>
  <div class="page-content">
    <!-- ═══ 时间范围 ═══ -->
    <div class="art-card mb-5 p-4 flex items-center gap-3">
      <el-radio-group v-model="timeRange" size="small">
        <el-radio-button value="daily">{{ $t('analytics.daily') }}</el-radio-button>
        <el-radio-button value="weekly">{{ $t('analytics.weekly') }}</el-radio-button>
        <el-radio-button value="monthly">{{ $t('analytics.monthly') }}</el-radio-button>
        <el-radio-button value="custom">{{ $t('analytics.custom') }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ═══ 指标卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="8" v-for="card in metricCards" :key="card.key">
        <div class="art-card h-28 px-5 mb-5 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-[26px] font-medium mt-1 text-g-900">{{ card.value }}</span>
          <span class="text-xs mt-1" :class="card.trendClass">{{ card.trend }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 图表区 ═══ -->
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12" v-for="chart in charts" :key="chart.key">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t(chart.labelKey) }}</span>
          </div>
          <div
            class="h-64 m-4 rounded-lg bg-g-50 flex items-center justify-center text-g-400 text-sm"
          >
            {{ $t('analytics.chartPlaceholder') }}
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'BusinessAnalytics' })

  const timeRange = ref('weekly')

  const metricCards = [
    {
      key: 'totalRevenue',
      labelKey: 'analytics.totalRevenue',
      value: '$128,450',
      trend: '+12.4%',
      trendClass: 'text-success'
    },
    {
      key: 'totalCost',
      labelKey: 'analytics.totalCost',
      value: '$32,180',
      trend: '+5.2%',
      trendClass: 'text-[var(--el-color-danger)]'
    },
    {
      key: 'revenueGrowth',
      labelKey: 'analytics.revenueGrowth',
      value: '+12.4%',
      trend: 'vs last month',
      trendClass: 'text-g-400'
    }
  ]

  const charts = [
    { key: 'revenueTrend', labelKey: 'analytics.revenueTrend' },
    { key: 'costStructure', labelKey: 'analytics.costStructure' },
    { key: 'merchantContribution', labelKey: 'analytics.merchantContribution' },
    { key: 'trendAnalysis', labelKey: 'analytics.trendAnalysis' }
  ]
</script>
