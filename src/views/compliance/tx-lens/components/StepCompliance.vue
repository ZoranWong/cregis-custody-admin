<!-- Step: Compliance — 合规审查 -->
<template>
  <div>
    <!-- Compliance Sub-Tabs -->
    <div class="sub-tab-bar mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="sub-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ $t(tab.label) }}
      </button>
    </div>

    <!-- Risk Profile（Risk Score/Decision/Conclusion 均为 '--' 时整卡不显示） -->
    <div v-show="activeTab === 'assessment'">
      <!-- Rules Triggered -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.rulesTriggered')
          }}</span>
          <span class="text-xs font-semibold text-g-500">
            {{ rulesTriggered.length }}
            {{ rulesTriggered.length === 1 ? $t('txLens.detail.rule') : $t('txLens.detail.rules') }}
          </span>
        </div>
        <div class="p-4 flex flex-col gap-2">
          <div
            v-if="rulesTriggered.length === 0"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-success-light-9)] border border-[var(--el-color-success-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-success text-base" />
            <div>
              <div class="text-sm font-medium text-success">{{
                $t('txLens.detail.noRulesTriggered')
              }}</div>
              <div class="text-xs text-g-500 mt-0.5">{{
                $t('txLens.detail.noRulesTriggeredHint')
              }}</div>
            </div>
          </div>
          <div
            v-for="rule in rulesTriggered"
            :key="rule.ruleCode"
            class="border border-[var(--default-border)] rounded-lg p-3"
          >
            <!-- 规则名 + 严重级别 + 跳转规则详情 -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span class="text-sm font-semibold text-g-900">{{ rule.ruleName }}</span>
                <el-tag
                  v-if="rule.severity"
                  :type="severityTag(rule.severity)"
                  size="small"
                  effect="light"
                >
                  {{ severityLabelOf(rule.severity) }}
                </el-tag>
              </div>
              <el-button
                v-if="rule.id != null"
                text
                size="small"
                class="flex-shrink-0 !px-1"
                @click="openRule(rule.id)"
              >
                {{ $t('txLens.detail.viewRule') }}
              </el-button>
            </div>

            <!-- 命中条件 -->
            <div v-if="rule.conditions?.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="(cond, ci) in rule.conditions"
                :key="ci"
                class="px-2 py-0.5 bg-g-50 border border-[var(--default-border)] rounded text-[11px] text-g-700"
              >
                {{ conditionLabel(cond) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Due Diligence -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.cdd') }}</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-2">
          <div v-if="cddItems.length === 0" class="text-xs text-g-400">--</div>
          <div
            v-for="item in cddItems"
            :key="item.label"
            class="flex items-center gap-1.5 text-xs"
            :class="item.available === false ? 'text-g-400' : 'text-g-700'"
          >
            <!-- available=false：后端无数据源，展示占位而非 ✗ -->
            <span v-if="item.available === false" class="text-g-300">—</span>
            <span v-else :class="item.passed ? 'text-success font-bold' : 'text-g-400'">
              {{ item.passed ? '✓' : '✗' }}</span
            >
            <span>{{ cddLabel(item.label) }}</span>
            <span v-if="item.available === false" class="text-g-400 ml-1">{{
              $t('txLens.detail.notAvailable')
            }}</span>
            <span v-else-if="item.value" class="text-g-400 ml-1">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- Screening Results -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.screeningResults')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="!hasScreening"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noScreeningResult') }}</span>
          </div>
          <template v-else>
            <!-- Entity Screening：VASP / Beneficiary 两行（对齐原型）
                 subject 为空不显示该行；result 为 NA 时展示 Clear -->
            <div v-if="entityRows.length" class="mb-4">
              <div
                class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                >{{ $t('txLens.detail.entityScreening') }}</div
              >
              <div
                v-for="row in entityRows"
                :key="row.labelKey"
                class="flex items-center justify-between gap-2 py-1.5"
              >
                <span class="text-xs font-medium text-g-800 truncate">
                  {{ $t(row.labelKey) }}<template v-if="row.subject"> — {{ row.subject }}</template>
                </span>
                <el-tag :type="screeningTagType(row.result)" size="small" effect="plain">{{
                  screeningLabel(row.result)
                }}</el-tag>
              </div>
            </div>
            <div>
              <div
                class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                >{{ $t('txLens.detail.onChainScreening') }}</div
              >
              <!-- 出金：双方地址 + 地址级风险等级（KYA） -->
              <template v-if="isOutgoing">
                <div
                  v-for="(item, i) in onChainScreening"
                  :key="'og-' + i"
                  class="py-1.5 border-b border-[var(--default-border)] last:border-b-0"
                >
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[10px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.originatorAddress')
                    }}</span>
                    <el-tag
                      :type="levelTagType(item.originatorLevel)"
                      size="small"
                      effect="plain"
                      >{{ levelLabel(item.originatorLevel) }}</el-tag
                    >
                  </div>
                  <div class="text-xs text-g-700 font-mono break-all">{{
                    item.originatorAddresses?.join(', ') || '--'
                  }}</div>
                  <div class="flex items-center justify-between gap-2 mb-1 mt-2.5">
                    <span class="text-[10px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.beneficiaryAddress')
                    }}</span>
                    <el-tag
                      :type="levelTagType(item.beneficiaryLevel)"
                      size="small"
                      effect="plain"
                      >{{ levelLabel(item.beneficiaryLevel) }}</el-tag
                    >
                  </div>
                  <div class="text-xs text-g-700 font-mono break-all">{{
                    item.beneficiaryAddresses?.join(', ') || '--'
                  }}</div>
                </div>
              </template>
              <!-- 入金：整笔交易哈希 + 交易级结论（KYT） -->
              <template v-else>
                <div
                  v-for="(item, i) in onChainScreening"
                  :key="'in-' + i"
                  class="py-1.5 border-b border-[var(--default-border)] last:border-b-0"
                >
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[10px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.txHashLabel')
                    }}</span>
                    <!-- 入金展示 result（NA/UNKNOWN/LOW 统一为 Clear），不展示 txLevel -->
                    <el-tag
                      :type="screeningTagType(normalizeResult(item.result))"
                      size="small"
                      effect="plain"
                    >
                      {{ screeningLabel(normalizeResult(item.result)) }}
                    </el-tag>
                  </div>
                  <div class="text-xs text-g-700 font-mono break-all">{{ item.txId || '--' }}</div>
                  <div class="text-[11px] text-g-400 font-mono truncate mt-0.5">
                    {{ txAddressSummary(item) }}
                  </div>
                </div>
              </template>
              <div v-if="onChainScreening.length === 0" class="text-xs text-g-400 py-1.5">--</div>
            </div>
          </template>
        </div>
      </div>

      <!-- Travel Rule（对齐原型：VASP Identity 多字段 + IVMS101 PII Exchange 状态） -->
      <div v-if="hasTravelRule" class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.travelRuleCompliance')
          }}</span>
        </div>
        <div class="p-4">
          <!-- IVMS101 PII Exchange（仅保留状态行，对齐原型；有效绿 / 无效红并附缺失字段数） -->
          <div
            class="flex items-center justify-between px-3.5 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
          >
            <span class="text-xs font-semibold text-g-600">{{
              $t('txLens.detail.ivms101PiiExchange')
            }}</span>
            <span class="text-xs font-semibold" :class="ivms101StatusClass">
              {{ ivms101StatusText }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作：合规状态为审查中时显示审核按钮（clear / flagged 不显示） -->
      <div
        v-if="showReviewActions"
        class="flex items-center justify-between gap-3 mt-2 px-4 py-3 bg-[var(--el-fill-color-light)] border border-[var(--default-border)] rounded-lg"
      >
        <span class="text-xs text-g-600">{{ $t('txLens.detail.pendingReviewHint') }}</span>
        <div class="flex gap-2 flex-shrink-0">
          <!-- 两个按钮各自独立 loading，避免点一个时另一个也转圈 -->
          <el-button type="danger" :loading="rejecting" @click="emit('reject')">{{
            $t('txLens.detail.reject')
          }}</el-button>
          <el-button type="success" :loading="approving" @click="emit('approve')">{{
            $t('txLens.detail.approve')
          }}</el-button>
        </div>
      </div>
    </div>

    <!-- Communication（按原型展示 mock 问答轮次；按钮未实现，点击提示开发中） -->
    <div v-show="activeTab === 'communication'">
      <div class="art-card mb-4">
        <div class="p-4">
          <!-- mock 提示：接口无数据源，内容仅样式参考 -->
          <div
            class="flex items-center gap-2 px-4 py-3 mb-4 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.commMockHint') }}</span>
          </div>

          <!-- 操作按钮（对齐原型右上角）：弹框交互可用，提交时提示开发中 -->
          <div class="flex justify-end gap-2 mb-4">
            <el-button size="small" @click="openRequestInfo">{{
              $t('txLens.detail.requestInfo')
            }}</el-button>
            <el-button size="small" @click="openRequestPii">{{
              $t('txLens.detail.requestPiiUpdate')
            }}</el-button>
          </div>

          <!-- 问答轮次（mock 数据，新→旧） -->
          <div v-for="round in commRounds" :key="round.n" class="question-round">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[13px] font-semibold text-g-900">{{
                $t('txLens.detail.roundQuestionsRaised', { n: round.n })
              }}</span>
              <span class="text-[11px] text-g-400">{{ round.time }}</span>
            </div>
            <div class="text-[11px] text-g-500 mb-1.5">{{
              $t('txLens.detail.byComplianceTeam')
            }}</div>
            <div class="text-xs text-g-600 mb-2.5">
              {{
                round.n === 1
                  ? $t('txLens.detail.complianceReviewed')
                  : $t('txLens.detail.additionalClarification')
              }}
            </div>
            <div v-for="qa in round.qas" :key="qa.q" class="mb-2.5">
              <div class="flex gap-1.5 mb-1">
                <span class="text-[11px] font-bold text-[var(--el-color-primary)] flex-shrink-0"
                  >Q{{ qa.idx }}</span
                >
                <span class="text-xs text-g-800">{{ qa.q }}</span>
              </div>
              <div class="pl-5">
                <div class="text-[10px] font-semibold uppercase text-g-400 mb-0.5">
                  {{ $t('txLens.detail.answer') }}
                </div>
                <!-- 文件型回答：文件名可点（原型为下载语义），下载功能未实现 -->
                <button
                  v-if="qa.file"
                  type="button"
                  class="flex items-center gap-1.5 text-xs text-[var(--el-color-primary)] hover:underline"
                  @click="notifyDev('txLens.detail.fileDownloadPending')"
                >
                  <ArtSvgIcon icon="ri:file-text-line" class="text-icon-sm" />
                  {{ qa.a }}
                </button>
                <div v-else class="text-xs text-g-700 leading-relaxed">{{ qa.a }}</div>
              </div>
            </div>
            <div
              class="text-[11px] text-g-400 mt-2 pt-1.5 border-t border-dashed border-[var(--el-border-color-light)]"
            >
              {{ $t('txLens.detail.responseSubmitted') }}: {{ round.respondedAt }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compliance Timeline -->
    <div v-show="activeTab === 'timeline'">
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.compTimeline')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="timeline.length === 0"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
          </div>
          <div v-else class="timeline-chain">
            <div v-for="node in timeline" :key="node.label + node.time" class="timeline-node">
              <div class="timeline-dot" :style="toneDotStyle(timelineNodeTone(node))" />
              <div class="text-sm font-semibold text-g-800">{{ timelineLabel(node.label) }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ timelineDetail(node.detail) }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Information 弹框（对齐原型 requestInfoModal）：动态问题列表，提交时提示开发中 -->
    <el-dialog
      v-model="requestInfoVisible"
      :title="$t('txLens.detail.requestInfoTitle')"
      width="560px"
      :close-on-click-modal="true"
      append-to-body
    >
      <div class="flex flex-col gap-2">
        <div v-for="(q, i) in requestQuestions" :key="i" class="flex items-center gap-2">
          <el-input
            v-model="requestQuestions[i]"
            :placeholder="$t('txLens.detail.questionPlaceholder')"
            maxlength="200"
          />
          <el-button
            text
            type="danger"
            :disabled="requestQuestions.length <= 1"
            @click="removeQuestion(i)"
          >
            <ArtSvgIcon icon="ri:subtract-line" class="text-icon-md" />
          </el-button>
        </div>
        <el-button text type="primary" class="self-start !px-0" @click="addQuestion">
          <ArtSvgIcon icon="ri:add-line" class="text-icon-sm mr-1" />
          {{ $t('txLens.detail.addQuestion') }}
        </el-button>
      </div>
      <template #footer>
        <el-button @click="requestInfoVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitRequestInfo">{{
          $t('txLens.detail.sendRequest')
        }}</el-button>
      </template>
    </el-dialog>

    <!-- Request PII Update 确认框：列出 mock 缺失字段，提交时提示开发中 -->
    <el-dialog
      v-model="requestPiiVisible"
      :title="$t('txLens.detail.requestPiiUpdate')"
      width="560px"
      :close-on-click-modal="true"
      append-to-body
    >
      <div class="text-xs text-g-600 mb-3">
        {{ $t('txLens.detail.piiFieldsRequireResubmission') }}
      </div>
      <div class="flex flex-col gap-2">
        <div
          v-for="f in PII_MISSING_FIELDS"
          :key="f"
          class="flex items-center justify-between px-3 py-2 bg-[var(--el-fill-color-light)] rounded-md"
        >
          <span class="text-sm text-g-800">{{ f }}</span>
          <el-tag type="danger" size="small" effect="light">{{
            $t('txLens.detail.piiMissing')
          }}</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="requestPiiVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitRequestPii">{{
          $t('txLens.detail.sendRequest')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import type {
    ComplianceTabView,
    OnchainScreeningItemView,
    RuleTriggerView
  } from '@/features/compliance/types'
  import { formatTime } from '@/utils/format'
  import {
    conditionText,
    severityLabel,
    severityTagType,
    type TagType
  } from '@/features/compliance/dictionaries'
  import {
    CONCLUSION_DICT,
    DECISION_DICT,
    toneDotStyle,
    timelineNodeTone
  } from '@/features/compliance/txState'

  const { t } = useI18n()
  const router = useRouter()

  const props = defineProps<{
    data: ComplianceTabView | null
    direction: string
    /** 放行中（独立控制，避免与拒绝共用 loading） */
    approving?: boolean
    /** 拒绝中 */
    rejecting?: boolean
  }>()
  const emit = defineEmits<{ (e: 'approve'): void; (e: 'reject'): void }>()

  /**
   * Communication 问答轮次（mock）。
   * 接口暂无数据源，内容取自原型 compliance-tx-lens-detail.html 的两轮问答，
   * 仅作样式参考；接口就绪后删除本常量并改接 props.data 即可。
   */
  const commRounds = [
    {
      n: 2,
      time: '2026-07-28 10:30 UTC',
      respondedAt: '2026-07-28 11:45 UTC',
      qas: [
        {
          idx: 1,
          q: 'Please provide proof of business relationship with the beneficiary.',
          a: 'Business_relationship_contract.pdf',
          file: true
        },
        {
          idx: 2,
          q: 'Please clarify the purpose of this transaction.',
          a: 'Payment for consulting services provided by the beneficiary for regulatory audit preparation.',
          file: false
        }
      ]
    },
    {
      n: 1,
      time: '2026-07-28 09:15 UTC',
      respondedAt: '2026-07-28 10:05 UTC',
      qas: [
        {
          idx: 1,
          q: 'Please provide source of funds documentation.',
          a: 'Source_of_funds_statement.pdf',
          file: true
        },
        {
          idx: 2,
          q: "Clarify the beneficiary's identity and relationship.",
          a: 'Independent compliance consultant engaged on a project basis.',
          file: false
        }
      ]
    }
  ]

  /** 文件下载：功能未实现，给出具体提示 */
  function notifyDev(pendingKey: string) {
    ElMessage.info(t(pendingKey))
  }

  // ─── Request Information / Request PII Update 弹框（交互可用，提交提示开发中）───
  const requestInfoVisible = ref(false)
  /** 问题列表：至少保留一行，最后一行不可删 */
  const requestQuestions = ref<string[]>([''])
  const requestPiiVisible = ref(false)
  /** IVMS101 校验缺失字段（mock，对齐原型 PII_VALIDATION_RESULT） */
  const PII_MISSING_FIELDS = [
    'Originator Date of Birth',
    'Originator National ID',
    'Beneficiary Address'
  ]

  function openRequestInfo() {
    // 每次打开重置为单行空问题
    requestQuestions.value = ['']
    requestInfoVisible.value = true
  }

  function addQuestion() {
    requestQuestions.value.push('')
  }

  function removeQuestion(i: number) {
    if (requestQuestions.value.length > 1) requestQuestions.value.splice(i, 1)
  }

  function submitRequestInfo() {
    const filled = requestQuestions.value.filter((q) => q.trim() !== '')
    if (!filled.length) {
      ElMessage.warning(t('txLens.detail.questionRequired'))
      return
    }
    // TODO: 接口就绪后在此发起提交
    requestInfoVisible.value = false
    ElMessage.info(t('txLens.detail.requestInfoPending'))
  }

  function openRequestPii() {
    requestPiiVisible.value = true
  }

  function submitRequestPii() {
    // TODO: 接口就绪后在此发起提交
    requestPiiVisible.value = false
    ElMessage.info(t('txLens.detail.requestPiiPending'))
  }

  /** 出金方向：链上筛查按地址级（KYA）展示，入金按交易级（KYT） */
  const isOutgoing = computed(() => String(props.direction).toLowerCase() === 'outgoing')

  const activeTab = ref('assessment')

  /**
   * 审核按钮显示条件：dispositionStatus 为 PENDING（待审核）。
   * PENDING = 待审核（显示按钮）
   * APPROVED = 审核通过（不显示按钮）
   * REJECTED = 审核拒绝（不显示按钮）
   */
  const showReviewActions = computed(() => props.data?.dispositionStatus === 'PENDING')

  const tabs = [
    { key: 'assessment', label: 'txLens.detail.subTabRiskProfile' },
    { key: 'communication', label: 'txLens.detail.subTabCommunication' },
    { key: 'timeline', label: 'txLens.detail.subTabTimeline' }
  ]

  const rulesTriggered = computed(() => props.data?.rulesTriggered || [])
  const cddItems = computed(() => props.data?.cddChecklist || [])
  const onChainScreening = computed(() => props.data?.screening?.onchain || [])

  /**
   * Entity Screening 两行（VASP / Beneficiary，对齐原型）：
   *   - subject 为空 → 该行不展示
   *   - result 为 NA → 语义等同 Clear
   */
  const entityRows = computed(() => {
    const e = props.data?.screening?.entity
    if (!e) return [] as Array<{ labelKey: string; subject: string | null; result: string }>
    const rows = [
      { labelKey: 'txLens.detail.entityVasp', ...e.vasp },
      { labelKey: 'txLens.detail.entityBeneficiary', ...e.beneficiary }
    ]
    return rows.filter((r) => !!r.subject).map((r) => ({ ...r, result: normalizeResult(r.result) }))
  })

  /**
   * 筛查结论归一：NA / UNKNOWN / LOW 均视为无风险 → CLEAR
   * （无 TR 记录、目录属性缺失、低风险等级在展示上等价于通过）
   */
  /**
   * 筛查结论归一。文档取值域：CLEAR / HIT / UNKNOWN / NOT_REQUIRED
   *   HIT                              → Hit（命中）
   *   CLEAR / UNKNOWN / NOT_REQUIRED   → Clear（无风险 / 无记录 / 无需筛查）
   * 注意：MEDIUM / HIGH 属于 *Level 字段的值域，不会出现在 result 中。
   */
  function normalizeResult(result: string): string {
    return (result || '').toUpperCase() === 'HIT' ? 'HIT' : 'CLEAR'
  }

  // ─── 规则展示统一走 dictionaries 的格式化函数 ───
  function severityTag(severity: string): TagType {
    return severityTagType(severity)
  }
  function severityLabelOf(severity: string): string {
    return severityLabel(severity, t)
  }
  function conditionLabel(cond: RuleTriggerView['conditions'][number]): string {
    return conditionText(cond, t)
  }

  /** 筛查结论 → el-tag type：命中红 / 其余（Clear 等）绿 */
  function screeningTagType(result: string): TagType {
    if (result === 'HIT' || result === 'FAILED') return 'danger'
    if (result === 'REVIEW') return 'warning'
    return 'success'
  }

  /** 筛查结果 → 前端描述文案（不直接展示后端枚举） */
  function screeningLabel(result: string): string {
    const map: Record<string, string> = {
      CLEAR: 'txLens.detail.screeningClear',
      VERIFIED: 'txLens.detail.screeningClear',
      REVIEW: 'txLens.detail.screeningReview',
      HIT: 'txLens.detail.screeningHit',
      FAILED: 'txLens.detail.screeningHit',
      UNKNOWN: 'txLens.detail.screeningUnknown',
      NOT_REQUIRED: 'txLens.detail.screeningNotRequired'
    }
    const key = map[result]
    return key ? t(key) : result || '--'
  }

  /**
   * 地址风险等级 → el-tag type
   * 命中（红）：MEDIUM / HIGH / SEVERE / CRITICAL / HIT
   * 未命中（绿）：null / LOW / CLEAR
   */
  function levelTagType(level: string | null): TagType {
    return isLevelHit(level) ? 'danger' : 'success'
  }

  /** 地址风险等级 → 展示文案：命中显示 Hit，未命中显示 Clear */
  function levelLabel(level: string | null): string {
    return isLevelHit(level) ? t('txLens.detail.screeningHit') : t('txLens.detail.screeningClear')
  }

  /** 该等级是否判定为命中（MEDIUM 及以上 / HIT） */
  function isLevelHit(level: string | null): boolean {
    const v = (level || '').toUpperCase()
    return ['MEDIUM', 'HIGH', 'SEVERE', 'CRITICAL', 'HIT'].includes(v)
  }

  /** 入金：把双方地址压成一行摘要（txId 为主，地址仅作副信息） */
  function txAddressSummary(item: OnchainScreeningItemView): string {
    const from = item.originatorAddresses?.[0]
    const to = item.beneficiaryAddresses?.[0]
    if (!from && !to) return ''
    const short = (a: string) => (a.length > 14 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a)
    return `${short(from || '--')} → ${short(to || '--')}`
  }

  // ─── 跳转规则详情（接口已直接返回规则 id）───
  function openRule(ruleId: number) {
    router.push({ name: 'ComplianceRuleDetail', params: { id: ruleId } })
  }

  // 是否有筛查结果（entity 两行 + onchain 列表均无内容视为无数据）
  const hasScreening = computed(() => {
    const s = props.data?.screening
    if (!s) return false
    return entityRows.value.length > 0 || (s.onchain && s.onchain.length > 0)
  })
  const timeline = computed(() => props.data?.timeline || [])
  const travelRuleSummary = computed(() => props.data?.travelRuleSummary || null)

  // 是否展示 Travel Rule 卡：
  //   - 无 summary / status 为 N/A → 无 TR
  //   - status 为 UNMATCHED → 对手方未匹配，无可展示的 VASP/PII 信息，整卡隐藏
  //   - 其余状态视为有 TR 记录
  /**
   * 是否展示 Travel Rule 卡。
   * 新版接口的 travelRuleSummary 有两种形态：
   *   有 TR → { ivms101Valid, ivms101MissingFields, ivms101Pii:{originator,beneficiary} }（无 status）
   *   无 TR → 三字段全 null
   * 因此以 ivms101Pii 是否有数据为主判据；旧版仍可回退 status 判定。
   */
  const hasTravelRule = computed(() => {
    const s = travelRuleSummary.value
    if (!s) return false
    if (s.ivms101Pii && Object.keys(s.ivms101Pii).length > 0) return true
    if (typeof s.ivms101Valid === 'boolean') return true
    const status = (s.status || '').toUpperCase()
    return !!status && status !== 'N/A' && status !== 'UNMATCHED'
  })

  /** IVMS101 校验状态：兼容新版 ivms101Valid(boolean) 与旧版 ivms101Status(字符串) */
  const ivms101State = computed<'VALID' | 'INVALID' | null>(() => {
    const s = travelRuleSummary.value
    if (!s) return null
    if (typeof s.ivms101Valid === 'boolean') return s.ivms101Valid ? 'VALID' : 'INVALID'
    if (s.ivms101Status === 'VALID') return 'VALID'
    if (s.ivms101Status === 'INVALID') return 'INVALID'
    return null
  })

  const ivms101StatusText = computed(() => {
    const state = ivms101State.value
    if (!state) return '--'
    if (state === 'VALID') return `${t('txLens.detail.ivmsValid')} ✓`
    // 无效：对齐原型 "Invalid — N Missing Fields"，字段数取缺失列表长度或缺失计数
    const missing = travelRuleSummary.value?.ivms101MissingFields
    const n = missing?.length || travelRuleSummary.value?.ivms101MissingFieldCount
    return n
      ? `${t('txLens.detail.ivmsInvalid')} — ${n} ${t('txLens.detail.missingFields')}`
      : t('txLens.detail.ivmsInvalid')
  })

  const ivms101StatusClass = computed(() => {
    const state = ivms101State.value
    if (state === 'VALID') return 'text-success'
    if (state === 'INVALID') return 'text-danger'
    return 'text-g-600'
  })

  /** 后端返回的 CDD label → 翻译；未收录的 label 原样展示 */
  const CDD_LABELS: Record<string, string> = {
    'Onboarding Status': 'txLens.detail.cddLabelOnboarding',
    'Corporate Identity': 'txLens.detail.cddLabelCorporateIdentity',
    'Corporate Identity Verified': 'txLens.detail.cddLabelCorporateIdentity',
    Jurisdiction: 'txLens.detail.cddLabelJurisdiction',
    'Entity Type': 'txLens.detail.cddLabelEntityType',
    'Risk Level': 'txLens.detail.cddLabelRiskLevel'
  }

  function cddLabel(label: string): string {
    const key = CDD_LABELS[label]
    return key ? t(key) : label
  }

  // ─── 时间线：label / detail 为后端枚举，统一翻译 ───
  const TIMELINE_LABELS: Record<string, string> = {
    'Rule Triggered': 'txLens.detail.timelineRuleTriggered',
    'Compliance Decision': 'txLens.detail.tlComplianceDecision',
    'Travel Rule': 'txLens.detail.tabTravelRule',
    'Sign-off': 'txLens.detail.tabSignOff',
    'On-Chain': 'txLens.detail.tabOnChain'
  }

  function timelineLabel(label: string): string {
    const key = TIMELINE_LABELS[label]
    return key ? t(key) : label
  }

  /** detail 可能是决策值（HOLD / MANUAL_REVIEW）或自由文本 */
  function timelineDetail(detail: string): string {
    const key =
      DECISION_DICT.find((d) => d.value === detail)?.labelKey ||
      CONCLUSION_DICT.find((d) => d.value === detail)?.labelKey
    return key ? t(key) : detail
  }
</script>

<style scoped>
  .pii-round {
    border-color: var(--el-color-warning-light-5);
  }

  .sub-tab-bar {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: var(--el-fill-color);
    border-radius: 8px;
  }

  .sub-tab {
    padding: 6px 14px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .sub-tab:hover {
    color: var(--el-text-color-primary);
  }

  .sub-tab.active {
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-bg-color);
    box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
  }

  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  /*
   * 连接线改为「节点间线段」：
   *   ① 原先用容器级 ::before 从 top 拉到 bottom，会一直延伸到容器底部，
   *      最后一个圆点下方仍拖出一条线；
   *   ② left:7px 与圆心（-14+12/2=-8 → 容器坐标 10px…）差 2px，连线不过圆心。
   * 几何：圆点相对节点 left:-20 / width:12 → 圆心 x=-14px，
   *       2px 线取 left:-15px 即对齐；纵向覆盖到下一节点圆点顶边。
   */
  .timeline-node:not(:last-child)::before {
    position: absolute;
    top: 16px;
    bottom: -4px;
    left: -15px;
    width: 2px;
    content: '';
    background: var(--el-border-color-light);
  }

  .timeline-node {
    position: relative;
    padding-bottom: 16px;
  }

  .timeline-node:last-child {
    padding-bottom: 0;
  }

  .timeline-dot {
    position: absolute;
    top: 4px;
    left: -20px;
    width: 12px;
    height: 12px;

    /* 用容器底色而非硬编码白：暗色模式下白圈会在深底上形成刺眼光晕 */
    border: 2px solid var(--default-box-color);
    border-radius: 50%;
  }

  /* Communication 问答轮次分隔（对齐原型 .question-round：轮与轮之间细线隔开） */
  .question-round {
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .question-round:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: none;
  }

  /* 圆点颜色由 toneDotStyle 内联注入 */
</style>
