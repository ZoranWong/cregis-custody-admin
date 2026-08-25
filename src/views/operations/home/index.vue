<!-- Operations Home — 运营概览 -->
<template>
  <div class="page-content">
    <!-- ═══ 摘要卡片 ═══ -->
    <ElRow :gutter="20" class="flex">
      <ElCol :sm="12" :md="8" v-for="card in summaryCards" :key="card.key">
        <div class="art-card relative flex items-center justify-between h-28 px-5 mb-5 max-sm:mb-4">
          <div>
            <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
            <span class="block text-[26px] font-medium mt-1 text-g-900">{{ card.value }}</span>
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center" :class="card.bgClass">
            <ArtSvgIcon :icon="card.icon" class="text-[20px]" :class="card.iconClass" />
          </div>
        </div>
      </ElCol>
    </ElRow>

    <ElRow :gutter="20">
      <!-- ═══ 待办列表 ═══ -->
      <ElCol :sm="24" :md="14">
        <div class="art-card mb-5">
          <div
            class="flex items-center justify-between p-4 border-b border-[var(--default-border)]"
          >
            <span class="text-g-900 font-medium">{{ $t('opsHome.todoList') }}</span>
            <span class="text-xs text-g-400">{{ $t('opsHome.itemsPending', { n: 8 }) }}</span>
          </div>
          <div class="p-4">
            <div v-for="group in todoGroups" :key="group.priority" class="mb-5 last:mb-0">
              <div class="flex items-center gap-2 mb-2">
                <el-tag :type="group.tagType" size="small" effect="light">{{ group.label }}</el-tag>
                <span class="text-xs text-g-400">({{ group.items.length }})</span>
              </div>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-g-50 transition-colors"
              >
                <div class="min-w-0">
                  <p class="text-sm text-g-800 truncate">{{ item.title }}</p>
                  <p class="text-xs text-g-400 mt-0.5">{{ item.source }}</p>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <el-button size="small" text>{{ $t('common.view') }}</el-button>
                  <el-button size="small" type="primary">{{ $t('common.process') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCol>

      <!-- ═══ 数据源状态 ═══ -->
      <ElCol :sm="24" :md="10">
        <div class="art-card mb-5">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-g-900 font-medium">{{ $t('opsHome.dataSourceStatus') }}</span>
          </div>
          <div class="p-4 flex flex-wrap gap-3">
            <div
              v-for="ds in dataSources"
              :key="ds.name"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--default-border)]"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="ds.status === 'ok' ? 'bg-success' : 'bg-g-400'"
              ></span>
              <span class="text-sm text-g-700">{{ ds.name }}</span>
              <span class="text-xs" :class="ds.status === 'ok' ? 'text-success' : 'text-g-400'">
                {{ ds.status === 'ok' ? $t('opsHome.ok') : $t('opsHome.notConnected') }}
              </span>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'OperationsHome' })

  const summaryCards = [
    {
      key: 'ticketQueue',
      labelKey: 'opsHome.ticketQueue',
      value: 8,
      icon: 'ri:file-list-3-line',
      bgClass: 'bg-blue-50',
      iconClass: 'text-blue-500'
    },
    {
      key: 'expiryAlerts',
      labelKey: 'opsHome.expiryAlerts',
      value: 2,
      icon: 'ri:timer-line',
      bgClass: 'bg-orange-50',
      iconClass: 'text-orange-500'
    },
    {
      key: 'criticalAlerts',
      labelKey: 'opsHome.criticalAlerts',
      value: 1,
      icon: 'ri:error-warning-line',
      bgClass: 'bg-red-50',
      iconClass: 'text-red-500'
    }
  ]

  const todoGroups = [
    {
      priority: 'P0',
      label: 'Urgent',
      tagType: 'danger' as const,
      items: [
        { id: 1, title: 'CryptoVault onboarding documents', source: 'Onboarding' },
        {
          id: 2,
          title: 'ChainBridge suspicious address investigation',
          source: 'Compliance'
        }
      ]
    },
    {
      priority: 'P1',
      label: 'Important',
      tagType: 'warning' as const,
      items: [
        { id: 3, title: 'PayFlow contract expiry', source: 'Merchant' },
        { id: 4, title: 'NodeSphere KYB review', source: 'Onboarding' },
        { id: 5, title: 'DataTrust audit materials', source: 'Audit' }
      ]
    },
    {
      priority: 'P2',
      label: 'Routine',
      tagType: 'info' as const,
      items: [
        { id: 6, title: 'TokenGuard activity', source: 'Monitoring' },
        { id: 7, title: 'Q2 upgrade notice', source: 'System' },
        { id: 8, title: 'BlockSafe onboarding', source: 'Onboarding' }
      ]
    }
  ]

  const dataSources = [
    { name: 'Onboarding', status: 'ok' as const },
    { name: 'Tickets', status: 'ok' as const },
    { name: 'Merchant Mgmt', status: 'ok' as const },
    { name: 'Support', status: 'degraded' as const }
  ]
</script>
