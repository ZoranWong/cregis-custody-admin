/**
 * 商户审核步骤条：状态映射与步骤数据（纯函数，无 Vue 依赖）。
 *
 * 主步骤条（Pre-screening → KYB → Compliance Review）与 KYB 子进度
 *（Submitted → Result）的状态完全由 kybStatus 驱动。这里把两张映射表
 * 与构建步骤数据的逻辑集中到一处，视图组件只负责渲染：
 *   - 新增/调整状态只改 KYB_FLOW_RULES / KYB_PROGRESS_RULES
 *   - 验收脚本可以直接调用这些函数，不需要正则解析 SFC
 */
import { KybStatus } from '@/enums/merchantEnum'

/** 主步骤状态；空串 = 待处理（灰） */
export type FlowStepState = '' | 'active' | 'waiting' | 'completed' | 'failed'

/** 圆圈视觉状态（主步骤条 / KYB 子进度共用） */
export type StepVisual = 'completed' | 'active' | 'waiting' | 'failed' | 'pending'

/** 审核阶段 */
export type ReviewStage = 'INITIAL' | 'KYB' | 'FINAL' | 'DONE'

export interface StepItem {
  key: string
  label: string
  state: FlowStepState | StepVisual
  /** 圆圈内图标；null 时显示序号 */
  icon: string | null
  /** 圆圈内文字（仅无图标时使用） */
  text?: string
  meta: string
}

export interface KybFlowRule {
  /** 当前阶段：0=Pre-screening，1=KYB，2=Compliance Review，3=全部完成 */
  index: number
  /** 被拒的步骤下标（无则 null） */
  rejected: number | null
  prescreening: FlowStepState
  kyb: FlowStepState
}

/**
 * 主步骤映射表（唯一来源）。
 *
 * FROZEN 优先级高于 KYB，冻结时 merchantStatus = FROZEN，
 * 不在这张表里覆盖 —— 冻结企业不进入审核流程展示。
 */
export const KYB_FLOW_RULES: Record<string, KybFlowRule> = {
  // 等待初审决策
  [KybStatus.PendingScreening]: { index: 0, rejected: null, prescreening: 'active', kyb: '' },
  // 初审拒绝：停在第一步（KYB 未开始）
  [KybStatus.AdminRejected]: { index: 0, rejected: 0, prescreening: 'failed', kyb: '' },
  // 以下三种都在 KYB 步骤，但均非 Admin 动作，显示为 waiting（琥珀）
  [KybStatus.Draft]: { index: 1, rejected: null, prescreening: 'completed', kyb: 'waiting' },
  [KybStatus.Submitted]: { index: 1, rejected: null, prescreening: 'completed', kyb: 'waiting' },
  [KybStatus.NeedSupplement]: {
    index: 1,
    rejected: null,
    prescreening: 'completed',
    kyb: 'waiting'
  },
  // 三方审核拒绝
  [KybStatus.Rejected]: { index: 1, rejected: 1, prescreening: 'completed', kyb: 'failed' },
  // 三方通过，等待 Admin 终审
  [KybStatus.PendingFinalReview]: {
    index: 2,
    rejected: null,
    prescreening: 'completed',
    kyb: 'completed'
  },
  // 终审拒绝
  [KybStatus.FinalRejected]: {
    index: 2,
    rejected: 2,
    prescreening: 'completed',
    kyb: 'completed'
  },
  // 全部通过（已入驻视图）
  [KybStatus.Approved]: { index: 3, rejected: null, prescreening: 'completed', kyb: 'completed' },
  // 流程取消：停在 3 但单独标记，只展示「已取消」，不画成通过
  [KybStatus.Cancelled]: { index: 3, rejected: null, prescreening: 'completed', kyb: 'completed' }
}

export interface KybSubStepRule {
  submitted: StepVisual
  result: StepVisual
  /** Result 步文案 key；缺省按状态给默认文案 */
  resultMetaKey?: string
}

