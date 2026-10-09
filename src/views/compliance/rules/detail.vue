<!-- Rule Detail — 规则详情 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('rules.ruleDetailTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('rules.ruleDetailSubtitle') }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('rules.backToRules') }}
      </el-button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="art-card p-10 text-center">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="errorMessage" class="art-card p-10 text-center">
      <p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p>
      <el-button type="primary" @click="loadDetail">{{ $t('console.refresh') }}</el-button>
    </div>

    <template v-else-if="currentRule">
      <!-- Rule Detail Card -->
      <div class="art-card mb-5">
        <div class="p-5 border-b border-[var(--default-border)] flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-g-900">{{ currentRule.ruleName }}</h2>
            <div class="text-xs text-g-400 font-mono mt-1">{{ currentRule.ruleCode }}</div>
          </div>
          <div class="flex items-center gap-2">
            <el-tag :type="currentRule.enabled ? 'success' : 'info'" size="default" effect="light">
              {{ currentRule.enabled ? $t('rules.enabled') : $t('rules.disabled') }}
            </el-tag>
            <!-- built-in 提示仅内置规则显示 -->
            <el-tag v-if="currentRule.builtIn" type="warning" size="default" effect="plain">
              {{ $t('rules.builtIn') }}
            </el-tag>
            <!-- 操作（原列表页按钮移入详情） -->
            <el-button
              v-if="currentRule.enabled"
              size="small"
              text
              type="danger"
              @click="handleToggleStatus(false)"
            >
              {{ $t('rules.cancel') }}
            </el-button>
            <el-button v-else size="small" text type="success" @click="handleToggleStatus(true)">
              {{ $t('rules.recover') }}
            </el-button>
            <el-button size="small" text type="primary" @click="handleEdit">
              {{ $t('rules.edit') }}
            </el-button>
          </div>
        </div>
        <div class="p-5">
          <!-- Description -->
          <div class="mb-5">
            <label class="text-xs font-semibold text-g-600 block mb-1">{{
              $t('rules.description')
            }}</label>
            <div
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800 leading-relaxed"
            >
              {{ currentRule.description || '—' }}
            </div>
          </div>

          <!-- Direction + Min Amount + Severity -->
          <div class="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label class="text-xs font-semibold text-g-600 block mb-1">{{
                $t('rules.direction')
              }}</label>
              <div
                class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
              >
                {{ directionLabel(currentRule.direction) }}
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-g-600 block mb-1">{{
                $t('rules.minAmountUsd')
              }}</label>
              <div
                class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
              >
                {{
                  currentRule.minAmountUsd != null
                    ? `$${currentRule.minAmountUsd}`
                    : $t('rules.anyAmount')
                }}
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-g-600 block mb-1">{{
                $t('rules.severity')
              }}</label>
              <div
                class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
              >
                {{ severityLabel(currentRule.severity) }}
              </div>
            </div>
          </div>

          <!-- Decision + Scope -->
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label class="text-xs font-semibold text-g-600 block mb-1">{{
                $t('rules.decision')
              }}</label>
              <div
                class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
              >
                {{ decisionLabel(currentRule.decision) }}
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-g-600 block mb-1">{{
                $t('rules.scope')
              }}</label>
              <div
                class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-800"
              >
                {{ scopeLabel(currentRule.scopeType)
                }}{{ currentRule.scopeValue ? `: ${currentRule.scopeValue}` : '' }}
              </div>
            </div>
          </div>

          <!-- Risk Factors -->
          <div>
            <label class="text-xs font-semibold text-g-600 block mb-2">{{
              $t('rules.riskFactors')
            }}</label>
            <div
              v-if="activeFactors.length === 0"
              class="px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-400 italic"
            >
              {{ $t('rules.noRiskFactors') }}
            </div>
            <div v-else class="space-y-4">
              <div v-for="domain in groupedFactors" :key="domain.domain">
                <div
                  class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-1.5 pb-2 border-b border-[var(--default-border)]"
                >
                  {{ domain.domain }}
                </div>
                <div class="flex flex-col gap-2">
                  <div
                    v-for="factor in domain.items"
                    :key="factor.label"
                    class="flex items-center gap-2 px-3 py-2 bg-[var(--el-color-primary-light-9)] border border-[var(--el-color-primary-light-5)] rounded-lg"
                  >
                    <span
                      class="w-4 h-4 rounded bg-[var(--el-color-primary)] flex items-center justify-center text-white text-[10px] flex-shrink-0"
                      >✓</span
                    >
                    <span class="text-sm font-medium text-g-800 min-w-[140px]">{{
                      factorLabel(factor.label)
                    }}</span>
                    <span class="text-xs text-[var(--el-color-primary)] font-medium ml-auto">{{
                      factor.values.map(factorOptionLabel).join(', ')
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { fetchComplianceRuleDetail, updateComplianceRuleEnabled } from '@/api/compliance'
  import type { ComplianceRuleView } from '@/features/compliance/types'
  import {
    conditionDomainLabel,
    decisionLabel as decisionLabelOf,
    directionLabel as directionLabelOf,
    factorLabel as factorLabelOf,
    factorOptionLabel as factorOptionLabelOf,
    scopeLabel as scopeLabelOf,
    severityLabel as severityLabelOf
  } from '@/features/compliance/dictionaries'

  defineOptions({ name: 'ComplianceRuleDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const loading = ref(false)
  const errorMessage = ref('')
  const currentRule = ref<ComplianceRuleView | null>(null)

  async function loadDetail() {
    const ruleId = route.params.id as string
    if (!ruleId) {
      errorMessage.value = 'Rule ID is required'
      return
    }
    loading.value = true
    errorMessage.value = ''
    try {
      currentRule.value = await fetchComplianceRuleDetail(ruleId)
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Failed to load rule detail'
      currentRule.value = null
    } finally {
      loading.value = false
    }
  }

  // ─── 操作（原列表页按钮，移入详情）───
  /** 启用/停用：停用=Cancel，启用=Recover */
  async function handleToggleStatus(enabled: boolean) {
    const rule = currentRule.value
    if (!rule) return
    try {
      await updateComplianceRuleEnabled(rule.id, { enabled })
      rule.enabled = enabled
      ElMessage.success(enabled ? t('rules.enabled') : t('rules.disabled'))
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  /** 编辑：接口暂未开放，先提示开发中 */
  function handleEdit() {
    // TODO: 接口就绪后跳转 ComplianceRuleEditor
    ElMessage.info(t('common.underDevelopment'))
  }

  // ─── 枚举展示统一走 dictionaries（此处仅绑定 t）───
  function severityLabel(value: string): string {
    return severityLabelOf(value, t)
  }

  function directionLabel(value: string): string {
    return directionLabelOf(value, t)
  }

  function decisionLabel(value: string): string {
    return decisionLabelOf(value, t)
  }

  function scopeLabel(value: string): string {
    return scopeLabelOf(value, t)
  }

  // ─── conditions → 风险因子分组展示（field 映射来自 dictionaries）───
  function factorLabel(value: string): string {
    return factorLabelOf(value, t)
  }

  function factorOptionLabel(value: string): string {
    return factorOptionLabelOf(value, t)
  }

  const activeFactors = computed(() => {
    const conditions = currentRule.value?.conditions || []
    const result: Array<{ domain: string; label: string; values: string[] }> = []
    for (const c of conditions) {
      if (!c.field) continue
      const values = (c.value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      result.push({
        domain: conditionDomainLabel(c.field, t),
        label: c.field,
        values
      })
    }
    return result
  })

  const groupedFactors = computed(() => {
    const groups: Record<string, Array<{ label: string; values: string[] }>> = {}
    for (const f of activeFactors.value) {
      if (!groups[f.domain]) groups[f.domain] = []
      groups[f.domain].push({ label: f.label, values: f.values })
    }
    return Object.entries(groups).map(([domain, items]) => ({ domain, items }))
  })

  onMounted(() => {
    loadDetail()
  })
</script>
