<!-- Step: Travel Rule — Travel Rule 事件 -->
<template>
  <div>
    <!-- 无 Travel Rule 通知 -->
    <div v-if="!hasTravelRule" class="art-card mb-4">
      <div class="p-4 flex items-center gap-2">
        <ArtSvgIcon :icon="emptyHint.icon" class="text-tone-info-text text-icon-md" />
        <span class="text-sm text-g-700">{{ $t(emptyHint.text) }}</span>
      </div>
    </div>

    <template v-else>
      <!-- VASP Identity：字段对齐原型（名称 + 双列网格 + IVMS 状态行），接口无数据的字段不展示 -->
      <div v-if="hasVaspDeclaration" class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.vaspIdentity')
          }}</span>
        </div>
        <div class="p-4">
          <div class="vasp-identity-box">
            <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspDisplayName }}</div>
            <div class="grid grid-cols-2 gap-3">
              <div v-if="vaspJurisdiction" class="flex flex-col gap-0.5">
                <span class="field-label">{{ $t('txLens.detail.vaspJurisdiction') }}</span>
                <span class="text-sm text-g-800 font-medium">{{ vaspJurisdiction }}</span>
              </div>
              <div v-if="vaspRegulatory" class="flex flex-col gap-0.5">
                <span class="field-label">{{ $t('txLens.detail.vaspRegulatory') }}</span>
                <span class="text-sm text-g-800 font-medium">{{ vaspRegulatory }}</span>
              </div>
              <div v-if="vaspTrCapable" class="flex flex-col gap-0.5">
                <span class="field-label">{{ $t('txLens.detail.trCapableLabel') }}</span>
                <span class="text-sm text-g-800 font-medium">{{ vaspTrCapable }}</span>
              </div>
              <div v-if="vaspDid" class="flex flex-col gap-0.5">
                <span class="field-label">{{ $t('txLens.detail.vaspDid') }}</span>
                <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                  vaspDid
                }}</span>
              </div>
            </div>
          </div>
          <!-- 没有 IVMS101 数据（ivms101Valid 为空）时，交换状态行无意义，不展示 -->
          <div
            v-if="hasIvms101Data"
            class="flex items-center justify-between px-3 py-2.5 bg-g-100 border border-[var(--default-border)] rounded-md"
          >
            <span class="text-xs font-semibold text-g-600">{{
              $t('txLens.detail.ivms101PiiExchange')
            }}</span>
            <span class="text-xs font-semibold" :class="ivms101StatusClass">{{
              ivms101StatusText
            }}</span>
          </div>

          <!--
            VASP 核对不一致（MISMATCH）时：
              · 不提供「补充 VASP 信息」—— 该字段应由客户申报，运营侧改不了；
              · 改为提示运营联系客户补全 / 更正数据，并附带不一致的具体原因。
            核对一致时仍保留「补充 VASP 信息」入口。
          -->
          <div v-if="showVaspMismatchActions" class="vasp-mismatch-notice mt-3">
            <ArtSvgIcon icon="ri:alert-line" class="text-icon-md mt-0.5 flex-shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-semibold">{{
                $t('txLens.detail.vaspMismatchContactTitle')
              }}</div>
              <div class="text-xs mt-0.5 leading-relaxed">
                {{ $t('txLens.detail.vaspMismatchContactBody') }}
              </div>
              <div class="text-xs mt-1 font-medium">{{ vaspMismatchHint }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- IVMS101 PII Details：接口没有 PII 数据时整张卡片不渲染 -->
      <div v-if="piiFields.length" class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.ivms101PiiDetails')
          }}</span>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 gap-3">
            <div v-for="field in piiFields" :key="field.label" class="pii-field">
              <div class="pii-field-label">{{ field.label }}</div>
              <div class="pii-field-value">{{ field.value || '--' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!--
        Operations 区块的显示条件：
          Manual Resolution   —— 仅出金（我方发起线下取证）
          Network Negotiation —— 仅当交易真正发到过 Notabene（notabeneTxId 非空）
        两者都没有时不渲染整块，避免给出无对象的操作入口。
      -->
      <div v-if="showManualResolution || showNetworkNegotiation" class="art-card mb-4">
        <div class="p-4">
          <div v-if="showManualResolution && showNetworkNegotiation" class="sub-tab-bar mb-4">
            <button
              class="sub-tab"
              :class="{ active: opsTab === 'manual' }"
              @click="opsTab = 'manual'"
            >
              {{ $t('txLens.detail.manualResolution') }}
            </button>
            <button
              class="sub-tab"
              :class="{ active: opsTab === 'network' }"
              @click="opsTab = 'network'"
            >
              {{ $t('txLens.detail.networkNegotiation') }}
            </button>
          </div>
          <!-- 只有一个页签时，直接给出该小节标题，保持信息结构一致 -->
          <div v-else class="text-sm font-semibold text-g-900 mb-4">
            {{
              showManualResolution
                ? $t('txLens.detail.manualResolution')
                : $t('txLens.detail.networkNegotiation')
            }}
          </div>

          <!-- Manual Resolution（仅出金） -->
          <div v-show="showManualResolution && (!showNetworkNegotiation || opsTab === 'manual')">
            <div class="text-xs text-g-700 mb-3 leading-relaxed">
              {{ $t('txLens.detail.offNetworkDescription') }}
            </div>
            <div v-if="!travelRuleReadOnly" class="flex gap-3 mb-4 flex-wrap">
              <el-button size="small" @click="notifyDev('txLens.detail.shareLinkPending')">
                <ArtSvgIcon icon="ri:link" class="text-icon-sm mr-1" />{{
                  $t('txLens.detail.generateShareLink')
                }}
              </el-button>
              <!-- 原型：Upload Proof 打开上传弹框（PDF/PNG/JPG，可多选） -->
              <el-button size="small" @click="openEvidenceDialog">
                <ArtSvgIcon icon="ri:upload-line" class="text-icon-sm mr-1" />{{
                  $t('txLens.detail.uploadProof')
                }}
              </el-button>
            </div>

            <!--
              第二行：强制通过 + 取消。
              后端新增 /vasp/confirm（VASP 不一致时强制放行）与 /cancel（取消挂起出金订单）。
              强制通过仅在核对结果为 MISMATCH 时出现 —— 无不一致时放行没有语义。
              （「补充 / 修正 VASP 信息」在 VASP Identity 卡片内，不在这里重复）
            -->
            <div class="flex gap-3 mb-4 flex-wrap">
              <el-button
                v-if="showVaspMismatchActions"
                type="primary"
                size="small"
                :loading="vaspActing"
                @click="handleVaspConfirm"
                >{{ $t('txLens.detail.resolve') }}</el-button
              >
              <el-button
                v-if="showCancelButton"
                type="danger"
                plain
                size="small"
                :loading="cancelling"
                @click="handleCancel"
                >{{ $t('txLens.detail.reject') }}</el-button
              >
            </div>
            <p v-if="showVaspMismatchActions" class="text-xs text-tone-error-text mb-3">
              {{ vaspMismatchHint }}
            </p>
            <!-- 子页签：Manual Trace / Proof Chain（自由切换） -->
            <div class="sub-tab-bar mb-3">
              <button
                class="sub-tab"
                :class="{ active: evidenceTab === 'trace' }"
                @click="evidenceTab = 'trace'"
              >
                {{ $t('txLens.detail.manualTrace') }}
              </button>
              <button
                class="sub-tab"
                :class="{ active: evidenceTab === 'proof' }"
                @click="evidenceTab = 'proof'"
              >
                {{ $t('txLens.detail.proofChain') }}
              </button>
            </div>
            <!-- 接口无数据时展示原型 mock（提示条样式与 rules detail 一致：琥珀 + alert 图标） -->
            <div v-show="evidenceTab === 'trace'">
              <div v-if="manualTraceIsMock" class="mock-inline-notice mb-3">
                <ArtSvgIcon icon="ri:alert-line" class="text-icon-md mt-0.5 flex-shrink-0" />
                <span class="text-xs leading-relaxed">{{
                  $t('txLens.detail.manualTraceMockHint')
                }}</span>
              </div>
              <div
                v-if="!manualTrace.length"
                class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
              >
                <ArtSvgIcon
                  icon="ri:information-line"
                  class="text-[var(--el-color-info)] text-base"
                />
                <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
              </div>
              <div v-else class="timeline-chain">
                <div
                  v-for="node in manualTrace"
                  :key="node.label + node.time"
                  class="timeline-node"
                >
                  <div class="timeline-dot" :style="toneDotStyle(timelineNodeTone(node))" />
                  <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
                  <div class="text-xs text-g-600 mt-0.5">{{ traceDetail(node.detail) }}</div>
                  <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
                </div>
              </div>
            </div>

            <!-- Proof Chain：与 Manual Trace 同款时间轴，按上传时间正序 -->
            <div v-show="evidenceTab === 'proof'">
              <div
                v-if="!attestations.length"
                class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
              >
                <ArtSvgIcon
                  icon="ri:information-line"
                  class="text-[var(--el-color-info)] text-base"
                />
                <span class="text-sm text-g-700">{{ $t('txLens.detail.noProof') }}</span>
              </div>
              <div v-else class="timeline-chain">
                <div v-for="item in proofChain" :key="item.id" class="timeline-node">
                  <div class="timeline-dot" :style="toneDotStyle('done')" />
                  <a
                    :href="item.fileUrl"
                    target="_blank"
                    rel="noopener"
                    class="text-sm font-semibold text-g-800 hover:text-[var(--el-color-primary)] truncate block"
                    >{{ item.fileName }}</a
                  >
                  <div class="text-xs text-g-600 mt-0.5">
                    {{ attestationTypeLabel(item.type) }} · {{ formatFileSize(item.size) }} ·
                    {{ item.uploader }}
                  </div>
                  <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(item.uploadedAt) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Network Negotiation（仅发往过 Notabene 的交易） -->
          <div v-show="showNetworkNegotiation && (!showManualResolution || opsTab === 'network')">
            <div class="text-xs text-g-700 mb-3 leading-relaxed">
              {{ $t('txLens.detail.networkLifecycleDescription') }}
            </div>
            <div v-if="showResolveRejectButtons" class="flex gap-3 mb-4 flex-wrap">
              <el-button type="primary" size="small" :loading="acting" @click="handleResolve">{{
                $t('txLens.detail.resolve')
              }}</el-button>
              <el-button type="danger" plain size="small" :loading="acting" @click="handleReject">{{
                $t('txLens.detail.reject')
              }}</el-button>
            </div>
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-3">
              {{ $t('txLens.detail.networkTrace') }}
            </div>
            <div
              v-if="!networkTrace.length"
              class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
            >
              <ArtSvgIcon
                icon="ri:information-line"
                class="text-[var(--el-color-info)] text-base"
              />
              <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
            </div>
            <div v-else class="timeline-chain">
              <div v-for="node in networkTrace" :key="node.label + node.time" class="timeline-node">
                <div class="timeline-dot" :style="toneDotStyle(timelineNodeTone(node))" />
                <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
                <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 上传取证材料：对齐原型（拖拽区 + 文件列表 + Cancel/Upload），多选 -->
    <el-dialog
      v-model="evidenceDialogVisible"
      :title="$t('txLens.detail.uploadProofTitle')"
      width="500px"
      @closed="resetEvidenceForm"
    >
      <p class="text-sm text-g-600 leading-relaxed mb-4">{{
        $t('txLens.detail.uploadProofHint')
      }}</p>

      <!-- 与 POST /travel-rule/attestations 的 CreateRequest.attestationType 对齐 -->
      <div class="flex flex-col gap-1 mb-4">
        <label class="text-xs font-semibold text-g-700">{{
          $t('txLens.detail.evidenceType')
        }}</label>
        <el-select v-model="evidenceType" class="!w-64">
          <el-option
            v-for="opt in EVIDENCE_TYPES"
            :key="opt.value"
            :label="$t(opt.labelKey)"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- CreateRequest.remark：取证说明 / 材料来源 -->
      <div class="flex flex-col gap-1 mb-4">
        <label class="text-xs font-semibold text-g-700">{{
          $t('txLens.detail.evidenceRemark')
        }}</label>
        <el-input
          v-model="evidenceRemark"
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
          :placeholder="$t('txLens.detail.evidenceRemarkPlaceholder')"
        />
      </div>

      <input
        ref="evidenceInputRef"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        class="hidden"
        @change="onEvidenceFilesSelected"
      />
      <!-- 上传区：可点击选择，也可直接拖拽文件进来；有明确的可见边界与聚焦态 -->
      <div
        class="evidence-dropzone"
        :class="{ 'is-dragging': draggingEvidence }"
        role="button"
        tabindex="0"
        :aria-label="$t('txLens.detail.evidenceDropHint')"
        @click="evidenceInputRef?.click()"
        @keyup.enter="evidenceInputRef?.click()"
        @keyup.space.prevent="evidenceInputRef?.click()"
        @dragover.prevent="draggingEvidence = true"
        @dragenter.prevent="draggingEvidence = true"
        @dragleave.prevent="draggingEvidence = false"
        @drop.prevent="onEvidenceDrop"
      >
        <ArtSvgIcon icon="ri:upload-cloud-2-line" class="text-icon-xl text-tone-muted-text" />
        <div class="text-sm font-medium text-g-800">{{ $t('txLens.detail.evidenceDropHint') }}</div>
        <div class="text-xs text-tone-muted-text">{{ $t('txLens.detail.evidenceFileLimit') }}</div>
      </div>

      <!-- 已选文件列表：每项可单独移除（对齐原型） -->
      <div v-if="evidenceFiles.length" class="flex flex-col gap-2 mt-4">
        <div
          v-for="(item, idx) in evidenceFiles"
          :key="item.name + idx"
          class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-g-50 border border-[var(--default-border)]"
        >
          <div class="flex items-center gap-2 min-w-0">
            <ArtSvgIcon icon="ri:file-text-line" class="text-icon-sm text-g-500 flex-shrink-0" />
            <div class="min-w-0">
              <div class="text-xs font-medium text-g-800 truncate">{{ item.name }}</div>
              <div class="text-[11px] text-tone-muted-text">{{ formatFileSize(item.size) }}</div>
            </div>
          </div>
          <el-button size="small" text @click="removeEvidenceFile(idx)">
            <ArtSvgIcon icon="ri:close-line" class="text-icon-sm" />
          </el-button>
        </div>
      </div>

      <p v-if="evidenceError" class="text-xs text-tone-error-text mt-3">{{ evidenceError }}</p>

      <template #footer>
        <ElButton @click="closeEvidenceDialog">{{ $t('common.cancel') }}</ElButton>
        <ElButton
          type="primary"
          :loading="uploadingEvidence"
          :disabled="!evidenceFiles.length"
          @click="submitEvidence"
          >{{ $t('txLens.detail.upload') }}</ElButton
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type {
    TimelineNodeView,
    TravelRuleAttestationType,
    TravelRuleAttestationView,
    TravelRuleTabView
  } from '@/features/compliance/types'
  import { toneDotStyle, timelineNodeTone } from '@/features/compliance/txState'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { useCountryStore } from '@/store/modules/country'
  import { useUserStore } from '@/store/modules/user'
  import { formatTime } from '@/utils/format'
  // rejectInboundNotification 待接口开放后重新引入
  import {
    acceptInboundNotification,
    fetchInboundNotifications,
    confirmVaspMismatch,
    rejectTransaction,
    fetchTravelRuleAttestations,
    uploadFile,
    createTravelRuleAttestation
  } from '@/api/compliance'

  const props = defineProps<{
    data: TravelRuleTabView | null
    direction?: string
    orderId?: string
    /**
     * 列表 / overview 的 travelRule 阶段状态（complete / confirming / pending / mismatch…）。
     * 详情接口的 status 与不是一一对应，confirming 这类中间态需要它来判断能否操作。
     */
    stageState?: string | null
  }>()

  const emit = defineEmits<{
    reviewed: []
  }>()

  const { t, locale } = useI18n()
  const countryStore = useCountryStore()
  const userStore = useUserStore()
  const opsTab = ref('manual')
  /** Manual Resolution 内的两个子页签：Manual Trace / Proof Chain */
  const evidenceTab = ref<'trace' | 'proof'>('trace')

  /**
   * Travel Rule 已进入终态 —— 完成 / 失败 / 拒绝都不再允许任何操作入口：
   * 出金不再能 Resolve / Reject，入金也不再能 Accept / Reject，其余操作按钮一并隐藏。
   * 状态来源是详情接口的 `status`（Notabene 状态），大写归一后比较。
   */
  const TRAVEL_RULE_TERMINAL_STATES = [
    'ACCEPTED',
    'COMPLETE',
    'COMPLETED',
    'SETTLED',
    'REJECTED',
    'FAILED',
    'REVERTED'
  ]
  const travelRuleTerminal = computed(() => {
    const s = (props.data?.status || '').toUpperCase()
    return !!s && TRAVEL_RULE_TERMINAL_STATES.includes(s)
  })

  /**
   * 进行中 / 已结束的中间态：已经发往网络、等待对手方处理。
   * 此时不应再提供 Resolve / Reject / 上传证据等本地操作，避免绕过流程。
   */
  const TRAVEL_RULE_IN_FLIGHT_STATES = [
    'CONFIRMING',
    'CONFORMING',
    'UNMATCHED',
    'PII_APPENDED',
    'AUTHORIZED'
  ]
  const travelRuleReadOnly = computed(() => {
    if (travelRuleTerminal.value) return true
    const detail = (props.data?.status || '').toUpperCase()
    if (TRAVEL_RULE_IN_FLIGHT_STATES.includes(detail)) return true
    const stage = (props.stageState || '').toLowerCase()
    return stage === 'confirming' || stage === 'conforming'
  })
  /**
   * Manual Resolution 只对出金交易展示 —— 对端离线/未响应时由我方发起线下取证；
   * 入金方向没有「我方发起」的动作，原型同样对入金隐藏该页签。
   */
  const showManualResolution = computed(() => props.direction !== 'incoming')
  /**
   * 是否发往过 Notabene —— 只看 notabeneTxId。
   * 不能用 networkTrace 判断：没有真正发到网络时 trace 也可能有本地记录，
   * 会误给出「等对方 VASP 授权」这类不存在的入口。
   */
  const showNetworkNegotiation = computed(() => !!props.data?.notabeneTxId)
  const acting = ref(false)
  const notificationId = ref<number | null>(null)

  // ─── VASP 不一致处置 ───
  const vaspActing = ref(false)
  /** 取消挂起出金订单（/cancel） */
  const cancelling = ref(false)

  /** 操作人标识：接口以 query 传入，后端用于审计留痕 */
  const operator = computed(() => String(userStore.info?.userName || '') || undefined)

  /**
   * 展示 VASP 处置入口的条件：
   *   reviewStatus 为 MISMATCH（接口实测取值），或 Travel Rule 阶段本身是 mismatch。
   * 两者任一命中即展示 —— 前者是 vaspDeclaration 的核对结果，
   * 后者是交易列表 travelRule 字段的汇总状态，避免其中一个先更新时入口消失。
   */
  const vaspReviewStatus = computed(() => (declaration.value?.reviewStatus || '').toUpperCase())
  const showVaspMismatchActions = computed(
    () => vaspReviewStatus.value === 'MISMATCH' && !travelRuleReadOnly.value
  )
  const vaspMismatchHint = computed(() => {
    const reason = declaration.value?.reason
    if (reason === 'no-vasp-pending') return t('txLens.detail.vaspMismatchNoVasp')
    if (reason === 'name-mismatch') return t('txLens.detail.vaspMismatchName')
    if (reason === 'did-mismatch') return t('txLens.detail.vaspMismatchDid')
    return t('txLens.detail.vaspMismatchGeneric')
  })

  /** 强制放行：二次确认后调用 /vasp/confirm */
  async function handleVaspConfirm(): Promise<void> {
    if (!props.orderId) return
    try {
      await ElMessageBox.confirm(
        t('txLens.detail.vaspForceApproveConfirm'),
        t('txLens.detail.vaspForceApprove'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
    vaspActing.value = true
    try {
      await confirmVaspMismatch(props.orderId, operator.value)
      ElMessage.success(t('txLens.detail.vaspForceApproveDone'))
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : t('txLens.detail.actionFailed'))
    } finally {
      vaspActing.value = false
    }
  }

  // ─── Manual Resolution：Cancel transfer ───
  /** 仅出金（我方发起的线下取证）才有「取消 / 拒绝」入口 */
  const showCancelButton = computed(
    () => props.direction !== 'incoming' && !travelRuleReadOnly.value
  )

  /**
   * Manual Resolution 的 Cancel transfer 调用「拒绝交易」接口：
   * POST /compliance/transactions/{orderId}/reject?note=...
   * 原因写入 note，随审计轨迹留痕。
   */
  async function handleCancel(): Promise<void> {
    if (!props.orderId) return
    let reason = ''
    try {
      const input = await ElMessageBox.prompt(
        t('txLens.detail.rejectReasonHint'),
        t('txLens.detail.cancelTransfer'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          inputPlaceholder: t('txLens.detail.cancelReasonPlaceholder'),
          type: 'warning'
        }
      )
      reason = String(input.value || '').trim()
    } catch {
      return
    }
    cancelling.value = true
    try {
      await rejectTransaction(props.orderId, { note: reason || undefined })
      ElMessage.success(t('txLens.detail.rejectDone'))
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : t('txLens.detail.actionFailed'))
    } finally {
      cancelling.value = false
    }
  }

  // ─── 线下取证材料（对齐原型：多文件上传 + 文件列表）───
  const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024

  const attestations = ref<TravelRuleAttestationView[]>([])
  const attestationLoading = ref(false)
  const evidenceDialogVisible = ref(false)
  const evidenceInputRef = ref<HTMLInputElement | null>(null)
  const evidenceError = ref('')
  const uploadingEvidence = ref(false)
  /** 拖拽悬停中（用于高亮上传区） */
  const draggingEvidence = ref(false)
  /** 证据类型（CreateRequest.attestationType，必选） */
  const evidenceType = ref<TravelRuleAttestationType>('OTHER')
  /** 取证说明 / 材料来源（CreateRequest.remark） */
  const evidenceRemark = ref('')
  const EVIDENCE_TYPES: Array<{ value: TravelRuleAttestationType; labelKey: string }> = [
    { value: 'TRANSFER_RECEIPT', labelKey: 'txLens.detail.evidenceTypeTransferReceipt' },
    { value: 'COUNTERPARTY_CONFIRM', labelKey: 'txLens.detail.evidenceTypeCounterpartyConfirm' },
    { value: 'SELF_DECLARATION', labelKey: 'txLens.detail.evidenceTypeSelfDeclaration' },
    { value: 'EMAIL', labelKey: 'txLens.detail.evidenceTypeEmail' },
    { value: 'OTHER', labelKey: 'txLens.detail.evidenceTypeOther' }
  ]
  /** Proof Chain：按上传时间正序（时间轴从上到下即发生顺序） */
  const proofChain = computed(() =>
    [...attestations.value].sort(
      (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    )
  )
  /** 待上传文件（原型支持多选，逐个上传后统一登记为证据） */
  const evidenceFiles = ref<File[]>([])

  /**
   * 证据类型标签 —— 与 Upload Proof 弹框的下拉共用同一批 key，
   * 避免「上传时叫 Transfer receipt、列表里叫别的」。
   */
  const ATTESTATION_LABEL_KEYS: Record<string, string> = {
    TRANSFER_RECEIPT: 'txLens.detail.evidenceTypeTransferReceipt',
    COUNTERPARTY_CONFIRM: 'txLens.detail.evidenceTypeCounterpartyConfirm',
    SELF_DECLARATION: 'txLens.detail.evidenceTypeSelfDeclaration',
    EMAIL: 'txLens.detail.evidenceTypeEmail',
    OTHER: 'txLens.detail.evidenceTypeOther'
  }
  function attestationTypeLabel(type: string): string {
    const key = ATTESTATION_LABEL_KEYS[type]
    return key ? t(key) : type
  }

  async function loadAttestations(): Promise<void> {
    if (!props.orderId) return
    attestationLoading.value = true
    try {
      attestations.value = await fetchTravelRuleAttestations(props.orderId)
    } catch {
      // 证据列表失败不阻塞主内容，静默降级为空
      attestations.value = []
    } finally {
      attestationLoading.value = false
    }
  }

  function openEvidenceDialog(): void {
    resetEvidenceForm()
    evidenceDialogVisible.value = true
  }

  /** 关闭 / 重开弹框都清空已选文件，避免残留上一次的选择 */
  function resetEvidenceForm(): void {
    evidenceFiles.value = []
    draggingEvidence.value = false
    evidenceType.value = 'OTHER'
    evidenceRemark.value = ''
    evidenceError.value = ''
    if (evidenceInputRef.value) evidenceInputRef.value.value = ''
  }

  function closeEvidenceDialog(): void {
    evidenceDialogVisible.value = false
  }

  /** 点击选择与拖拽共用：校验大小、去重后加入待上传列表 */
  function addEvidenceFiles(picked: File[]): void {
    evidenceError.value = ''
    const oversized = picked.filter((f) => f.size > MAX_EVIDENCE_SIZE)
    if (oversized.length) {
      evidenceError.value = t('txLens.detail.evidenceTooLarge', {
        names: oversized.map((f) => f.name).join(', ')
      })
    }
    const valid = picked.filter((f) => f.size <= MAX_EVIDENCE_SIZE)
    // 同名同大小视为重复，避免重复上传
    const exists = (f: File) =>
      evidenceFiles.value.some((e) => e.name === f.name && e.size === f.size)
    evidenceFiles.value = [...evidenceFiles.value, ...valid.filter((f) => !exists(f))]
  }

  function onEvidenceFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const picked = Array.from(input.files || [])
    // 清空 value，允许重复选择同一个文件
    input.value = ''
    addEvidenceFiles(picked)
  }

  function onEvidenceDrop(event: DragEvent): void {
    draggingEvidence.value = false
    addEvidenceFiles(Array.from(event.dataTransfer?.files || []))
  }

  function removeEvidenceFile(index: number): void {
    evidenceFiles.value = evidenceFiles.value.filter((_, i) => i !== index)
  }

  /**
   * 两段式上传：每个文件先 POST /file/upload 拿 fileUrl，
   * 再以该 URL 登记一条 attestation（后端 CreateRequest 按单文件建模）。
   */
  async function submitEvidence(): Promise<void> {
    if (!props.orderId || !evidenceFiles.value.length) return
    uploadingEvidence.value = true
    evidenceError.value = ''
    const created: TravelRuleAttestationView[] = []
    try {
      for (const file of evidenceFiles.value) {
        const uploaded = await uploadFile(file, {
          bizType: 'travel_rule_attestation',
          bizId: props.orderId
        })
        const item = await createTravelRuleAttestation(props.orderId, {
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName || file.name,
          attestationType: evidenceType.value,
          remark: evidenceRemark.value.trim() || undefined
        })
        created.push(item)
      }
      attestations.value = [...created, ...attestations.value]
      ElMessage.success(t('txLens.detail.evidenceUploaded'))
      closeEvidenceDialog()
    } catch (err) {
      // 已成功的保留在列表里，失败的部分给出提示，避免用户重复上传
      if (created.length) attestations.value = [...created, ...attestations.value]
      evidenceError.value = err instanceof Error ? err.message : t('txLens.detail.actionFailed')
    } finally {
      uploadingEvidence.value = false
    }
  }

  function formatFileSize(bytes: number): string {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  /**
   * Resolve / Reject 按钮显示条件：
   *   1. 入金（direction === 'incoming'）
   *   2. 且 status 为待审核状态（CREATED / PII_APPENDED / UNMATCHED）
   * 出金不需要在 Travel Rule 阶段做人工审核，由后续 Sign-off / On-Chain 流程处理。
   */
  const PENDING_REVIEW_STATUSES = ['CREATED', 'PII_APPENDED', 'UNMATCHED']
  const showResolveRejectButtons = computed(() => {
    if (props.direction !== 'incoming') return false
    if (travelRuleReadOnly.value) return false
    const status = props.data?.status
    return !!status && PENDING_REVIEW_STATUSES.includes(status)
  })

  // 无 Travel Rule 通知时的提示文案（出金=未发送，入金=未收到）
  const emptyHint = computed(() => {
    const outgoing = props.direction === 'outgoing'
    return outgoing
      ? { icon: 'ri:mail-send-line', text: 'txLens.detail.noTravelRuleSent' }
      : { icon: 'ri:mail-unread-line', text: 'txLens.detail.noTravelRuleNotification' }
  })

  // 是否收到 Travel Rule 通知
  /**
   * 是否有 Travel Rule 数据。
   * 注意：vaspIdentity 现在恒为 {name:null}（接口已不下发 VASP 机构信息，
   * 改由 vaspDeclaration 下发），不能再作为判据，改看真正有内容的字段。
   *
   * vaspDeclaration 也要看子字段：对端未申报时接口返回
   * { declaredDid:null, declaredName:null, reviewStatus:'MATCHED' } 这类空壳，
   * 只判断对象非空会把「没有 TR 信息」误判成有数据。
   */
  const hasTravelRule = computed(() => {
    const d = props.data
    if (!d) return false
    const decl = d.vaspDeclaration
    const hasDeclContent =
      !!decl &&
      !!(decl.declaredDid || decl.declaredName || decl.discoveredDid || decl.discoveredName)
    return !!(
      d.notabeneTxId ||
      d.status ||
      d.ivms101Status ||
      typeof d.ivms101Valid === 'boolean' ||
      (d.ivms101Pii && Object.keys(d.ivms101Pii).length > 0) ||
      (d.networkTrace && d.networkTrace.length > 0) ||
      (d.attestations && d.attestations.length > 0) ||
      hasDeclContent
    )
  })

  // ─── VASP Identity（接口 vaspDeclaration，展示字段严格对齐原型）───
  const declaration = computed(() => props.data?.vaspDeclaration || null)
  const hasVaspDeclaration = computed(() => {
    const d = declaration.value
    return !!d && !!(d.declaredName || d.declaredDid || d.discoveredName || d.discoveredDid)
  })

  /**
   * 原型字段 → 接口字段映射：
   *   名称      ← discoveredName，为空退回 declaredName
   *   DID       ← declaredDid（申报身份；与 discoveredDid 不一致即为未匹配）
   *   司法辖区  ← DID 的 did:web 域名最后一段（如 :ae → AE），原型展示属地
   *   监管状态 / TR 能力 ← 接口已不下发，不展示
   */
  const vaspDisplayName = computed(
    () => declaration.value?.discoveredName || declaration.value?.declaredName || '--'
  )

  const vaspDid = computed(() => declaration.value?.declaredDid || null)

  const vaspJurisdiction = computed(() => {
    const did = vaspDid.value
    if (!did?.startsWith('did:web:')) return null
    const host = did.slice('did:web:'.length).split(':')[0]
    const tld = host.split('.').filter(Boolean).pop()?.toUpperCase()
    return tld ? countryStore.countryName(tld) : null
  })

  // 接口未下发监管状态 / TR 能力，保持为空即不渲染
  const vaspRegulatory = computed(() => null as string | null)
  const vaspTrCapable = computed(() => null as string | null)

  /** 接口是否下发过 IVMS101 数据（布尔校验结果或旧版字符串状态） */
  const hasIvms101Data = computed(
    () => typeof props.data?.ivms101Valid === 'boolean' || !!props.data?.ivms101Status
  )

  /** IVMS101 PII 交换状态：优先 ivms101Valid，兼容旧版 ivms101Status */
  const ivms101StatusText = computed(() => {
    const d = props.data
    if (!d) return '--'
    if (typeof d.ivms101Valid === 'boolean') {
      return d.ivms101Valid
        ? `${t('txLens.detail.ivmsValid')} ✓`
        : `${t('txLens.detail.ivmsInvalid')} ✕`
    }
    if (d.ivms101Status) return d.ivms101Status
    return '--'
  })

  const ivms101StatusClass = computed(() => {
    const valid = props.data?.ivms101Valid
    if (valid === true) return 'text-[var(--el-color-success)]'
    if (valid === false) return 'text-[var(--el-color-danger)]'
    return 'text-g-600'
  })

  onMounted(() => {
    // 国家码翻译需要国家字典
    countryStore.ensureLoaded(locale.value)
  })

  /**
   * 数据到达后查询通知 ID（用于 accept/reject 接口）。
   * 不能用 onMounted —— 组件挂载时 props.data 仍为 null，
   * showResolveRejectButtons 还是 false，会漏掉这次查询。
   */
  watch(
    () => [props.data?.status, props.direction, props.orderId] as const,
    async ([status, direction, orderId]) => {
      // 证据列表随交易切换重新拉取（详情页各步骤共用同一组件实例）
      if (orderId) await loadAttestations()
      if (
        direction === 'incoming' &&
        orderId &&
        status &&
        PENDING_REVIEW_STATUSES.includes(status) &&
        notificationId.value === null
      ) {
        // 待审核交易的 Resolve / Reject 位于 Network Negotiation 页签，自动切过去避免用户漏看
        opsTab.value = 'network'
        await loadNotificationId(orderId)
      }
    },
    { immediate: true }
  )

  /** 查询入金通知 ID（按 orderId 匹配） */
  async function loadNotificationId(orderId: string) {
    try {
      const res = await fetchInboundNotifications({
        direction: 'INBOUND',
        keyword: orderId,
        page: 1,
        pageSize: 1
      })
      const hit = res.items?.find((n) => n.transferId === orderId)
      notificationId.value = hit?.id ?? null
    } catch {
      notificationId.value = null
    }
  }

  /** Resolve：接受入金通知 */
  async function handleResolve() {
    if (!notificationId.value || !props.orderId) return
    try {
      await ElMessageBox.confirm(t('travelRule.confirmAccept'), t('travelRule.accept'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
    } catch {
      return
    }
    acting.value = true
    try {
      await acceptInboundNotification(notificationId.value)
      ElMessage.success(t('travelRule.accept') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to accept')
    } finally {
      acting.value = false
    }
  }

  /** Reject：拒绝入金通知（接口暂未开放，先提示开发中，不发起请求） */
  function handleReject() {
    // TODO: 接口就绪后恢复 rejectInboundNotification 调用
    ElMessage.info(t('txLens.detail.rejectPending'))
  }

  /** Generate Share Link / Upload Proof：功能未实现，按按钮给出具体提示 */
  function notifyDev(pendingKey: string) {
    ElMessage.info(t(pendingKey))
  }

  // ─── PII 语义化展示（对齐原型：Originator/Beneficiary 两块字段）───
  const originatorPii = computed(() =>
    parseIvms101Party(props.data?.ivms101Pii as Record<string, unknown> | null, 'originator')
  )
  const beneficiaryPii = computed(() =>
    parseIvms101Party(props.data?.ivms101Pii as Record<string, unknown> | null, 'beneficiary')
  )

  function piiRows(side: 'originator' | 'beneficiary'): Array<{ label: string; value: string }> {
    const p = side === 'originator' ? originatorPii.value : beneficiaryPii.value
    if (!p) return []
    const prefix = side === 'originator' ? t('travelRule.originator') : t('travelRule.beneficiary')
    const rows = [
      { label: `${prefix} · ${t('travelRule.piiName')}`, value: p.name },
      { label: `${prefix} · ${t('travelRule.piiAccountNumber')}`, value: p.accountNumber },
      {
        label: `${prefix} · ${t('travelRule.piiCountry')}`,
        value: countryStore.countryName(p.country)
      },
      { label: `${prefix} · ${t('travelRule.piiTownName')}`, value: p.townName },
      { label: `${prefix} · ${t('travelRule.piiAddressLine')}`, value: p.addressLine },
      { label: `${prefix} · ${t('travelRule.piiNationalId')}`, value: p.nationalIdentifier }
    ]
    // 空值字段不占格，避免大面积 '--'
    return rows.filter((r) => r.value && r.value.trim() !== '')
  }

  const piiFields = computed(() => [...piiRows('originator'), ...piiRows('beneficiary')])

  const networkTrace = computed(() => props.data?.networkTrace || [])

  /*
   * Manual Trace：接口暂无数据源，先用原型（compliance-tx-lens-detail.html）的
   * 三条事件做样式演示，并显示「mock 数据」提示条；接口就绪后删掉
   * MANUAL_TRACE_MOCK 与 manualTraceIsMock 即可切换回真实数据。
   */
  const MANUAL_TRACE_MOCK: TimelineNodeView[] = [
    {
      label: 'VASP_NOT_FOUND',
      detail: 'txLens.detail.vaspNotFoundDetail',
      time: '2026-07-28 09:01:15',
      status: 'info'
    },
    {
      label: 'SHARE_LINK_GENERATED',
      detail: 'txLens.detail.shareLinkDetail',
      time: '2026-07-28 09:05:00',
      status: 'pending'
    },
    {
      label: 'BENEFICIARY_AUTHORIZED',
      detail: 'txLens.detail.beneficiaryAuthorizedDetail',
      time: '2026-07-28 09:30:00',
      status: 'completed'
    }
  ]
  const manualTraceIsMock = computed(() => !(props.data?.manualTrace || []).length)
  const manualTrace = computed(() =>
    manualTraceIsMock.value ? MANUAL_TRACE_MOCK : props.data?.manualTrace || []
  )

  // ─── 网络追踪 label：后端返回 i18n key（notification.* / tap.*），统一翻译 ───
  const TRACE_LABEL_KEYS: Record<string, string> = {
    'notification.transferCreated': 'txLens.detail.traceTransferCreated',
    'notification.transferStatusChanged': 'txLens.detail.traceTransferStatusChanged',
    'notification.transferAgentStatusChanged': 'txLens.detail.traceAgentStatusChanged',
    'tap.requirePresentationSatisfied': 'txLens.detail.tracePresentationSatisfied',
    'tap.requireAuthorizationSatisfied': 'txLens.detail.traceAuthorizationSatisfied',
    // manual trace 的 mock 节点（label 为前端自定义枚举）
    VASP_NOT_FOUND: 'txLens.detail.vaspNotFound',
    SHARE_LINK_GENERATED: 'txLens.detail.shareLinkGenerated',
    BENEFICIARY_AUTHORIZED: 'txLens.detail.beneficiaryAuthorized'
  }

  function traceLabel(label: string): string {
    const key = TRACE_LABEL_KEYS[label]
    return key ? t(key) : label
  }

  /** detail 可能是 i18n key（mock 节点）或后端原文 */
  function traceDetail(detail: string): string {
    return detail.startsWith('txLens.detail.') ? t(detail) : detail
  }
</script>

<style scoped>
  /* VASP 身份卡（对齐原型 .vasp-identity） */
  .vasp-identity-box {
    padding: 14px 18px;
    margin-bottom: 12px;
    background: var(--art-gray-100);
    border: 1px solid var(--default-border);
    border-radius: 8px;
  }

  .field-label {
    font-size: var(--font-size-label);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pii-field {
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }

  .pii-field-label {
    margin-bottom: 2px;
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
  }

  .pii-field-value {
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--el-text-color-primary);
    word-break: break-all;
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
    font-size: var(--font-size-body);
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
    color: var(--theme-text);
    background: var(--el-bg-color);
    box-shadow: var(--art-shadow-subtle);
  }

  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  /*
   * 连接线与 StepCompliance 的 timeline 同款（节点间线段）：
   *   ① 容器级 ::before 会一直延伸到容器底部，最后一个圆点下方仍拖出一条线；
   *   ② left:7px 与圆心差 2px，连线不过圆心。
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

  /* 圆点颜色由 toneDotStyle 内联注入 */

  /* 上传区：虚线边框给出明确的点击/拖拽目标 */
  .evidence-dropzone {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    min-height: 132px;
    padding: 20px 16px;
    text-align: center;
    cursor: pointer;
    background: var(--tone-neutral-bg);
    border: 1px dashed var(--default-border);
    border-radius: 8px;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .evidence-dropzone:hover,
  .evidence-dropzone:focus-visible {
    background: var(--tone-info-bg);
    border-color: var(--tone-info-border);
  }

  .evidence-dropzone.is-dragging {
    background: var(--tone-info-bg);
    border-color: var(--tone-info-mark);
  }

  /* VASP 信息不一致提示：沿用全站警示条样式（琥珀 + alert 图标） */
  .vasp-mismatch-notice {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 12px;
    color: var(--tone-progress-text);
    background: var(--tone-progress-bg);
    border: 1px solid var(--tone-progress-border);
    border-radius: 8px;
  }

  /* mock 提示条：与 compliance/rules/detail 的提示样式一致（琥珀 + alert 图标） */
  .mock-inline-notice {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 12px;
    color: var(--tone-progress-text);
    background: var(--tone-progress-bg);
    border: 1px solid var(--tone-progress-border);
    border-radius: 8px;
  }
</style>
