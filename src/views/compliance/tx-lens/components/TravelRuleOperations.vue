<!-- Travel Rule Operations — Manual Resolution + Network Negotiation -->
<template>
  <div class="art-card mb-4">
    <div class="p-4">
      <!-- 双页签：同时存在 Manual Resolution 和 Network Negotiation 时显示 -->
      <div v-if="showManualResolution && showNetworkNegotiation" class="sub-tab-bar mb-4">
        <button class="sub-tab" :class="{ active: opsTab === 'manual' }" @click="opsTab = 'manual'">
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
      <!-- 单页签标题 -->
      <div v-else class="text-sm font-semibold text-g-900 mb-4">
        {{
          showManualResolution
            ? $t('txLens.detail.manualResolution')
            : $t('txLens.detail.networkNegotiation')
        }}
      </div>

      <!-- ═══ Manual Resolution（仅出金）═══ -->
      <div v-show="showManualResolution && (!showNetworkNegotiation || opsTab === 'manual')">
        <div class="text-xs text-g-700 mb-3 leading-relaxed">
          {{ $t('txLens.detail.offNetworkDescription') }}
        </div>
        <div v-if="needsManualProcess" class="flex gap-3 mb-4 flex-wrap">
          <el-button size="small" @click="notifyDev('txLens.detail.shareLinkPending')">
            <ArtSvgIcon icon="ri:link" class="text-icon-sm mr-1" />{{
              $t('txLens.detail.generateShareLink')
            }}
          </el-button>
          <el-button size="small" @click="openEvidenceDialog">
            <ArtSvgIcon icon="ri:upload-line" class="text-icon-sm mr-1" />{{
              $t('txLens.detail.uploadProof')
            }}
          </el-button>
        </div>

        <!-- 第二行：强制通过 + 取消 -->
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
        <!-- 子页签：Manual Trace / Proof Chain -->
        <div
          v-if="needsManualProcess || (manualTrace.length && attestations.length)"
          class="sub-tab-bar mb-3"
        >
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
        <!-- Manual Trace -->
        <div v-show="needsManualProcess || manualTrace.length" v-if="evidenceTab === 'trace'">
          <div
            v-if="!manualTrace.length"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
          </div>
          <div v-else class="timeline-chain">
            <div v-for="node in manualTrace" :key="node.label + node.time" class="timeline-node">
              <div class="timeline-dot" :style="toneDotStyle(timelineNodeTone(node))" />
              <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ traceDetail(node.detail) }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
            </div>
          </div>
        </div>

        <!-- Proof Chain -->
        <div v-show="needsManualProcess || attestations.length" v-if="evidenceTab === 'proof'">
          <div
            v-if="!attestations.length"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
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

      <!-- ═══ Network Negotiation（仅发往过 Notabene 的交易）═══ -->
      <div v-show="showNetworkNegotiation && (!showManualResolution || opsTab === 'network')">
        <div class="text-xs text-g-700 mb-3 leading-relaxed">
          {{ $t('txLens.detail.networkLifecycleDescription') }}
        </div>
        <!-- 无通知记录提示：入金但尚未收到对手方的 Travel Rule -->
        <div
          v-if="notificationMissing"
          class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-warning-light-9)] border border-[var(--el-color-warning-light-5)] rounded-lg mb-4"
        >
          <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-warning)] text-base" />
          <span class="text-sm text-g-700">{{ $t('txLens.detail.noNotificationRecord') }}</span>
        </div>
        <div v-if="showResolveRejectButtons" class="flex gap-3 mb-4 flex-wrap">
          <el-button
            type="primary"
            size="small"
            :loading="resolving"
            :disabled="rejecting"
            @click="handleResolve"
            >{{ $t('txLens.detail.resolve') }}</el-button
          >
          <el-button
            type="danger"
            plain
            size="small"
            :loading="rejecting"
            :disabled="resolving"
            @click="handleReject"
            >{{ $t('txLens.detail.reject') }}</el-button
          >
        </div>

        <!-- 网络协商 pending 状态 -->
        <div v-if="showNetworkPendingButtons" class="flex items-center gap-3 mb-4 flex-wrap">
          <el-button
            type="primary"
            size="small"
            :loading="networkAccepting"
            :disabled="networkRejecting"
            @click="handleNetworkAccept"
          >
            {{ $t('txLens.detail.accept') }}
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            :loading="networkRejecting"
            :disabled="networkAccepting"
            @click="handleNetworkReject"
          >
            {{ $t('txLens.detail.reject') }}
          </el-button>
          <span class="text-xs text-g-400">
            {{ $t('txLens.detail.networkPendingHint') }}
          </span>
        </div>

        <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-3">
          {{ $t('txLens.detail.networkTrace') }}
        </div>

        <div
          v-if="!networkTrace.length"
          class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
        >
          <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
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

  <!-- ═══ 上传取证材料弹框 ═══ -->
  <el-dialog
    v-model="evidenceDialogVisible"
    :title="$t('txLens.detail.uploadProofTitle')"
    width="500px"
    @closed="resetEvidenceForm"
  >
    <p class="text-sm text-g-600 leading-relaxed mb-4">{{ $t('txLens.detail.uploadProofHint') }}</p>

    <div class="flex flex-col gap-1 mb-4">
      <label class="text-xs font-semibold text-g-700">{{ $t('txLens.detail.evidenceType') }}</label>
      <el-select v-model="evidenceType" class="!w-64">
        <el-option
          v-for="opt in EVIDENCE_TYPES"
          :key="opt.value"
          :label="$t(opt.labelKey)"
          :value="opt.value"
        />
      </el-select>
    </div>

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
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type {
    TravelRuleAttestationType,
    TravelRuleAttestationView,
    TravelRuleTabView
  } from '@/features/compliance/types'
  import { toneDotStyle, timelineNodeTone } from '@/features/compliance/txState'
  import { formatTime } from '@/utils/format'
  import {
    acceptInboundNotification,
    fetchInboundNotifications,
    confirmVaspMismatch,
    rejectTransaction,
    rejectInboundNotification,
    fetchTravelRuleAttestations,
    uploadFile,
    createTravelRuleAttestation
  } from '@/api/compliance'
  import { useUserStore } from '@/store/modules/user'

  const props = defineProps<{
    data: TravelRuleTabView
    direction?: string
    orderId?: string
    stageState?: string | null
  }>()

  const emit = defineEmits<{
    reviewed: []
  }>()

  const { t } = useI18n()
  const userStore = useUserStore()
  const opsTab = ref('manual')
  const evidenceTab = ref<'trace' | 'proof'>('trace')

  // ─── 状态判断 ───
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
   * 需要手动处理：以 overview 接口的 travelRule 字段为准，
   * 值为 'mismatch' 时表示 VASP 不匹配需人工审核。
   */
  const needsManualProcess = computed(() => {
    return props.stageState?.toLowerCase() === 'mismatch'
  })
  const hasManualResolutionHistory = computed(
    () =>
      (props.data?.manualTrace && props.data.manualTrace.length > 0) ||
      (props.data?.attestations && props.data.attestations.length > 0)
  )
  const showManualResolution = computed(
    () =>
      props.direction !== 'incoming' &&
      (needsManualProcess.value || hasManualResolutionHistory.value)
  )
  const showNetworkNegotiation = computed(() => !!props.data?.notabeneTxId)

  // ─── VASP MISMATCH ───
  const vaspActing = ref(false)
  const cancelling = ref(false)

  const vaspReviewStatus = computed(() =>
    (props.data?.vaspDeclaration?.reviewStatus || '').toUpperCase()
  )
  const showVaspMismatchActions = computed(
    () => vaspReviewStatus.value === 'MISMATCH' && needsManualProcess.value
  )
  const vaspMismatchHint = computed(() => {
    const reason = props.data?.vaspDeclaration?.reason
    if (reason === 'no-vasp-pending') return t('txLens.detail.vaspMismatchNoVasp')
    if (reason === 'name-mismatch') return t('txLens.detail.vaspMismatchName')
    if (reason === 'did-mismatch') return t('txLens.detail.vaspMismatchDid')
    return t('txLens.detail.vaspMismatchGeneric')
  })
  const showCancelButton = computed(
    () => props.direction !== 'incoming' && needsManualProcess.value
  )

  const operator = computed(() => String(userStore.info?.userName || '') || undefined)

  // ─── VASP 强制通过 ───
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

  // ─── Cancel transfer ───
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

  // ─── 网络协商 ───
  // 每个操作按钮独立的 loading 状态，避免点击一个导致所有按钮同时转圈
  const resolving = ref(false)
  const rejecting = ref(false)
  const networkAccepting = ref(false)
  const networkRejecting = ref(false)
  const notificationId = ref<number | null>(null)
  /** 标记是否已尝试加载通知 ID（区分"加载中"和"确认无记录"） */
  const notificationLoaded = ref(false)
  const PENDING_REVIEW_STATUSES = ['CREATED', 'PII_APPENDED', 'UNMATCHED']

  const showResolveRejectButtons = computed(() => {
    if (props.direction !== 'incoming') return false
    if (travelRuleReadOnly.value) return false
    if (!notificationLoaded.value) return false
    if (!notificationId.value) return false
    const status = props.data?.status
    return !!status && PENDING_REVIEW_STATUSES.includes(status)
  })

  const showNetworkPendingButtons = computed(() => {
    if (props.direction !== 'incoming') return false
    if (!notificationLoaded.value) return false
    if (!notificationId.value) return false
    const d = props.data
    if (!d) return false
    if (d.ivms101Valid !== true) return false
    const status = d.status
    return !!status && PENDING_REVIEW_STATUSES.includes(status)
  })

  /** 确认无通知记录：已加载但找不到 notificationId */
  const notificationMissing = computed(
    () => notificationLoaded.value && !notificationId.value && props.direction === 'incoming'
  )

  async function loadNotificationId(orderId: string) {
    notificationLoaded.value = false
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
    } finally {
      notificationLoaded.value = true
    }
  }

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
    resolving.value = true
    try {
      await acceptInboundNotification(notificationId.value)
      ElMessage.success(t('travelRule.accept') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to accept')
    } finally {
      resolving.value = false
    }
  }

  function handleReject() {
    ElMessage.info(t('txLens.detail.rejectPending'))
  }

  async function handleNetworkAccept() {
    if (!notificationId.value) {
      ElMessage.warning(t('txLens.detail.notificationNotLoaded'))
      return
    }
    try {
      await ElMessageBox.confirm(
        t('txLens.detail.networkPendingAcceptConfirm'),
        t('txLens.detail.accept'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
    networkAccepting.value = true
    try {
      await acceptInboundNotification(notificationId.value)
      ElMessage.success(t('txLens.detail.accept') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to accept')
    } finally {
      networkAccepting.value = false
    }
  }

  async function handleNetworkReject() {
    if (!notificationId.value) {
      ElMessage.warning(t('txLens.detail.notificationNotLoaded'))
      return
    }
    try {
      await ElMessageBox.confirm(
        t('txLens.detail.networkPendingRejectConfirm'),
        t('txLens.detail.reject'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
    networkRejecting.value = true
    try {
      await rejectInboundNotification(notificationId.value)
      ElMessage.success(t('txLens.detail.reject') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      networkRejecting.value = false
    }
  }

  // ─── 证据列表（必须在 watch 上方，避免 immediate 调用撞 TDZ）───
  const attestations = ref<TravelRuleAttestationView[]>([])
  const attestationLoading = ref(false)

  async function loadAttestations(): Promise<void> {
    if (!props.orderId) return
    attestationLoading.value = true
    try {
      attestations.value = await fetchTravelRuleAttestations(props.orderId)
    } catch {
      attestations.value = []
    } finally {
      attestationLoading.value = false
    }
  }

  const proofChain = computed(() =>
    [...attestations.value].sort(
      (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    )
  )

  watch(
    () => [props.data?.status, props.direction, props.orderId] as const,
    async ([, direction, orderId]) => {
      if (orderId) await loadAttestations()
      // 入金方向：只要 orderId 就绪就尝试加载通知 ID（无论 Travel Rule 状态如何）
      if (direction === 'incoming' && orderId && !notificationLoaded.value) {
        opsTab.value = 'network'
        await loadNotificationId(orderId)
      }
    },
    { immediate: true }
  )

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

  // ─── 上传弹框 ───
  const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024
  const evidenceDialogVisible = ref(false)
  const evidenceInputRef = ref<HTMLInputElement | null>(null)
  const evidenceError = ref('')
  const uploadingEvidence = ref(false)
  const draggingEvidence = ref(false)
  const evidenceType = ref<TravelRuleAttestationType>('OTHER')
  const evidenceRemark = ref('')
  const evidenceFiles = ref<File[]>([])

  const EVIDENCE_TYPES: Array<{ value: TravelRuleAttestationType; labelKey: string }> = [
    { value: 'TRANSFER_RECEIPT', labelKey: 'txLens.detail.evidenceTypeTransferReceipt' },
    { value: 'COUNTERPARTY_CONFIRM', labelKey: 'txLens.detail.evidenceTypeCounterpartyConfirm' },
    { value: 'SELF_DECLARATION', labelKey: 'txLens.detail.evidenceTypeSelfDeclaration' },
    { value: 'EMAIL', labelKey: 'txLens.detail.evidenceTypeEmail' },
    { value: 'OTHER', labelKey: 'txLens.detail.evidenceTypeOther' }
  ]

  function openEvidenceDialog(): void {
    resetEvidenceForm()
    evidenceDialogVisible.value = true
  }

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

  function addEvidenceFiles(picked: File[]): void {
    evidenceError.value = ''
    const oversized = picked.filter((f) => f.size > MAX_EVIDENCE_SIZE)
    if (oversized.length) {
      evidenceError.value = t('txLens.detail.evidenceTooLarge', {
        names: oversized.map((f) => f.name).join(', ')
      })
    }
    const valid = picked.filter((f) => f.size <= MAX_EVIDENCE_SIZE)
    const exists = (f: File) =>
      evidenceFiles.value.some((e) => e.name === f.name && e.size === f.size)
    evidenceFiles.value = [...evidenceFiles.value, ...valid.filter((f) => !exists(f))]
  }

  function onEvidenceFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const picked = Array.from(input.files || [])
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

  function notifyDev(pendingKey: string) {
    ElMessage.info(t(pendingKey))
  }

  // ─── 时间轴 ───
  const networkTrace = computed(() => props.data?.networkTrace || [])
  const manualTrace = computed(() => props.data?.manualTrace || [])

  const TRACE_LABEL_KEYS: Record<string, string> = {
    'notification.transferCreated': 'txLens.detail.traceTransferCreated',
    'notification.transferStatusChanged': 'txLens.detail.traceTransferStatusChanged',
    'notification.transferAgentStatusChanged': 'txLens.detail.traceAgentStatusChanged',
    'tap.requirePresentationSatisfied': 'txLens.detail.tracePresentationSatisfied',
    'tap.requireAuthorizationSatisfied': 'txLens.detail.traceAuthorizationSatisfied',
    VASP_NOT_FOUND: 'txLens.detail.vaspNotFound',
    SHARE_LINK_GENERATED: 'txLens.detail.shareLinkGenerated',
    BENEFICIARY_AUTHORIZED: 'txLens.detail.beneficiaryAuthorized'
  }

  function traceLabel(label: string): string {
    const key = TRACE_LABEL_KEYS[label]
    return key ? t(key) : label
  }

  function traceDetail(detail: string): string {
    return detail.startsWith('txLens.detail.') ? t(detail) : detail
  }
</script>

<style scoped>
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
    border: 2px solid var(--default-box-color);
    border-radius: 50%;
  }

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
</style>
