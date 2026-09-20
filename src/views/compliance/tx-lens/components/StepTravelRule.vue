<!-- Step: Travel Rule — Travel Rule 事件 -->
<template>
  <div>
    <!-- 无 Travel Rule 通知 -->
    <div v-if="!hasTravelRule" class="art-card mb-4">
      <div class="p-4 flex items-center gap-2">
        <ArtSvgIcon :icon="emptyHint.icon" class="text-[var(--el-color-info)] text-base" />
        <span class="text-sm text-g-700">{{ $t(emptyHint.text) }}</span>
      </div>
    </div>

    <template v-else>
      <!-- VASP Identity（对齐原型：名称 + 双列网格 + IVMS 状态行） -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.vaspIdentity')
          }}</span>
        </div>
        <div class="p-4">
          <div v-if="!data?.vaspIdentity" class="py-6 text-center text-g-400 text-sm">--</div>
          <template v-else>
            <div class="vasp-identity-box">
              <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspDisplayName }}</div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-0.5">
                  <span class="field-label">{{ $t('txLens.detail.trStatus') }}</span>
                  <span class="text-sm text-g-800 font-medium">{{
                    trStatusText(data.vaspIdentity.status)
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="field-label">{{ $t('travelRule.notabeneTxId') }}</span>
                  <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                    data.notabeneTxId || '--'
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="field-label">{{ $t('travelRule.originatorDid') }}</span>
                  <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                    data.vaspIdentity.originatorDid || '--'
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="field-label">{{ $t('travelRule.beneficiaryDid') }}</span>
                  <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                    data.vaspIdentity.beneficiaryDid || '--'
                  }}</span>
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-3 py-2.5 bg-g-100 border border-[var(--default-border)] rounded-md"
            >
              <span class="text-xs font-semibold text-g-600">{{
                $t('txLens.detail.ivms101PiiExchange')
              }}</span>
              <span class="text-xs font-semibold" :class="ivms101StatusClass">{{
                ivms101StatusText
              }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- IVMS101 PII Details（对齐原型：双列语义化字段） -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.ivms101PiiDetails')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="!piiFields.length"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noIvms101Pii') }}</span>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div v-for="field in piiFields" :key="field.label" class="pii-field">
              <div class="pii-field-label">{{ field.label }}</div>
              <div class="pii-field-value">{{ field.value || '--' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Operations: Manual Resolution / Network Negotiation -->
      <div class="art-card mb-4">
        <div class="p-4">
          <div class="sub-tab-bar mb-4">
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

          <!-- Manual Resolution -->
          <div v-show="opsTab === 'manual'">
            <div class="text-xs text-g-500 mb-3 leading-relaxed">
              {{ $t('txLens.detail.offNetworkDescription') }}
            </div>
            <div class="flex gap-3 mb-4 flex-wrap">
              <el-button size="small">
                <ArtSvgIcon icon="ri:link" class="mr-1" />{{
                  $t('txLens.detail.generateShareLink')
                }}
              </el-button>
              <el-button size="small">
                <ArtSvgIcon icon="ri:upload-line" class="mr-1" />{{
                  $t('txLens.detail.uploadProof')
                }}
              </el-button>
            </div>
            <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">
              {{ $t('txLens.detail.manualTrace') }}
            </div>
            <div v-if="!manualTrace.length" class="text-xs text-g-400 py-4 text-center">--</div>
            <div v-else class="timeline-chain">
              <div v-for="node in manualTrace" :key="node.label + node.time" class="timeline-node">
                <div class="timeline-dot" :style="toneDotStyle(toneOf(node.status))" />
                <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
                <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
              </div>
            </div>
          </div>

          <!-- Network Negotiation -->
          <div v-show="opsTab === 'network'">
            <div class="text-xs text-g-500 mb-3 leading-relaxed">
              {{ $t('txLens.detail.networkLifecycleDescription') }}
            </div>
            <div
              v-if="showResolveRejectButtons || props.direction === 'outgoing'"
              class="flex gap-3 mb-4 flex-wrap"
            >
              <template v-if="showResolveRejectButtons">
                <el-button type="primary" size="small" :loading="acting" @click="handleResolve">{{
                  $t('txLens.detail.resolve')
                }}</el-button>
                <el-button
                  type="danger"
                  plain
                  size="small"
                  :loading="acting"
                  @click="handleReject"
                  >{{ $t('txLens.detail.reject') }}</el-button
                >
              </template>
              <el-button
                v-if="props.direction === 'outgoing'"
                type="danger"
                plain
                size="small"
                :loading="acting"
                @click="handleCancelTransfer"
                >{{ $t('txLens.detail.cancelTransfer') }}</el-button
              >
            </div>
            <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">
              {{ $t('txLens.detail.networkTrace') }}
            </div>
            <div v-if="!networkTrace.length" class="text-xs text-g-400 py-4 text-center">--</div>
            <div v-else class="timeline-chain">
              <div v-for="node in networkTrace" :key="node.label + node.time" class="timeline-node">
                <div class="timeline-dot" :style="toneDotStyle(toneOf(node.status))" />
                <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
                <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { TravelRuleTabView } from '@/features/compliance/types'
  import { toneDotStyle, toneOf } from '@/features/compliance/txState'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { useCountryStore } from '@/store/modules/country'
  import { formatTime } from '@/utils/format'
  import {
    acceptInboundNotification,
    fetchInboundNotifications,
    rejectInboundNotification,
    rejectTransaction
  } from '@/api/compliance'

  const props = defineProps<{
    data: TravelRuleTabView | null
    direction?: string
    ivms101Status?: string | null
    orderId?: string
  }>()

  const emit = defineEmits<{
    reviewed: []
  }>()

  const { t, locale } = useI18n()
  const countryStore = useCountryStore()
  const opsTab = ref('manual')
  const acting = ref(false)
  const notificationId = ref<number | null>(null)

  /**
   * Resolve / Reject 按钮显示条件：
   *   1. 入金（direction === 'incoming'）
   *   2. 且 status 为待审核状态（CREATED / PII_APPENDED / UNMATCHED）
   * 出金不需要在 Travel Rule 阶段做人工审核，由后续 Sign-off / On-Chain 流程处理。
   */
  const PENDING_REVIEW_STATUSES = ['CREATED', 'PII_APPENDED', 'UNMATCHED']
  const showResolveRejectButtons = computed(() => {
    if (props.direction !== 'incoming') return false
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
  const hasTravelRule = computed(() => {
    const d = props.data
    if (!d) return false
    return !!(
      d.vaspIdentity ||
      d.notabeneTxId ||
      d.status ||
      d.ivms101Status ||
      (d.ivms101Pii && Object.keys(d.ivms101Pii).length > 0) ||
      (d.networkTrace && d.networkTrace.length > 0)
    )
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

  /** Reject：拒绝入金通知 */
  async function handleReject() {
    if (!notificationId.value || !props.orderId) return
    try {
      await ElMessageBox.confirm(t('travelRule.confirmReject'), t('travelRule.reject'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
    } catch {
      return
    }
    acting.value = true
    try {
      await rejectInboundNotification(notificationId.value)
      ElMessage.success(t('travelRule.reject') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      acting.value = false
    }
  }

  /** Cancel Transfer：取消出金交易（仅出金交易显示） */
  async function handleCancelTransfer() {
    if (!props.orderId) return
    try {
      await ElMessageBox.confirm(t('travelRule.confirmReject'), t('txLens.detail.cancelTransfer'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
    } catch {
      return
    }
    acting.value = true
    try {
      await rejectTransaction(props.orderId)
      ElMessage.success(t('txLens.detail.cancelTransfer') + ' OK')
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      acting.value = false
    }
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
  const manualTrace = computed(() => props.data?.manualTrace || [])

  // ─── VASP 名称：接口 name 字段是 DID 而非可读名，从 PII 里取对手方名称兜底 ───
  const vaspDisplayName = computed(() => {
    const raw = props.data?.vaspIdentity?.name || ''
    if (raw && !raw.startsWith('did:')) return raw
    // 入金时对手方是 originator，出金时是 beneficiary
    const outgoing = props.direction === 'outgoing'
    const p = outgoing ? beneficiaryPii.value : originatorPii.value
    return p?.name || raw || '--'
  })

  // ─── Travel Rule 状态枚举（CREATED / PII_APPENDED / … / SETTLED）───
  const TR_STATUS_KEYS: Record<string, string> = {
    CREATED: 'travelRule.stCreated',
    PII_APPENDED: 'travelRule.stPiiAppended',
    UNMATCHED: 'travelRule.stUnmatched',
    AUTHORIZED: 'travelRule.stAuthorized',
    ACCEPTED: 'travelRule.stAccepted',
    SETTLING: 'travelRule.stSettling',
    SETTLED: 'travelRule.stSettled',
    REJECTED: 'travelRule.stRejected',
    REVERTED: 'travelRule.stReverted',
    INCOMING: 'txLens.incoming',
    OUTGOING: 'txLens.outgoing'
  }

  function trStatusText(status: string | null | undefined): string {
    if (!status) return '--'
    const key = TR_STATUS_KEYS[status]
    return key ? t(key) : status
  }

  // ─── IVMS101 交换状态：优先用 prop（来自 compliance tab），兜底用 travel-rule tab 的数据 ───
  const ivms101StatusText = computed(() => {
    const s = props.ivms101Status || props.data?.ivms101Status
    if (!s) return '--'
    if (s === 'VALID') return `${t('txLens.detail.ivmsValid')} ✓`
    if (s === 'INVALID') return `${t('txLens.detail.ivmsInvalid')} ✗`
    return s
  })

  const ivms101StatusClass = computed(() => {
    const s = props.ivms101Status || props.data?.ivms101Status
    if (s === 'VALID') return 'text-success'
    if (s === 'INVALID') return 'text-danger'
    return 'text-g-600'
  })

  // ─── 网络追踪 label：后端返回 i18n key（notification.* / tap.*），统一翻译 ───
  const TRACE_LABEL_KEYS: Record<string, string> = {
    'notification.transferCreated': 'txLens.detail.traceTransferCreated',
    'notification.transferStatusChanged': 'txLens.detail.traceTransferStatusChanged',
    'notification.transferAgentStatusChanged': 'txLens.detail.traceAgentStatusChanged',
    'tap.requirePresentationSatisfied': 'txLens.detail.tracePresentationSatisfied',
    'tap.requireAuthorizationSatisfied': 'txLens.detail.traceAuthorizationSatisfied'
  }

  function traceLabel(label: string): string {
    const key = TRACE_LABEL_KEYS[label]
    return key ? t(key) : label
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
    font-size: 11px;
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
    font-size: 10px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
  }

  .pii-field-value {
    font-size: 12px;
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

  .timeline-chain::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 7px;
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
    border: 2px solid #fff;
    border-radius: 50%;
  }

  /* 圆点颜色由 toneDotStyle 内联注入 */
</style>
