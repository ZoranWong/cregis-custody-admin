<!-- Travel Rule Detail — Travel Rule 事件详情 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ $t('travelRule.detailTitle') }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('travelRule.detailSubtitle') }}</p>
      </div>
      <ArtBackButton history />
    </div>
    <!-- Loading / Error -->
    <div v-if="loading" class="art-card p-10 text-center">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="errorMessage" class="art-card p-10 text-center">
      <p class="text-tone-error-text mb-4">{{ errorMessage }}</p>
      <el-button type="primary" @click="loadDetail">{{ $t('console.refresh') }}</el-button>
    </div>

    <template v-else-if="detail">
      <!-- ═══ Header Card ═══ -->
      <div class="art-card mb-4 p-4">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <ArtSvgIcon
                :icon="isInbound ? 'ri:arrow-down-line' : 'ri:arrow-up-line'"
                :class="isInbound ? 'text-tone-inbound-text' : 'text-tone-outbound-text'"
                class="text-icon-md"
              />
              <span class="text-hero tabular-nums font-semibold text-g-900">{{
                amountDisplay
              }}</span>
              <span class="text-sm text-tone-muted-text">{{ assetLabel }}</span>
            </div>
            <div class="text-xs text-g-700 font-mono">{{ detail.transferId }}</div>
            <div class="text-caption text-g-700 mt-1">{{ formatTime(detail.createTime) }}</div>
          </div>
          <div class="text-right">
            <div class="flex gap-1 justify-end">
              <ArtDirectionTag :inbound="isInbound" />
              <el-tag :type="statusTagType(detail.status)" size="small">{{
                statusLabel(detail.status)
              }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Parties -->
        <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div class="originator-box rounded-lg p-3">
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-1">
              {{ $t('travelRule.originator') }}
            </div>
            <div class="text-xs text-g-700 font-mono break-all mb-1.5">{{
              detail.originatorDid || '--'
            }}</div>
            <div class="text-xs text-g-700 font-mono break-all">{{
              detail.sourceAddress || '--'
            }}</div>
          </div>
          <div
            class="text-hero font-semibold"
            :class="isInbound ? 'text-tone-inbound-text' : 'text-tone-outbound-text'"
          >
            {{ isInbound ? '→' : '→' }}
          </div>
          <div class="beneficiary-box rounded-lg p-3">
            <div class="text-caption font-bold text-g-700 uppercase tracking-wider mb-1">
              {{ $t('travelRule.beneficiary') }}
            </div>
            <div class="text-xs text-g-700 font-mono break-all mb-1.5">{{
              detail.beneficiaryDid || '--'
            }}</div>
            <div class="text-xs text-g-700 font-mono break-all">{{
              detail.settlementAddress || '--'
            }}</div>
          </div>
        </div>
      </div>

      <!-- ═══ Status Tracking (Timeline) ═══ -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('travelRule.statusTracking')
          }}</span>
        </div>
        <div class="p-4">
          <div class="timeline-chain">
            <div v-for="node in statusTimeline" :key="node.status" class="timeline-node">
              <div class="timeline-dot" :class="node.dotClass" />
              <div class="text-sm font-semibold" :class="node.labelClass">{{ node.label }}</div>
              <div class="text-xs text-g-700 mt-0.5">{{ node.detail }}</div>
              <div class="text-label text-tone-muted-text mt-0.5">{{ node.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Notification Detail ═══ -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{ $t('travelRule.detail') }}</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">Transfer ID</span>
            <span class="text-sm text-g-800 font-mono">{{ detail.transferId }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">{{
              $t('travelRule.notabeneTxId')
            }}</span>
            <span class="text-sm text-g-800 font-mono">{{ detail.notabeneTxId || '--' }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">{{
              $t('travelRule.assetAmount')
            }}</span>
            <span class="text-sm text-g-800">{{ amountDisplay }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">{{
              $t('travelRule.assetCode')
            }}</span>
            <span class="text-sm text-g-800">{{ assetLabel }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">{{
              $t('travelRule.createTime')
            }}</span>
            <span class="text-sm text-g-800">{{ formatTime(detail.createTime) }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-label font-semibold text-g-700 uppercase">Notabene Status</span>
            <span class="text-sm text-g-800">{{ detail.notabeneStatus || '--' }}</span>
          </div>
        </div>
      </div>

      <!-- ═══ Counterparty Info (解析 IVMS101 PII) ═══ -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('travelRule.counterpartyInfo')
          }}</span>
        </div>
        <div class="p-4">
          <div v-if="counterparty" class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('travelRule.piiName')
              }}</span>
              <span class="text-sm text-g-800">{{ counterparty.name || '--' }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('travelRule.piiAccountNumber')
              }}</span>
              <span class="text-xs text-g-700 font-mono break-all">{{
                counterparty.accountNumber || '--'
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('travelRule.piiCountry')
              }}</span>
              <span class="text-sm text-g-800">{{ counterparty.country || '--' }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('travelRule.piiTownName')
              }}</span>
              <span class="text-sm text-g-800">{{ counterparty.townName || '--' }}</span>
            </div>
            <div class="flex flex-col gap-0.5 col-span-2">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('travelRule.piiAddressLine')
              }}</span>
              <span class="text-sm text-g-800">{{ counterparty.addressLine || '--' }}</span>
            </div>
          </div>
          <div v-else class="text-xs text-tone-muted-text py-4 text-center">--</div>
        </div>
      </div>

      <!-- ═══ IVMS101 Raw PII ═══ -->
      <div class="art-card mb-4">
        <div
          class="p-4 border-b border-[var(--default-border)] flex items-center justify-between cursor-pointer"
          @click="rawExpanded = !rawExpanded"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="rawExpanded = !rawExpanded"
          @keydown.space.prevent="rawExpanded = !rawExpanded"
        >
          <span class="text-sm font-semibold text-g-900">{{ $t('travelRule.piiRaw') }}</span>
          <ArtSvgIcon
            :icon="rawExpanded ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'"
            class="text-icon-sm text-g-700"
          />
        </div>
        <div v-if="rawExpanded" class="p-4">
          <div
            v-if="detail.ivms101Payload"
            class="bg-g-50 border border-[var(--default-border)] rounded-lg p-3 max-h-96 overflow-y-auto"
          >
            <pre class="text-xs text-g-700 whitespace-pre-wrap break-all">{{ ivms101Text }}</pre>
          </div>
          <div v-else class="text-xs text-tone-muted-text py-4 text-center">--</div>
        </div>
      </div>

      <!-- ═══ Review Actions ═══ -->
      <div v-if="isInbound && isPendingReview" class="flex justify-end gap-3">
        <el-button type="danger" :loading="acting" @click="handleReject">{{
          $t('travelRule.reject')
        }}</el-button>
        <el-button type="success" :loading="acting" @click="handleAccept">{{
          $t('travelRule.accept')
        }}</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useCountryStore } from '@/store/modules/country'
  import { useCoinStore } from '@/store/modules/coins'
  import {
    fetchInboundNotificationDetail,
    acceptInboundNotification,
    rejectInboundNotification
  } from '@/api/compliance'
  import type { InboundNotificationDetail } from '@/features/compliance/types'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { formatCoinBalance, formatTime } from '@/utils/format'

  defineOptions({ name: 'TravelRuleDetail' })

  const route = useRoute()
  const { locale, t } = useI18n()
  const countryStore = useCountryStore()
  const coinStore = useCoinStore()

  const loading = ref(false)
  const errorMessage = ref('')
  const detail = ref<InboundNotificationDetail | null>(null)
  const acting = ref(false)
  const rawExpanded = ref(false)

  const isInbound = computed(() => detail.value?.direction !== 'OUTBOUND')

  // 待审核状态：CREATED / PII_APPENDED / UNMATCHED
  const isPendingReview = computed(() =>
    ['CREATED', 'PII_APPENDED', 'UNMATCHED'].includes(detail.value?.status || '')
  )

  // 国家代码 → 名称（通过全局 country store，按 locale 动态加载）
  function countryName(code: string): string {
    if (!code) return '--'
    return countryStore.countryName(code)
  }

  const amountDisplay = computed(() => {
    if (!detail.value) return '--'
    const coinId = detail.value.coinId || coinStore.resolveCoinIdByAssetCode(detail.value.assetCode)
    const decimals = coinStore.getDecimalsByCoinId(coinId, detail.value.network)
    if (decimals <= 0) return '--'
    return formatCoinBalance(String(detail.value.assetAmount ?? ''), decimals)
  })

  const assetLabel = computed(() => {
    if (detail.value?.coinId) return detail.value.coinId
    const code = detail.value?.assetCode
    if (!code) return '--'
    const parts = code.split('/')
    return parts.length > 1 ? parts[0] : code
  })

  const ivms101Text = computed(() => {
    if (!detail.value?.ivms101Payload) return ''
    return JSON.stringify(detail.value.ivms101Payload, null, 2)
  })

  // ─── 解析 IVMS101 PII：出金显示受益方，入金显示发起方（解析逻辑见 features/compliance/ivms101）───
  const counterparty = computed(() => {
    const sideKey = isInbound.value ? 'originator' : 'beneficiary'
    const p = parseIvms101Party(
      detail.value?.ivms101Payload as Record<string, unknown> | null,
      sideKey
    )
    if (!p) return null
    return { ...p, country: countryName(p.country) }
  })

  // ─── 状态流转（timeline）───
  const STATUS_ORDER = [
    'CREATED',
    'PII_APPENDED',
    'UNMATCHED',
    'AUTHORIZED',
    'ACCEPTED',
    'SETTLING',
    'SETTLED'
  ]

  const statusTimeline = computed(() => {
    const d = detail.value
    if (!d) return []

    // 终止失败态：REJECTED / REVERTED
    const terminal = d.status === 'REJECTED' || d.status === 'REVERTED'
    const order = terminal ? [...STATUS_ORDER.slice(0, 3), d.status] : STATUS_ORDER

    // 当前状态在流程中的位置（AUTHORIZED/ACCEPTED 视为同一节点）
    const idxOf = (s: string) => {
      if (s === 'AUTHORIZED') return STATUS_ORDER.indexOf('ACCEPTED')
      return STATUS_ORDER.indexOf(s)
    }
    const currentIdx = idxOf(d.status)

    return order.map((s) => {
      const isCurrent = s === d.status
      const past = idxOf(s) < currentIdx
      const dotClass = terminal
        ? isCurrent
          ? 'failed'
          : past
            ? 'completed'
            : 'upcoming'
        : isCurrent
          ? 'active'
          : past
            ? 'completed'
            : 'upcoming'
      return {
        status: s,
        label: statusLabel(s),
        detail: isCurrent ? t('travelRule.currentStatus') : '',
        time: isCurrent ? formatTime(d.updateTime) : '',
        dotClass,
        labelClass: dotLabelClass(dotClass)
      }
    })
  })

  // 状态文字颜色：与圆点颜色一致
  function dotLabelClass(dotClass: string): string {
    const map: Record<string, string> = {
      completed: 'text-tone-inbound-text',
      active: 'text-tone-info-text',
      failed: 'text-tone-error-text',
      upcoming: 'text-tone-muted-text'
    }
    return map[dotClass] || 'text-g-800'
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      CREATED: 'travelRule.stCreated',
      PII_APPENDED: 'travelRule.stPiiAppended',
      UNMATCHED: 'travelRule.stUnmatched',
      AUTHORIZED: 'travelRule.stAuthorized',
      ACCEPTED: 'travelRule.stAccepted',
      REJECTED: 'travelRule.stRejected',
      SETTLING: 'travelRule.stSettling',
      SETTLED: 'travelRule.stSettled',
      REVERTED: 'travelRule.stReverted'
    }
    return map[status] ? t(map[status]) : status || '--'
  }

  function statusTagType(status: string) {
    const map: Record<string, string> = {
      CREATED: 'info',
      PII_APPENDED: 'info',
      UNMATCHED: 'warning',
      AUTHORIZED: 'success',
      ACCEPTED: 'success',
      REJECTED: 'danger',
      SETTLING: 'warning',
      SETTLED: 'primary',
      REVERTED: 'danger'
    }
    return (map[status] || 'info') as any
  }

  async function loadDetail() {
    const id = route.params.id as string
    if (!id) {
      errorMessage.value = 'Notification ID is required'
      return
    }
    loading.value = true
    errorMessage.value = ''
    try {
      detail.value = await fetchInboundNotificationDetail(id)
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'Failed to load notification'
      detail.value = null
    } finally {
      loading.value = false
    }
  }

  async function handleAccept() {
    if (!detail.value) return
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
      await acceptInboundNotification(detail.value.id)
      ElMessage.success(t('travelRule.accept') + ' OK')
      await loadDetail()
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to accept')
    } finally {
      acting.value = false
    }
  }

  async function handleReject() {
    if (!detail.value) return
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
      await rejectInboundNotification(detail.value.id)
      ElMessage.success(t('travelRule.reject') + ' OK')
      await loadDetail()
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      acting.value = false
    }
  }

  onMounted(() => {
    countryStore.ensureLoaded(locale.value)
    coinStore.ensureLoaded()
    loadDetail()
  })
