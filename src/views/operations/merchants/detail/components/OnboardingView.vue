<!--
  审核进行中 / 被拒视图（未入驻）。

  三步进度条（Pre-screening → KYB → Compliance Review）+ 当前步骤面板 + 完成后回看。
  步骤状态与文案全部由 features/merchant/merchantStepper 推导，组件只做渲染与动作。
-->
<template>
  <div>
    <!-- 审核进度条 -->
    <div v-if="showStepper" class="onboarding-progress mb-4">
      <h2 class="progress-title">{{ $t('merchantDetail.onboardingProgress') }}</h2>
      <StepFlow v-if="flowSteps" :steps="flowSteps" size="lg" />
    </div>

    <!-- 当前步骤面板（审核已结束时只展示下方只读回看） -->
    <div v-if="stage && stage !== 'DONE'" class="art-card overflow-hidden">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <h2 class="text-sm font-semibold text-g-900">{{ currentStepTitle }}</h2>
        <div class="flex items-center gap-2">
          <el-button v-if="canDecideInitial" size="small" @click="showQuestionnaireEdit = true">
            {{ $t('merchantDetail.editQuestionnaire') }}
          </el-button>
          <ArtStatusTag :status="stepBadgeTone" :text="stepBadgeLabel" />
        </div>
      </div>

      <!-- 步骤一：资格筛查（已拒绝时首屏即为拒绝提示，与终审一致） -->
      <div v-if="stage === 'INITIAL'" class="p-5">
        <div v-if="initialRejected" class="verification-note rejected">
          <ArtSvgIcon icon="ri:close-circle-line" class="text-icon-md verification-note-icon" />
          <div class="verification-note-body">
            <div class="verification-note-title">
              {{ $t('merchantDetail.initialRejectedNoteTitle') }}
            </div>
            <div class="verification-note-desc">{{
              $t('merchantDetail.initialRejectedNoteDesc')
            }}</div>
            <div class="verification-note-reason">
              {{ $t('merchantStatus.initialRejectedReason') }}：{{ rejectReasonText }}
            </div>
          </div>
        </div>

        <PrescreeningPanel v-if="detail.questionnaire" :questionnaire="detail.questionnaire">
          <div
            v-if="canDecideInitial"
            class="flex justify-center gap-3 pt-4 border-t border-[var(--default-border)]"
          >
            <el-button
              type="danger"
              plain
              :loading="rejecting"
              :disabled="approving"
              @click="openRejectDialog('INITIAL')"
            >
              {{ $t('merchantDetail.reject') }}
            </el-button>
            <el-button
              type="primary"
              :loading="approving"
              :disabled="rejecting"
              @click="handleApproveScreening"
            >
              {{ $t('merchantDetail.approve') }}
            </el-button>
          </div>
        </PrescreeningPanel>
        <div v-else class="py-8 text-center text-sm text-g-400">
          {{ $t('merchantDetail.noQuestionnaire') }}
        </div>
      </div>

      <!-- 步骤二：KYB -->
      <div v-else-if="stage === 'KYB'" class="p-5">
        <!-- 提示模块：阶段说明；等待客户时邮箱与验证链接的操作也统一放在这里 -->
        <div class="verification-note" :class="kybPanel.tone">
          <ArtSvgIcon :icon="kybPanel.icon" class="text-icon-md verification-note-icon" />
          <div class="verification-note-body">
            <div class="verification-note-title">{{ kybPanel.title }}</div>
            <div class="verification-note-desc">{{ kybPanel.desc }}</div>

            <template v-if="kybPanel.waitingCustomer">
              <!-- 已生成：链接 + 有效期 + 复制 -->
              <template v-if="sdkLink">
                <div class="verification-link-box">
                  <div class="verification-link-row">
                    <el-link
                      class="verification-link-url"
                      type="primary"
                      :href="sdkLink.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ sdkLink.url }}
                    </el-link>
                    <el-button size="small" text @click="handleCopySdkLink">
                      <ArtSvgIcon icon="ri:file-copy-line" class="text-icon-sm mr-1" />
                      {{ $t('merchantDetail.copyLink') }}
                    </el-button>
                  </div>
                  <div class="verification-link-expiry">
                    {{
                      $t('merchantDetail.verificationLinkExpiresAt', {
                        time: formatDateTime(sdkLink.expiresAt)
                      })
                    }}
                  </div>
                </div>
                <div class="verification-note-contact">
                  <span class="verification-note-email">
                    {{ $t('merchantDetail.verificationCustomerEmail') }}:
                    <strong>{{ detail.email || '--' }}</strong>
                  </span>
                </div>
              </template>

              <!-- 未生成：引导生成链接并发送邮件 -->
              <div v-else class="verification-note-contact">
                <span class="verification-note-email">
                  {{ $t('merchantDetail.verificationCustomerEmail') }}:
                  <strong>{{ detail.email || '--' }}</strong>
                </span>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :loading="sdkLinkLoading"
                  :disabled="sdkLinkLoading"
                  @click="handleGenerateSdkLink"
                >
                  <ArtSvgIcon icon="ri:send-plane-line" class="text-icon-sm mr-1" />
                  {{ $t('merchantDetail.generateLink') }}
                </el-button>
              </div>
            </template>
          </div>
        </div>

        <!-- 验证子进度（Verification Progress） -->
        <div class="kyb-progress-card">
          <div class="text-sm font-semibold text-g-900 mb-4">
            {{ $t('merchantDetail.verificationProgress') }}
          </div>
          <StepFlow v-if="kybSubSteps" :steps="kybSubSteps" size="sm" />

          <!-- 手动同步：强制从 Sumsub 拉一次最新状态 -->
          <div class="flex justify-end mt-4 pt-4 border-t border-[var(--default-border)]">
            <el-button size="small" :loading="refreshing" @click="handleRefreshKyb">
              <ArtSvgIcon icon="ri:refresh-line" class="text-icon-sm mr-1" />
              {{ $t('merchantDetail.refreshKyb') }}
            </el-button>
          </div>
        </div>

        <!-- Sumsub 出结果后才展示身份核验与筛查 -->
        <IdentityVerificationPanel
          v-if="hasKybResult"
          :identity="detail.identityVerification"
          :beneficiaries="detail.beneficiaries"
          :merchant-name="detail.merchantName"
        />
      </div>

      <!-- 步骤三：终审（已拒绝时提示模块切换为拒绝态，不再提示「待终审」） -->
      <div v-else-if="stage === 'FINAL'" class="p-5">
        <!-- 提示模块：阶段说明 + 已上传材料概览 -->
        <div class="verification-note" :class="finalRejected ? 'rejected' : 'reviewing'">
          <ArtSvgIcon
            :icon="finalRejected ? 'ri:close-circle-line' : 'ri:shield-check-line'"
            class="text-icon-md verification-note-icon"
          />
          <div class="verification-note-body">
            <div class="verification-note-title">
              {{
                finalRejected
                  ? $t('merchantDetail.finalRejectedNoteTitle')
                  : $t('merchantDetail.finalReviewNoteTitle')
              }}
            </div>
            <div class="verification-note-desc">
              {{
                finalRejected
                  ? $t('merchantDetail.finalRejectedNoteDesc')
                  : $t('merchantDetail.finalReviewNoteDesc')
              }}
            </div>
            <div v-if="documentsLoaded" class="final-review-summary">
              <!-- 拒绝态：与初审一致，平铺文本 -->
              <template v-if="finalRejected">
                <div class="verification-note-reason">
                  {{ $t('merchantStatus.finalRejectedReason') }}：{{ rejectReasonText }}
                </div>
              </template>
              <!-- 有已上传材料 -->
              <span
                v-else-if="documentCount > 0"
                class="flex items-center gap-1 text-[var(--tone-done-text)]"
              >
                <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-icon-sm" />
                {{ $t('merchantDetail.finalReviewDocsReady', { count: documentCount }) }}
              </span>
              <!-- 待终审且尚未上传 -->
              <span
                v-else-if="canDecideFinal"
                class="flex items-center gap-1 text-[var(--tone-progress-text)]"
              >
                <ArtSvgIcon icon="ri:error-warning-line" class="text-icon-sm" />
                {{ $t('merchantDetail.finalReviewDocsMissing') }}
              </span>
              <span v-else class="text-tone-muted-text">
                {{ $t('merchantDetail.finalReviewDocsNone') }}
              </span>
            </div>
          </div>
        </div>

        <!-- 终审材料：与原型一致，卡片标题就是 Agreements -->
        <div class="final-review-card">
          <div class="final-review-card-header">
            <div>
              <div class="final-review-card-title">{{ $t('merchantDetail.agreementsTitle') }}</div>
              <div class="final-review-card-desc">
                {{
                  canDecideFinal
                    ? $t('merchantDetail.agreementsHint')
                    : $t('merchantDetail.agreementsReadonlyHint')
                }}
              </div>
            </div>
          </div>
          <AgreementsPanel
            :ecode="detail.ecode"
            :editable="canDecideFinal"
            @loaded="handleAgreementsLoaded"
          />
        </div>

        <div
          v-if="canDecideFinal"
          class="flex justify-center gap-3 pt-5 mt-5 border-t border-[var(--default-border)]"
        >
          <el-button
            type="danger"
            plain
            :loading="rejecting"
            :disabled="approving"
            @click="openRejectDialog('FINAL')"
          >
            {{ $t('merchantDetail.reject') }}
          </el-button>
          <el-button
            type="primary"
            :loading="approving"
            :disabled="rejecting"
            @click="handleApproveFinal"
          >
            {{ $t('merchantDetail.finalApprove') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 已完成后回看的只读信息 -->
    <div v-if="stage === 'DONE'" class="art-card p-5 mt-4">
      <el-tabs v-model="completedTab">
        <el-tab-pane :label="$t('merchantDetail.tabPrescreening')" name="prescreening">
          <PrescreeningPanel
            :questionnaire="detail.questionnaire"
            :beneficiaries="detail.beneficiaries"
            :show-beneficiaries="true"
          />
        </el-tab-pane>
        <el-tab-pane :label="$t('merchantDetail.tabIdentity')" name="identity">
          <IdentityVerificationPanel
            :identity="detail.identityVerification"
            :beneficiaries="detail.beneficiaries"
            :merchant-name="detail.merchantName"
          />
        </el-tab-pane>
        <el-tab-pane :label="$t('merchantDetail.tabAgreements')" name="agreements">
          <AgreementsPanel :ecode="detail.ecode" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 拒绝原因弹窗（初审 / 终审各自独立） -->
    <el-dialog v-model="showRejectDialog" :title="rejectDialogTitle" width="440px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        :placeholder="$t('merchantDetail.rejectReasonPlaceholder')"
      />
      <template #footer>
        <el-button @click="showRejectDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="rejecting" @click="handleReject">
          {{ $t('merchantDetail.reject') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 问卷编辑弹窗 -->
    <QuestionnaireEditForm
      v-model:visible="showQuestionnaireEdit"
      :ecode="detail.ecode"
      :questionnaire="detail.questionnaire"
      @saved="handleQuestionnaireSaved"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    approveKybFinalReview,
    approveKybScreening,
    createKybSdkLink,
    rejectKybFinalReview,
    rejectKybScreening,
    type AdminMerchantKybDetailView
  } from '@/api/merchant'
  import { KybStatus } from '@/enums/merchantEnum'
  import {
    buildFlowSteps,
    buildKybSubSteps,
    reviewStageOf,
    type ReviewStage
  } from '@/features/merchant/merchantStepper'
  import {
    MerchantStatus,
    merchantStatusOf,
    resolveMerchantRejectReason
  } from '@/utils/merchantStatus'
  import StepFlow from './StepFlow.vue'
  import PrescreeningPanel from './PrescreeningPanel.vue'
  import IdentityVerificationPanel from './IdentityVerificationPanel.vue'
  import AgreementsPanel from './AgreementsPanel.vue'
  import QuestionnaireEditForm from './QuestionnaireEditForm.vue'

  defineOptions({ name: 'MerchantOnboardingView' })

  const props = defineProps<{
    detail: AdminMerchantKybDetailView
    /** 重新拉取详情（审批 / 拒绝 / 刷新 KYB 后调用） */
    reload: () => Promise<void>
  }>()

  const { t } = useI18n()

  const completedTab = ref('prescreening')
  const showRejectDialog = ref(false)
  const showQuestionnaireEdit = ref(false)
  const rejectReason = ref('')
  const rejectStage = ref<'INITIAL' | 'FINAL'>('INITIAL')
  const approving = ref(false)
  const rejecting = ref(false)
  const refreshing = ref(false)

  // ─── KYB 验证链接（直接使用详情接口返回的数据）───
  const sdkLinkLoading = ref(false)

  /** 详情接口返回的有效 SDK 链接（未过期） */
  const sdkLink = computed(() => {
    const link = props.detail.kybSdkLink
    if (!link?.url || !link?.expiresAt) return null
    const expiresAt = new Date(link.expiresAt).getTime()
    if (expiresAt <= Date.now()) return null
    return {
      url: link.url,
      externalUserId: link.externalUserId,
      createdAt: new Date(link.issuedAt).getTime(),
      expiresAt
    }
  })

  const kybState = computed(() => props.detail.kybStatus?.toUpperCase() || '')

  const merchantStatus = computed<MerchantStatus | null>(() =>
    merchantStatusOf({
      merchantStatus: props.detail.merchantStatus,
      latestKybStatus: props.detail.kybStatus,
      apiStatus: props.detail.enterpriseStatus,
      ecode: props.detail.ecode
    })
  )

  const stage = computed<ReviewStage | null>(() => reviewStageOf(props.detail.kybStatus))

  /** 进度条只在审核流程中展示（取消 / 冻结不展示） */
  const showStepper = computed(() => stage.value !== null)

  const flowSteps = computed(() => {
    if (!stage.value) return null
    return buildFlowSteps({
      kybStatus: props.detail.kybStatus,
      labels: [
        t('merchantDetail.stagePreScreening'),
        t('merchantDetail.stageKyb'),
        t('merchantDetail.stageComplianceReview')
      ],
      appliedAt: props.detail.appliedAt,
      questionnaireReviewedAt: props.detail.questionnaire?.reviewedAt,
      timeline: props.detail.approvalTimeline,
      t
    })
  })

  const kybSubSteps = computed(() =>
    buildKybSubSteps({
      kybStatus: props.detail.kybStatus,
      appliedAt: props.detail.appliedAt,
      providerApprovedAt: formatDateTime(props.detail.approvalTimeline?.providerApprovedAt),
      t
    })
  )

  /** 初审决策：仅当对外状态为「待初审」 */
  const canDecideInitial = computed(
    () => merchantStatus.value === MerchantStatus.PendingInitialReview
  )

  /** 终审决策：仅当对外状态为「待复审」 */
  const canDecideFinal = computed(() => merchantStatus.value === MerchantStatus.PendingFinalReview)

  // ─── 终审材料概览（AgreementsPanel 加载完成后回传数量）───
  const documentCount = ref(0)
  const documentsLoaded = ref(false)
  /** 终审已拒绝：提示模块切换为拒绝态，且只读陈述事实 */
  const finalRejected = computed(() => merchantStatus.value === MerchantStatus.FinalRejected)

  function handleAgreementsLoaded(count: number) {
    documentCount.value = count
    documentsLoaded.value = true
  }

  /** 客户已提交身份材料、等待三方审核 */
  const kybReviewing = computed(() =>
    [KybStatus.Submitted, KybStatus.NeedSupplement].includes(kybState.value as KybStatus)
  )

  const isAnyRejected = computed(
    () =>
      merchantStatus.value === MerchantStatus.InitialRejected ||
      merchantStatus.value === MerchantStatus.KybRejected ||
      merchantStatus.value === MerchantStatus.FinalRejected
  )

  /** 初审已拒绝：资格筛查步骤的提示区切换为拒绝态 */
  const initialRejected = computed(() => merchantStatus.value === MerchantStatus.InitialRejected)

  /**
   * 拒绝原因：三种来源不能混用。
   *   初审 → 问卷 screeningReason；终审 → rejectReason（兼容 finalReviewReason）；KYB → Sumsub reviewComment
   */
  const rejectReasonText = computed(() => {
    const d = props.detail
    const reviewComment =
      d.reviewComment ||
      (kybState.value === KybStatus.Rejected && d.identityVerification?.companyVerificationStatus
        ? t('merchantDetail.kybRejectedFallback', {
            status: d.identityVerification.companyVerificationStatus
          })
        : '')
    const reason = resolveMerchantRejectReason(merchantStatus.value, {
      screeningReason: d.questionnaire?.screeningReason || d.screeningReason,
      finalReviewReason: d.rejectReason || d.finalReviewReason,
      reviewComment
    })
    return reason || t('merchantDetail.rejectReasonNotProvided')
  })

  /** KYB 面板文案：按 KYB 内部状态区分阶段 */
  const kybPanel = computed<{
    tone: 'waiting' | 'reviewing' | 'supplement' | 'rejected'
    icon: string
    title: string
    desc: string
    /** 是否等待客户完成验证（展示邮箱与验证链接操作） */
    waitingCustomer: boolean
  }>(() => {
    const email = props.detail.email || '--'
    switch (kybState.value) {
      case KybStatus.Draft:
        return {
          tone: 'waiting',
          icon: 'ri:time-line',
          // 未生成链接与已发送链接时的标题 / 说明分开，避免把「还没发」说成「已发送」
          title: t(
            sdkLink.value
              ? 'merchantDetail.kybNoteSubmittingTitle'
              : 'merchantDetail.kybNoteSubmittingNoLinkTitle'
          ),
          desc: t(
            sdkLink.value
              ? 'merchantDetail.kybNoteSubmittingDesc'
              : 'merchantDetail.kybNoteSubmittingNoLinkDesc',
            { email }
          ),
          waitingCustomer: true
        }
      case KybStatus.NeedSupplement:
        return {
          tone: 'supplement',
          icon: 'ri:file-warning-line',
          title: t('merchantDetail.kybNoteSupplementTitle'),
          desc: t(
            sdkLink.value
              ? 'merchantDetail.kybNoteSupplementDesc'
              : 'merchantDetail.kybNoteSupplementNoLinkDesc',
            { email }
          ),
          waitingCustomer: true
        }
      case KybStatus.Submitted:
        return {
          tone: 'reviewing',
          icon: 'ri:search-eye-line',
          title: t('merchantDetail.kybNoteReviewingTitle'),
          desc: t('merchantDetail.verificationNoteReviewing'),
          waitingCustomer: false
        }
      case KybStatus.Rejected:
        return {
          tone: 'rejected',
          icon: 'ri:close-circle-line',
          title: t('merchantDetail.kybNoteRejectedTitle'),
          desc: t('merchantDetail.kybNoteRejectedDesc'),
          waitingCustomer: false
        }
      default:
        return {
          tone: 'reviewing',
          icon: 'ri:shield-check-line',
          title: t('merchantDetail.kybNoteResultTitle'),
          desc: t('merchantDetail.kybNoteResultDesc'),
          waitingCustomer: false
        }
    }
  })

  /** 是否已有三方核验结论（KYB 进行中不展示身份核验区块） */
  const hasKybResult = computed(() => {
    const verificationStatus = (
      props.detail.identityVerification?.companyVerificationStatus || ''
    ).toLowerCase()
    if (verificationStatus && verificationStatus !== 'pending') return true
    return kybState.value === KybStatus.Rejected || kybState.value === KybStatus.Approved
  })

  const currentStepTitle = computed(() => {
    if (stage.value === 'INITIAL') return t('merchantDetail.stagePreScreening')
    if (stage.value === 'KYB') return t('merchantDetail.stageKyb')
    if (stage.value === 'FINAL') return t('merchantDetail.stageComplianceReview')
    return t('merchantDetail.reviewClosed')
  })

  /** 步骤徽章配色，与步骤条一致：拒绝=danger / 进行中=warning / 完成=success */
  const stepBadgeTone = computed<'success' | 'warning' | 'danger' | null>(() => {
    if (isAnyRejected.value) return 'danger'
    if (stage.value === 'DONE') return 'success'
    return 'warning'
  })

  const stepBadgeLabel = computed(() => {
    if (isAnyRejected.value) return t('merchantDetail.rejected')
    if (stage.value === 'INITIAL') return t('merchantDetail.awaitingDecision')
    if (stage.value === 'KYB') {
      if (kybState.value === KybStatus.Draft) return t('merchantDetail.kybSubmitting')
      return kybReviewing.value
        ? t('merchantDetail.verificationReviewing')
        : t('merchantDetail.verificationRequested')
    }
    if (stage.value === 'FINAL') return t('merchantDetail.awaitingFinalDecision')
    return ''
  })

  const rejectDialogTitle = computed(() =>
    rejectStage.value === 'FINAL'
      ? t('merchantDetail.finalRejectReasonTitle')
      : t('merchantDetail.rejectReason')
  )

  // ─── 动作 ───
  async function handleApproveScreening() {
    approving.value = true
    try {
      await approveKybScreening(props.detail.ecode)
      ElMessage.success(t('merchantDetail.approveSuccess'))
      await props.reload()
    } catch {
      ElMessage.error(t('merchantDetail.approveFailed'))
    } finally {
      approving.value = false
    }
  }

  async function handleApproveFinal() {
    try {
      await ElMessageBox.confirm(
        t('merchantDetail.finalApproveConfirm'),
        t('merchantDetail.finalApprove'),
        { type: 'warning' }
      )
    } catch {
      return
    }
    approving.value = true
    try {
      await approveKybFinalReview(props.detail.ecode)
      ElMessage.success(t('merchantDetail.finalApproveSuccess'))
      await props.reload()
    } catch {
      ElMessage.error(t('merchantDetail.finalApproveFailed'))
    } finally {
      approving.value = false
    }
  }

  function openRejectDialog(stageToReject: 'INITIAL' | 'FINAL') {
    rejectStage.value = stageToReject
    rejectReason.value = ''
    showRejectDialog.value = true
  }

  async function handleReject() {
    rejecting.value = true
    try {
      if (rejectStage.value === 'FINAL') {
        await rejectKybFinalReview(props.detail.ecode, rejectReason.value || undefined)
      } else {
        await rejectKybScreening(props.detail.ecode, rejectReason.value || undefined)
      }
      showRejectDialog.value = false
      ElMessage.success(t('merchantDetail.rejectSuccess'))
      await props.reload()
    } catch {
      ElMessage.error(t('merchantDetail.rejectFailed'))
    } finally {
      rejecting.value = false
    }
  }

  /**
   * 生成 KYB 验证链接并发送邮件。
   * 仅在无有效链接时调用，生成后触发详情重载以同步接口数据。
   */
  async function handleGenerateSdkLink() {
    const email = props.detail.email || '--'

    sdkLinkLoading.value = true
    try {
      await createKybSdkLink(props.detail.ecode)
      ElMessage.success(t('merchantDetail.generateLinkSuccess', { email }))
      await props.reload()
    } catch (error) {
      ElMessage.error(
        t('merchantDetail.generateLinkFailed', {
          error: error instanceof Error ? error.message : String(error)
        })
      )
    } finally {
      sdkLinkLoading.value = false
    }
  }

  /** 复制验证链接给运营使用 */
  async function handleCopySdkLink() {
    if (!sdkLink.value) return
    try {
      await navigator.clipboard.writeText(sdkLink.value.url)
      ElMessage.success(t('merchantDetail.copyLinkSuccess'))
    } catch {
      ElMessage.error(t('merchantDetail.copyLinkFailed'))
    }
  }

  /** 刷新 KYB：重新拉取详情后重渲染 */
  async function handleRefreshKyb() {
    refreshing.value = true
    try {
      await props.reload()
      ElMessage.success(t('merchantDetail.refreshKybSuccess'))
    } catch (error) {
      ElMessage.error(
        t('merchantDetail.refreshKybFailed', {
          error: error instanceof Error ? error.message : String(error)
        })
      )
    } finally {
      refreshing.value = false
    }
  }

  /** 问卷编辑保存后重载详情 */
  async function handleQuestionnaireSaved() {
    await props.reload()
  }

  /** 时间格式化：接口时间保留原样截断；本地时间戳（毫秒）按本地时区展示 */
  function formatDateTime(v?: string | number | null): string {
    if (v == null || v === '') return ''
    if (typeof v === 'number') {
      const d = new Date(v)
      const pad = (n: number) => String(n).padStart(2, '0')
      return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      )
    }
    return v.replace('T', ' ').slice(0, 19)
  }
</script>

<style scoped>
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

  /* ── KYB 验证面板 ── */
  .verification-note {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    margin-bottom: 16px;
    border: 1px solid;
    border-radius: 8px;
  }

  .verification-note.waiting,
  .verification-note.reviewing,
  .verification-note.supplement {
    background: var(--tone-progress-bg);
    border-color: var(--tone-progress-border);
  }

  .verification-note.rejected {
    background: var(--tone-error-bg);
    border-color: var(--tone-error-border);
  }

  .verification-note.waiting .verification-note-icon,
  .verification-note.waiting .verification-note-title,
  .verification-note.reviewing .verification-note-icon,
  .verification-note.reviewing .verification-note-title,
  .verification-note.supplement .verification-note-icon,
  .verification-note.supplement .verification-note-title {
    color: var(--tone-progress-text);
  }

  .verification-note.rejected .verification-note-icon,
  .verification-note.rejected .verification-note-title {
    color: var(--tone-error-text);
  }

  .verification-note-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .verification-note-body {
    flex: 1;
    min-width: 0;
  }

  .verification-note-title {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
  }

  .verification-note-desc {
    font-size: 12px;
    line-height: 1.6;
    color: var(--tone-secondary-text);
  }

  /* 提示模块内的操作区：邮箱 + 生成 / 重新生成链接 */
  .verification-note-contact {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
  }

  .verification-note-email {
    font-size: 12px;
    color: var(--tone-secondary-text);
  }

  .verification-note-email strong {
    font-weight: 600;
    color: var(--tone-strong-text);
  }

  .verification-link-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    margin-top: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .verification-link-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .verification-link-url {
    min-width: 0;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .verification-link-row :deep(.el-button) {
    flex-shrink: 0;
    margin-left: auto;
  }

  .verification-link-expiry {
    font-size: 11px;
    color: var(--tone-muted-text);
  }

  /* 终审：提示模块内的材料概览 */
  .final-review-summary {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 500;
  }

  /* 终审：材料卡片（与原型一致：白底卡片 + 标题/说明 + 分类列表） */
  .final-review-card {
    padding: 20px;
    border: 1px solid var(--default-border);
    border-radius: 12px;
  }

  .final-review-card-header {
    margin-bottom: 12px;
  }

  .final-review-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--tone-strong-text);
  }

  .final-review-card-desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--tone-secondary-text);
  }

  /* 拒绝原因行：放在提示模块内部，左侧色条区分，不再独立成框 */
  .verification-note-reason {
    padding-left: 10px;
    margin-top: 8px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.6;
    color: var(--tone-error-text);
    border-left: 3px solid var(--tone-error-border);
  }

  /* 旧样式保留，供其他组件使用 */
  .reject-reason {
    padding: 8px 12px;
    margin-top: 10px;
    background: var(--tone-error-bg);
    border: 1px solid var(--tone-error-border);
    border-radius: 6px;
  }

  .reject-reason-label {
    display: block;
    margin-bottom: 2px;
    font-size: 12px;
    font-weight: 600;
    color: var(--tone-error-text);
  }

  .reject-reason-text {
    font-size: 12px;
    line-height: 1.6;
    color: var(--tone-neutral-text);
  }

  .kyb-progress-card {
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--default-border);
    border-radius: 12px;
  }
</style>
