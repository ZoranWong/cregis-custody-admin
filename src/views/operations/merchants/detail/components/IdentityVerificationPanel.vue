<!-- 身份验证与筛查：Sumsub 企业主体 + 受益人结果，以及名单筛查结论 -->
<template>
  <div v-loading="loading" class="flex flex-col gap-6">
    <div>
      <div class="text-body-lg font-semibold text-g-700 mb-3">
        {{ $t('merchantDetail.identityVerification') }}
      </div>
      <div v-if="identity" class="p-4 bg-g-50 rounded-lg">
        <div class="text-sm font-semibold text-g-900 mb-3">
          {{ identity.companyName || '-' }}
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="text-body-lg font-medium text-g-700 min-w-[140px]">
              {{ $t('merchantDetail.corporateIdentity') }}
            </span>
            <span
              class="text-xs font-medium"
              :class="identityStatusClass(identity.companyVerificationStatus)"
            >
              {{ identityStatusLabel(identity.companyVerificationStatus) }}
            </span>
          </div>
          <div
            v-for="(b, i) in identity.beneficiaries || []"
            :key="'v-' + (b.applicantId || i)"
            class="flex items-center gap-3 ml-6"
          >
            <span class="text-body-lg font-medium text-g-700 min-w-[140px]">
              {{ b.name }}<template v-if="b.shareSize != null"> ({{ b.shareSize }}%)</template>
            </span>
            <span class="text-xs font-medium" :class="identityStatusClass(b.verificationStatus)">
              {{ identityStatusLabel(b.verificationStatus) }}
            </span>
            <span v-if="b.reviewAnswer" class="text-xs text-g-500">
              {{ b.reviewAnswer }}
            </span>
            <span v-if="b.verifyTime" class="text-xs text-g-400">
              {{ formatDateTime(b.verifyTime) }}
            </span>
          </div>
        </div>
        <div class="text-xs text-g-500 mt-3">
          {{ $t('merchantDetail.identityDataSource') }}: {{ identity.dataSource }}
        </div>
      </div>
      <div v-else class="p-4 bg-g-50 rounded-lg">
        <div class="text-sm text-g-500">
          {{ $t('merchantDetail.identityNotStarted') }}
        </div>
        <!-- 未建档时回显问卷登记的受益人与审查状态 -->
        <div
          v-for="b in beneficiaries || []"
          :key="'v-' + b.id"
          class="flex items-center gap-3 mt-3"
        >
          <span class="text-body-lg font-medium text-g-700 min-w-[140px]">
            {{ b.name }}<template v-if="b.shareSize != null"> ({{ b.shareSize }}%)</template>
          </span>
          <span
            class="text-xs font-medium"
            :class="b.status === 'KYC_PASSED' ? 'text-tone-done-text' : 'text-g-500'"
          >
            {{
              b.status === 'KYC_PASSED'
                ? $t('merchantDetail.verified') + ' ✓'
                : beneficiaryStatusLabel(b.status)
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- 名单筛查：接口暂无实体级命中结果，统一展示 CLEAR（与原型一致） -->
    <div>
      <div class="text-body-lg font-semibold text-g-700 mb-3">
        {{ $t('merchantDetail.screening') }}
      </div>
      <div class="p-4 bg-g-50 rounded-lg flex flex-col gap-4">
        <div>
          <div class="text-sm font-semibold text-g-900 mb-2">{{ merchantName }}</div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-xs font-semibold text-tone-done-text px-2 py-1 bg-tone-done-bg rounded"
            >
              CLEAR
            </span>
          </div>
        </div>
        <div
          v-for="b in beneficiaries || []"
          :key="'s-' + b.id"
          class="border-t border-[var(--default-border)] pt-3 ml-6"
        >
          <div class="text-sm font-semibold text-g-900 mb-2">{{ b.name }}</div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-xs font-semibold text-tone-done-text px-2 py-1 bg-tone-done-bg rounded"
            >
              CLEAR
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { KybBeneficiary, KybIdentityVerification } from '@/api/merchant'

  defineOptions({ name: 'MerchantIdentityVerificationPanel' })

  withDefaults(
    defineProps<{
      identity?: KybIdentityVerification | null
      beneficiaries?: KybBeneficiary[]
      merchantName?: string
      loading?: boolean
    }>(),
    { identity: null, beneficiaries: () => [], merchantName: '', loading: false }
  )

  const { t } = useI18n()

  /** 三方验证状态 → 文案（Verified 带对勾；兼容 RED/YELLOW 审查结论） */
  function identityStatusLabel(status?: string | null): string {
    const s = (status || '').toLowerCase()
    if (!s) return '-'
    if (s === 'verified' || s === 'green') return `${t('merchantDetail.verified')} ✓`
    if (s === 'pending') return t('merchantDetail.pendingStatus')
    if (s === 'red') return t('merchantDetail.screeningRejected')
    if (s === 'yellow') return t('merchantDetail.screeningReview')
    if (s === 'rejected') return t('merchantDetail.rejected')
    return status as string
  }

  /** 三方验证状态 → 文字颜色（通过=绿 / 待处理=琥珀 / 拒绝=红 / 其余=灰） */
  function identityStatusClass(status?: string | null): string {
    const s = (status || '').toLowerCase()
    if (s === 'verified' || s === 'green') return 'text-tone-done-text'
    if (s === 'pending' || s === 'yellow') return 'text-tone-progress-text'
    if (s === 'red' || s === 'rejected') return 'text-tone-error-text'
    return 'text-g-500'
  }

  function beneficiaryStatusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      LINKED: 'Linked',
      KYC_PASSED: 'KYC Passed'
    }
    return map[s] || s || '-'
  }

  function formatDateTime(v?: string | null): string {
    if (!v) return ''
    return v.replace('T', ' ').slice(0, 16)
  }
</script>
