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
      <!-- VASP Identity 卡已移除：接口不再下发 VASP 机构信息（仅 {name:null}），无数据不展示 -->

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
            <ArtSvgIcon icon="ri:information-line" class="text-tone-info-text text-icon-md" />
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
            <div class="text-xs text-g-700 mb-3 leading-relaxed">
              {{ $t('txLens.detail.offNetworkDescription') }}
            </div>
            <div class="flex gap-3 mb-4 flex-wrap">
              <el-button size="small" @click="notifyDev('txLens.detail.shareLinkPending')">
                <ArtSvgIcon icon="ri:link" class="text-icon-sm mr-1" />{{
                  $t('txLens.detail.generateShareLink')
                }}
              </el-button>
              <el-button size="small" @click="notifyDev('txLens.detail.uploadProofPending')">
                <ArtSvgIcon icon="ri:upload-line" class="text-icon-sm mr-1" />{{
                  $t('txLens.detail.uploadProof')
                }}
              </el-button>
            </div>
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-3">
              {{ $t('txLens.detail.manualTrace') }}
            </div>
            <!-- 接口无数据时展示原型 mock（带提示条）：仅样式参考 -->
            <div
              v-if="manualTraceIsMock"
              class="flex items-center gap-2 px-3 py-2 mb-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
            >
              <ArtSvgIcon icon="ri:information-line" class="text-tone-info-text flex-shrink-0" />
              <span class="text-xs text-g-700">{{ $t('txLens.detail.manualTraceMockHint') }}</span>
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
              <div v-for="node in manualTrace" :key="node.label + node.time" class="timeline-node">
                <div class="timeline-dot" :style="toneDotStyle(timelineNodeTone(node))" />
                <div class="text-sm font-semibold text-g-800">{{ traceLabel(node.label) }}</div>
                <div class="text-xs text-g-600 mt-0.5">{{ traceDetail(node.detail) }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
              </div>
            </div>
          </div>

          <!-- Network Negotiation -->
          <div v-show="opsTab === 'network'">
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
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { TimelineNodeView, TravelRuleTabView } from '@/features/compliance/types'
  import { toneDotStyle, timelineNodeTone } from '@/features/compliance/txState'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { useCountryStore } from '@/store/modules/country'
  import { formatTime } from '@/utils/format'
  // rejectInboundNotification 待接口开放后重新引入
  import { acceptInboundNotification, fetchInboundNotifications } from '@/api/compliance'

  const props = defineProps<{
    data: TravelRuleTabView | null
    direction?: string
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
  /**
   * 是否有 Travel Rule 数据。
   * 注意：vaspIdentity 现在恒为 {name:null}（接口已不下发 VASP 机构信息），
   * 不能再作为判据，改看真正有内容的字段。
   */
  const hasTravelRule = computed(() => {
    const d = props.data
    if (!d) return false
    return !!(
      d.notabeneTxId ||
      d.status ||
      d.ivms101Status ||
      typeof d.ivms101Valid === 'boolean' ||
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
</style>