/**
 * KYB 子步骤映射表（第一行=已提交，第二行=结果）。
 *
 *   kybStatus            已提交              结果
 *   DRAFT                waiting             pending
 *   SUBMITTED            completed           waiting  ← 等待三方出结果
 *   NEED_SUPPLEMENT      completed           waiting  ← 文案为「待补件」
 *   PENDING_FINAL_REVIEW completed           completed
 *   APPROVED             completed           completed
 *   REJECTED             completed           failed
 *   ADMIN_REJECTED       waiting             failed   ← 初审即拒绝，客户未进入 KYB
 *   FINAL_REJECTED       completed           completed← 三方已通过
 *   CANCELLED            completed           pending  ← 文案「已取消」
 */
export const KYB_PROGRESS_RULES: Record<string, KybSubStepRule> = {
  [KybStatus.Draft]: { submitted: 'waiting', result: 'pending' },
  [KybStatus.Submitted]: { submitted: 'completed', result: 'waiting' },
  [KybStatus.NeedSupplement]: { submitted: 'completed', result: 'waiting' },
  [KybStatus.PendingFinalReview]: { submitted: 'completed', result: 'completed' },
  [KybStatus.Approved]: { submitted: 'completed', result: 'completed' },
  [KybStatus.Rejected]: { submitted: 'completed', result: 'failed' },
  [KybStatus.AdminRejected]: { submitted: 'waiting', result: 'failed' },
  [KybStatus.FinalRejected]: { submitted: 'completed', result: 'completed' },
  [KybStatus.Cancelled]: {
    submitted: 'completed',
    result: 'pending',
    resultMetaKey: 'merchantDetail.cancelledStatus'
  }
}

/** 视觉状态 → 圆圈图标；待处理无图标（显示序号） */
export function stepCircleIcon(visual: StepVisual): string | null {
  if (visual === 'completed') return 'ri:check-line'
  if (visual === 'active' || visual === 'waiting') return 'ri:time-line'
  if (visual === 'failed') return 'ri:close-line'
  return null
}

/** 各步骤操作时间（approvalTimeline），保持原样截断到秒 */
function stepTime(value?: string | null): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 19)
}

export interface ApprovalTimeline {
  screeningReviewedAt?: string | null
  providerApprovedAt?: string | null
  finalReviewedAt?: string | null
}

export interface FlowStepsInput {
  kybStatus?: string | null
  /** 三个阶段标题（调用方传入已翻译文案，保持纯函数无 i18n 依赖） */
  labels: [string, string, string]
  appliedAt?: string | null
  screeningReviewedAt?: string | null
  /** 问卷 reviewedAt：初审时间兜底 */
  questionnaireReviewedAt?: string | null
  timeline?: ApprovalTimeline | null
  /** 已翻译的文案表 */
  t: (key: string) => string
}

