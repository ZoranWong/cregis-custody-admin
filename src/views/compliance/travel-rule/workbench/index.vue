<!-- Travel Rule Events — Travel Rule 事件 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('travelRule.pageTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('travelRule.pageSubtitle') }}</p>
      </div>
      <el-button type="primary" plain @click="load">
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- ═══ Primary filters ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchant"
        :placeholder="$t('travelRule.merchant')"
        clearable
        filterable
        class="!w-48"
        @change="reload"
      >
        <el-option
          v-for="m in merchantOptions"
          :key="m.ecode"
          :label="m.enterpriseName || m.ecode"
          :value="m.ecode"
        />
      </el-select>
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
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
    </div>

    <!-- ═══ Secondary filters (inside card) ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-4">
          <el-select
            v-model="filters.direction"
            :placeholder="$t('travelRule.direction')"
            clearable
            class="!w-36"
            @change="reload"
          >
            <el-option :label="$t('travelRule.outgoing')" value="outgoing" />
            <el-option :label="$t('travelRule.incoming')" value="incoming" />
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
        </div>
      </div>

      <!-- ═══ Event Cards ═══ -->
      <div class="p-4">
        <template v-if="loading">
          <el-skeleton :rows="6" animated />
        </template>
        <template v-else>
          <div
            v-for="event in displayEvents"
            :key="event.id"
            class="tx-card mb-4 last:mb-0 cursor-pointer"
            @click="openDetail(event)"
          >
            <!-- Header: Amount + Meta -->
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <ArtSvgIcon
                    :icon="
                      event.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'
                    "
                    :class="
                      event.direction === 'outgoing'
                        ? 'text-[var(--el-color-primary)]'
                        : 'text-[var(--el-color-success)]'
                    "
                    class="text-lg flex-shrink-0"
                  />
                  <span class="text-lg font-semibold text-g-900">{{ event.amount }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <el-tooltip :content="event.transferId" placement="top">
                    <span class="text-g-500 font-mono truncate max-w-52">{{
                      event.transferId
                    }}</span>
                  </el-tooltip>
                  <span class="text-g-400">· {{ event.timeAgo }}</span>
                  <span class="text-g-400">· {{ $t('travelRule.merchant') }}:</span>
                  <span class="text-g-600 truncate">{{ event.enterpriseName || '--' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <el-tag :type="event.direction === 'outgoing' ? 'warning' : 'success'" size="small">
                  {{
                    event.direction === 'outgoing'
                      ? $t('travelRule.outgoing')
                      : $t('travelRule.incoming')
                  }}
                </el-tag>
                <el-tag :type="notificationTagType(event.status)" size="small">{{
                  txStateLabel(NOTIFICATION_STATUS_DICT, event.status, t)
                }}</el-tag>
              </div>
            </div>

            <!-- Parties -->
            <div class="flex items-stretch gap-3 mb-3">
              <div
                class="flex-1 min-w-0 rounded-lg p-3"
                :class="
                  event.direction === 'outgoing'
                    ? 'bg-[var(--el-color-primary-light-9)]'
                    : 'bg-[var(--el-color-success-light-9)]'
                "
              >
                <div class="text-xs text-g-600 mb-1.5 font-medium">
                  {{ partyLabel(event.direction, 'originator') }}
                </div>
                <div class="text-sm font-semibold text-g-900 truncate">{{
                  event.originator.name
                }}</div>
                <div class="text-xs text-g-600 mt-1 truncate">
                  {{ event.originator.country
                  }}{{ event.originator.townName ? ' · ' + event.originator.townName : '' }}
                </div>
                <div class="text-xs text-g-500 font-mono truncate mt-0.5">
                  {{ event.originator.address }}
                </div>
              </div>
              <div class="flex items-center px-1">
                <ArtSvgIcon
                  icon="ri:arrow-right-long-line"
                  :class="
                    event.direction === 'outgoing'
                      ? 'text-[var(--el-color-primary)]'
                      : 'text-[var(--el-color-success)]'
                  "
                  class="text-2xl"
                />
              </div>
              <div
                class="flex-1 min-w-0 rounded-lg p-3"
                :class="
                  event.direction === 'outgoing'
                    ? 'bg-[var(--el-color-success-light-9)]'
                    : 'bg-[var(--el-color-primary-light-9)]'
                "
              >
                <div class="text-xs text-g-600 mb-1.5 font-medium">
                  {{ partyLabel(event.direction, 'beneficiary') }}
                </div>
                <div class="text-sm font-semibold text-g-900 truncate">
                  {{ event.beneficiary.name }}
                </div>
                <div class="text-xs text-g-600 mt-1 truncate">
                  {{ event.beneficiary.country
                  }}{{ event.beneficiary.townName ? ' · ' + event.beneficiary.townName : '' }}
                </div>
                <div class="text-xs text-g-500 font-mono truncate mt-0.5">
                  {{ event.beneficiary.address }}
                </div>
              </div>
            </div>

            <!-- Footer: Status text + View Trace -->
            <div
              class="flex items-center justify-between pt-2.5 border-t border-[var(--default-border)]"
            >
              <div class="text-[11px] font-medium" :style="toneTextStyle(toneOf(event.status))">
                {{ $t('travelRule.notabeneTxId') }}: {{ event.notabeneTxId || '--' }}
              </div>
              <el-button size="small" type="primary" plain @click.stop="openDetail(event)">
                {{ $t('travelRule.viewTrace') }} →
              </el-button>
            </div>
          </div>
          <div v-if="displayEvents.length === 0" class="py-10 text-center text-g-400 text-sm">
            {{ $t('travelRule.noResults') }}
          </div>
        </template>
      </div>

      <!-- ═══ Pagination ═══ -->
      <div
        v-if="pagination.total > 0"
        class="flex justify-end items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <el-pagination
          v-model:current-page="pagination.page"
          :total="pagination.total"
          :page-size="pagination.pageSize"
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
  import { fetchMerchantList } from '@/api/merchant'
  import { useCoinStore } from '@/store/modules/coins'
  import type { InboundNotificationItem } from '@/features/compliance/types'
  import {
    NOTIFICATION_STATUS_DICT,
    notificationTagType,
    toneOf,
    toneTextStyle,
    txStateLabel
  } from '@/features/compliance/txState'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { formatCoinBalance, formatTime } from '@/utils/format'

  defineOptions({ name: 'TravelRuleEvents' })

  const router = useRouter()
  const { t } = useI18n()
  const coinStore = useCoinStore()

  const loading = ref(false)
  const notifications = ref<InboundNotificationItem[]>([])
  const merchantOptions = ref<Array<{ ecode: string; enterpriseName: string }>>([])
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  const filters = reactive({
    merchant: '',
    dateFrom: '' as '' | Date,
    search: '',
    direction: '',
    status: ''
  })

  // ─── 展示对象（保留原卡片结构所需字段）───
  interface DisplayParty {
    name: string
    country: string
    townName: string
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
      country: pii?.country || '--',
      townName: pii?.townName || '',
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

  // ─── 数据加载 ───
  /** date-picker 的 Date 值 → "YYYY-MM-DD" 查询参数 */
  function toDateParam(v: '' | Date): string {
    if (!v) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`
  }

  async function loadMerchants() {
    try {
      const res = await fetchMerchantList({ pageSize: 200 })
      const seen = new Map<string, string>()
      for (const r of res.records ?? []) {
        if (r.code) seen.set(r.code, r.merchantName || r.code)
      }
      merchantOptions.value = [...seen.entries()].map(([ecode, enterpriseName]) => ({
        ecode,
        enterpriseName
      }))
    } catch {
      merchantOptions.value = []
    }
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
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      notifications.value = result.items || []
      pagination.total = result.total || 0
    } catch {
      notifications.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
    loadMerchants()
  }

  function reload() {
    pagination.page = 1
    load()
  }

  function handleSizeChange() {
    pagination.page = 1
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

  .tx-card:hover {
    border-color: var(--el-color-primary-light-5);
  }
</style>
