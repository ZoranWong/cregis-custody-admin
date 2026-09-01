<!-- Merchant Detail (KYB) — 商户详情（双状态视图） -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-5"><el-skeleton :rows="3" animated /></div>
      <div class="art-card h-64 p-5 mb-5"><el-skeleton :rows="6" animated /></div>
    </template>

    <template v-else-if="detail">
      <!-- ═══ Breadcrumb + Header ═══ -->
      <div class="art-card p-5 mb-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold text-g-900">{{ detail.merchantName }}</h1>
              <span class="status-badge" :class="headerStatusClass">
                {{ headerStatusLabel }}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-g-500 mt-1.5">
              <span
                >{{ $t('merchantDetail.code') }}:
                <strong class="text-g-700 font-mono">{{ detail.ecode }}</strong></span
              >
              <span>{{ detail.email }}</span>
              <span v-if="detail.appliedAt">
                {{
                  isOnboarded ? $t('merchantDetail.onboardedAt') : $t('merchantDetail.appliedAt')
                }}:
                {{ formatDateTime(detail.appliedAt) }}
              </span>
            </div>
          </div>
          <ElButton @click="backToList">{{ $t('merchantDetail.backToList') }}</ElButton>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <div class="text-sm text-g-900">{{ kybStatusLabel(detail.kybStatus) }}</div>
          </div>
          <div>
            <div class="text-xs text-g-500 mb-0.5">{{ $t('merchantDetail.kybCaseNo') }}</div>
            <div class="text-sm text-g-900 font-mono">{{ detail.kybCaseNo || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- 视图 A: Onboarding (merchant.status = PENDING) -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-if="!isOnboarded">
        <!-- Onboarding Progress Stepper -->
        <div class="onboarding-progress mb-4">
          <h2 class="progress-title">{{ $t('merchantDetail.onboardingProgress') }}</h2>
          <div class="progress-stepper">
            <div class="progress-step completed">
              <div class="step-circle done">✓</div>
              <div class="step-label">{{ $t('merchantDetail.stepApplication') }}</div>
              <div class="step-meta">{{ formatDateTime(detail.appliedAt) || '-' }}</div>
            </div>
            <div class="progress-step" :class="screeningStepClass">
              <div class="step-circle" :class="screeningStepClass === 'active' ? 'active' : ''">
                {{ screeningStepClass === 'completed' ? '✓' : '2' }}
              </div>
              <div class="step-label">{{ $t('merchantDetail.stepScreening') }}</div>
              <div class="step-meta">{{ screeningStepMeta }}</div>
            </div>
            <div class="progress-step" :class="verificationStepClass">
              <div class="step-circle" :class="verificationStepClass === 'active' ? 'active' : ''">
                {{ verificationStepClass === 'completed' ? '✓' : '3' }}
              </div>
              <div class="step-label">{{ $t('merchantDetail.stepVerification') }}</div>
              <div class="step-meta">{{ verificationStepMeta }}</div>
            </div>
          </div>
        </div>

        <!-- Current Step: Qualification Screening (3-page questionnaire) -->
        <div class="art-card overflow-hidden">
          <div
            class="p-4 border-b border-[var(--default-border)] flex items-center justify-between"
          >
            <h2 class="text-sm font-semibold text-g-900">
              {{ $t('merchantDetail.qualificationScreening') }}
            </h2>
            <span class="status-badge in-review">{{ currentStepBadge }}</span>
          </div>
          <div class="p-5">
            <!-- Page 1: Business Entity + Structure -->
            <div v-show="screeningPage === 1" class="flex flex-col gap-6">
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.bizEntityInfo') }}
                </div>
                <div class="screening-grid">
                  <div v-for="f in entityFields" :key="f.key" class="summary-card">
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value">{{ questionnaireValue(f.key) }}</div>
                  </div>
                </div>
              </div>
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.bizStructure') }}
                </div>
                <div class="screening-grid">
                  <div v-for="f in structureFields" :key="f.key" class="summary-card">
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value">{{ questionnaireValue(f.key, f.boolean) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Page 2: Business Activities + Ownership -->
            <div v-show="screeningPage === 2" class="flex flex-col gap-6">
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.bizActivities') }}
                </div>
                <div class="screening-grid">
                  <div
                    v-for="f in activityFields"
                    :key="f.key"
                    class="summary-card"
                    :class="{ 'col-span-2': f.wide }"
                  >
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value" :class="{ 'whitespace-normal': f.wide }">
                      {{ questionnaireValue(f.key) }}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.ownershipStructure') }}
                </div>
                <div class="screening-grid">
                  <div v-for="f in ownershipFields" :key="f.key" class="summary-card">
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value">{{ questionnaireValue(f.key) }}</div>
                  </div>
                </div>
              </div>
              <!-- Beneficiaries -->
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.beneficiaries') }}
                  <span class="text-xs text-g-500 font-normal ml-2">
                    ({{ (detail.beneficiaries || []).length }})
                  </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="b in detail.beneficiaries || []" :key="b.id" class="summary-card">
                    <div class="summary-card-title">
                      <span class="text-sm font-semibold text-g-900">{{ b.name || '-' }}</span>
                      <el-tag size="small" type="info" class="ml-2">{{
                        beneficiaryTypeLabel(b.type)
                      }}</el-tag>
                      <span v-if="b.shareSize != null" class="text-xs text-g-500 ml-2">
                        {{ b.shareSize }}%
                      </span>
                    </div>
                    <div class="text-xs text-g-600 space-y-1 mt-2">
                      <div v-if="b.country" class="flex items-center gap-2">
                        <span class="text-g-500"
                          >{{ $t('merchantDetail.beneficiaryCountry') }}:</span
                        >
                        <span>{{ b.country }}</span>
                      </div>
                      <div v-if="b.dateOfBirth" class="flex items-center gap-2">
                        <span class="text-g-500">{{ $t('merchantDetail.beneficiaryDob') }}:</span>
                        <span>{{ b.dateOfBirth }}</span>
                      </div>
                      <div v-if="b.email" class="flex items-center gap-2">
                        <span class="text-g-500">{{ $t('merchantDetail.beneficiaryEmail') }}:</span>
                        <span>{{ b.email }}</span>
                      </div>
                      <div v-if="b.phone" class="flex items-center gap-2">
                        <span class="text-g-500">{{ $t('merchantDetail.beneficiaryPhone') }}:</span>
                        <span>{{ b.phone }}</span>
                      </div>
                      <div v-if="b.applicantId" class="flex items-center gap-2">
                        <span class="text-g-500"
                          >{{ $t('merchantDetail.beneficiaryApplicant') }}:</span
                        >
                        <span class="font-mono">{{ b.applicantId }}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="(detail.beneficiaries || []).length === 0"
                    class="col-span-2 py-6 text-center text-g-400 text-sm"
                  >
                    {{ $t('merchantDetail.noBeneficiaries') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Page 3: Financial + Regulatory + Decision -->
            <div v-show="screeningPage === 3" class="flex flex-col gap-6">
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.financialInfo') }}
                </div>
                <div class="screening-grid">
                  <div v-for="f in financialFields" :key="f.key" class="summary-card">
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value">{{ questionnaireValue(f.key) }}</div>
                  </div>
                </div>
              </div>
              <div>
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t('merchantDetail.regulatoryCompliance') }}
                </div>
                <div class="screening-grid">
                  <div v-for="f in regulatoryFields" :key="f.key" class="summary-card">
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value">{{ questionnaireValue(f.key, f.boolean) }}</div>
                  </div>
                </div>
              </div>
              <!-- Approve / Reject -->
              <div
                v-if="canDecide"
                class="flex justify-center gap-3 pt-4 border-t border-[var(--default-border)]"
              >
                <el-button type="success" size="large" :loading="deciding" @click="handleApprove">
                  {{ $t('merchantDetail.approve') }}
                </el-button>
                <el-button size="large" :loading="deciding" @click="showRejectDialog = true">
                  {{ $t('merchantDetail.reject') }}
                </el-button>
              </div>
            </div>

            <!-- Pagination -->
            <div
              class="flex flex-col items-center gap-3 mt-5 pt-4 border-t border-[var(--default-border)]"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs text-g-500">
                  {{ $t('merchantDetail.pageIndicator', { page: screeningPage, total: 3 }) }}
                </span>
                <el-button v-if="screeningPage > 1" size="small" @click="screeningPage--">{{
                  $t('merchantDetail.back')
                }}</el-button>
                <el-button v-if="screeningPage < 3" size="small" @click="screeningPage++">{{
                  $t('merchantDetail.next')
                }}</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══════════════════════════════════════════ -->
      <!-- 视图 B: Onboarded (merchant.status = ACTIVE) -->
      <!-- ═══════════════════════════════════════════ -->
      <template v-else>
        <el-tabs v-model="activeTab">
          <!-- Tab 1: Compliance Status -->
          <el-tab-pane :label="$t('merchantDetail.tabCompliance')" name="compliance">
            <div class="cdd-grid">
              <div class="art-card p-4">
                <div
                  class="text-xs font-semibold text-g-700 mb-3 pb-2 border-b border-[var(--default-border)]"
                >
                  {{ $t('merchantDetail.cdd') }}
                </div>
                <div class="flex flex-col gap-2.5">
                  <div class="cdd-item">
                    <span class="text-success font-bold">✓</span>
                    <span
                      >{{ $t('merchantDetail.cddOnboardingStatus') }}:
                      {{ merchantStatusLabel(detail.merchantStatus) }}</span
                    >
                  </div>
                  <div class="cdd-item">
                    <span class="text-success font-bold">✓</span>
                    <span
                      >{{ $t('merchantDetail.cddCustomerType') }}:
                      {{ merchantTypeLabel(detail.merchantType) }}</span
                    >
                  </div>
                  <div class="cdd-item">
                    <span class="text-success font-bold">✓</span>
                    <span
                      >{{ $t('merchantDetail.cddKybStatus') }}:
                      {{ kybStatusLabel(detail.kybStatus) }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="art-card p-4">
                <div
                  class="text-xs font-semibold text-g-700 mb-3 pb-2 border-b border-[var(--default-border)]"
                >
                  {{ $t('merchantDetail.bizInfo') }}
                </div>
                <div class="flex flex-col gap-2.5">
                  <div v-for="f in bizInfoFields" :key="f.key" class="cdd-item">
                    <span class="text-success font-bold">✓</span>
                    <span>{{ f.label }}: {{ questionnaireValue(f.key) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 2: Business Information -->
          <el-tab-pane :label="$t('merchantDetail.tabBusiness')" name="business">
            <div class="screening-grid">
              <div v-for="f in allQuestionnaireFields" :key="f.key" class="summary-card">
                <div class="summary-card-title">{{ f.label }}</div>
                <div class="summary-card-value" :class="{ 'whitespace-normal': f.wide }">
                  {{ questionnaireValue(f.key, f.boolean) }}
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 3: Identity Verification & Screening -->
          <el-tab-pane :label="$t('merchantDetail.tabIdentity')" name="identity">
            <!-- Beneficiaries with screening -->
            <div class="art-card p-4 mb-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-g-700">{{
                  $t('merchantDetail.beneficiaries')
                }}</span>
                <span class="text-xs text-g-500"
                  >{{ (detail.beneficiaries || []).length }} {{ $t('merchantDetail.people') }}</span
                >
              </div>
              <div class="flex flex-col gap-3">
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
                      <span class="text-sm font-semibold text-g-900">{{ b.name }}</span>
                      <el-tag size="small" type="info">{{ beneficiaryTypeLabel(b.type) }}</el-tag>
                      <span v-if="b.shareSize != null" class="text-xs text-g-500"
                        >{{ b.shareSize }}%</span
                      >
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
          </el-tab-pane>

          <!-- Tab 4: Team Members -->
          <el-tab-pane :label="$t('merchantDetail.tabTeam')" name="team">
            <div class="team-grid">
              <div v-for="b in detail.beneficiaries || []" :key="b.id" class="team-card">
                <div class="text-sm font-semibold text-g-900 mb-1.5">{{ b.name }}</div>
                <div class="text-xs text-g-600 mb-0.5">
                  <span class="text-g-500">Email:</span> {{ b.email || '-' }}
                </div>
                <div class="text-xs text-g-600">
                  <span class="text-g-500">Phone:</span> {{ b.phone || '-' }}
                </div>
              </div>
              <div
                v-if="(detail.beneficiaries || []).length === 0"
                class="py-6 text-center text-g-400 text-sm col-span-full"
              >
                {{ $t('merchantDetail.noTeamMembers') }}
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </template>

    <template v-else>
      <div class="art-card p-10 text-center">
        <p class="text-g-500 mb-4">{{ errorMessage }}</p>
        <ElButton type="primary" @click="backToList">{{
          $t('merchantDetail.backToList')
        }}</ElButton>
      </div>
    </template>

    <!-- ═══ Reject Reason Dialog ═══ -->
    <el-dialog v-model="showRejectDialog" :title="$t('merchantDetail.rejectReason')" width="440px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        :placeholder="$t('merchantDetail.rejectReasonPlaceholder')"
      />
      <template #footer>
        <el-button @click="showRejectDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="deciding" @click="handleReject">
          {{ $t('merchantDetail.reject') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { fetchMerchantKybDetail, approveKybScreening, rejectKybScreening } from '@/api/merchant'
  import type { AdminMerchantKybDetailView, KybQuestionnaire } from '@/api/merchant'

  defineOptions({ name: 'MerchantDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const loading = ref(false)
  const detail = ref<AdminMerchantKybDetailView | null>(null)
  const errorMessage = ref('')
  const screeningPage = ref(1)
  const activeTab = ref('compliance')
  const showRejectDialog = ref(false)
  const rejectReason = ref('')
  const deciding = ref(false)

  // ─── State-derived view ───
  const isOnboarded = computed(() => detail.value?.merchantStatus?.toUpperCase() === 'ACTIVE')
  const canDecide = computed(() => detail.value?.kybStatus?.toUpperCase() === 'PENDING_SCREENING')

  const headerStatusClass = computed(() => {
    const s = detail.value?.merchantStatus?.toUpperCase()
    if (s === 'ACTIVE') return 'onboarded'
    if (s === 'FROZEN') return 'rejected'
    return 'in-review'
  })
  const headerStatusLabel = computed(() =>
    isOnboarded.value
      ? t('merchantDetail.statusOnboarded')
      : t('merchantDetail.qualificationScreening')
  )

  // Stepper states (screening = step 2, verification = step 3)
  const screeningStepClass = computed(() => {
    const s = detail.value?.kybStatus?.toUpperCase()
    if (s === 'PENDING_SCREENING') return 'active'
    if (['DRAFT', 'SUBMITTED', 'NEED_SUPPLEMENT', 'APPROVED', 'REJECTED'].includes(s || ''))
      return 'completed'
    return ''
  })
  const screeningStepMeta = computed(() => {
    const cls = screeningStepClass.value
    if (cls === 'active') return t('merchantDetail.inProgress')
    if (cls === 'completed') {
      const s = detail.value?.kybStatus?.toUpperCase()
      if (s === 'REJECTED') return t('merchantDetail.rejected')
      return t('merchantDetail.passed')
    }
    return t('merchantDetail.pendingMeta')
  })
  const verificationStepClass = computed(() => {
    const s = detail.value?.kybStatus?.toUpperCase()
    if (s === 'APPROVED') return 'completed'
    if (['SUBMITTED', 'NEED_SUPPLEMENT'].includes(s || '')) return 'active'
    return ''
  })
  const verificationStepMeta = computed(() => {
    const cls = verificationStepClass.value
    if (cls === 'active') return t('merchantDetail.inProgress')
    if (cls === 'completed') return t('merchantDetail.passed')
    return t('merchantDetail.pendingMeta')
  })
  const currentStepBadge = computed(() =>
    canDecide.value
      ? t('merchantDetail.awaitingDecision')
      : kybStatusLabel(detail.value?.kybStatus || '')
  )

  // ─── Load ───
  async function load() {
    const ecode = String(route.params.merchantId || '')
    if (!ecode) return
    loading.value = true
    try {
      detail.value = await fetchMerchantKybDetail(ecode)
    } catch {
      errorMessage.value = t('merchantDetail.notFound')
    } finally {
      loading.value = false
    }
  }

  function backToList() {
    router.push({ name: 'MerchantList' })
  }

  async function handleApprove() {
    if (!detail.value) return
    deciding.value = true
    try {
      await approveKybScreening(detail.value.ecode)
      ElMessage.success(t('merchantDetail.approveSuccess'))
      await load()
    } catch {
      ElMessage.error(t('merchantDetail.approveFailed'))
    } finally {
      deciding.value = false
    }
  }

  async function handleReject() {
    if (!detail.value) return
    deciding.value = true
    try {
      await rejectKybScreening(detail.value.ecode, rejectReason.value || undefined)
      showRejectDialog.value = false
      ElMessage.success(t('merchantDetail.rejectSuccess'))
      await load()
    } catch {
      ElMessage.error(t('merchantDetail.rejectFailed'))
    } finally {
      deciding.value = false
    }
  }

  // ─── Questionnaire field groups ───
  interface Field {
    key: string
    label: string
    boolean?: boolean
    wide?: boolean
  }

  const entityFields = computed<Field[]>(() => [
    { key: 'legalName', label: t('merchantDetail.qLegalName') },
    { key: 'dbaName', label: t('merchantDetail.qDbaName') },
    { key: 'jurisdiction', label: t('merchantDetail.qJurisdiction') },
    { key: 'dateOfIncorporation', label: t('merchantDetail.qDateOfIncorporation') },
    { key: 'registrationNumber', label: t('merchantDetail.qRegistrationNumber') },
    { key: 'taxId', label: t('merchantDetail.qTaxId') }
  ])
  const structureFields = computed<Field[]>(() => [
    { key: 'entityType', label: t('merchantDetail.qEntityType') },
    { key: 'publiclyTraded', label: t('merchantDetail.qPubliclyTraded'), boolean: true },
    { key: 'employeeCount', label: t('merchantDetail.qEmployeeCount') }
  ])
  const activityFields = computed<Field[]>(() => [
    { key: 'primaryActivity', label: t('merchantDetail.qPrimaryActivity') },
    { key: 'website', label: t('merchantDetail.qWebsite') },
    { key: 'businessDescription', label: t('merchantDetail.qBusinessDescription'), wide: true }
  ])
  const ownershipFields = computed<Field[]>(() => [
    { key: 'beneficiaryCount', label: t('merchantDetail.qBeneficiaryCount') },
    { key: 'pepStatus', label: t('merchantDetail.qPepStatus') }
  ])
  const financialFields = computed<Field[]>(() => [
    { key: 'annualVolumeUsd', label: t('merchantDetail.qAnnualVolume') },
    { key: 'sourceOfFunds', label: t('merchantDetail.qSourceOfFunds') },
    { key: 'useCase', label: t('merchantDetail.qUseCase') }
  ])
  const regulatoryFields = computed<Field[]>(() => [
    { key: 'regulated', label: t('merchantDetail.qRegulated'), boolean: true },
    { key: 'regulatoryAction', label: t('merchantDetail.qRegulatoryAction'), boolean: true }
  ])
  const bizInfoFields = computed<Field[]>(() => [
    { key: 'registrationNumber', label: t('merchantDetail.qRegistrationNumber') },
    { key: 'dateOfIncorporation', label: t('merchantDetail.qDateOfIncorporation') },
    { key: 'taxId', label: t('merchantDetail.qTaxId') },
    { key: 'employeeCount', label: t('merchantDetail.qEmployeeCount') },
    { key: 'beneficiaryCount', label: t('merchantDetail.qBeneficiaryCount') }
  ])
  const allQuestionnaireFields = computed<Field[]>(() => [
    ...entityFields.value,
    ...structureFields.value,
    ...activityFields.value,
    ...ownershipFields.value,
    ...financialFields.value,
    ...regulatoryFields.value
  ])

  function questionnaireValue(key: string, boolean?: boolean): string {
    const q = detail.value?.questionnaire as KybQuestionnaire | null | undefined
    if (!q) return '-'
    const raw = (q as unknown as Record<string, unknown>)[key]
    if (boolean) {
      if (raw === true) return t('common.yes')
      if (raw === false) return t('common.no')
      return '-'
    }
    if (raw == null || raw === '') return '-'
    const str = String(raw)

    // Map enum values to i18n keys
    const enumMap: Record<string, string> = {
      entityType: `merchantDetail.entityType_${str}`,
      sourceOfFunds: `merchantDetail.sourceOfFunds_${str}`,
      pepStatus: `merchantDetail.pepStatus_${str}`,
      employeeCount: `merchantDetail.employeeCount_${str}`,
      annualVolumeUsd: `merchantDetail.annualVolume_${str}`,
      primaryActivity: `merchantDetail.primaryActivity_${str}`
    }
    const i18nKey = enumMap[key]
    if (i18nKey) {
      const translated = t(i18nKey)
      if (translated !== i18nKey) return translated
    }
    return str
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

<style scoped>
  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
  }
  .status-badge.onboarded {
    background: var(--el-color-success-light-8);
    color: var(--el-color-success);
  }
  .status-badge.pending {
    background: var(--el-color-warning-light-8);
    color: var(--el-color-warning-dark-2);
  }
  .status-badge.in-review {
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }
  .status-badge.rejected {
    background: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
  }

  /* Onboarding progress */
  .onboarding-progress {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    padding: 24px 32px 20px;
  }
  .progress-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    margin-bottom: 20px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .progress-stepper {
    display: flex;
    align-items: flex-start;
  }
  .progress-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    text-align: center;
  }
  .progress-step::before {
    content: '';
    position: absolute;
    top: 18px;
    left: -50%;
    right: 50%;
    height: 3px;
    background: var(--el-border-color-lighter);
    border-radius: 2px;
    z-index: 0;
  }
  .progress-step:first-child::before {
    display: none;
  }
  .progress-step.completed::before {
    background: var(--el-color-success);
  }
  .progress-step.active::before {
    background: var(--el-color-success-light-5);
  }
  .step-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    position: relative;
    z-index: 1;
    background: var(--el-bg-color);
    border: 2.5px solid var(--el-border-color-light);
    color: var(--el-text-color-placeholder);
  }
  .step-circle.done {
    background: var(--el-color-success);
    border-color: transparent;
    color: #fff;
  }
  .step-circle.active {
    background: var(--el-color-primary);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  }
  .step-label {
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    max-width: 120px;
  }
  .progress-step.completed .step-label {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
  .progress-step.active .step-label {
    color: var(--el-color-primary);
    font-weight: 700;
  }
  .step-meta {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-top: 3px;
  }

  /* Screening grid */
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
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 8px;
  }
  .summary-card-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* CDD grid */
  .cdd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .cdd-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 10px;
  }
  .cdd-item:last-child {
    margin-bottom: 0;
  }

  /* Team grid */
  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .team-card {
    padding: 14px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }
</style>
