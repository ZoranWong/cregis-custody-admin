<!-- Business Analytics — 业务分析 -->
<template>
  <div class="page-content">
    <!-- ═══ 时间范围 ═══ -->
    <div class="art-card mb-4 p-4 flex items-center gap-3">
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
        <div class="art-card h-28 px-5 mb-4 flex flex-col justify-center">
          <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
          <span class="text-display font-semibold mt-1 text-g-900">{{ card.value }}</span>
          <span class="text-xs mt-1" :class="card.trendClass">{{ card.trend }}</span>
        </div>
      </ElCol>
    </ElRow>

    <!-- ═══ 图表区 ═══ -->
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('analytics.revenueTrend') }}</span>
          </div>
          <div class="p-4">
            <ArtLineChart
              :data="revenueTrendData"
              :xAxisData="revenueTrendXAxis"
              height="300px"
              showAreaColor
            />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('analytics.costStructure') }}</span>
          </div>
          <div class="p-4">
            <ArtRingChart :data="costStructureData" height="300px" />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('analytics.merchantContribution') }}</span>
          </div>
          <div class="p-4">
            <ArtBarChart
              :data="merchantContributionData"
              :xAxisData="merchantContributionXAxis"
              height="300px"
            />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('analytics.trendAnalysis') }}</span>
          </div>
          <div class="p-4">
            <ArtLineChart
              :data="trendAnalysisData"
              :xAxisData="trendAnalysisXAxis"
              height="300px"
            />
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'
  import ArtBarChart from '@/components/core/charts/art-bar-chart/index.vue'
  import ArtRingChart from '@/components/core/charts/art-ring-chart/index.vue'

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
      trendClass: 'text-tone-error-text'
    },
    {
      key: 'revenueGrowth',
      labelKey: 'analytics.revenueGrowth',
      value: '+12.4%',
      trend: 'vs last month',
      trendClass: 'text-g-400'
    }
  ]

  // Mock data for charts
  const revenueTrendData = [45000, 52000, 48000, 61000, 58000, 67000, 72000]
  const revenueTrendXAxis = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const costStructureData = [
    { value: 15000, name: 'Operations' },
    { value: 8000, name: 'Infrastructure' },
    { value: 5000, name: 'Support' },
    { value: 4180, name: 'Other' }
  ]

  const merchantContributionData = [
    { value: 35000, name: 'CryptoVault' },
    { value: 28000, name: 'PayFlow' },
    { value: 22000, name: 'ChainBridge' },
    { value: 18000, name: 'TokenGuard' },
    { value: 12000, name: 'BlockSafe' }
  ]
  const merchantContributionXAxis = [
    'CryptoVault',
    'PayFlow',
    'ChainBridge',
    'TokenGuard',
    'BlockSafe'
  ]

  const trendAnalysisData = [8.5, 9.2, 10.1, 11.5, 12.0, 12.4, 13.2]
  const trendAnalysisXAxis = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
</script>
