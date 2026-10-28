<!-- Travel Rule Events — Travel Rule 事件 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{ $t('travelRule.pageTitle') }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('travelRule.pageSubtitle') }}</p>
      </div>
      <el-button type="primary" plain @click="load">
        <ArtSvgIcon icon="ri:download-line" class="text-icon-md mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- ═══ 筛选栏（与 Transaction Lens 一致：单行筛选，无外层卡片）═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <MerchantSelect
        v-model="filters.merchant"
        :selected-label="filters.merchantName"
        :placeholder="$t('travelRule.merchant')"
        class="!w-48"
        @select="(_ecode, name) => (filters.merchantName = name)"
        @update:model-value="reload"
      />
      <el-date-picker
        v-model="filters.dateFrom"
        type="date"
        :placeholder="$t('travelRule.from')"
        class="!w-36"
        @change="reload"
      />
      <el-input
        v-model="filters.search"
        :placeholder="$t('travelRule.searchPlaceholder')"
        clearable
        class="!w-64"
        @keyup.enter="reload"
        @clear="reload"
      >
        <template #prefix
          ><ArtSvgIcon icon="ri:search-line" class="text-icon-md text-tone-muted-text"
        /></template>
      </el-input>
      <el-select
        v-model="filters.direction"
        :placeholder="$t('travelRule.direction')"
        clearable
        class="!w-36"
        @change="reload"
      >
        <el-option :label="$t('travelRule.outbound')" value="outgoing" />
        <el-option :label="$t('travelRule.inbound')" value="incoming" />
      </el-select>
      <el-select
        v-model="filters.status"
        :placeholder="$t('travelRule.status')"
        clearable
        class="!w-52"
        @change="reload"
      >
        <el-option
          v-for="s in NOTIFICATION_STATUS_DICT"
          :key="s.value"
          :label="$t(s.labelKey)"
          :value="s.value"
        />
      </el-select>
      <el-button plain @click="clearAllFilters">{{ $t('common.reset') }}</el-button>
    </div>

    <!-- ═══ Event Cards（与 Transaction Lens 一致：无外层卡片与标题栏）═══ -->
    <div>
      <template v-if="loading">
        <el-skeleton :rows="6" animated />
      </template>
      <template v-else>
        <div
          v-for="event in displayEvents"
          :key="event.id"
          class="tx-card mb-2.5 last:mb-0 cursor-pointer"
          @click="openDetail(event)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="openDetail(event)"
          @keydown.space.prevent="openDetail(event)"
        >
          <!-- Header: Amount + Meta -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <ArtSvgIcon
                  :icon="event.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
                  :class="
                    event.direction === 'outgoing'
                      ? 'text-tone-outbound-text'
                      : 'text-tone-inbound-text'
                  "
                  class="text-icon-md flex-shrink-0"
                />
                <span class="text-metric tabular-nums font-semibold text-g-900">{{
                  event.amount
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs mt-0.5">
                <el-tooltip :content="event.transferId" placement="top">
                  <span class="text-g-700 font-mono truncate max-w-52">{{ event.transferId }}</span>
                </el-tooltip>
                <span class="text-tone-muted-text">· {{ event.timeAgo }}</span>
                <span class="text-tone-muted-text">· {{ $t('travelRule.merchant') }}:</span>
                <span class="text-g-700 truncate">{{ event.enterpriseName || '--' }}</span>
              </div>
            </div>
            <!-- 三个 badge（对齐原型）：方向 + 通道 + 状态 -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <ArtDirectionTag :inbound="event.direction !== 'outgoing'" />
              <!--
                  通道是交易的元数据，不占用语义色相：
                  普通通道用中性灰；Off-Network 是异常通道，保留 warning 提示性。
                  （此前用 primary → 落在主题绿，与「入金」「已完成」三个绿并排糊成一片）
                -->
              <el-tag
                :type="isOffNetwork(event.status) ? 'warning' : undefined"
                :class="isOffNetwork(event.status) ? '' : 'art-tag-neutral'"
                size="small"
                effect="light"
              >
                {{
                  isOffNetwork(event.status)
                    ? $t('travelRule.chOffNetwork')
                    : $t('travelRule.chNetwork')
                }}
              </el-tag>
              <el-tag :type="prototypeStateTagType(event.status)" size="small" effect="light">
                {{ prototypeStateLabel(event.status) }}
              </el-tag>
            </div>
          </div>

          <!-- Parties（三行结构，与 tx-lens / alerts 一致） -->
          <div class="flex items-stretch gap-2 mb-2">
            <div
              class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
              :class="
                event.direction === 'outgoing'
                  ? 'bg-[var(--el-color-primary-light-9)]'
                  : 'bg-[var(--tone-neutral-bg)]'
              "
            >
              <div class="text-caption text-g-700 font-medium">
                {{ partyLabel(event.direction, 'originator') }}
              </div>
              <div class="text-xs font-semibold text-g-900 truncate">{{
                event.originator.name
              }}</div>
              <div class="text-caption text-g-700 font-mono truncate">
                {{ event.originator.address }}
              </div>
            </div>
            <div class="flex items-center">
              <ArtSvgIcon
                icon="ri:arrow-right-long-line"
                :class="
                  event.direction === 'outgoing'
                    ? 'text-tone-outbound-text'
                    : 'text-tone-inbound-text'
                "
                class="text-icon-lg"
              />
            </div>
            <div
              class="flex-1 min-w-0 rounded-lg px-2.5 py-1.5"
              :class="
                event.direction === 'outgoing'
                  ? 'bg-[var(--tone-neutral-bg)]'
                  : 'bg-[var(--el-color-primary-light-9)]'
              "
            >
              <div class="text-caption text-g-700 font-medium">
                {{ partyLabel(event.direction, 'beneficiary') }}
              </div>
              <div class="text-xs font-semibold text-g-900 truncate">
                {{ event.beneficiary.name }}
              </div>
              <div class="text-caption text-g-700 font-mono truncate">
                {{ event.beneficiary.address }}
              </div>
            </div>
          </div>

          <!-- Footer: 状态描述 + View Trace（对齐原型 .tr-status-text） -->
          <div
            class="flex items-center justify-between gap-3 pt-2.5 border-t border-[var(--default-border)]"
          >
            <div
              class="text-label font-medium truncate"
              :style="toneTextStyle(toneOf(event.status))"
            >
              {{ statusDescription(event.status) }}
            </div>
            <el-button
              size="small"
              type="primary"
              plain
              class="flex-shrink-0"
              @click.stop="openDetail(event)"
            >
              {{ $t('travelRule.viewTrace') }} →
            </el-button>
          </div>
        </div>
        <div
          v-if="displayEvents.length === 0"
          class="p-10 text-center text-tone-neutral-text text-body"
        >
          {{ $t('travelRule.noResults') }}
        </div>
      </template>

      <!-- ═══ Pagination ═══ -->
      <div
        v-if="pagination.total > 0"
        class="flex justify-end items-center px-4 py-3 border-t border-[var(--default-border)]"
      >
        <el-pagination
          v-model:current-page="filters.page"
          :total="pagination.total"
          v-model:page-size="filters.pageSize"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { fetchInboundNotifications } from '@/api/compliance'
  import { useCoinStore } from '@/store/modules/coins'
  import { useComplianceFilterStore } from '@/store/modules/complianceFilters'
  import MerchantSelect from '@/components/business/merchant-select/index.vue'
  import type { InboundNotificationItem } from '@/features/compliance/types'
  import { NOTIFICATION_STATUS_DICT, toneOf, toneTextStyle } from '@/features/compliance/txState'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { formatCoinBalance, formatTime } from '@/utils/format'

  defineOptions({ name: 'TravelRuleEvents' })

  const router = useRouter()
  const { t } = useI18n()
  const coinStore = useCoinStore()

  const loading = ref(false)
  const notifications = ref<InboundNotificationItem[]>([])
  const pagination = reactive({ total: 0 })

  // 筛选条件与分页放全局状态：详情页返回时条件仍在并自动重新查询
  const filterStore = useComplianceFilterStore()
  const filters = filterStore.travelRule

  // ─── 展示对象（保留原卡片结构所需字段）───
  interface DisplayParty {
    name: string
    /** 链上地址（PII 账户号缺失时回退 DID，仍无则用链上来源/结算地址） */
    address: string
  }

  interface DisplayEvent {
    id: number
    transferId: string
    amount: string
    timeAgo: string
    direction: 'outgoing' | 'incoming'
    status: string
    enterpriseName: string
    notabeneTxId: string
    originator: DisplayParty
    beneficiary: DisplayParty
  }

  /** PII → 卡片展示字段；PII 缺失时逐级回退，保证总有可读信息 */
  function toDisplayParty(
    n: InboundNotificationItem,
    side: 'originator' | 'beneficiary'
  ): DisplayParty {
    const pii = parseIvms101Party(n.ivms101Payload, side)
    const did = side === 'originator' ? n.originatorDid : n.beneficiaryDid
    const chainAddress = side === 'originator' ? n.sourceAddress : n.settlementAddress
    return {
      name: pii?.name || shortDid(did) || '--',
      address: pii?.accountNumber || chainAddress || '--'
    }
  }

  function shortDid(did: string | null): string {
    if (!did) return ''
    return did.length > 40 ? did.slice(0, 20) + '...' + did.slice(-8) : did
  }

  const displayEvents = computed<DisplayEvent[]>(() => {
    return notifications.value.map((n) => {
      const direction: 'outgoing' | 'incoming' =
        n.direction === 'OUTBOUND' ? 'outgoing' : 'incoming'
      // 精度：优先用 coinId，其次用 assetCode 解析出的 coinId
      const coinId = n.coinId || coinStore.resolveCoinIdByAssetCode(n.assetCode)
      const decimals = coinStore.getDecimalsByCoinId(coinId, n.network)
      const amount = decimals > 0 ? formatCoinBalance(String(n.assetAmount ?? ''), decimals) : '--'
      return {
        id: n.id,
        transferId: n.transferId,
        amount,
        timeAgo: formatTime(n.createTime),
        direction,
        status: n.status,
        enterpriseName: n.enterpriseName || '',
        notabeneTxId: n.notabeneTxId || '',
        originator: toDisplayParty(n, 'originator'),
        beneficiary: toDisplayParty(n, 'beneficiary')
      }
    })
  })

  /** 出入金双方标签：本方（我们的客户）位置随方向翻转 */
  function partyLabel(direction: string, party: 'originator' | 'beneficiary'): string {
    const outgoing = direction === 'outgoing'
    if (party === 'originator') {
      return outgoing ? t('alerts.originatorOurCustomer') : t('alerts.originatorCounterparty')
    }
    return outgoing ? t('alerts.beneficiaryCounterparty') : t('alerts.beneficiaryOurCustomer')
  }

  // ─── 三个 badge 的映射（对齐原型 direction / channel / state）───

  /** 后端状态 → 原型 state 分组：waiting / approved / rejected / settled / failed */
  function prototypeStateKey(status: string): string {
    switch (status) {
      case 'CREATED':
      case 'PII_APPENDED':
      case 'UNMATCHED':
        return 'waiting'
      case 'AUTHORIZED':
      case 'ACCEPTED':
      case 'SETTLING':
        return 'approved'
      case 'REJECTED':
        return 'rejected'
      case 'SETTLED':
        return 'settled'
      case 'REVERTED':
        return 'failed'
      default:
        return 'waiting'
    }
  }

  /** 通道：对手方不在 Travel Rule 网络（UNMATCHED）视为 Off-Network */
  function isOffNetwork(status: string): boolean {
    return status === 'UNMATCHED'
  }

  /** 原型 state badge 文案 */
  function prototypeStateLabel(status: string): string {
    const map: Record<string, string> = {
      waiting: t('travelRule.stWaiting'),
      approved: t('travelRule.stApproved'),
      rejected: t('travelRule.stRejected'),
      settled: t('travelRule.stSettled'),
      failed: t('travelRule.stFailed')
    }
    return map[prototypeStateKey(status)]
  }

  /** 原型 state badge 配色：waiting=琥珀 / approved·settled=绿 / rejected·failed=红 */
  function prototypeStateTagType(status: string): 'warning' | 'success' | 'danger' {
    const key = prototypeStateKey(status)
    if (key === 'approved' || key === 'settled') return 'success'
    if (key === 'rejected' || key === 'failed') return 'danger'
    return 'warning'
  }

  /** 状态 → 描述文案（对齐原型 .tr-status-text，取代原 Notabene Tx ID 展示） */
  function statusDescription(status: string): string {
    const map: Record<string, string> = {
      CREATED: 'travelRule.descCreated',
      PII_APPENDED: 'travelRule.descPiiAppended',
      VASP_MISMATCH: 'travelRule.descVaspMismatch',
      UNMATCHED: 'travelRule.descUnmatched',
      AUTHORIZED: 'travelRule.descAuthorized',
      ACCEPTED: 'travelRule.descAccepted',
      REJECTED: 'travelRule.descRejected',
      SETTLING: 'travelRule.descSettling',
      SETTLED: 'travelRule.descSettled',
      REVERTED: 'travelRule.descReverted'
    }
    return map[status] ? t(map[status]) : status || '--'
  }

  // ─── 数据加载 ───
  /** date-picker 的 Date 值 → "YYYY-MM-DD" 查询参数 */
  function toDateParam(v: '' | Date): string {
    if (!v) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`
  }

  async function load() {
    loading.value = true
    try {
      const result = await fetchInboundNotifications({
        direction:
          filters.direction === 'outgoing'
            ? 'OUTBOUND'
            : filters.direction === 'incoming'
              ? 'INBOUND'
              : undefined,
        status: filters.status || undefined,
        ecode: filters.merchant || undefined,
        dateFrom: toDateParam(filters.dateFrom) || undefined,
        keyword: filters.search || undefined,
        page: filters.page,
        pageSize: filters.pageSize
      })
      notifications.value = result.items || []
      pagination.total = result.total || 0
    } catch {
      notifications.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  function reload() {
    filters.page = 1
    load()
  }

  /** 清空全部筛选条件并重新查询 */
  function clearAllFilters() {
    filters.merchant = ''
    filters.merchantName = ''
    filters.dateFrom = ''
    filters.search = ''
    filters.direction = ''
    filters.status = ''
    reload()
  }

  function handleSizeChange() {
    filters.page = 1
    load()
  }

  function openDetail(event: DisplayEvent) {
    router.push({
      name: 'TransactionLensDetail',
      params: { id: event.transferId },
      query: { step: 'travelRule' }
    })
  }

  onMounted(() => {
    coinStore.ensureLoaded()
    load()
  })
</script>

<style scoped>
  .tx-card {
    padding: 16px;
    border: 1px solid var(--default-border);
    border-radius: 12px;
    transition: border-color 0.2s;
  }

  /* 卡片可点击（role=button + tabindex）后必须提供可见焦点环：
     否则键盘用户无法定位当前选中项。focus-visible 只在键盘导航时出现，鼠标点击不触发 */
  .tx-card:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  .tx-card:focus {
    outline: none;
  }

  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }
</style>
