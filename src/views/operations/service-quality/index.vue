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

  const charts = [
    { key: 'sentimentTrend', labelKey: 'serviceQuality.sentimentTrend' },
    { key: 'complaintStatistics', labelKey: 'serviceQuality.complaintStatistics' },
    { key: 'feedbackSummary', labelKey: 'serviceQuality.feedbackSummary' },
    { key: 'slaCompliance', labelKey: 'serviceQuality.slaCompliance' }
  ]
</script>
