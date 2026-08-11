<!-- Cregis Merchant Detail -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-5"><el-skeleton :rows="3" animated /></div>
      <ElRow :gutter="20"><ElCol v-for="i in 4" :key="i" :sm="12" :md="6"><div class="art-card h-40 p-5 mb-5"><el-skeleton :rows="3" animated /></div></ElCol></ElRow>
    </template>
    <template v-else-if="detail">
      <!-- Header -->
      <div class="art-card p-5 mb-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h1 class="text-xl font-semibold text-g-900">{{ detail.merchantName || '-' }}</h1>
            <p class="text-sm text-g-500 mt-1">{{ detail.pageSummary || '' }}</p>
          </div>
          <div class="flex gap-2">
            <ElButton @click="copyMerchantCode">{{ $t('merchantDetail.copyCode') }}</ElButton>
            <ElButton type="primary" @click="backToList">{{ $t('merchantDetail.backToList') }}</ElButton>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.code') }}</div>
            <div class="text-sm font-medium text-g-900 font-mono">{{ detail.code || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.status') }}</div>
            <el-tag :type="statusTagType(detail.statusLabel || '')" size="small">{{ detail.statusLabel || '-' }}</el-tag>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.type') }}</div>
            <div class="text-sm text-g-900">{{ detail.merchantTypeLabel || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.industry') }}</div>
            <div class="text-sm text-g-900">{{ detail.industryType || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- Detail Grid -->
      <ElRow :gutter="20">
        <!-- Profile -->
        <ElCol :sm="12" :md="6">
          <div class="art-card p-5 mb-5">
            <h3 class="text-base font-semibold text-g-900 mb-3">{{ $t('merchantDetail.profile') }}</h3>
            <div class="grid gap-2">
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.contact') }}</span><div class="text-sm text-g-900">{{ detail.email || '-' }}</div></div>
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.creator') }}</span><div class="text-sm text-g-900">{{ detail.creatorId || '-' }}</div></div>
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.created') }}</span><div class="text-sm text-g-900">{{ formatTime(detail.createTime) }}</div></div>
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.updated') }}</span><div class="text-sm text-g-900">{{ formatTime(detail.updateTime) }}</div></div>
            </div>
          </div>
        </ElCol>
        <!-- Onboarding -->
        <ElCol :sm="12" :md="6">
          <div class="art-card p-5 mb-5">
            <h3 class="text-base font-semibold text-g-900 mb-3">{{ $t('merchantDetail.onboarding') }}</h3>
            <div class="grid gap-2">
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.caseNo') }}</span><div class="text-sm text-g-900 font-mono">{{ detail.onboardingCaseNo || '-' }}</div></div>
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.onboardingStatus') }}</span><el-tag :type="statusTagType(detail.onboardingStatusLabel || '')" size="small" class="mt-1">{{ detail.onboardingStatusLabel || '-' }}</el-tag></div>
              <div><span class="text-xs text-g-500">{{ $t('merchantDetail.onboardingSummary') }}</span><div class="text-sm text-g-900">{{ detail.onboardingSummary || '-' }}</div></div>
            </div>
            <ElButton v-if="detail.onboardingTarget" size="small" class="mt-3" @click="openOnboarding">{{ $t('merchantDetail.openOnboarding') }}</ElButton>
          </div>
        </ElCol>
        <!-- Overview -->
        <ElCol :sm="12" :md="6">
          <div class="art-card p-5 mb-5">
            <h3 class="text-base font-semibold text-g-900 mb-3">{{ $t('merchantDetail.overview') }}</h3>
            <p class="text-sm text-g-700 leading-relaxed">{{ detail.overviewSummary || '-' }}</p>
          </div>
        </ElCol>
        <!-- Profile Summary -->
        <ElCol :sm="12" :md="6">
          <div class="art-card p-5 mb-5">
            <h3 class="text-base font-semibold text-g-900 mb-3">{{ $t('merchantDetail.profileSummary') }}</h3>
            <p class="text-sm text-g-700 leading-relaxed">{{ detail.profileSummary || '-' }}</p>
          </div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <div class="art-card p-10 text-center text-g-500">{{ $t('merchantDetail.notFound') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useMerchantDetail } from '@/features/merchant/useMerchantDetail'
  import { formatTime } from '@/utils/format'

  defineOptions({ name: 'MerchantDetail' })
  const { loading, detail, backToList, openOnboarding, copyMerchantCode } = useMerchantDetail()

  function statusTagType(s: string) {
    if (!s) return 'info'
    if (/active/i.test(s)) return 'success'
    if (/frozen|suspend|inactive/i.test(s)) return 'danger'
    if (/pending|review|collecting/i.test(s)) return 'warning'
    return 'info'
  }
</script>