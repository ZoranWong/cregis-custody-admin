<!--
  商户详情页头：名称 + 状态徽章 + meta 行。
  拒绝原因不在页头重复展示：统一由下方 OnboardingView 的步骤提示区域按阶段呈现。
-->
<template>
  <div>
    <!-- 页头：名称 + 统一商户状态徽章 + meta 行 -->
    <div class="art-card p-5 mb-4">
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-g-900">{{ detail.merchantName }}</h1>
            <ArtStatusTag :status="statusTone" :text="statusLabel" />
          </div>
          <div class="flex items-center gap-4 text-sm text-g-500 mt-1.5">
            <span v-if="headerJurisdiction">
              {{ $t('merchantDetail.jurisdiction') }}:
              <span class="font-medium text-g-700">{{ headerJurisdiction }}</span>
            </span>
            <span v-if="investorTypeLabel">
              {{ $t('merchantDetail.investorType') }}:
              <span class="font-medium text-g-700">{{ investorTypeLabel }}</span>
            </span>
            <span v-if="sourceLabel">
              {{ $t('merchantDetail.source') }}:
              <span class="font-medium text-g-700">{{ sourceLabel }}</span>
            </span>
            <span v-if="detail.appliedAt">
              {{ isOnboarded ? $t('merchantDetail.onboardedAt') : $t('merchantDetail.appliedAt') }}:
              <span class="font-medium text-g-700">{{ formatDateTime(detail.appliedAt) }}</span>
            </span>
          </div>
        </div>
        <ArtBackButton :to="'ComplianceMerchants'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { AdminMerchantKybDetailView } from '@/api/merchant'
  import { useCountryStore } from '@/store/modules/country'
  import { KybStatus } from '@/enums/merchantEnum'
  import {
    MERCHANT_STATUS_LABEL_KEYS,
    MerchantStatus,
    merchantStatusOf
  } from '@/utils/merchantStatus'

  defineOptions({ name: 'MerchantDetailHeader' })

  const props = defineProps<{ detail: AdminMerchantKybDetailView }>()

  const { t } = useI18n()
  const countryStore = useCountryStore()

  const kybState = computed(() => props.detail.kybStatus?.toUpperCase() || '')

  /** 商户对外状态：FROZEN > 最新 KYB Case > 商户自身状态兜底 */
  const merchantStatus = computed<MerchantStatus | null>(() =>
    merchantStatusOf({
      merchantStatus: props.detail.merchantStatus,
      latestKybStatus: props.detail.kybStatus,
      apiStatus: props.detail.enterpriseStatus,
      ecode: props.detail.ecode
    })
  )

  /**
   * 页头状态徽章配色。
   * onboarding 未走完（含拒绝、冻结、取消）一律 warning 提示待处理；
   * 只有完成入驻（ACTIVE）才是 success。拒绝原因由下方步骤提示区域按阶段呈现。
   */
  const statusTone = computed<'success' | 'warning' | null>(() => {
    if (!merchantStatus.value) return null
    return merchantStatus.value === MerchantStatus.Active ? 'success' : 'warning'
  })

  const statusLabel = computed(() => {
    if (merchantStatus.value) return t(MERCHANT_STATUS_LABEL_KEYS[merchantStatus.value])
    return props.detail.merchantStatus || '-'
  })

  /** 「已入驻」= KYB 通过且商户未被冻结 */
  const isOnboarded = computed(
    () => kybState.value === KybStatus.Approved && merchantStatus.value === MerchantStatus.Active
  )

  /** 投资人类别：详情顶层 investorType 优先，缺失回退问卷 */
  const investorTypeLabel = computed(() => {
    const type = (
      props.detail.investorType ||
      props.detail.questionnaire?.investorType ||
      ''
    ).toUpperCase()
    if (type === 'QUALIFIED_INVESTOR') return t('merchantDetail.investorTypeQualified')
    if (type === 'INSTITUTIONAL_INVESTOR') return t('merchantDetail.investorTypeInstitutional')
    return ''
  })

  /** 企业来源：PLATFORM / THIRD_PARTY */
  const sourceLabel = computed(() => {
    const source = (props.detail.source || '').toUpperCase()
    if (source === 'PLATFORM') return t('merchantDetail.sourcePlatform')
    if (source === 'THIRD_PARTY') return t('merchantDetail.sourceThirdParty')
    return ''
  })

  /** 注册地：问卷 jurisdiction 优先，缺失回退 countryCode */
  const headerJurisdiction = computed(() => {
    const q = props.detail.questionnaire
    const raw = q?.jurisdiction || q?.countryCode
    return raw ? countryStore.countryName(raw) : ''
  })

  function formatDateTime(v?: string | null): string {
    if (!v) return ''
    return v.replace('T', ' ').slice(0, 19)
  }
</script>
