<!-- Rule Editor — 规则编辑 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ pageTitle }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ pageSubtitle }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('rules.backToRules') }}
      </el-button>
    </div>

    <!-- Rule Form Card -->
    <div class="art-card mb-5">
      <div class="p-5 border-b border-[var(--default-border)]">
        <h2 class="text-lg font-semibold text-g-900">{{ $t('rules.basicInfo') }}</h2>
      </div>
      <div class="p-5">
        <el-form label-width="140px" :model="form">
          <el-form-item :label="$t('rules.ruleName')">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item :label="$t('rules.description')">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.direction')">
              <el-input :model-value="form.direction" disabled />
            </el-form-item>
            <el-form-item :label="$t('rules.stage')">
              <el-input :model-value="form.stage" disabled />
            </el-form-item>
          </div>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.minAmount')">
              <el-input v-model="form.minAmount" placeholder="e.g. 10000" />
            </el-form-item>
            <el-form-item :label="$t('rules.severity')">
              <el-select v-model="form.severity" class="w-full">
                <el-option :label="$t('rules.severityRoutine')" value="Routine" />
                <el-option :label="$t('rules.severityMedium')" value="Medium" />
                <el-option :label="$t('rules.severityCritical')" value="Critical" />
              </el-select>
            </el-form-item>
          </div>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.scope')">
              <el-select v-model="form.scope" class="w-full">
                <el-option :label="$t('rules.global')" value="Global" />
                <el-option :label="$t('rules.merchantSpecific')" value="Merchant Specific" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('rules.decision')">
              <el-select v-model="form.decision" class="w-full">
                <el-option :label="$t('rules.autoReject')" value="Auto Reject" />
                <el-option :label="$t('rules.submitReview')" value="Submit for Review" />
                <el-option :label="$t('rules.hold')" value="Hold" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <!-- Risk Factors Card -->
    <div class="art-card mb-5">
      <div class="p-5 border-b border-[var(--default-border)]">
        <h2 class="text-lg font-semibold text-g-900">{{ $t('rules.riskFactors') }}</h2>
        <p class="text-xs text-g-500 mt-1">{{ $t('rules.riskFactorHint') }}</p>
      </div>
      <div class="p-5">
        <div v-for="domain in factorCatalog" :key="domain.domain" class="mb-6">
          <div
            class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1 border-b border-[var(--default-border)]"
          >
            {{ domain.domain }}
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="factor in domain.factors"
              :key="factor.key"
              class="factor-row"
              :class="{ active: isFactorActive(factor.key) }"
            >
              <div class="factor-toggle" @click="toggleFactor(factor.key)">
                <span v-if="isFactorActive(factor.key)" class="text-white text-[10px]">✓</span>
              </div>
              <span class="factor-label">{{ factor.label }}</span>
              <div v-if="isFactorActive(factor.key)" class="flex flex-wrap gap-1 ml-auto">
                <el-checkbox
                  v-for="opt in factor.options"
                  :key="opt"
                  :model-value="isOptionSelected(factor.key, opt)"
                  @update:model-value="toggleFactorOption(factor.key, opt)"
                  size="small"
                >
                  {{ opt }}
                </el-checkbox>
              </div>
              <span v-else class="factor-options-hint">{{
                getFactorOptionsDisplay(factor.key)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <el-button @click="router.back()">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="saveRule">{{ $t('common.confirm') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import countriesEn from '@/data/countries-en.json'
  import countriesZh from '@/data/countries-zh.json'

  defineOptions({ name: 'RuleEditor' })

  const route = useRoute()
  const router = useRouter()
  const { locale, t } = useI18n()

  const ruleId = computed(() => route.params.id as string)
  const isEdit = computed(() => !!ruleId.value)

  const pageTitle = computed(() => (isEdit.value ? t('rules.editRule') : t('rules.addRule')))
  const pageSubtitle = computed(() =>
    isEdit.value ? t('rules.editRuleSubtitle') : t('rules.addRuleSubtitle')
  )

  // Get country list based on current locale
  function getCountries(): { code: string; name: string }[] {
    return locale.value === 'zh' ? countriesZh : countriesEn
  }

  const countryOptions = computed(() => getCountries().map((c) => `${c.code} — ${c.name}`))

  interface FactorOption {
    key: string
    labelKey: string
    type: 'multi'
    options: string[]
  }

  interface FactorDomain {
    domainKey: string
    factors: FactorOption[]
  }

  const factorCatalogTemplate: FactorDomain[] = [
    {
      domainKey: 'rules.factorDomains.customerDueDiligence',
      factors: [
        {
          key: 'onboarding_state',
          labelKey: 'rules.factors.onboardingStatus',
          type: 'multi',
          options: ['onboarded', 'pending', 'labeled', 'frozen', 'offboarded']
        },
        {
          key: 'customer_risk_level',
          labelKey: 'rules.factors.customerRiskLevel',
          type: 'multi',
          options: ['low', 'medium', 'high']
        }
      ]
    },
    {
      domainKey: 'rules.factorDomains.screening',
      factors: [
        {
          key: 'screening.counterparty_vasp',
          labelKey: 'rules.factors.counterpartyVasp',
          type: 'multi',
          options: ['ofacSdn', 'euList', 'unSecurity', 'pep', 'adverseMedia', 'criminal']
        },
        {
          key: 'screening.beneficiary_entity',
          labelKey: 'rules.factors.beneficiary',
          type: 'multi',
          options: ['ofacSdn', 'euList', 'unSecurity', 'pep', 'adverseMedia', 'criminal']
        },
        {
          key: 'screening.originator_address',
          labelKey: 'rules.factors.originatorAddress',
          type: 'multi',
          options: ['mixer', 'darknet', 'ransomware', 'sanctionsAddr', 'theftScam', 'structuring']
        },
        {
          key: 'screening.beneficiary_address',
          labelKey: 'rules.factors.beneficiaryAddress',
          type: 'multi',
          options: ['mixer', 'darknet', 'ransomware', 'sanctionsAddr', 'theftScam', 'structuring']
        }
      ]
    },
    {
      domainKey: 'rules.factorDomains.counterpartyVasp',
      factors: [
        {
          key: 'counterparty_jurisdiction',
          labelKey: 'rules.factors.jurisdiction',
          type: 'multi',
          options: countryOptions.value
        },
        {
          key: 'vasp_status',
          labelKey: 'rules.factors.vaspStatus',
          type: 'multi',
          options: ['registered', 'exempt', 'unlicensed']
        },
        {
          key: 'vasp_regulatory',
          labelKey: 'rules.factors.regulatory',
          type: 'multi',
          options: ['verified', 'unverified']
        },
        {
          key: 'tr_capable',
          labelKey: 'rules.factors.trCapable',
          type: 'multi',
          options: ['yes', 'no']
        },
        {
          key: 'ivms101_valid',
          labelKey: 'rules.factors.ivms101Valid',
          type: 'multi',
          options: ['valid', 'invalid']
        }
      ]
    }
  ]

  const factorCatalog = computed(() =>
    factorCatalogTemplate.map((domain) => ({
      domain: t(domain.domainKey),
      factors: domain.factors.map((factor) => ({
        ...factor,
        label: t(factor.labelKey),
        options: factor.options.map((opt) => {
          if (opt.includes(' — ')) return opt
          const translated = t(`rules.factorOptions.${opt}`)
          return translated.startsWith('rules.factorOptions.') ? opt : translated
        })
      }))
    }))
  )

  const activeFactors = ref<Record<string, string[]>>({})

  function toggleFactor(factorKey: string) {
    if (activeFactors.value[factorKey]) {
      delete activeFactors.value[factorKey]
    } else {
      activeFactors.value[factorKey] = []
    }
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

  function getFactorOptionsDisplay(factorKey: string): string {
    const factor = factorCatalog.value.flatMap((d) => d.factors).find((f) => f.key === factorKey)
    if (!factor) return ''
    return factor.options.join(' | ')
  }

  const form = reactive({
    id: 0,
    name: '',
    description: '',
    direction: 'Outgoing',
    stage: '',
    minAmount: '',
    severity: 'Routine',
    scope: 'Global',
    decision: 'Submit for Review',
    riskFactors: [] as string[]
  })

  function saveRule() {
    // TODO: Implement save rule API call
    console.log('Save rule:', { ...form, activeFactors: activeFactors.value })
    router.back()
  }

  onMounted(() => {
    if (isEdit.value) {
      // TODO: Load rule data from API
      console.log('Edit rule:', ruleId.value)
    }
  })
</script>

<style scoped>
  .factor-row {
    display: flex;
    align-items: center;
    gap: 10px;
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

  .factor-toggle {
    width: 16px;
    height: 16px;
    border: 2px solid var(--el-border-color);
    border-radius: 4px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.15s;
  }

  .factor-row.active .factor-toggle {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  .factor-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    min-width: 140px;
  }

  .factor-options-hint {
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