</script>

<style scoped>
  /* 折叠头可聚焦 → 需可见焦点环 */
  [role='button']:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  .originator-box {
    background: var(--el-color-primary-light-9);
    border-left: 3px solid var(--el-color-primary);
  }

  .beneficiary-box {
    /* 对手方：中性底 + 中性描边。此前用 success 色，与我方的品牌色同为绿系，
       两块并排时分不出「我方 / 对手方」。 */
    background: var(--tone-neutral-bg);
    border-left: 3px solid var(--tone-neutral-mark);
  }

  .timeline-chain {
    position: relative;
    padding-left: 32px;
  }

  .timeline-node {
    position: relative;
    padding-bottom: 20px;
  }

  .timeline-node:last-child {
    padding-bottom: 0;
  }

  /* 每个节点（除最后一个）向下画一条连线，起点在 dot 圆心下方，dot 用实心背景盖住 */
  .timeline-node:not(:last-child)::after {
    position: absolute;
    top: 18px;
    bottom: -20px;
    left: -26px;
    width: 2px;
    content: '';
    background: var(--el-border-color-light);
  }

  .timeline-dot {
    position: absolute;
    top: 4px;
    left: -32px;
    z-index: 1;
    box-sizing: border-box;
    width: 14px;
    height: 14px;
    background: var(--el-color-success);
    border: 2px solid var(--el-bg-color);
    border-radius: 50%;
  }

  .timeline-dot.completed {
    background: var(--el-color-success);
  }

  .timeline-dot.active {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
  }

  .timeline-dot.pending {
    background: var(--el-color-warning);
  }

  .timeline-dot.failed {
    background: var(--el-color-danger);
  }

  .timeline-dot.upcoming {
    background: var(--default-box-color);
    border: 2px solid var(--default-border);
  }
</style>
