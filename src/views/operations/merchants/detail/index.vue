<!-- Merchant Detail (KYB) — 商户详情含 KYB 问卷 -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-5"><el-skeleton :rows="3" animated /></div>
      <ElRow :gutter="20">
        <ElCol v-for="i in 2" :key="i" :sm="24" :md="12">
          <div class="art-card h-64 p-5 mb-5"><el-skeleton :rows="6" animated /></div>
        </ElCol>
      </ElRow>
    </template>

    <template v-else-if="detail">
      <!-- ═══ Header ═══ -->
      <div class="art-card p-5 mb-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold text-g-900">{{ detail.merchantName }}</h1>
              <el-tag :type="merchantStatusTag(detail.merchantStatus)" size="small">
                {{ merchantStatusLabel(detail.merchantStatus) }}
              </el-tag>
            </div>
            <p class="text-sm text-g-500 mt-1">{{ detail.ecode }} · {{ detail.email }}</p>
          </div>
          <ElButton @click="backToList">{{ $t('merchantDetail.backToList') }}</ElButton>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.code') }}</div>
            <div class="text-sm font-medium text-g-900 font-mono">{{ detail.ecode }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.type') }}</div>
            <div class="text-sm text-g-900">{{ merchantTypeLabel(detail.merchantType) }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.industry') }}</div>
            <div class="text-sm text-g-900">{{ detail.industryType || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.kybStatus') }}</div>
            <div>
              <el-tag :type="kybStatusTag(detail.kybStatus)" size="small">
                {{ detail.kybStageLabel || kybStatusLabel(detail.kybStatus) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ KYB Case Info ═══ -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{ $t('merchantDetail.kybCase') }}</span>
        </div>
        <div class="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.kybCaseNo') }}</div>
            <div class="text-sm text-g-900 font-mono">{{ detail.kybCaseNo || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.appliedAt') }}</div>
            <div class="text-sm text-g-900">{{ formatDateTime(detail.appliedAt) || '-' }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.screeningStatus') }}</div>
            <div class="text-sm text-g-900">
              {{ screeningStatusLabel(detail.questionnaire?.screeningStatus) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.reviewedAt') }}</div>
            <div class="text-sm text-g-900">
              {{ formatDateTime(detail.questionnaire?.reviewedAt) || '-' }}
            </div>
          </div>
        </div>
      </div>

      <ElRow :gutter="20">
        <!-- ═══ KYB Questionnaire ═══ -->
        <ElCol :sm="24" :md="12">
          <div class="art-card mb-5">
            <div class="p-4 border-b border-[var(--default-border)]">
              <span class="text-sm font-semibold text-g-900">{{
                $t('merchantDetail.questionnaire')
              }}</span>
            </div>
            <div class="p-4 flex flex-col gap-2.5">
              <div
                v-for="field in questionnaireFields"
                :key="field.key"
                class="flex items-start justify-between gap-4"
              >
                <span class="text-xs text-g-500 flex-shrink-0">{{ field.label }}</span>
                <span class="text-sm text-g-900 text-right font-medium">
                  {{ questionnaireValue(field) }}
                </span>
              </div>
            </div>
          </div>
        </ElCol>

        <!-- ═══ Beneficiaries ═══ -->
        <ElCol :sm="24" :md="12">
          <div class="art-card mb-5">
            <div
              class="p-4 border-b border-[var(--default-border)] flex items-center justify-between"
            >
              <span class="text-sm font-semibold text-g-900">{{
                $t('merchantDetail.beneficiaries')
              }}</span>
              <span class="text-xs text-g-500">
                {{ (detail.beneficiaries || []).length }} {{ $t('merchantDetail.people') }}
              </span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div
                v-for="b in detail.beneficiaries || []"
                :key="b.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-g-50"
              >
                <div
                  class="w-9 h-9 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--el-color-primary)] flex items-center justify-center text-xs font-semibold flex-shrink-0"
                >
                  {{ initialsOf(b.name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-g-900 truncate">{{ b.name }}</span>
                    <el-tag size="small" type="info">{{ beneficiaryTypeLabel(b.type) }}</el-tag>
                    <span v-if="b.shareSize != null" class="text-xs text-g-500">
                      {{ b.shareSize }}%
                    </span>
                  </div>
                  <div class="text-xs text-g-500 mt-0.5 truncate">
                    {{ [b.country, b.dateOfBirth, b.email].filter(Boolean).join(' · ') || '-' }}
                  </div>
                </div>
                <el-tag :type="beneficiaryStatusTag(b.status)" size="small">
                  {{ beneficiaryStatusLabel(b.status) }}
                </el-tag>
              </div>
              <div
                v-if="(detail.beneficiaries || []).length === 0"
                class="py-6 text-center text-g-400 text-sm"
              >
                {{ $t('merchantDetail.noBeneficiaries') }}
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </template>

    <template v-else>
      <div class="art-card p-10 text-center">
        <p class="text-g-500 mb-4">{{ errorMessage || $t('merchantDetail.notFound') }}</p>
        <ElButton type="primary" @click="backToList">
          {{ $t('merchantDetail.backToList') }}
        </ElButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { fetchMerchantKybDetail } from '@/api/merchant'
  import type { AdminMerchantKybDetailView, KybQuestionnaire } from '@/api/merchant'

  defineOptions({ name: 'MerchantDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const loading = ref(false)
  const detail = ref<AdminMerchantKybDetailView | null>(null)
  const errorMessage = ref('')

  async function load() {
    const ecode = String(route.params.merchantId || '')
    if (!ecode) return
    loading.value = true
    try {
      detail.value = await fetchMerchantKybDetail(ecode)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to load merchant'
    } finally {
      loading.value = false
    }
  }

  function backToList() {
    router.push({ name: 'MerchantList' })
  }

  // ─── Questionnaire display fields ───
  const questionnaireFields = computed(
    () =>
      [
        { key: 'legalName', label: t('merchantDetail.qLegalName') },
        { key: 'dbaName', label: t('merchantDetail.qDbaName') },
        { key: 'entityType', label: t('merchantDetail.qEntityType') },
        { key: 'jurisdiction', label: t('merchantDetail.qJurisdiction') },
        { key: 'dateOfIncorporation', label: t('merchantDetail.qDateOfIncorporation') },
        { key: 'registrationNumber', label: t('merchantDetail.qRegistrationNumber') },
        { key: 'taxId', label: t('merchantDetail.qTaxId') },
        { key: 'employeeCount', label: t('merchantDetail.qEmployeeCount') },
        { key: 'primaryActivity', label: t('merchantDetail.qPrimaryActivity') },
        { key: 'website', label: t('merchantDetail.qWebsite') },
        { key: 'businessDescription', label: t('merchantDetail.qBusinessDescription') },
        { key: 'beneficiaryCount', label: t('merchantDetail.qBeneficiaryCount') },
        { key: 'pepStatus', label: t('merchantDetail.qPepStatus') },
        { key: 'annualVolumeUsd', label: t('merchantDetail.qAnnualVolume') },
        { key: 'sourceOfFunds', label: t('merchantDetail.qSourceOfFunds') },
        { key: 'useCase', label: t('merchantDetail.qUseCase') },
        { key: 'publiclyTraded', label: t('merchantDetail.qPubliclyTraded'), boolean: true },
        { key: 'regulated', label: t('merchantDetail.qRegulated'), boolean: true },
        { key: 'regulatoryAction', label: t('merchantDetail.qRegulatoryAction'), boolean: true }
      ] as Array<{ key: string; label: string; boolean?: boolean }>
  )

  function questionnaireValue(field: { key: string; boolean?: boolean }): string {
    const q = detail.value?.questionnaire as KybQuestionnaire | null | undefined
    if (!q) return '-'
    const raw = (q as unknown as Record<string, unknown>)[field.key]
    if (field.boolean) {
      if (raw === true) return t('common.yes')
      if (raw === false) return t('common.no')
      return '-'
    }
    if (raw == null || raw === '') return '-'
    return String(raw)
  }

  // ─── Label helpers ───
  function merchantStatusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      ACTIVE: 'Active',
      FROZEN: 'Frozen',
      CANCELLED: 'Cancelled'
    }
    return map[s] || s || '-'
  }
  function merchantStatusTag(s: string) {
    const map: Record<string, string> = {
      ACTIVE: 'success',
      PENDING: 'warning',
      FROZEN: 'primary',
      CANCELLED: 'danger'
    }
    return (map[s] || 'info') as any
  }
  function merchantTypeLabel(s: string): string {
    const map: Record<string, string> = {
      NON_FINANCIAL_CORPORATE: 'Non-Financial Corporate',
      REGULATED_VASP: 'Regulated VASP',
      INTERNAL_SYSTEM: 'Internal System'
    }
    return map[s] || s || '-'
  }
  function kybStatusLabel(s: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_SCREENING: 'Pending Screening',
      SUBMITTED: 'Submitted',
      NEED_SUPPLEMENT: 'Need Supplement',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled'
    }
    return map[s] || s || '-'
  }
  function kybStatusTag(s: string) {
    const map: Record<string, string> = {
      APPROVED: 'success',
      REJECTED: 'danger',
      SUBMITTED: 'primary',
      NEED_SUPPLEMENT: 'warning',
      DRAFT: 'info',
      CANCELLED: 'info',
      PENDING_SCREENING: 'warning'
    }
    return (map[s] || 'info') as any
  }
  function screeningStatusLabel(s?: string | null): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected'
    }
    return (s && map[s]) || s || '-'
  }
  function beneficiaryTypeLabel(s: string): string {
    const map: Record<string, string> = {
      ubo: 'UBO',
      director: 'Director',
      shareholder: 'Shareholder'
    }
    return map[s] || s || '-'
  }
  function beneficiaryStatusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      LINKED: 'Linked',
      KYC_PASSED: 'KYC Passed'
    }
    return map[s] || s || '-'
  }
  function beneficiaryStatusTag(s: string) {
    const map: Record<string, string> = {
      KYC_PASSED: 'success',
      LINKED: 'primary',
      PENDING: 'warning'
    }
    return (map[s] || 'info') as any
  }
  function initialsOf(name: string): string {
    return (name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  function formatDateTime(v?: string | null): string {
    if (!v) return ''
    return v.replace('T', ' ').slice(0, 19)
  }

  onMounted(() => {
    void load()
  })
</script>
