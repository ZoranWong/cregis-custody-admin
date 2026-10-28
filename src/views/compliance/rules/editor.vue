<!-- Rule Editor — 规则编辑 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ pageTitle }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ pageSubtitle }}</p>
      </div>
      <ArtBackButton history />
    </div>

    <!--
      自定义规则说明条。
      新增模式：一定显示（即将创建的就是自定义规则）；
      编辑模式：仅非内置规则显示（isBuiltIn 加载后自动隐藏）。
      后端合规流程尚未接入自定义规则引擎 —— 用户应知道「能存但不生效」。
    -->
    <ArtMockNotice
      v-if="!isBuiltIn"
      :title="$t('rules.customRuleNoticeTitle')"
      :description="$t('rules.customRuleNoticeBody')"
    />

    <!-- Rule Form Card -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{ $t('rules.basicInfo') }}</h2>
      </div>
      <div class="p-4">
        <el-form label-width="140px" :model="form">
          <el-form-item :label="$t('rules.ruleName')">
            <el-input v-model="form.ruleName" :disabled="isBuiltIn" />
          </el-form-item>
          <el-form-item :label="$t('rules.description')">
            <el-input v-model="form.description" type="textarea" :rows="2" :disabled="isBuiltIn" />
          </el-form-item>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.direction')">
              <el-select v-model="form.direction" class="w-full" :disabled="isBuiltIn">
                <el-option
                  v-for="item in DIRECTION_DICT"
                  :key="item.value"
                  :label="$t(item.labelKey)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('rules.stage')">
              <el-input :model-value="stageLabel(form.stage)" disabled />
            </el-form-item>
          </div>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.severity')">
              <el-select v-model="form.severity" class="w-full" :disabled="isBuiltIn">
                <el-option
                  v-for="item in SEVERITY_DICT"
                  :key="item.value"
                  :label="$t(item.labelKey)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('rules.decision')">
              <el-select v-model="form.decision" class="w-full" :disabled="isBuiltIn">
                <el-option
                  v-for="item in DECISION_DICT"
                  :key="item.value"
                  :label="$t(item.labelKey)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.scope')">
              <el-select v-model="form.scopeType" class="w-full" :disabled="isBuiltIn">
                <el-option
                  v-for="item in SCOPE_DICT"
                  :key="item.value"
                  :label="$t(item.labelKey)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('rules.minAmountUsd')">
              <el-input-number
                v-model="form.minAmountUsd"
                class="!w-full min-amount-input"
                :min="0"
                :controls="false"
                :placeholder="$t('rules.minAmountUsdPlaceholder')"
                :disabled="isBuiltIn"
              />
            </el-form-item>
          </div>
          <el-form-item v-if="form.scopeType === 'MERCHANT'" :label="$t('rules.scopeValue')">
            <el-select
              v-model="form.scopeValue"
              class="w-full"
              filterable
              :loading="merchantLoading"
              :disabled="isBuiltIn"
              :placeholder="$t('rules.scopeValuePlaceholder')"
            >
              <el-option
                v-for="m in merchantOptions"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- Risk Factors Card -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{ $t('rules.riskFactors') }}</h2>
        <p class="text-xs text-g-700 mt-1">{{ $t('rules.riskFactorHint') }}</p>
      </div>
      <div class="p-4">
        <div v-for="domain in factorCatalog" :key="domain.domain" class="mb-6">
          <div
            class="text-caption font-bold text-g-700 uppercase tracking-wider mb-2 pb-1 border-b border-[var(--default-border)]"
          >
            {{ domain.domain }}
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="factor in domain.factors"
              :key="factor.key"
              class="factor-row"
              :class="{ active: isFactorActive(factor.key), disabled: !factor.supported }"
            >
              <div
                class="factor-toggle"
                @click="factor.supported && toggleFactor(factor.key)"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="factor.supported && toggleFactor(factor.key)"
                @keydown.space.prevent="factor.supported && toggleFactor(factor.key)"
              >
                <span v-if="isFactorActive(factor.key)" class="text-white text-caption">✓</span>
              </div>
              <span class="factor-label">{{ factor.label }}</span>

              <!-- input 类型：风险分数 / 金额 -->
              <div v-if="factor.type === 'input'" class="ml-auto">
                <div v-if="isFactorActive(factor.key)" class="flex items-center justify-end gap-2">
                  <el-input
                    :model-value="getFactorValue(factor.key)"
                    placeholder="e.g. 7.0"
                    size="small"
                    class="!w-40"
                    @update:model-value="setFactorValue(factor.key, $event)"
                  />
                  <span v-if="factor.hint" class="text-xs text-tone-muted-text">{{
                    factor.hint
                  }}</span>
                </div>
                <span v-else class="factor-options-hint">{{ factor.hint }}</span>
              </div>

              <!-- single 类型：eq 单选 -->
              <div
                v-else-if="factor.type === 'single' && isFactorActive(factor.key)"
                class="flex flex-wrap gap-1 ml-auto justify-end"
              >
                <el-radio-group
                  :model-value="getFactorValue(factor.key)"
                  size="small"
                  @update:model-value="(v) => setFactorValue(factor.key, String(v))"
                >
                  <el-radio v-for="opt in factor.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </el-radio>
                </el-radio-group>
              </div>

              <!-- multi 类型：in 多选 -->
              <div
                v-else-if="factor.type === 'multi' && isFactorActive(factor.key)"
                class="flex flex-wrap gap-1 ml-auto justify-end"
              >
                <el-checkbox
                  v-for="opt in factor.options"
                  :key="opt.value"
                  :model-value="isOptionSelected(factor.key, opt.value)"
                  @update:model-value="toggleFactorOption(factor.key, opt.value)"
                  size="small"
                >
                  {{ opt.label }}
                </el-checkbox>
              </div>
              <!-- 否定值因子：不提供取值选择，展示系统自动采用的校验值 -->
              <span v-else-if="negativeOptionLabel(factor.key)" class="factor-auto-hint ml-auto">
                {{ $t('rules.factorAutoNegative', { value: negativeOptionLabel(factor.key) }) }}
              </span>
              <span v-else class="factor-options-hint">{{
                factor.supported ? getFactorOptionsDisplay(factor.key) : t('rules.factorPending')
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <el-button @click="router.back()">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="saveRule" :loading="saving" :disabled="isBuiltIn">{{
        $t('common.confirm')
      }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import countriesEn from '@/data/countries-en.json'
  import countriesZh from '@/data/countries-zh.json'
  import { fetchMerchantList } from '@/api/merchant'
  import {
    createComplianceRule,
    updateComplianceRule,
    fetchComplianceFactors,
    fetchComplianceRuleDetail
  } from '@/api/compliance'
  import type { RuleCondition, FactorView } from '@/features/compliance/types'
  import {
    DECISION_DICT,
    SCOPE_DICT,
    SEVERITY_DICT,
    DIRECTION_DICT,
    factorByKey,
    factorOptionsOverride,
    factorSortOrder,
    NEGATIVE_OPTION,
    isNegativeOnlyFactor,
    factorLabel as factorLabelOf,
    factorOptionLabel as factorOptionLabelOf,
    stageLabel as stageLabelOf
  } from '@/features/compliance/dictionaries'

  defineOptions({ name: 'RuleEditor' })

  const route = useRoute()
  const router = useRouter()
  const { locale, t } = useI18n()

  const ruleId = computed(() => route.params.id as string)
  const isEdit = computed(() => !!ruleId.value)
  const isBuiltIn = ref(false)
  const saving = ref(false)

  const pageTitle = computed(() => (isEdit.value ? t('rules.editRule') : t('rules.addRule')))
  const pageSubtitle = computed(() =>
    isEdit.value ? t('rules.editRuleSubtitle') : t('rules.addRuleSubtitle')
  )

  function stageLabel(value: string): string {
    return stageLabelOf(value, t)
  }

  // 国家列表（counterparty_jurisdiction 的多选数据源）
  const countryOptions = computed(() => {
    const countries = locale.value === 'zh' ? countriesZh : countriesEn
    return countries.map((c) => `${c.code} — ${c.name}`)
  })

  // ─── 因子目录（GET /compliance/factors 接口驱动）───
  // 地址因子按方向显示：出金只显示受益方地址，入金只显示发起方地址（对手方筛查语义）
  // ─── 因子目录（GET /compliance/factors，接口驱动）───
  // enabled=false 的因子置灰不可编辑；factorName 走 i18n 兜底（FACTOR_CATALOG）
  const serverFactors = ref<FactorView[]>([])

  async function loadFactors() {
    try {
      serverFactors.value = await fetchComplianceFactors()
    } catch {
      serverFactors.value = []
    }
  }

  function factorLabel(factor: FactorView): string {
    return factorLabelOf(factor.factorCode, t, factor.factorName)
  }

  function factorType(factor: FactorView): 'input' | 'multi' | 'single' {
    // NUMBER → 输入框
    if (factor.valueType === 'NUMBER') return 'input'
    // in → 多选；eq → 单选
    if (factor.defaultOperator === 'in') return 'multi'
    if (factor.defaultOperator === 'eq') return 'single'
    // 兜底：无可选值 → 输入框；否则单选
    if (factor.allowedValues.length === 0) return 'input'
    return 'single'
  }

  function factorHint(factor: FactorView): string {
    const staticFactor = factorByKey(factor.factorCode)
    return staticFactor?.hintKey ? t(staticFactor.hintKey) : ''
  }

  const factorCatalog = computed(() => {
    const domains: Record<
      string,
      Array<{
        key: string
        label: string
        type: string
        hint: string
        supported: boolean
        options: Array<{ value: string; label: string }>
        rank: number
      }>
    > = {}
    for (const factor of serverFactors.value) {
      // 按方向过滤地址因子
      if (form.direction === 'OUTGOING' && factor.factorCode === 'screening.originator_address')
        continue
      if (form.direction === 'INCOMING' && factor.factorCode === 'screening.beneficiary_address')
        continue
      // Travel Rule 相关因子归到 travelRule 分组（后端 domain 仍为 counterpartyVasp）
      const domain = ['tr_capable', 'ivms101_valid'].includes(factor.factorCode)
        ? 'travelRule'
        : factor.domain
      const domainKey = `rules.factorDomains.${domain}`
      if (!domains[domainKey]) domains[domainKey] = []
      // 取值与后端 allowedValues 保持一致（仅字典显式覆盖时收敛），展示走 i18n
      const values = factorOptionsOverride(factor.factorCode) ?? factor.allowedValues
      const type = isNegativeOnlyFactor(factor.factorCode) ? 'negative' : factorType(factor)
      let options: Array<{ value: string; label: string }> = []
      if (type === 'multi' || type === 'single') {
        // 辖区因子（allowedValues 为空 + in 操作符）用国家列表做数据源
        options =
          values.length > 0
            ? values.map((v) => ({ value: v, label: factorOptionLabelOf(v, t) }))
            : countryOptions.value.map((c) => ({ value: c, label: c }))
      }
      domains[domainKey].push({
        key: factor.factorCode,
        label: factorLabel(factor),
        type,
        hint: factorHint(factor),
        supported: factor.enabled,
        options,
        rank: factorSortOrder(factor.factorCode) ?? factor.sortOrder
      })
    }
    // 分组内按 sortOrder 排序（vasp_did_status 紧跟 vasp_status），分组间保持后端顺序
    for (const factors of Object.values(domains)) {
      factors.sort((a, b) => a.rank - b.rank)
    }
    return Object.entries(domains).map(([domainKey, factors]) => ({
      domain: t(domainKey),
      factors
    }))
  })

  // activeFactors: multi 类型存选项数组，input 类型存单值（用数组第一个元素承载）
  const activeFactors = ref<Record<string, string[]>>({})

  function toggleFactor(factorKey: string) {
    if (activeFactors.value[factorKey]) {
      delete activeFactors.value[factorKey]
      return
    }
    // 否定值因子：勾选后自动带上否定值，用户无需（也不应）再选具体枚举
    activeFactors.value[factorKey] = NEGATIVE_OPTION[factorKey] ? [NEGATIVE_OPTION[factorKey]!] : []
  }

  function toggleFactorOption(factorKey: string, option: string) {
    if (!activeFactors.value[factorKey]) {
      activeFactors.value[factorKey] = []
    }
    const idx = activeFactors.value[factorKey].indexOf(option)
    if (idx >= 0) {
      activeFactors.value[factorKey].splice(idx, 1)
      if (activeFactors.value[factorKey].length === 0) {
        delete activeFactors.value[factorKey]
      }
    } else {
      activeFactors.value[factorKey].push(option)
    }
  }

  function isFactorActive(factorKey: string): boolean {
    return !!activeFactors.value[factorKey]
  }

  function isOptionSelected(factorKey: string, option: string): boolean {
    return activeFactors.value[factorKey]?.includes(option) ?? false
  }

  function getFactorValue(factorKey: string): string {
    return activeFactors.value[factorKey]?.[0] ?? ''
  }

  function setFactorValue(factorKey: string, value: string) {
    if (value === '') {
      delete activeFactors.value[factorKey]
    } else {
      activeFactors.value[factorKey] = [value]
    }
  }

  /** 否定值因子的自动取值标签；非否定值因子返回空串 */
  function negativeOptionLabel(factorKey: string): string {
    const negative = NEGATIVE_OPTION[factorKey]
    return negative ? factorOptionLabelOf(negative, t) : ''
  }

  function getFactorOptionsDisplay(factorKey: string): string {
    const factor = factorCatalog.value.flatMap((d) => d.factors).find((f) => f.key === factorKey)
    if (!factor) return ''
    return factor.options.map((o) => o.label).join(' | ')
  }

  const form = reactive({
    ruleName: '',
    description: '',
    direction: 'OUTGOING',
    stage: 'DUE_DILIGENCE',
    severity: 'ROUTINE',
    scopeType: 'GLOBAL',
    scopeValue: '',
    decision: 'SUBMIT_FOR_REVIEW',
    minAmountUsd: null as number | null,
    enabled: true
  })

  // ─── 商户列表（scopeType=MERCHANT 时选择 scopeValue）───
  const merchantOptions = ref<Array<{ label: string; value: string }>>([])
  const merchantLoading = ref(false)

  async function loadMerchants() {
    merchantLoading.value = true
    try {
      const result = await fetchMerchantList({ pageSize: 200 })
      merchantOptions.value = result.records.map((m) => ({
        label: `${m.merchantName} (${m.code})`,
        value: m.code
      }))
    } catch {
      merchantOptions.value = []
    } finally {
      merchantLoading.value = false
    }
  }

  // ─── conditions ↔ activeFactors 映射（operator/valueType 用接口数据）───
  // 供 saveRule 提交时使用；接口开放后恢复调用

  function buildConditions(): RuleCondition[] {
    const conds: RuleCondition[] = []
    let sort = 1
    for (const [key, values] of Object.entries(activeFactors.value)) {
      const serverFactor = serverFactors.value.find((f) => f.factorCode === key)
      if (!serverFactor || !serverFactor.enabled) continue
      if (values.length === 0) continue
      // input/single 类型：单值；multi 类型：逗号分隔
      const type = factorType(serverFactor)
      const value = type === 'multi' ? values.join(',') : values[0]
      conds.push({
        field: key,
        operator: serverFactor.defaultOperator,
        value,
        enabled: true,
        sortOrder: sort++
      })
    }
    return conds
  }

  function applyConditions(conditions: RuleCondition[]) {
    activeFactors.value = {}
    for (const c of conditions || []) {
      const serverFactor = serverFactors.value.find((f) => f.factorCode === c.field)
      if (!serverFactor) continue
      const type = factorType(serverFactor)
      if (type !== 'multi') {
        activeFactors.value[c.field] = [c.value || '']
      } else {
        const opts = (c.value || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        if (opts.length) activeFactors.value[c.field] = opts
      }
    }
  }

  async function loadDetail() {
    if (!isEdit.value) return
    try {
      const detail = await fetchComplianceRuleDetail(ruleId.value)
      form.ruleName = detail.ruleName
      form.description = detail.description || ''
      form.direction = detail.direction
      form.stage = 'DUE_DILIGENCE'
      form.severity = detail.severity
      form.scopeType = detail.scopeType
      form.scopeValue = detail.scopeValue || ''
      form.decision = detail.decision
      form.minAmountUsd = detail.minAmountUsd ?? null
      form.enabled = detail.enabled
      applyConditions(detail.conditions || [])
      isBuiltIn.value = detail.builtIn
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to load rule')
      router.back()
    }
  }

  /**
   * 提交：新增走 POST /compliance/rules，编辑走 PUT /compliance/rules/{id}。
   *
   * ⚠️ 后端合规流程尚未接入自定义规则引擎 —— 提交成功只代表规则已保存，
   * 不会影响实际交易的筛查/审批（页面顶部有对应说明条）。
   * 接口接入流程后该提示与说明条应一并移除。
   */
  async function saveRule() {
    if (!form.ruleName.trim()) {
      ElMessage.warning(t('rules.ruleName') + ' is required')
      return
    }
    if (form.scopeType === 'MERCHANT' && !form.scopeValue) {
      ElMessage.warning(t('rules.scopeValue') + ' is required')
      return
    }
    saving.value = true
    try {
      const request = {
        ruleName: form.ruleName.trim(),
        description: form.description || '',
        direction: form.direction,
        scopeType: form.scopeType,
        scopeValue: form.scopeType === 'MERCHANT' ? form.scopeValue : null,
        decision: form.decision,
        severity: form.severity,
        minAmountUsd: form.minAmountUsd ?? null,
        enabled: form.enabled,
        conditions: buildConditions()
      }
      if (isEdit.value) {
        await updateComplianceRule(ruleId.value, request)
        ElMessage.success(t('common.updateSuccess'))
      } else {
        await createComplianceRule(request)
        ElMessage.success(t('common.addSuccess'))
      }
      // 成功后返回列表（列表页会重新拉取）
      router.back()
    } catch (e) {
      // apiRequest 抛出的 ApiError 自带可读信息
      ElMessage.error(e instanceof Error ? e.message : String(e))
    } finally {
      saving.value = false
    }
  }

  onMounted(async () => {
    loadMerchants()
    // 因子目录先于详情加载（applyConditions 依赖 serverFactors）
    await loadFactors()
    if (isEdit.value) {
      loadDetail()
      return
    }
    // 新增：从 query 读取 stage 编号与方向编号（direction 与列表 tab 一致：OUTGOING/INCOMING/ALL）
    const stageCode = route.query.stage as string
    const directionCode = route.query.direction as string
    if (stageCode) form.stage = stageCode
    const VALID_DIRECTIONS = ['OUTGOING', 'INCOMING', 'ALL']
    if (directionCode && VALID_DIRECTIONS.includes(directionCode)) {
      form.direction = directionCode
      // 入金默认决策 Hold；出金/任意方向保持表单默认 SUBMIT_FOR_REVIEW
      if (directionCode === 'INCOMING') form.decision = 'HOLD'
    }
  })
</script>

<style scoped>
  .factor-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.15s;
  }

  .factor-row.active {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary-light-5);
  }

  .factor-row.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .factor-row.disabled .factor-toggle {
    cursor: not-allowed;
  }

  .factor-toggle:focus-visible,
  .condition-toggle:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  .factor-toggle {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 16px;
    height: 16px;
    cursor: pointer;
    border: 2px solid var(--el-border-color);
    border-radius: 4px;
    transition: all 0.15s;
  }

  .factor-row.active .factor-toggle {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  .factor-label {
    min-width: 140px;
    font-size: var(--font-size-body-lg);
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .factor-options-hint {
    margin-left: auto;
    font-size: var(--font-size-body);
    color: var(--el-text-color-secondary);
  }

  /* 金额门槛输入框与同排 el-select/el-input 宽度对齐，内部文本左对齐 */
  .min-amount-input :deep(.el-input__wrapper) {
    width: 100%;
  }

  .min-amount-input :deep(.el-input__inner) {
    text-align: left;
  }

  /* 否定值因子的自动取值提示：比普通选项提示更轻，避免误以为是可选值 */
  .factor-auto-hint {
    font-size: var(--font-size-body);
    color: var(--tone-muted-text);
  }
</style>
