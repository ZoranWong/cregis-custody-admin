<!-- Service Quality — 服务质量 -->
<template>
  <div class="page-content">
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
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('serviceQuality.sentimentTrend') }}</span>
          </div>
          <div class="p-4">
            <ArtLineChart
              :data="sentimentTrendData"
              :xAxisData="sentimentTrendXAxis"
              height="300px"
              showAreaColor
            />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{
              $t('serviceQuality.complaintStatistics')
            }}</span>
          </div>
          <div class="p-4">
            <ArtRingChart :data="complaintStatisticsData" height="300px" />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('serviceQuality.feedbackSummary') }}</span>
          </div>
          <div class="p-4">
            <ArtBarChart
              :data="feedbackSummaryData"
              :xAxisData="['Positive', 'Neutral', 'Negative']"
              height="300px"
            />
          </div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="12">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('serviceQuality.slaCompliance') }}</span>
          </div>
          <div class="p-4">
            <ArtLineChart
              :data="slaComplianceData"
              :xAxisData="slaComplianceXAxis"
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

  defineOptions({ name: 'ServiceQuality' })

  const metricCards = [
    {
      key: 'avgResponseTime',
      labelKey: 'serviceQuality.avgResponseTime',
      value: '2.4h',
      trend: '-8.1%',
      trendClass: 'text-success'
    },
    {
      key: 'satisfactionRate',
      labelKey: 'serviceQuality.satisfactionRate',
      value: '94.2%',
      trend: '+1.3%',
      trendClass: 'text-success'
    },
    {
      key: 'activeTickets',
      labelKey: 'serviceQuality.activeTickets',
      value: '8',
      trend: '3 pending',
      trendClass: 'text-g-400'
    }
  ]

  // Mock data for charts
  const sentimentTrendData = [88, 90, 91, 92, 93, 94, 94.2]
  const sentimentTrendXAxis = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

  const complaintStatisticsData = [
    { value: 12, name: 'Response Time' },
    { value: 8, name: 'Quality' },
    { value: 5, name: 'Billing' },
    { value: 3, name: 'Other' }
  ]

  const feedbackSummaryData = [
    { value: 45, name: 'Positive' },
    { value: 38, name: 'Neutral' },
    { value: 17, name: 'Negative' }
  ]

  const slaComplianceData = [92, 93, 94, 95, 96, 95, 94]
  const slaComplianceXAxis = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
</script>
