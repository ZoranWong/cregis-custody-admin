<!-- Merchant Detail (KYB) — 商户详情（双状态视图） -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-5"><el-skeleton :rows="3" animated /></div>
      <div class="art-card h-64 p-5 mb-5"><el-skeleton :rows="6" animated /></div>
    </template>

    <template v-else-if="detail">
      <!-- ═══ Merchant Header（对齐原型：名称+徽章 + meta 行，无四格网格）═══ -->
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
                >{{ $t('merchantDetail.jurisdiction') }}:
                <strong class="text-g-700">{{ headerJurisdiction }}</strong></span
              >
              <span
                >{{ $t('merchantDetail.businessType') }}:
                <strong class="text-g-700">{{
                  merchantTypeLabel(detail.merchantType)
                }}</strong></span
              >
              <span v-if="detail.appliedAt">
                {{
                  isOnboarded ? $t('merchantDetail.onboardedAt') : $t('merchantDetail.appliedAt')
                }}:
                <strong class="text-g-700">{{ formatDateTime(detail.appliedAt) }}</strong>
              </span>
            </div>
          </div>
          <ElButton @click="backToList">{{ $t('merchantDetail.backToList') }}</ElButton>
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
                        <span>{{ countryStore.countryName(b.country) }}</span>
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
          <!-- Tab 1: Compliance Status（onboarded 后可编辑，对齐原型五张 summary-card） -->
          <el-tab-pane :label="$t('merchantDetail.tabCompliance')" name="compliance">
            <div class="screening-grid">
              <!-- Onboarding Status -->
              <div class="summary-card">
                <div class="summary-card-title">
                  {{ $t('merchantDetail.cddOnboardingStatus') }}
                </div>
                <el-select
                  v-if="complianceEditing"
                  v-model="complianceForm.merchantStatus"
                  size="default"
                  class="!w-full"
                >
                  <el-option
                    v-for="opt in MERCHANT_STATUS_OPTIONS"
                    :key="opt"
                    :label="merchantStatusLabel(opt)"
                    :value="opt"
                  />
                </el-select>
                <div v-else class="summary-card-value">
                  <span class="status-badge" :class="headerStatusClass">
                    {{ merchantStatusLabel(detail.merchantStatus) }}
                  </span>
                </div>
              </div>

              <!-- Risk Level -->
              <div class="summary-card">
                <div class="summary-card-title">{{ $t('merchantDetail.riskLevel') }}</div>
                <el-select
                  v-if="complianceEditing"
                  v-model="complianceForm.riskLevel"
                  size="default"
                  class="!w-full"
                >
                  <el-option
                    v-for="opt in RISK_LEVEL_OPTIONS"
                    :key="opt.value"
                    :label="t(opt.labelKey)"
                    :value="opt.value"
                  />
                </el-select>
                <div v-else class="summary-card-value">
                  <span class="status-badge" :class="riskLevelBadgeClass(complianceForm.riskLevel)">
                    {{ riskLevelLabel(complianceForm.riskLevel) }}
                  </span>
                </div>
              </div>

              <!-- CRS/FATCA Status -->
              <div class="summary-card">
                <div class="summary-card-title">{{ $t('merchantDetail.crsFatcaStatus') }}</div>
                <el-select
                  v-if="complianceEditing"
                  v-model="complianceForm.crsFatcaStatus"
                  size="default"
                  class="!w-full"
                >
                  <el-option
                    v-for="opt in CRS_FATCA_OPTIONS"
                    :key="opt.value"
                    :label="t(opt.labelKey)"
                    :value="opt.value"
                  />
                </el-select>
                <div v-else class="summary-card-value text-g-800">
                  {{ crsFatcaLabel(complianceForm.crsFatcaStatus) }}
                </div>
              </div>

              <!-- Source of Wealth -->
              <div class="summary-card">
                <div class="summary-card-title">{{ $t('merchantDetail.sourceOfWealth') }}</div>
                <el-select
                  v-if="complianceEditing"
                  v-model="complianceForm.sourceOfWealth"
                  size="default"
                  class="!w-full"
                >
                  <el-option
                    v-for="opt in VERIFY_STATUS_OPTIONS"
                    :key="opt.value"
                    :label="t(opt.labelKey)"
                    :value="opt.value"
                  />
                </el-select>
                <div
                  v-else
                  class="summary-card-value"
                  :class="verifyStatusClass(complianceForm.sourceOfWealth)"
                >
                  {{ verifyStatusDisplay(complianceForm.sourceOfWealth) }}
                </div>
              </div>

              <!-- Source of Funds -->
              <div class="summary-card">
                <div class="summary-card-title">{{ $t('merchantDetail.sourceOfFundsStatus') }}</div>
                <el-select
                  v-if="complianceEditing"
                  v-model="complianceForm.sourceOfFunds"
                  size="default"
                  class="!w-full"
                >
                  <el-option
                    v-for="opt in VERIFY_STATUS_OPTIONS"
                    :key="opt.value"
                    :label="t(opt.labelKey)"
                    :value="opt.value"
                  />
                </el-select>
                <div
                  v-else
                  class="summary-card-value"
                  :class="verifyStatusClass(complianceForm.sourceOfFunds)"
                >
                  {{ verifyStatusDisplay(complianceForm.sourceOfFunds) }}
                </div>
              </div>
            </div>

            <!-- 编辑操作 -->
            <div class="flex justify-end gap-2 mt-4">
              <el-button v-if="complianceEditing" @click="cancelComplianceEdit">
                {{ $t('common.cancel') }}
              </el-button>
              <el-button
                type="primary"
                :loading="complianceSaving"
                @click="complianceEditing ? saveCompliance() : startComplianceEdit()"
              >
                {{ complianceEditing ? $t('common.save') : $t('common.edit') }}
              </el-button>
            </div>
          </el-tab-pane>

          <!-- Tab 2: Business Information（对齐原型：三页分页，每页两个分区） -->
          <el-tab-pane :label="$t('merchantDetail.tabBusiness')" name="business">
            <div class="flex flex-col gap-6">
              <div v-for="section in bizPageSections(bizPage)" :key="section.titleKey">
                <div class="text-[13px] font-semibold text-g-700 mb-3">
                  {{ $t(section.titleKey) }}
                </div>
                <div class="screening-grid">
                  <div
                    v-for="f in section.fields"
                    :key="f.key"
                    class="summary-card"
                    :class="{ 'col-span-2': f.wide }"
                  >
                    <div class="summary-card-title">{{ f.label }}</div>
                    <div class="summary-card-value" :class="{ 'whitespace-normal': f.wide }">
                      {{ questionnaireValue(f.key, f.boolean) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 分页（问卷字段只读，原型同款 Back/Next + 页码指示） -->
            <div class="flex flex-col gap-3 items-center mt-6">
              <div class="flex items-center gap-3">
                <span class="text-xs text-g-500">
                  {{ $t('merchantDetail.pageOf', { page: bizPage, total: 3 }) }}
                </span>
                <el-button v-if="bizPage > 1" size="small" @click="bizPage--">
                  {{ $t('merchantDetail.back') }}
                </el-button>
                <el-button v-if="bizPage < 3" size="small" @click="bizPage++">
                  {{ $t('merchantDetail.next') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 3: Identity Verification & Screening（对齐原型：验证卡片 + 筛查名单 chips） -->
          <el-tab-pane :label="$t('merchantDetail.tabIdentity')" name="identity">
            <!-- 身份验证 -->
            <div class="mb-6">
              <div class="text-[13px] font-semibold text-g-700 mb-3">
                {{ $t('merchantDetail.identityVerification') }}
              </div>
              <div class="p-4 bg-g-50 rounded-lg">
                <div class="text-sm font-semibold text-g-900 mb-3">
                  {{ detail.merchantName }}
                </div>
                <div class="flex flex-col gap-2">
                  <!-- Corporate Identity 行 -->
                  <div class="flex items-center gap-3">
                    <span class="text-[13px] font-medium text-g-700 min-w-[140px]">
                      {{ $t('merchantDetail.corporateIdentity') }}
                    </span>
                    <span class="text-xs text-success font-medium">
                      {{ $t('merchantDetail.verified') }} ✓
                    </span>
                  </div>
                  <!-- 受益人缩进行 -->
                  <div
                    v-for="b in detail.beneficiaries || []"
                    :key="'v-' + b.id"
                    class="flex items-center gap-3 ml-6"
                  >
                    <span class="text-[13px] font-medium text-g-700 min-w-[140px]">
                      {{ b.name
                      }}<template v-if="b.shareSize != null"> ({{ b.shareSize }}%)</template>
                    </span>
                    <span
                      class="text-xs font-medium"
                      :class="b.status === 'KYC_PASSED' ? 'text-success' : 'text-g-500'"
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
            </div>

            <!-- 筛查（CLEAR 徽章 or 名单 chips，对齐原型） -->
            <div class="mb-6">
              <div class="text-[13px] font-semibold text-g-700 mb-3">
                {{ $t('merchantDetail.screening') }}
              </div>
              <div class="p-4 bg-g-50 rounded-lg">
                <div class="flex flex-col gap-4">
                  <!-- 企业主体 -->
                  <div>
                    <div class="text-[13px] font-semibold text-g-900 mb-2">
                      {{ detail.merchantName }}
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-xs font-semibold text-success px-2 py-1 bg-[var(--el-color-success-light-9)] rounded"
                      >
                        CLEAR
                      </span>
                      <span class="text-[11px] text-g-500">or</span>
                      <span
                        v-for="list in SCREENING_LISTS"
                        :key="list"
                        class="text-[11px] px-1.5 py-0.5 bg-g-100 text-g-600 rounded cursor-pointer hover:bg-g-200"
                      >
                        {{ list }}
                      </span>
                    </div>
                  </div>
                  <!-- 受益人 -->
                  <div
                    v-for="b in detail.beneficiaries || []"
                    :key="'s-' + b.id"
                    class="border-t border-[var(--default-border)] pt-3 ml-6"
                  >
                    <div class="text-[13px] font-semibold text-g-900 mb-2">{{ b.name }}</div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-xs font-semibold text-success px-2 py-1 bg-[var(--el-color-success-light-9)] rounded"
                      >
                        CLEAR
                      </span>
                      <span class="text-[11px] text-g-500">or</span>
                      <span
                        v-for="list in SCREENING_LISTS"
                        :key="list"
                        class="text-[11px] px-1.5 py-0.5 bg-g-100 text-g-600 rounded cursor-pointer hover:bg-g-200"
                      >
                        {{ list }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Re-screen / Re-verify 操作（接口待支持，先占位） -->
            <div class="flex justify-end gap-2">
              <el-button @click="handleRescreen">{{ $t('merchantDetail.rescreen') }}</el-button>
              <el-button type="primary" @click="handleReverifyRescreen">
                {{ $t('merchantDetail.reverifyRescreen') }}
              </el-button>
            </div>
          </el-tab-pane>

          <!-- Tab 4: Team Members（企业用户接口 /merchant/{ecode}/user/page） -->
          <el-tab-pane :label="$t('merchantDetail.tabTeam')" name="team">
            <div class="flex flex-col gap-3">
              <div
                v-for="u in merchantUsers"
                :key="u.userId"
                class="flex items-center gap-3 p-3 bg-g-50 rounded-lg"
              >
                <div
                  class="w-9 h-9 rounded-full bg-[var(--el-color-primary)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
                >
                  {{ initialsOf(u.username) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-g-900 truncate">{{ u.username }}</span>
                    <span
                      class="text-[11px] px-2 py-0.5 rounded font-medium flex-shrink-0"
                      :class="
                        u.state === 'ACTIVE'
                          ? 'bg-[var(--el-color-success-light-9)] text-success'
                          : 'bg-g-100 text-g-500'
                      "
                    >
                      {{ userStateLabel(u.state) }}
                    </span>
                  </div>
                  <div class="text-xs text-g-600 truncate mt-0.5">
                    {{ u.email
                    }}<template v-if="u.loginTime">
                      · {{ $t('merchantDetail.lastLogin') }}:
                      {{ formatDateTime(u.loginTime) }}</template
                    >
                  </div>
                </div>
                <span
                  class="text-[11px] px-2 py-0.5 bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)] rounded font-medium flex-shrink-0"
                >
                  {{ userRoleLabel(u.role) }}
                </span>
              </div>
              <div v-if="merchantUsers.length === 0" class="py-6 text-center text-g-400 text-sm">
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
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import {
    fetchMerchantKybDetail,
    approveKybScreening,
    rejectKybScreening,
    fetchMerchantUsers,
    updateComplianceStatus,
    type AdminMerchantUserVO
  } from '@/api/merchant'
  import type { AdminMerchantKybDetailView, KybQuestionnaire } from '@/api/merchant'
  import { useCountryStore } from '@/store/modules/country'

  defineOptions({ name: 'MerchantDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t, locale } = useI18n()
  const countryStore = useCountryStore()

  const loading = ref(false)
  const detail = ref<AdminMerchantKybDetailView | null>(null)
  const errorMessage = ref('')
  const screeningPage = ref(1)
  const activeTab = ref('compliance')
  const showRejectDialog = ref(false)
  const rejectReason = ref('')
  const deciding = ref(false)

  // ─── Team Members（企业用户接口）───
  const merchantUsers = ref<AdminMerchantUserVO[]>([])

  /** 企业内角色 → 标签 */
  function userRoleLabel(role: string): string {
    const map: Record<string, string> = {
      MERCHANT_OWNER: t('merchantDetail.roleOwner'),
      MERCHANT_ADMIN: t('merchantDetail.roleAdmin'),
      MERCHANT_STAFF: t('merchantDetail.roleStaff'),
      MERCHANT_FUND_OPERATOR: t('merchantDetail.roleFundOperator'),
      MERCHANT_ANYCALL_OPERATOR: t('merchantDetail.roleAnycallOperator')
    }
    return map[role] || role || '-'
  }

  /** 企业内状态 → 标签 */
  function userStateLabel(state: string): string {
    const map: Record<string, string> = {
      ACTIVE: t('merchantDetail.userActive'),
      INACTIVE: t('merchantDetail.userInactive'),
      SUSPENDING: t('merchantDetail.userSuspending')
    }
    return map[state] || state || '-'
  }

  async function loadMerchantUsers() {
    const ecode = detail.value?.ecode
    if (!ecode) return
    try {
      const res = await fetchMerchantUsers(ecode, { pageIndex: 1, pageSize: 100 })
      merchantUsers.value = res.records || []
    } catch {
      merchantUsers.value = []
    }
  }

  // ─── Compliance Status 编辑（onboarded 后可编辑，对齐原型五张卡）───
  const complianceEditing = ref(false)
  const complianceSaving = ref(false)
  const complianceForm = reactive({
    merchantStatus: '',
    riskLevel: '',
    crsFatcaStatus: '',
    sourceOfWealth: '',
    sourceOfFunds: ''
  })

  /** 入驻状态可切换的取值（原型：Pending/Onboarded/Frozen/Offboarded） */
  const MERCHANT_STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'FROZEN', 'CANCELLED']

  /** 风险等级三档；接口暂无该字段，先本地维护，接口就绪后接入 */
  const RISK_LEVEL_OPTIONS = [
    { value: 'LOW', labelKey: 'merchantDetail.riskLevelLow' },
    { value: 'MEDIUM', labelKey: 'merchantDetail.riskLevelMedium' },
    { value: 'HIGH', labelKey: 'merchantDetail.riskLevelHigh' }
  ]

  /** CRS/FATCA 分类（接口取值） */
  const CRS_FATCA_OPTIONS = [
    { value: 'DEPOSITORY_INSTITUTION', labelKey: 'merchantDetail.crsFatcaDepository' },
    { value: 'CUSTODIAL_INSTITUTION', labelKey: 'merchantDetail.crsFatcaCustodial' },
    { value: 'INVESTMENT_ENTITY', labelKey: 'merchantDetail.crsFatcaInvestment' },
    { value: 'ACTIVE_NFE', labelKey: 'merchantDetail.crsFatcaActiveNfe' },
    { value: 'PASSIVE_NFE', labelKey: 'merchantDetail.crsFatcaPassiveNfe' }
  ]

  /** 验证状态（财富来源 / 资金来源共用） */
  const VERIFY_STATUS_OPTIONS = [
    { value: 'VERIFIED', labelKey: 'merchantDetail.verified' },
    { value: 'PENDING', labelKey: 'merchantDetail.pendingStatus' },
    { value: 'NOT_VERIFIED', labelKey: 'merchantDetail.notVerified' }
  ]

  function crsFatcaLabel(value: string): string {
    const hit = CRS_FATCA_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || '-'
  }

  function verifyStatusLabel(value: string): string {
    const hit = VERIFY_STATUS_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || '-'
  }

  /** 核验状态 → 文字颜色（已核验=绿 / 待核验=琥珀 / 未核验=灰） */
  function verifyStatusClass(value: string): string {
    if (value === 'VERIFIED') return 'text-success'
    if (value === 'PENDING') return 'text-[var(--el-color-warning)]'
    return 'text-g-500'
  }

  /** 核验状态 → 展示文案（已核验带对勾） */
  function verifyStatusDisplay(value: string): string {
    const label = verifyStatusLabel(value)
    return value === 'VERIFIED' ? `✓ ${label}` : label
  }

  function riskLevelLabel(value: string): string {
    const hit = RISK_LEVEL_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || '-'
  }

  function riskLevelBadgeClass(value: string): string {
    if (value === 'LOW') return 'onboarded'
    if (value === 'MEDIUM') return 'in-review'
    if (value === 'HIGH') return 'rejected'
    return ''
  }

  function startComplianceEdit() {
    if (!detail.value) return
    complianceForm.merchantStatus = detail.value.merchantStatus?.toUpperCase() || 'ACTIVE'
    complianceForm.riskLevel = complianceForm.riskLevel || 'LOW'
    complianceForm.crsFatcaStatus = complianceForm.crsFatcaStatus || 'CUSTODIAL_INSTITUTION'
    complianceForm.sourceOfWealth = complianceForm.sourceOfWealth || 'VERIFIED'
    complianceForm.sourceOfFunds = complianceForm.sourceOfFunds || 'VERIFIED'
    complianceEditing.value = true
  }

  function cancelComplianceEdit() {
    complianceEditing.value = false
    // 回退到保存前的值：入驻状态以接口数据为准
    if (detail.value) complianceForm.merchantStatus = detail.value.merchantStatus?.toUpperCase()
  }

  async function saveCompliance() {
    if (!detail.value?.ecode) return
    complianceSaving.value = true
    try {
      // 构建 API 请求数据，发送所有字段
      const requestData = {
        onboardingStatus: complianceForm.merchantStatus || null,
        riskLevel: complianceForm.riskLevel || null,
        crsFatcaStatus: complianceForm.crsFatcaStatus || null,
        sourceOfWealthStatus: complianceForm.sourceOfWealth || null,
        sourceOfFundsStatus: complianceForm.sourceOfFunds || null
      }

      // 调用 API 保存
      const updatedStatus = await updateComplianceStatus(detail.value.ecode, requestData)

      // 更新本地数据
      if (!detail.value.complianceStatus) {
        detail.value.complianceStatus = updatedStatus
      } else {
        Object.assign(detail.value.complianceStatus, updatedStatus)
      }

      // 同步 merchantStatus（onboardingStatus 会同步到 merchantStatus）
      if (updatedStatus.onboardingStatus) {
        detail.value.merchantStatus = updatedStatus.onboardingStatus
      }

      complianceEditing.value = false
      ElMessage.success(t('merchantDetail.editSuccess'))
    } catch {
      ElMessage.error(t('merchantDetail.editFailed'))
    } finally {
      complianceSaving.value = false
    }
  }

  // ─── Identity Verification 占位操作（接口待支持）───
  /** 筛查名单 chips（对齐原型：OFAC SDN / EU List / UN Security / PEP / Adverse Media / Criminal） */
  const SCREENING_LISTS = ['OFAC SDN', 'EU List', 'UN Security', 'PEP', 'Adverse Media', 'Criminal']

  function handleRescreen() {
    // TODO: 接口就绪后对接重新筛查
    ElMessage.info(t('merchantDetail.rescreen'))
  }

  function handleReverifyRescreen() {
    // TODO: 接口就绪后对接重新验证并筛查
    ElMessage.info(t('merchantDetail.reverifyRescreen'))
  }

  // ─── State-derived view ───
  // KYB 审核通过（APPROVED）即进入详情 tab 视图；
  // 之后本地切换 ACTIVE / FROZEN / CANCELLED 都保持该视图，不再翻回 onboarding 步骤器
  const isOnboarded = computed(() => {
    const s = detail.value?.merchantStatus?.toUpperCase()
    if (s === 'ACTIVE' || s === 'FROZEN' || s === 'CANCELLED') return true
    return detail.value?.kybStatus?.toUpperCase() === 'APPROVED'
  })
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

  /** 头部注册地：问卷 jurisdiction 优先，缺失回退 countryCode */
  const headerJurisdiction = computed(() => {
    const q = detail.value?.questionnaire as KybQuestionnaire | null | undefined
    const raw = q?.jurisdiction || q?.countryCode
    return raw ? countryStore.countryName(raw) : '-'
  })

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
      // 初始化合规状态表单
      initComplianceForm()
      // 企业用户独立加载，失败不阻塞详情
      loadMerchantUsers()
    } catch {
      errorMessage.value = t('merchantDetail.notFound')
    } finally {
      loading.value = false
    }
  }

  function initComplianceForm() {
    if (!detail.value) return
    const cs = detail.value.complianceStatus
    if (cs) {
      complianceForm.merchantStatus = cs.onboardingStatus || detail.value.merchantStatus || 'ACTIVE'
      complianceForm.riskLevel = cs.riskLevel || 'LOW'
      complianceForm.crsFatcaStatus = cs.crsFatcaStatus || ''
      complianceForm.sourceOfWealth = cs.sourceOfWealthStatus || ''
      complianceForm.sourceOfFunds = cs.sourceOfFundsStatus || ''
    } else {
      // 如果没有 complianceStatus 数据，使用默认值
      complianceForm.merchantStatus = detail.value.merchantStatus || 'ACTIVE'
      complianceForm.riskLevel = 'LOW'
      complianceForm.crsFatcaStatus = ''
      complianceForm.sourceOfWealth = ''
      complianceForm.sourceOfFunds = ''
    }
  }

  function backToList() {
    router.back()
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

  // ─── Business Information 三页分页（对齐原型：每页两个分区）───
  const bizPage = ref(1)

  /**
   * 页码 → 分区列表（沿用 onboarding 问卷分组）：
   *   Page 1  企业实体信息 + 企业结构
   *   Page 2  业务活动 + 股权结构
   *   Page 3  财务信息 + 监管与合规
   */
  function bizPageSections(page: number): Array<{ titleKey: string; fields: Field[] }> {
    if (page === 1) {
      return [
        { titleKey: 'merchantDetail.bizEntityInfo', fields: entityFields.value },
        { titleKey: 'merchantDetail.bizStructure', fields: structureFields.value }
      ]
    }
    if (page === 2) {
      return [
        { titleKey: 'merchantDetail.bizActivities', fields: activityFields.value },
        { titleKey: 'merchantDetail.ownershipStructure', fields: ownershipFields.value }
      ]
    }
    return [
      { titleKey: 'merchantDetail.financialInfo', fields: financialFields.value },
      { titleKey: 'merchantDetail.regulatoryCompliance', fields: regulatoryFields.value }
    ]
  }

  /** 问卷中属于国家/地区编码的字段（展示时需转成国家名） */
  const COUNTRY_FIELDS = new Set(['jurisdiction', 'countryCode', 'country'])

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

    // 国家/地区类字段：ISO 编码 → 当前语言的国家名
    if (COUNTRY_FIELDS.has(key)) return countryStore.countryName(str)

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
    void countryStore.ensureLoaded(locale.value)
    void load()
  })
</script>

<style scoped>
  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    border-radius: 20px;
  }

  .status-badge.onboarded {
    color: var(--el-color-success);
    background: var(--el-color-success-light-8);
  }

  .status-badge.pending {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-8);
  }

  .status-badge.in-review {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
  }

  .status-badge.rejected {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-8);
  }

  /* Onboarding progress */
  .onboarding-progress {
    padding: 24px 32px 20px;
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-bg-color) 100%);
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
  }

  .progress-title {
    margin-bottom: 20px;
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .progress-stepper {
    display: flex;
    align-items: flex-start;
  }

  .progress-step {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .progress-step::before {
    position: absolute;
    top: 18px;
    right: 50%;
    left: -50%;
    z-index: 0;
    height: 3px;
    content: '';
    background: var(--el-border-color-lighter);
    border-radius: 2px;
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
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-placeholder);
    background: var(--el-bg-color);
    border: 2.5px solid var(--el-border-color-light);
    border-radius: 50%;
  }

  .step-circle.done,
  .progress-step.completed .step-circle {
    color: #fff;
    background: var(--el-color-success);
    border-color: transparent;
  }

  .step-circle.active {
    color: #fff;
    background: var(--el-color-primary);
    border-color: transparent;
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  }

  .step-label {
    max-width: 120px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  .progress-step.completed .step-label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .progress-step.active .step-label {
    font-weight: 700;
    color: var(--el-color-primary);
  }

  .step-meta {
    margin-top: 3px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
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
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .summary-card-value {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* CDD grid */
  .cdd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .cdd-item {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .cdd-item:last-child {
    margin-bottom: 0;
  }
</style>