/** 主步骤条数据 */
export function buildFlowSteps(input: FlowStepsInput): StepItem[] {
  const { kybStatus, labels, appliedAt, timeline, t } = input
  const stateKey = (kybStatus || '').toUpperCase()
  const rule = KYB_FLOW_RULES[stateKey] ?? null
  const applied = stepTime(appliedAt)
  const doneAt = [
    stepTime(timeline?.screeningReviewedAt) || stepTime(input.questionnaireReviewedAt),
    stepTime(timeline?.providerApprovedAt),
    stepTime(timeline?.finalReviewedAt)
  ]

  return labels.map((label, index) => {
    // 第 1/2 步状态来自映射表；第 3 步只区分「已完成 / 进行中 / 被拒 / 待处理」
    let state: FlowStepState = ''
    if (index === 0) state = rule?.prescreening ?? ''
    else if (index === 1) state = rule?.kyb ?? ''
    else if (rule?.rejected === 2) state = 'failed'
    else if (rule && rule.index > 2) state = 'completed'
    else if (rule && rule.index === 2) state = 'active'

    let meta = t('merchantDetail.pendingMeta')
    if (state === 'active') {
      meta = t('merchantDetail.inProgress')
    } else if (state === 'waiting') {
      // KYB 步骤按具体状态区分：等客户提交 / 待补件 / 三方审核中
      if (index === 1) {
        if (stateKey === KybStatus.Draft) meta = t('merchantDetail.awaitingCustomer')
        else if (stateKey === KybStatus.NeedSupplement)
          meta = t('merchantDetail.supplementRequired')
        else meta = t('merchantDetail.verificationReviewing')
      } else {
        meta = t('merchantDetail.awaitingCustomer')
      }
    } else if (state === 'failed') {
      meta = t('merchantDetail.rejected')
    } else if (state === 'completed') {
      // 有操作时间显示时间；缺失时退回「已通过」/ 第一步的申请时间
      meta = doneAt[index] || (index === 0 && applied) || t('merchantDetail.passed')
    }

    const visual: StepVisual = state === '' ? 'pending' : state
    return {
      key: `step-${index}`,
      label,
      state,
      icon: stepCircleIcon(visual),
      text: String(index + 1),
      meta
    }
  })
}

export interface KybSubStepsInput {
  kybStatus?: string | null
  appliedAt?: string | null
  /** 三方通过时间；后端暂不区分两个阶段，两个子步骤共用 */
  providerApprovedAt?: string | null
  t: (key: string) => string
}

/** KYB 子进度（Verification Progress）数据 */
export function buildKybSubSteps(input: KybSubStepsInput): StepItem[] {
  const { kybStatus, appliedAt, providerApprovedAt, t } = input
  const stateKey = (kybStatus || '').toUpperCase()
  const rule = KYB_PROGRESS_RULES[stateKey]
  const submittedState: StepVisual = rule?.submitted ?? 'pending'
  const resultState: StepVisual = rule?.result ?? 'pending'
  const submittedAt = stepTime(appliedAt)
  const isDraft = stateKey === KybStatus.Draft

  const resultMeta =
    resultState === 'completed' && providerApprovedAt
      ? providerApprovedAt
      : subStepMeta(resultState, t, rule?.resultMetaKey)

  return [
    {
      key: 'submitted',
      label: isDraft ? t('merchantDetail.waitingSubmit') : t('merchantDetail.subStepSubmitted'),
      state: submittedState,
      icon: stepCircleIcon(submittedState),
      meta: isDraft
        ? t('merchantDetail.inProgress')
        : submittedState === 'completed'
          ? submittedAt || t('merchantDetail.passed')
          : t('merchantDetail.pendingMeta')
    },
    {
      key: 'result',
      label: t('merchantDetail.subStepResult'),
      state: resultState,
      icon: stepCircleIcon(resultState),
      meta: resultMeta
    }
  ]
}

/** 子步骤默认文案 */
function subStepMeta(state: StepVisual, t: (key: string) => string, metaKey?: string): string {
  if (metaKey) return t(metaKey)
  if (state === 'waiting') return t('merchantDetail.submittedStatus')
  if (state === 'completed') return t('merchantDetail.passed')
  if (state === 'failed') return t('merchantDetail.rejected')
  if (state === 'active') return t('merchantDetail.inProgress')
  return t('merchantDetail.pendingMeta')
}

/** 由 kybStatus 推导审核阶段；不在流程中（取消/未知）返回 null */
export function reviewStageOf(kybStatus?: string | null): ReviewStage | null {
  const stateKey = (kybStatus || '').toUpperCase()
  if (stateKey === KybStatus.Cancelled) return null
  const rule = KYB_FLOW_RULES[stateKey]
  if (!rule) return null
  if (rule.index === 0) return 'INITIAL'
  if (rule.index === 1) return 'KYB'
  if (rule.index === 2) return 'FINAL'
  return 'DONE'
}
