<!-- Cregis Effectiveness Analysis -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('strategy.effectiveness') }}</h2>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Filter -->
    <div class="art-card p-4 mb-5">
      <div class="flex flex-wrap items-center gap-3">
        <el-select v-model="filters.measurementWindow" class="!w-32" @change="onFilterChange">
          <el-option v-for="o in windowOptions" :key="o" :label="o" :value="o" />
        </el-select>
        <el-input-number
          v-model="thresholds.amount"
          :placeholder="$t('strategy.thresholdAmount')"
          size="small"
          class="!w-32"
          @change="onFilterChange"
        />
        <el-input-number
          v-model="thresholds.frequency"
          :placeholder="$t('strategy.thresholdFrequency')"
          size="small"
          class="!w-32"
          @change="onFilterChange"
        />
        <el-input-number
          v-model="thresholds.score"
          :placeholder="$t('strategy.thresholdScore')"
          size="small"
          class="!w-32"
          @change="onFilterChange"
        />
      </div>
    </div>

    <!-- Metric Cards -->
    <ElRow :gutter="20" class="flex mb-5">
      <ElCol :sm="12" :md="6">
        <div class="art-card p-5 mb-5">
          <div class="text-xs text-g-500 mb-1">{{ $t('strategy.totalHits') }}</div>
          <div class="text-[22px] font-medium text-g-900">{{ totalHits }}</div>
        </div>
      </ElCol>
      <ElCol :sm="12" :md="6">
        <div class="art-card p-5 mb-5">
          <div class="text-xs text-g-500 mb-1">{{ $t('strategy.fpRate') }}</div>
          <div class="text-[22px] font-medium text-[var(--el-color-danger)]"
            >{{ (fpRate * 100).toFixed(1) }}%</div
          >
        </div>
      </ElCol>
      <ElCol :sm="12" :md="6">
        <div class="art-card p-5 mb-5">
          <div class="text-xs text-g-500 mb-1">{{ $t('strategy.fnRate') }}</div>
          <div class="text-[22px] font-medium text-[var(--el-color-warning)]"
            >{{ (fnRate * 100).toFixed(1) }}%</div
          >
        </div>
      </ElCol>
      <ElCol :sm="12" :md="6">
        <div class="art-card p-5 mb-5">
          <div class="text-xs text-g-500 mb-1">{{ $t('strategy.health') }}</div>
          <el-tag :type="healthType" size="default">{{ healthLabel }}</el-tag>
        </div>
      </ElCol>
    </ElRow>

    <!-- Disposition bar -->
    <div class="art-card p-5 mb-5">
      <h3 class="text-sm font-semibold text-g-900 mb-3">{{ $t('strategy.dispositionBar') }}</h3>
      <div class="flex h-6 rounded overflow-hidden">
        <div
          v-for="seg in dispositionSegments"
          :key="seg.key"
          :style="{ width: seg.pct + '%', background: seg.color }"
          class="transition-all"
        />
      </div>
      <div class="flex gap-4 mt-2 text-xs text-g-500">
        <span v-for="seg in dispositionSegments" :key="seg.key"
          ><span
            class="inline-block w-2.5 h-2.5 rounded-sm mr-1"
            :style="{ background: seg.color }"
          />{{ seg.label }}: {{ seg.count }}</span
        >
      </div>
    </div>

    <div class="p-10 text-center text-g-400 text-xs">{{ $t('strategy.effectivenessNote') }}</div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  defineOptions({ name: 'RiskEffectiveness' })
  const filters = ref({ measurementWindow: '30d' })
  const thresholds = ref({ amount: 1, frequency: 1, score: 1 })
  const totalHits = ref(0)
  const fpRate = ref(0.02)
  const fnRate = ref(0.01)

  const healthLabel = computed(() => (fpRate.value < 0.05 ? 'Healthy' : 'Needs Tuning'))
  const healthType = computed(() => (fpRate.value < 0.05 ? 'success' : 'warning'))

  const dispositions = ref({ hold: 60, release: 20, block: 12, escalate: 8 })
  const dispositionSegments = computed(() => {
    const total = Object.values(dispositions.value).reduce((a, b) => a + b, 0) || 1
    return [
      {
        key: 'hold',
        label: 'Hold',
        count: dispositions.value.hold,
        pct: ((dispositions.value.hold / total) * 100).toFixed(1),
        color: '#3b82f6'
      },
      {
        key: 'release',
        label: 'Release',
        count: dispositions.value.release,
        pct: ((dispositions.value.release / total) * 100).toFixed(1),
        color: '#22c55e'
      },
      {
        key: 'block',
        label: 'Block',
        count: dispositions.value.block,
        pct: ((dispositions.value.block / total) * 100).toFixed(1),
        color: '#ef4444'
      },
      {
        key: 'escalate',
        label: 'Escalate',
        count: dispositions.value.escalate,
        pct: ((dispositions.value.escalate / total) * 100).toFixed(1),
        color: '#f59e0b'
      }
    ]
  })

  function load() {
    /* stub */
  }
  function onFilterChange() {
    load()
  }
  const windowOptions = ['7d', '30d', '90d']
</script>
