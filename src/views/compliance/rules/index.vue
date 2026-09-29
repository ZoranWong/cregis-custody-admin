<!-- Compliance Rules — 合规规则管理 -->
<template>
  <div class="page-content rules-page">
    <!-- ═══ Page Header ═══ -->
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-g-900">{{ $t('rules.title') }}</h1>
      <p class="text-sm text-g-500 mt-1">{{ $t('rules.subtitle') }}</p>
    </div>

    <!-- ═══ Filter Bar ═══ -->
    <div class="art-card mb-5 p-4">
      <div class="flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('rules.severity') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in severityOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: severityFilter === opt.value }"
              @click="severityFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('rules.scope') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in scopeOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: scopeFilter === opt.value }"
              @click="scopeFilter = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Direction Tabs（ALL 为出入金通用规则）═══ -->
    <el-tabs v-model="direction" class="mb-5">
      <el-tab-pane :label="$t('rules.all')" name="ALL" />
      <el-tab-pane :label="$t('rules.outgoing')" name="OUTGOING" />
      <el-tab-pane :label="$t('rules.incoming')" name="INCOMING" />
    </el-tabs>

    <!-- ═══ 列表区（撑满剩余高度，可滚动）═══ -->
    <div class="rules-list flex-1 min-h-0 overflow-y-auto">
      <!-- Loading / Error / Empty -->
      <div v-if="loading" class="art-card p-10 text-center">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else-if="errorMessage" class="art-card p-10 text-center">
        <p class="text-[var(--el-color-danger)] mb-4">{{ errorMessage }}</p>
        <el-button type="primary" @click="loadRules">{{ $t('console.refresh') }}</el-button>
      </div>
      <div v-else-if="filteredRules.length === 0" class="art-card p-10 text-center">
        <p class="text-g-500 mb-4">{{ $t('rules.noRiskFactors') }}</p>
        <el-button type="primary" @click="openAddRule">{{ $t('rules.addRule') }}</el-button>
      </div>

      <!-- Step Sections -->
      <div
        v-else
        v-for="(step, stepIdx) in filteredSteps"
        :key="step.name"
        class="step-section mb-7"
      >
        <div class="flex items-center gap-2.5 mb-1">
          <span
            class="w-6 h-6 rounded-full bg-g-100 text-g-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0"
          >
            {{ stepIdx + 1 }}
          </span>
          <span class="text-[15px] font-semibold text-g-900">{{ stageLabelOf(step.name) }}</span>
        </div>
        <div class="text-xs text-g-500 mb-4 ml-[34px]">{{ stepDescription(step.name) }}</div>

        <!-- Rule Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
          <div
            v-for="rule in step.rules"
            :key="rule.id"
            class="art-card rule-card-hover p-4 cursor-pointer flex flex-col"
            :class="{ 'opacity-60 bg-g-50': !rule.enabled }"
            @click="goDetail(rule.id)"
          >
            <!-- 上部自适应 -->
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-g-900 truncate">{{
                      rule.ruleName
                    }}</span>
                    <el-tag v-if="rule.builtIn" type="info" size="small" effect="plain">
                      {{ $t('rules.builtIn') }}
                    </el-tag>
                  </div>
                  <div class="text-[11px] text-g-400 font-mono mt-0.5 truncate">{{
                    rule.ruleCode
                  }}</div>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <el-tag :type="severityTag(rule.severity)" size="small" effect="light">
                    {{ severityLabelOf(rule.severity) }}
                  </el-tag>
                </div>
              </div>

              <p class="text-xs text-g-600 leading-relaxed mb-3 line-clamp-2">{{
                rule.description
              }}</p>

              <div class="flex flex-wrap gap-1.5 mb-3">
                <el-tag :type="directionTag(rule.direction)" size="small" effect="plain">
                  {{ directionLabelOf(rule.direction) }}
                </el-tag>
                <el-tag size="small" effect="plain">
                  {{ scopeLabelOf(rule.scopeType)
                  }}{{ rule.scopeValue ? `: ${rule.scopeValue}` : '' }}
                </el-tag>
              </div>

              <div class="flex gap-3 text-[11px] text-g-400">
                <span
                  >{{ $t('rules.decision') }}:
                  <span class="text-g-600">{{ decisionLabelOf(rule.decision) }}</span></span
                >
                <span
                  >{{ $t('rules.minAmountUsd') }}:
                  <span class="text-g-600">{{ minAmountDisplay(rule.minAmountUsd) }}</span></span
                >
              </div>
            </div>

            <!-- 底部操作栏固定 -->
            <div
              class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--default-border)] h-[40px]"
              @click.stop
            >
              <div class="flex gap-1">
                <el-button
                  v-if="rule.enabled"
                  size="small"
                  text
                  type="danger"
                  @click="toggleRuleStatus(rule, false)"
                >
                  {{ $t('rules.cancel') }}
                </el-button>
                <el-button
                  v-else
                  size="small"
                  text
                  type="success"
                  @click="toggleRuleStatus(rule, true)"
                >
                  {{ $t('rules.recover') }}
                </el-button>
              </div>
              <div class="flex gap-1">
                <el-button size="small" text @click="editRule(rule)">
                  {{ $t('rules.edit') }}
                </el-button>
                <el-button size="small" text @click="goDetail(rule.id)">
                  {{ $t('rules.detail') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Rule per step -->
        <button
          class="w-full mt-3 py-2.5 border border-dashed border-g-300 rounded-lg text-sm font-medium text-g-500 hover:border-primary hover:bg-primary-50 hover:text-primary transition-all"
          @click="openAddRule(step.name)"
        >
          + {{ $t('rules.addRule') }}
        </button>
      </div>
    </div>

    <!-- ═══ Pagination（固定底部）═══ -->
    <div
      v-if="pagination.total > 0"
      class="flex justify-end items-center px-5 py-3 border-t border-[var(--default-border)] shrink-0"
    >
      <el-pagination
        v-model:current-page="filterPage"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :page-count="pagination.totalPages"
        :page-sizes="[10, 20, 50]"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="(v: number) => updatePage({ page: v })"
        @size-change="(v: number) => updatePage({ pageSize: v, page: 1 })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { fetchComplianceRules, updateComplianceRuleEnabled } from '@/api/compliance'
  import type { ComplianceRuleItem } from '@/features/compliance/types'
  import {
    decisionLabel,
    directionLabel,
    directionTagType as directionTag,
    scopeLabel,
    severityLabel,
    severityTagType as severityTag,
    stageDescKey,
    stageLabel
  } from '@/features/compliance/dictionaries'

  defineOptions({ name: 'ComplianceRules' })

  const router = useRouter()
  const { t } = useI18n()

  // ─── State ───
  const loading = ref(false)
  const errorMessage = ref('')
  const rules = ref<ComplianceRuleItem[]>([])

  const direction = ref('OUTGOING')
  const severityFilter = ref('all')
  const scopeFilter = ref('all')

  const pagination = reactive({
    pageIndex: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1
  })

  const filterPage = ref(1)

  // ─── Computed ───
  const severityOptions = computed(() => [
    { label: t('rules.all'), value: 'all' },
    { label: t('rules.routine'), value: 'ROUTINE' },
    { label: t('rules.medium'), value: 'MEDIUM' },
    { label: t('rules.critical'), value: 'CRITICAL' }
  ])

  const scopeOptions = computed(() => [
    { label: t('rules.all'), value: 'all' },
    { label: t('rules.global'), value: 'GLOBAL' },
    { label: t('rules.merchant'), value: 'MERCHANT' }
  ])

  const filteredRules = computed(() => {
    return rules.value.filter((r) => {
      if (severityFilter.value !== 'all' && r.severity !== severityFilter.value) return false
      if (scopeFilter.value !== 'all' && r.scopeType !== scopeFilter.value) return false
      return true
    })
  })

  const filteredSteps = computed(() => {
    // Travel Rule Auto-Accept 与 Mismatch Hold 暂不支持，只展示 Due Diligence
    return [
      {
        name: 'DUE_DILIGENCE',
        rules: filteredRules.value
      }
    ]
  })

  // ─── Methods ───
  async function loadRules() {
    loading.value = true
    errorMessage.value = ''
    try {
      const queryList: Array<{ key: string; oper?: string; value: unknown; join?: string }> = []
      // ALL = 出入金通用规则，direction 参数固定传 'all'
      queryList.push({
        key: 'direction',
        oper: '=',
        value: direction.value.toLowerCase(),
        join: 'and'
      })
      if (severityFilter.value !== 'all') {
        queryList.push({ key: 'severity', oper: '=', value: severityFilter.value, join: 'and' })
      }

      const result = await fetchComplianceRules({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        queryList
      })
      rules.value = result.records || []
      pagination.total = result.total || 0
      pagination.totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Failed to load rules'
      rules.value = []
    } finally {
      loading.value = false
    }
  }

  // ─── 枚举展示统一走 dictionaries（此处仅绑定 t）───
  function severityLabelOf(severity: string): string {
    return severityLabel(severity, t)
  }
  function directionLabelOf(direction: string): string {
    return directionLabel(direction, t)
  }
  function decisionLabelOf(decision: string): string {
    return decisionLabel(decision, t)
  }
  function scopeLabelOf(scopeType: string): string {
    return scopeLabel(scopeType, t)
  }
  function stageLabelOf(stage: string): string {
    return stageLabel(stage, t)
  }

  /** 金额门槛：null 或 0 均显示“任意金额” */
  function minAmountDisplay(minAmountUsd: number | null): string {
    if (minAmountUsd == null || minAmountUsd === 0) return t('rules.anyAmount')
    return `$${minAmountUsd}`
  }

  function stepDescription(stage: string): string {
    // ALL 为通用规则，无方向专属描述，取 OUTGOING 侧文案兜底
    const dir = direction.value === 'ALL' ? 'OUTGOING' : direction.value
    const key = stageDescKey(stage, dir)
    return key ? t(key) : ''
  }

  function openAddRule(stage: string | MouseEvent = 'DUE_DILIGENCE') {
    const stageCode = typeof stage === 'string' ? stage : 'DUE_DILIGENCE'

    // Route to Travel Rule Auto-Accept editor for TRAVEL_RULE_AUTO_ACCEPT stage
    if (stageCode === 'TRAVEL_RULE_AUTO_ACCEPT') {
      router.push({
        name: 'TravelRuleAutoAcceptEditor'
      })
      return
    }

    router.push({
      name: 'ComplianceRuleEditor',
      query: { stage: stageCode, direction: direction.value }
    })
  }

  function editRule(rule: ComplianceRuleItem) {
    router.push({ name: 'ComplianceRuleEditor', params: { id: String(rule.id) } })
  }

  function goDetail(id: number) {
    router.push({ name: 'ComplianceRuleDetail', params: { id: String(id) } })
  }

  async function toggleRuleStatus(rule: ComplianceRuleItem, enabled: boolean) {
    try {
      await updateComplianceRuleEnabled(rule.id, { enabled })
      rule.enabled = enabled
      ElMessage.success(enabled ? t('rules.enabled') : t('rules.disabled'))
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  function updatePage(patch: { page?: number; pageSize?: number }) {
    if (patch.pageSize !== undefined) {
      pagination.pageSize = patch.pageSize
      pagination.pageIndex = 1
      filterPage.value = 1
    } else if (patch.page !== undefined) {
      pagination.pageIndex = patch.page
      filterPage.value = patch.page
    }
    loadRules()
  }

  onMounted(() => {
    loadRules()
  })

  // 切换出入金 tab 时重新请求对应方向的规则
  watch(direction, () => {
    pagination.pageIndex = 1
    filterPage.value = 1
    loadRules()
  })
</script>

<style scoped>
  /* 页面纵向布局：分页固定底部，列表区撑满剩余高度 */
  .rules-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .filter-btn {
    padding: 4px 10px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: #fff;
    border: 1px solid var(--default-border);
    border-radius: 5px;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
  }

  .filter-btn.active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .rule-card-hover {
    transition: all 0.15s;
  }

  .rule-card-hover:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
