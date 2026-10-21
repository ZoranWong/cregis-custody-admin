<!-- Merchant Detail (KYB) — 商户详情（双状态视图） -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-4"><el-skeleton :rows="3" animated /></div>
      <div class="art-card h-64 p-5 mb-4"><el-skeleton :rows="6" animated /></div>
    </template>

    <template v-else-if="detail">
      <!-- ═══ Merchant Header（对齐原型：名称+徽章 + meta 行，无四格网格）═══ -->
      <div class="art-card p-5 mb-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold text-g-900">{{ detail.merchantName }}</h1>
              <ArtStatusTag :status="stageToneToStatus()" :text="headerStatusLabel" />
            </div>
            <div class="flex items-center gap-4 text-sm text-g-500 mt-1.5">
              <span
                >{{ $t('merchantDetail.jurisdiction') }}:
                <span class="font-medium text-g-700">{{ headerJurisdiction }}</span></span
              >
              <span
                >{{ $t('merchantDetail.businessType') }}:
                <span class="font-medium text-g-700">{{
                  merchantTypeLabel(detail.merchantType)
                }}</span></span
              >
              <span v-if="detail.appliedAt">
                {{
                  isOnboarded ? $t('merchantDetail.onboardedAt') : $t('merchantDetail.appliedAt')
                }}:
                <span class="font-medium text-g-700">{{ formatDateTime(detail.appliedAt) }}</span>
              </span>
            </div>
          </div>
          <ArtBackButton :to="'ComplianceMerchants'" />
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

        <!-- Current Step：筛查未过 = 资格筛查问卷；已过 = 身份验证（等 KYB） -->
        <div class="art-card overflow-hidden">
          <div
            class="p-4 border-b border-[var(--default-border)] flex items-center justify-between"
          >
            <h2 class="text-sm font-semibold text-g-900">
              {{ currentStepTitle }}
            </h2>
            <ArtStatusTag :status="stageToneToStatus()" :text="currentStepBadge" />
          </div>

          <!-- ── 当前步骤：继续显示资格筛查问卷（预审进行中 / 已拒绝）── -->
          <div v-if="!screeningPassed" class="p-5">
            <!-- Page 1: Business Entity + Structure -->
            <div v-show="screeningPage === 1" class="flex flex-col gap-6">
              <div>
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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

          <!--
            ── 当前步骤：身份验证（预审通过后进入）──
            预审通过时后端把 kyb.status 回到 DRAFT 并注册 Sumsub applicant，
            此后等待客户在 Sumsub 完成验证，管理员不再有决策动作。
          -->
          <div v-else class="p-5">
            <!-- 等待/审核中提示条 -->
            <div
              class="verification-note"
              :class="isVerificationReviewing ? 'reviewing' : 'waiting'"
            >
              <ArtSvgIcon
                :icon="isVerificationReviewing ? 'ri:search-eye-line' : 'ri:time-line'"
                class="text-icon-md verification-note-icon"
              />
              <div>
                <div class="verification-note-title">
                  {{
                    isVerificationReviewing
                      ? $t('merchantDetail.verificationNoteReviewing')
                      : $t('merchantDetail.verificationRequested')
                  }}
                </div>
                <div v-if="!isVerificationReviewing" class="verification-note-desc">
                  {{
                    $t('merchantDetail.verificationNoteWaiting', {
                      email: detail.email || '--'
                    })
                  }}
                </div>
              </div>
            </div>

            <!-- 客户邮箱 + 重新发送链接 -->
            <div class="verification-contact">
              <span class="text-sm text-g-700">
                {{ $t('merchantDetail.verificationCustomerEmail') }}:
                <strong class="text-g-900">{{ detail.email || '--' }}</strong>
              </span>
              <el-button size="small" :disabled="isVerificationReviewing" @click="handleResendLink">
                <ArtSvgIcon icon="ri:send-plane-line" class="text-icon-sm mr-1" />
                {{ $t('merchantDetail.resendLink') }}
              </el-button>
            </div>

            <!-- 子进度：已提交 / 审核 / 已通过 -->
            <div class="verification-progress-card">
              <div class="text-sm font-semibold text-g-900 mb-4">
                {{ $t('merchantDetail.verificationProgress') }}
              </div>
              <div class="verification-progress">
                <template v-for="(s, i) in verificationSubSteps" :key="s.label">
                  <div v-if="i > 0" class="vp-line" :class="{ done: s.state === 'done' }"></div>
                  <div class="vp-step" :class="s.state">
                    <div class="vp-dot">
                      <ArtSvgIcon
                        v-if="s.state === 'done' || s.state === 'failed'"
                        :icon="s.icon"
                        class="text-icon-xs"
                      />
                    </div>
                    <div class="vp-label">{{ s.label }}</div>
                    <div class="vp-meta">{{ s.meta }}</div>
                  </div>
                </template>
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
                  <ArtStatusTag
                    :status="stageToneToStatus()"
                    :text="merchantStatusLabel(detail.merchantStatus)"
                  />
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
                  <ArtStatusTag
                    :status="riskLevelTone(complianceForm.riskLevel)"
                    :text="riskLevelLabel(complianceForm.riskLevel)"
                  />
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
                <div class="text-body-lg font-semibold text-g-700 mb-3">
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
              <div class="text-body-lg font-semibold text-g-700 mb-3">
                {{ $t('merchantDetail.identityVerification') }}
              </div>
              <div class="p-4 bg-g-50 rounded-lg">
                <div class="text-sm font-semibold text-g-900 mb-3">
                  {{ detail.merchantName }}
                </div>
                <div class="flex flex-col gap-2">
                  <!-- Corporate Identity 行 -->
                  <div class="flex items-center gap-3">
                    <span class="text-body-lg font-medium text-g-700 min-w-[140px]">
                      {{ $t('merchantDetail.corporateIdentity') }}
                    </span>
                    <span class="text-xs font-medium text-tone-done-text">
                      {{ $t('merchantDetail.verified') }} ✓
                    </span>
                  </div>
                  <!-- 受益人缩进行 -->
                  <div
                    v-for="b in detail.beneficiaries || []"
                    :key="'v-' + b.id"
                    class="flex items-center gap-3 ml-6"
                  >
                    <span class="text-body-lg font-medium text-g-700 min-w-[140px]">
                      {{ b.name
                      }}<template v-if="b.shareSize != null"> ({{ b.shareSize }}%)</template>
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
            </div>

            <!-- 筛查 -->
            <div class="mb-6">
              <div class="text-body-lg font-semibold text-g-700 mb-3">
                {{ $t('merchantDetail.screening') }}
              </div>
              <div class="p-4 bg-g-50 rounded-lg">
                <div class="flex flex-col gap-4">
                  <!-- 企业主体 -->
                  <div>
                    <div class="text-sm font-semibold text-g-900 mb-2">
                      {{ detail.merchantName }}
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="text-xs font-semibold text-tone-done-text px-2 py-1 bg-tone-done-bg rounded"
                      >
                        CLEAR
                      </span>
                    </div>
                  </div>
                  <!-- 受益人 -->
                  <div
                    v-for="b in detail.beneficiaries || []"
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
                      class="text-label px-2 py-0.5 rounded font-medium flex-shrink-0"
                      :class="
                        u.state === 'ACTIVE'
                          ? 'bg-tone-done-bg text-tone-done-text'
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
                  class="text-label px-2 py-0.5 bg-[var(--el-color-primary-light-9)] text-[var(--theme-text)] rounded font-medium flex-shrink-0"
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
    if (value === 'VERIFIED') return 'text-tone-done-text'
    if (value === 'PENDING') return 'text-tone-progress-text'
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

  function riskLevelTone(value: string): 'success' | 'warning' | 'danger' | null {
    if (value === 'LOW') return 'success'
    if (value === 'MEDIUM') return 'warning'
    if (value === 'HIGH') return 'danger'
    return null
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

  /*
   * Re-screen / Re-verify & Re-screen 目前无后端接口。
   *
   * 原先点击后只弹按钮自身的名字（「重新筛查」），用户看不出：
   *   · 这个操作会做什么
   *   · 为什么点了没反应
   * 改为说明「操作范围 + 当前不可用的原因」，让占位态也有信息量。
   *
   * ⚠️ 接口就绪后替换为真实调用，并补上确认弹窗（这类操作会影响商户状态，不应一键直达）。
   */
  function handleRescreen() {
    ElMessage.warning(t('merchantDetail.rescreenUnavailable'))
  }

  function handleReverifyRescreen() {
    ElMessage.warning(t('merchantDetail.reverifyRescreenUnavailable'))
  }

  /** KYB 内部状态（大写归一） */
  const kybState = computed(() => detail.value?.kybStatus?.toUpperCase() || '')

  /**
   * 资格筛查是否已通过（step 2 完成）。
   *
   * 关键契约：预审通过后 kyb.status 回到 DRAFT（后端同时注册 Sumsub applicant，
   * 见 api/merchant.ts 中 /kyb/screening/approve 的说明），并非直接 APPROVED。
   * 因此「筛查已完成」必须同时认 DRAFT 与 PENDING_SCREENING 之后的状态，
   * 否则同意后进度条会从第二步退回成「待处理」。
   */
  const screeningPassed = computed(() =>
    ['DRAFT', 'SUBMITTED', 'NEED_SUPPLEMENT', 'APPROVED'].includes(kybState.value)
  )

  /** 身份验证已进入（step 3 已开始） */
  const verificationStarted = computed(() =>
    ['DRAFT', 'SUBMITTED', 'NEED_SUPPLEMENT', 'APPROVED'].includes(kybState.value)
  )

  /**
   * 「已入驻」页面视图 = 客户已完成身份验证、审核通过。
   *
   * 修正点：此前用 merchantStatus(ACTIVE/FROZEN/CANCELLED) 或 kybStatus=APPROVED 判定，
   * 会在预审通过（kyb→DRAFT）后立刻翻到已入驻视图，跳过了 waiting-for-KYB 的第三步。
   * 现在唯一依据是 kybStatus=APPROVED，与审批接口的后置状态对齐。
   */
  const isOnboarded = computed(() => kybState.value === 'APPROVED')

  /** 预审决策仅在后端返回 PENDING_SCREENING（即 step 2 进行中）时可用 */
  const canDecide = computed(() => kybState.value === 'PENDING_SCREENING')

  /** 客户已提交身份材料、等待三方审核 */
  const isVerificationReviewing = computed(() =>
    ['SUBMITTED', 'NEED_SUPPLEMENT'].includes(kybState.value)
  )

  /**
   * 当前阶段的色调 —— 页头徽章与「当前步骤」徽章共用同一来源。
   *
   * 企业名称右侧的徽章必须反映进度条里 class=active 的那一步，
   * 否则同一屏会出现「徽章说是审核中、进度条说在进行中」的矛盾。
   *   onboarded            → 绿
   *   REJECTED             → 红
   *   SUBMITTED/NEED_SUPPLEMENT（三方处理中） → 蓝
   *   其余进行中（待筛查 / 等待客户提交）      → 琥珀
   */
  const stageToneClass = computed(() => {
    if (isOnboarded.value) return 'onboarded'
    if (kybState.value === 'REJECTED') return 'rejected'
    if (isVerificationReviewing.value) return 'in-review'
    return 'pending'
  })

  /** 将 stageToneClass 映射为 ArtStatusTag 的 StatusTone */
  function stageToneToStatus(): 'success' | 'warning' | 'danger' | 'info' | null {
    const s = stageToneClass.value
    if (s === 'onboarded') return 'success'
    if (s === 'rejected') return 'danger'
    if (s === 'in-review') return 'info'
    return 'warning'
  }

  /**
   * 页头徽章文案 = 当前【进行中】的那一步，而非笼统的状态词。
   * 与进度条中 class 为 active 的步骤始终一致。
   */
  const headerStatusLabel = computed(() => {
    if (isOnboarded.value) return t('merchantDetail.statusOnboarded')
    if (kybState.value === 'REJECTED') return t('merchantDetail.rejected')
    return canDecide.value
      ? t('merchantDetail.qualificationScreening')
      : t('merchantDetail.stepVerification')
  })

  /** 头部注册地：问卷 jurisdiction 优先，缺失回退 countryCode */
  const headerJurisdiction = computed(() => {
    const q = detail.value?.questionnaire as KybQuestionnaire | null | undefined
    const raw = q?.jurisdiction || q?.countryCode
    return raw ? countryStore.countryName(raw) : '-'
  })

  // Stepper states (screening = step 2, verification = step 3)
  const screeningStepClass = computed(() => {
    if (kybState.value === 'PENDING_SCREENING') return 'active'
    if (screeningPassed.value || kybState.value === 'REJECTED') return 'completed'
    return ''
  })
  const screeningStepMeta = computed(() => {
    const cls = screeningStepClass.value
    if (cls === 'active') return t('merchantDetail.inProgress')
    if (cls === 'completed') {
      return kybState.value === 'REJECTED'
        ? t('merchantDetail.rejected')
        : t('merchantDetail.passed')
    }
    return t('merchantDetail.pendingMeta')
  })
  const verificationStepClass = computed(() => {
    if (kybState.value === 'APPROVED') return 'completed'
    if (verificationStarted.value) return 'active'
    return ''
  })
  const verificationStepMeta = computed(() => {
    const cls = verificationStepClass.value
    if (cls === 'active') return t('merchantDetail.inProgress')
    if (cls === 'completed') return t('merchantDetail.passed')
    return t('merchantDetail.pendingMeta')
  })

  /** 当前步骤面板标题：筛查已过则进入身份验证 */
  const currentStepTitle = computed(() =>
    screeningPassed.value
      ? t('merchantDetail.stepVerification')
      : t('merchantDetail.qualificationScreening')
  )

  /** 当前步骤徽章：待决策 / 等待客户 / 审核中 */
  const currentStepBadge = computed(() => {
    if (canDecide.value) return t('merchantDetail.awaitingDecision')
    if (isVerificationReviewing.value) return t('merchantDetail.verificationReviewing')
    if (verificationStarted.value) return t('merchantDetail.verificationRequested')
    return kybStatusLabel(kybState.value)
  })

  /**
   * 徽章配色服从「当前进行到哪一步」的色调：
   *   筛查/验证刚起步、等对方动作 → 琥珀（进行中）
   *   三方正在处理             → 蓝（处理中）
   *   已出结果                 → 绿/红
   * 与进度条中 active 步骤的色调保持一致，避免同一屏出现两套阶段语义。
   */
  /**
   * KYB 验证子进度（已提交 / 已审核 / 已通过）。
   *
   * 语义按用户确认的口径：这是 **KYB 的进度**，不是客户在 Sumsub 里的动作。
   * 客户一提交（kyb.status → SUBMITTED），「已提交」即完成变绿，
   * 流程推进到「已审核」并停在那里等待审核结果 ——
   * 即进行中永远落在「已审核」，只有三方给出结论后才前进到「已通过」。
   */
  /**
   * KYB 验证子进度（已提交 / 审核 / 已通过）—— 完全由 kybStatus 驱动。
   *
   *   Submitted  已提交：kybStatus 一旦有值（DRAFT 起）即视为已提交 → 完成(绿)
   *   Review     审核  ：DRAFT / SUBMITTED / NEED_SUPPLEMENT 期间进行中(琥珀)；
   *                     出结果后（APPROVED / REJECTED）该步完成(绿)
   *   Passed     已通过：APPROVED → 成功(绿)；REJECTED → 失败(红)
   */
  const verificationSubSteps = computed(() => {
    const s = kybState.value
    const submitted = !!s && s !== 'PENDING_SCREENING'
    const reviewing = ['DRAFT', 'SUBMITTED', 'NEED_SUPPLEMENT'].includes(s)
    const passed = s === 'APPROVED'
    const failed = s === 'REJECTED'

    const states: string[] = [
      submitted ? 'done' : 'pending',
      reviewing ? 'active' : passed || failed ? 'done' : 'pending',
      passed ? 'done' : failed ? 'failed' : 'pending'
    ]
    const labels = [
      t('merchantDetail.subStepSubmitted'),
      t('merchantDetail.subStepReviewed'),
      t('merchantDetail.subStepPassed')
    ]
    const icons = ['ri:check-line', 'ri:check-line', failed ? 'ri:close-line' : 'ri:check-line']
    const submittedAt = submitted ? formatDateTime(detail.value?.appliedAt) : ''
    const metaOf = (i: number): string => {
      if (states[i] === 'active') return t('merchantDetail.inProgress')
      if (states[i] === 'failed') return t('merchantDetail.rejected')
      if (states[i] === 'done') {
        // 「审核」步已完成时结论随最终结果：被拒时不能显示「已通过」
        if (i === 1) return failed ? t('merchantDetail.rejected') : t('merchantDetail.passed')
        return i === 0 && submittedAt ? submittedAt : t('merchantDetail.passed')
      }
      return t('merchantDetail.pendingMeta')
    }
    return labels.map((label, i) => ({
      label,
      state: states[i],
      icon: icons[i],
      meta: metaOf(i)
    }))
  })

  /** 重新发送验证链接（接口待接入） */
  function handleResendLink() {
    const email = detail.value?.email || ''
    ElMessage.info(t('merchantDetail.resendLink') + (email ? ` → ${email}` : ''))
  }

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
    background: var(--tone-track-idle);
    border-radius: 2px;
  }

  .progress-step:first-child::before {
    display: none;
  }

  .progress-step.completed::before {
    background: var(--tone-track-done);
  }

  /* 进行中步骤之前的连线：用 track 色（≥3:1 非文本对比）。
     不能用 -ring —— 16% 透明度在白底仅 1.17:1，肉眼几乎不可见。 */
  .progress-step.active::before {
    background: var(--tone-track-progress);
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
    background: var(--tone-done-mark);
    border-color: transparent;
  }

  /* 进行中：琥珀而非蓝 —— 蓝色在合规模块里表示信息/中性，
     无法与「完成」的绿形成足够区分；琥珀色相独立，且与完成态在灰度下也能分辨。
     形状对比 3.02:1、白字对比 5.02:1，均达标。 */
  .step-circle.active {
    color: #fff;
    background: var(--tone-progress-text);
    border-color: transparent;
    box-shadow: 0 0 0 4px var(--tone-progress-ring-soft);
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
    color: var(--tone-progress-text);
  }

  .step-meta {
    margin-top: 3px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .progress-step.active .step-meta {
    color: var(--tone-progress-text);
  }

  /* ── 第三步：身份验证面板 ── */
  .verification-note {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    margin-bottom: 16px;
    border: 1px solid;
    border-radius: 8px;
  }

  .verification-note.waiting {
    background: var(--tone-progress-bg);
    border-color: var(--tone-track-progress);
  }

  .verification-note.reviewing {
    background: var(--tone-info-bg);
    border-color: var(--el-color-primary-light-3);
  }

  .verification-note.waiting .verification-note-icon,
  .verification-note.waiting .verification-note-title {
    color: var(--tone-progress-text);
  }

  .verification-note.reviewing .verification-note-icon,
  .verification-note.reviewing .verification-note-title {
    color: var(--tone-info-text);
  }

  .verification-note-icon {
    margin-top: 2px;
    flex-shrink: 0;
  }

  .verification-note-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .verification-note-desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }

  .verification-contact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--default-border);
  }

  .verification-progress-card {
    padding: 20px;
    border: 1px solid var(--default-border);
    border-radius: 12px;
  }

  .verification-progress {
    display: flex;
    align-items: flex-start;
  }

  .vp-step {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    min-width: 88px;
    text-align: center;
  }

  .vp-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #fff;
    background: var(--el-fill-color-dark);
    border-radius: 50%;
  }

  /* 子步骤配色与主步骤条同一套 tone token，避免出现第三套颜色 */
  .vp-step.done .vp-dot {
    background: var(--tone-done-mark);
  }

  .vp-step.active .vp-dot {
    background: var(--tone-progress-text);
    box-shadow: 0 0 0 4px var(--tone-progress-ring-soft);
  }

  /* 已通过 · 失败（REJECTED）：红，与成功态的绿形成对照 */
  .vp-step.failed .vp-dot {
    background: var(--tone-error-text);
  }

  .vp-line {
    flex: 1;
    height: 2px;
    margin-top: 15px;
    background: var(--tone-track-idle);
  }

  .vp-line.done {
    background: var(--tone-track-done);
  }

  .vp-label {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--tone-muted-text);
  }

  .vp-step.done .vp-label {
    color: var(--tone-done-text);
  }

  .vp-step.active .vp-label {
    font-weight: 600;
    color: var(--tone-progress-text);
  }

  .vp-step.failed .vp-label {
    font-weight: 600;
    color: var(--tone-error-text);
  }

  .vp-meta {
    margin-top: 2px;
    font-size: 10px;
    color: var(--tone-muted-text);
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
