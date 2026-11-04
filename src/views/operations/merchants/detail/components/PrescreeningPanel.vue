<!-- 初审问卷（Pre-screening）：按 investorType 展示不同字段，对齐控制台原型两张问卷 -->
<template>
  <div class="flex flex-col gap-6">
    <!-- 基本信息 -->
    <div>
      <div class="screening-grid">
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qFullCompanyName') }}</div>
          <div class="summary-card-value">{{ display(q?.legalName) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qBusinessActivity') }}</div>
          <div class="summary-card-value">{{ activityLabel }}</div>
        </div>
        <div class="summary-card col-span-2">
          <div class="summary-card-title">{{ $t('merchantDetail.qCompanyLegalAddress') }}</div>
          <div class="summary-card-value">{{ display(q?.companyAddress) }}</div>
        </div>
        <div v-if="websiteHref" class="summary-card col-span-2">
          <div class="summary-card-title">{{ $t('merchantDetail.qCompanyWebsite') }}</div>
          <div class="summary-card-value">
            <a
              :href="websiteHref"
              target="_blank"
              rel="noopener noreferrer"
              class="summary-card-link"
            >
              {{ websiteHref }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 合格投资者（Qualified Investor）资格问题：仅该类型展示 -->
    <div v-if="isQualifiedInvestor">
      <div class="screening-grid">
        <div class="summary-card col-span-2">
          <div class="summary-card-title !normal-case whitespace-normal">
            {{ $t('merchantDetail.qNetAssets') }}
          </div>
          <div class="summary-card-value">
            {{ yesNo(q?.netAssetsMet) }}
            <p class="text-xs text-g-500 font-normal mt-1 whitespace-normal leading-relaxed">
              {{ $t('merchantDetail.qNetAssetsNote') }}
            </p>
          </div>
        </div>
        <div class="summary-card col-span-2">
          <div class="summary-card-title !normal-case whitespace-normal">
            {{ $t('merchantDetail.qDirectorsKnowledge') }}
          </div>
          <div class="summary-card-value">{{ yesNo(q?.directorsVaKnowledge) }}</div>
        </div>
      </div>
    </div>

    <!-- 附加问题 -->
    <div>
      <div class="screening-grid">
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qBdReferral') }}</div>
          <div class="summary-card-value">{{ bdReferralText }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qAuthorisedPerson') }}</div>
          <div class="summary-card-value">{{ yesNo(q?.authorisedPerson) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qRiskDisclosure') }}</div>
          <div class="summary-card-value">{{ confirmedText(q?.riskDisclosureAccepted) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.qPrivacyPolicy') }}</div>
          <div class="summary-card-value">{{ confirmedText(q?.privacyPolicyAccepted) }}</div>
        </div>
      </div>
    </div>

    <!-- 受益人 -->
    <div v-if="showBeneficiaries">
      <div class="text-body-lg font-semibold text-g-700 mb-3">
        {{ $t('merchantDetail.beneficiaries') }}
        <span class="text-xs text-g-500 font-normal ml-2">({{ beneficiaries?.length || 0 }})</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="b in beneficiaries || []" :key="b.id" class="summary-card">
          <div class="summary-card-title">
            <span class="text-sm font-semibold text-g-900">{{ b.name || '-' }}</span>
            <span class="text-xs text-g-500 ml-2">{{ beneficiaryTypeLabel(b.type) }}</span>
            <span v-if="b.shareSize != null" class="text-xs text-g-500 ml-2">
              {{ b.shareSize }}%
            </span>
          </div>
          <div class="text-xs text-g-600 space-y-1 mt-2">
            <div v-if="b.country" class="flex items-center gap-2">
              <span class="text-g-500">{{ $t('merchantDetail.beneficiaryCountry') }}:</span>
              <span>{{ countryStore.countryName(b.country) }}</span>
            </div>
            <div v-if="b.email" class="flex items-center gap-2">
              <span class="text-g-500">{{ $t('merchantDetail.beneficiaryEmail') }}:</span>
              <span>{{ b.email }}</span>
            </div>
            <div v-if="b.phone" class="flex items-center gap-2">
              <span class="text-g-500">{{ $t('merchantDetail.beneficiaryPhone') }}:</span>
              <span>{{ b.phone }}</span>
            </div>
          </div>
        </div>
        <div
          v-if="(beneficiaries || []).length === 0"
          class="col-span-2 py-6 text-center text-g-400 text-sm"
        >
          {{ $t('merchantDetail.noBeneficiaries') }}
        </div>
      </div>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { KybBeneficiary, KybQuestionnaire } from '@/api/merchant'
  import { useCountryStore } from '@/store/modules/country'
  import { primaryActivityLabel } from '@/utils/merchantLabels'

  defineOptions({ name: 'MerchantPrescreeningPanel' })

  const props = withDefaults(
    defineProps<{
      questionnaire?: KybQuestionnaire | null
      beneficiaries?: KybBeneficiary[]
      showBeneficiaries?: boolean
    }>(),
    { questionnaire: null, beneficiaries: () => [], showBeneficiaries: false }
  )

  const { t } = useI18n()
  const countryStore = useCountryStore()

  const q = computed(() => props.questionnaire)

  /**
   * 投资人类别决定问卷结构（对齐控制台原型）：
   *   QUALIFIED_INVESTOR    → 额外展示净资产、董事虚拟资产知识两项资格问题
   *   INSTITUTIONAL_INVESTOR → 只展示基本信息与附加问题
   * 缺失时按机构投资者处理（不凭空展示资格问题）。
   */
  const isQualifiedInvestor = computed(
    () => (q.value?.investorType || '').toUpperCase() === 'QUALIFIED_INVESTOR'
  )

  /** Business Activity 与页头 Business Type 共用同一套映射（utils/merchantLabels） */
  const activityLabel = computed(() => primaryActivityLabel(q.value?.primaryActivity, t) || '-')

  /**
   * 官网：统一补全协议后再渲染为可点击链接。
   * 只有 http(s) 链接才可点击 —— 其它协议（如 javascript:）一律不渲染，避免 XSS。
   */
  const websiteHref = computed(() => {
    const raw = (q.value?.website || '').trim()
    if (!raw) return ''
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      const url = new URL(withScheme)
      return url.protocol === 'http:' || url.protocol === 'https:' ? withScheme : ''
    } catch {
      return ''
    }
  })

  function display(value?: string | null): string {
    return value == null || value === '' ? '-' : String(value)
  }

  /** 三态：true → Yes，false → No，null/undefined → '-'（不猜默认值） */
  function yesNo(value?: boolean | null): string {
    if (value === true) return t('common.yes')
    if (value === false) return t('common.no')
    return '-'
  }

  function confirmedText(value?: boolean | null): string {
    if (value === true) return t('merchantDetail.answerConfirmed')
    if (value === false) return t('merchantDetail.answerNotConfirmed')
    return '-'
  }

  const bdReferralText = computed(() => {
    if (q.value?.bdReferral !== true) return t('merchantDetail.answerNone')
    const name = q.value?.bdName || ''
    const email = q.value?.bdEmail || ''
    if (name && email) return `${name} - ${email}`
    return name || email || t('merchantDetail.answerNone')
  })

  function beneficiaryTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ubo: 'UBO',
      director: t('merchantDetail.beneficiaryType_director'),
      shareholder: t('merchantDetail.beneficiaryType_shareholder')
    }
    return map[type] || type || '-'
  }
</script>

<style scoped>
  /* 与详情页的 summary-card 视觉一致：子组件不能继承父组件的 scoped 样式，需自行声明 */
  .screening-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .summary-card {
    padding: 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .summary-card-title {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .summary-card-value {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-card-link {
    display: block;
    overflow: hidden;
    color: var(--theme-text);
    text-decoration: underline;
    text-decoration-color: var(--theme-border);
    text-underline-offset: 2px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-card-link:hover {
    text-decoration-color: currentcolor;
  }
</style>
