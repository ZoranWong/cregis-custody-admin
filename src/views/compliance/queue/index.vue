<!-- Compliance Alerts — 合规告警 -->
<template>
  <div class="page-content">
    <!-- ═══ 筛选栏 ═══ -->
    <div class="flex flex-wrap items-center gap-4 mb-5">
      <el-select
        v-model="filters.merchantEcode"
        :placeholder="$t('alerts.merchant')"
        clearable
        filterable
        class="!w-48"
        @change="handleFilterChange"
      >
        <el-option
          v-for="m in merchants"
          :key="m.code"
          :label="m.merchantName || m.code"
          :value="m.code"
        />
      </el-select>
      <el-select
        v-model="filters.direction"
        :placeholder="$t('alerts.direction')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option :label="$t('alerts.outgoing')" value="OUTGOING" />
        <el-option :label="$t('alerts.incoming')" value="INCOMING" />
      </el-select>
      <el-select
        v-model="filters.decision"
        :placeholder="$t('alerts.decision')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option
          v-for="d in DECISION_DICT"
          :key="d.value"
          :label="$t(d.labelKey)"
          :value="d.value"
        />
      </el-select>
      <el-select
        v-model="filters.dispositionStatus"
        :placeholder="$t('alerts.disposition')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option
          v-for="d in DISPOSITION_STATUS_DICT"
          :key="d.value"
          :label="$t(d.labelKey)"
          :value="d.value"
        />
      </el-select>
      <el-button type="primary" @click="handleFilterChange">{{ $t('common.search') }}</el-button>
      <el-button text @click="resetFilters">{{ $t('common.reset') }}</el-button>
    </div>

    <!-- ═══ 告警卡片列表 ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
        <div class="flex items-center gap-4 text-sm">
          <span class="text-g-700 font-medium">{{ $t('alerts.pageTitle') }}</span>
          <span class="text-g-400"
            >{{ $t('alerts.tabAll') }}: <strong class="text-g-900">{{ total }}</strong></span
          >
        </div>
        <el-button text size="small">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
        </el-button>
      </div>

      <div class="p-4">
        <template v-if="loading">
          <el-skeleton :rows="6" animated />
        </template>
        <template v-else>
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="tx-card mb-4 last:mb-0 cursor-pointer"
            @click="openAlert(alert)"
          >
            <!-- 顶部：金额 + 订单号 + 标签 -->
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <ArtSvgIcon
                    :icon="
                      alert.direction === 'INCOMING' ? 'ri:arrow-down-line' : 'ri:arrow-up-line'
                    "
                    :class="
                      alert.direction === 'INCOMING'
                        ? 'text-[var(--el-color-success)]'
                        : 'text-[var(--el-color-primary)]'
                    "
                    class="text-lg flex-shrink-0"
                  />
                  <span class="text-lg font-semibold text-g-900">{{ displayAmount(alert) }}</span>
                  <span class="text-sm text-g-400">{{ alert.currency }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <el-tooltip :content="alert.bizRefId" placement="top">
                    <span class="text-g-500 font-mono truncate max-w-52">{{ alert.bizRefId }}</span>
                  </el-tooltip>
                  <span class="text-g-400">· {{ formatTime(alert.createTime) }}</span>
                  <span class="text-g-400">· {{ $t('alerts.merchantName') }}:</span>
                  <span class="text-g-600">{{ merchantName(alert.merchantEcode) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <el-tag :type="alert.direction === 'INCOMING' ? 'success' : 'primary'" size="small">
                  {{
                    alert.direction === 'INCOMING' ? $t('alerts.incoming') : $t('alerts.outgoing')
                  }}
                </el-tag>
                <el-tag :type="decisionTagType(alert.decision)" size="small">{{
                  txStateLabel(DECISION_DICT, alert.decision, t)
                }}</el-tag>
                <el-tag
                  :type="dispositionTagType(alert.dispositionStatus)"
                  size="small"
                  effect="plain"
                >
                  {{ txStateLabel(DISPOSITION_STATUS_DICT, alert.dispositionStatus, t) }}
                </el-tag>
                <el-tag
                  v-if="alert.riskScore != null && alert.riskScore !== 0"
                  :type="riskScoreTagType(alert.riskScore)"
                  size="small"
                  effect="light"
                >
                  {{ $t('alerts.riskScore') }}: {{ alert.riskScore }}
                </el-tag>
              </div>
            </div>

            <!-- 出入金双方 -->
            <div class="flex items-stretch gap-3 mb-3">
              <div
                class="flex-1 min-w-0 rounded-lg p-3"
                :class="
                  alert.direction === 'OUTGOING'
                    ? 'bg-[var(--el-color-primary-light-9)]'
                    : 'bg-[var(--el-color-success-light-9)]'
                "
              >
                <div class="text-xs text-g-600 mb-1.5 font-medium">
                  {{ partyLabel(alert.direction, 'originator') }}
                </div>
                <div class="text-sm font-semibold text-g-900 truncate">
                  {{ partyName(alert.originator) }}
                </div>
                <div v-if="alert.originator?.detail" class="text-xs text-g-700 mt-1.5">
                  {{ alert.originator.detail }}
                </div>
                <div class="text-xs text-g-600 font-mono truncate mt-1">
                  {{ alert.originator?.address || '--' }}
                </div>
              </div>
              <div class="flex items-center px-1">
                <ArtSvgIcon
                  icon="ri:arrow-right-long-line"
                  :class="
                    alert.direction === 'INCOMING'
                      ? 'text-[var(--el-color-success)]'
                      : 'text-[var(--el-color-primary)]'
                  "
                  class="text-2xl"
                />
              </div>
              <div
                class="flex-1 min-w-0 rounded-lg p-3"
                :class="
                  alert.direction === 'OUTGOING'
                    ? 'bg-[var(--el-color-success-light-9)]'
                    : 'bg-[var(--el-color-primary-light-9)]'
                "
              >
                <div class="text-xs text-g-600 mb-1.5 font-medium">
                  {{ partyLabel(alert.direction, 'beneficiary') }}
                </div>
                <div class="text-sm font-semibold text-g-900 truncate">
                  {{ partyName(alert.beneficiary) }}
                </div>
                <div v-if="alert.beneficiary?.detail" class="text-xs text-g-700 mt-1.5">
                  {{ alert.beneficiary.detail }}
                </div>
                <div class="text-xs text-g-600 font-mono truncate mt-1">
                  {{ alert.beneficiary?.address || '--' }}
                </div>
              </div>
            </div>

            <!-- 命中规则 / 结论 -->
            <div
              class="flex flex-wrap items-start gap-x-6 gap-y-2 mb-3 py-2.5 px-3 bg-g-100 rounded-lg"
            >
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span class="text-xs text-g-400 flex-shrink-0">{{ $t('alerts.ruleHits') }}:</span>
                <template v-if="alert.ruleHits?.length">
                  <el-tag
                    v-for="hit in alert.ruleHits"
                    :key="hit.ruleCode"
                    :type="severityTagType(hit.severity)"
                    size="small"
                    effect="light"
                  >
                    {{ hit.ruleName }}
                  </el-tag>
                </template>
                <span v-else class="text-sm text-g-600">{{ $t('alerts.noRuleHit') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xs text-g-400">{{ $t('alerts.conclusion') }}:</span>
                <span class="text-sm text-g-700 font-medium">{{
                  txStateLabel(CONCLUSION_DICT, alert.conclusion, t)
                }}</span>
              </div>
            </div>

            <!-- 操作 -->
            <div class="flex justify-end pt-3 border-t border-[var(--default-border)]">
              <el-button size="small" type="primary" @click.stop="openAlert(alert)">
                {{ $t('alerts.fullReview') }} →
              </el-button>
            </div>
          </div>
          <div v-if="alerts.length === 0" class="py-10 text-center text-g-400 text-sm">
            {{ $t('alerts.noResults') }}
          </div>
        </template>
      </div>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex justify-end items-center px-5 py-3 border-t border-[var(--default-border)]"
      >
        <el-pagination
          v-model:current-page="pagination.pageIndex"
          :total="total"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { fetchCoinList } from '@/api/coin'
  import { fetchComplianceAlerts } from '@/api/compliance'
  import { fetchMerchantList } from '@/api/merchant'
  import type { ComplianceAlertItem, TransactionPartyView } from '@/features/compliance/types'
  import {
    CONCLUSION_DICT,
    DECISION_DICT,
    DISPOSITION_STATUS_DICT,
    decisionTagType,
    dispositionTagType,
    riskScoreTagType,
    txStateLabel
  } from '@/features/compliance/txState'
  import { severityTagType } from '@/features/compliance/dictionaries'
  import { formatCoinBalance, formatTime } from '@/utils/format'

  defineOptions({ name: 'ComplianceAlerts' })

  const router = useRouter()
  const { t } = useI18n()
  const loading = ref(false)
  const total = ref(0)

  const alerts = ref<ComplianceAlertItem[]>([])
  const merchants = ref<Array<{ code: string; merchantName: string }>>([])
  const merchantMap = ref<Record<string, string>>({})
  const coinDecimals = ref<Record<string, number>>({})

  const filters = reactive({
    merchantEcode: '',
    direction: '',
    decision: '',
    dispositionStatus: ''
  })

  const pagination = reactive({
    pageIndex: 1,
    pageSize: 20
  })

  // ─── 展示辅助 ───

  /** 金额按币种精度换算；币种精度未知时回退原始值 */
  function displayAmount(alert: ComplianceAlertItem): string {
    const decimals = coinDecimals.value[alert.currency]
    if (!decimals) return String(alert.amount)
    return formatCoinBalance(String(alert.amount), decimals)
  }

  function merchantName(ecode: string): string {
    return merchantMap.value[ecode] || ecode || '--'
  }

  /** 出入金双方：本方（我们的客户）为发起方还是受益方，取决于交易方向 */
  function partyLabel(direction: string, party: 'originator' | 'beneficiary'): string {
    const outgoing = direction === 'OUTGOING'
    if (party === 'originator') {
      return outgoing ? t('alerts.originatorOurCustomer') : t('alerts.originatorCounterparty')
    }
    return outgoing ? t('alerts.beneficiaryCounterparty') : t('alerts.beneficiaryOurCustomer')
  }

  function partyName(party: TransactionPartyView | null): string {
    if (!party) return '--'
    return party.name || party.did || party.address || '--'
  }

  function openAlert(alert: ComplianceAlertItem) {
    router.push({
      name: 'TransactionLensDetail',
      params: { id: alert.bizRefId },
      query: { step: 'compliance' }
    })
  }

  // ─── 数据加载 ───

  /**
   * 商户名回填。接口分页上限 200 且不支持翻页取全量，
   * 超出部分回退展示 ecode（列表本身仍按 ecode 筛选，不影响正确性）。
   */
  async function loadMerchants() {
    try {
      const res = await fetchMerchantList({ pageSize: 200 })
      const records = res.records ?? []
      merchants.value = records
        .filter((r) => r.code)
        .map((r) => ({ code: r.code, merchantName: r.merchantName || r.code }))
      const map: Record<string, string> = {}
      for (const m of merchants.value) map[m.code] = m.merchantName
      merchantMap.value = map
    } catch {
      merchants.value = []
      merchantMap.value = {}
    }
  }

  /** 币种精度用于金额换算；缺失的币种原样展示最小单位 */
  async function loadCoins() {
    try {
      const coins = await fetchCoinList()
      const map: Record<string, number> = {}
      for (const c of coins) map[c.coinId] = c.decimals
      coinDecimals.value = map
    } catch {
      coinDecimals.value = {}
    }
  }

  async function fetchData() {
    loading.value = true
    try {
      const queryList: Array<{ key: string; value: unknown }> = []
      if (filters.merchantEcode)
        queryList.push({ key: 'merchantEcode', value: filters.merchantEcode })
      if (filters.direction) queryList.push({ key: 'direction', value: filters.direction })
      if (filters.decision) queryList.push({ key: 'decision', value: filters.decision })
      if (filters.dispositionStatus)
        queryList.push({ key: 'dispositionStatus', value: filters.dispositionStatus })

      const res = await fetchComplianceAlerts({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        queryList
      })
      alerts.value = res.records ?? []
      total.value = res.total ?? 0
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
      alerts.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  function handleFilterChange() {
    pagination.pageIndex = 1
    fetchData()
  }

  function resetFilters() {
    filters.merchantEcode = ''
    filters.direction = ''
    filters.decision = ''
    filters.dispositionStatus = ''
    handleFilterChange()
  }

  function handleSizeChange() {
    pagination.pageIndex = 1
    fetchData()
  }

  onMounted(() => {
    loadMerchants()
    loadCoins()
    fetchData()
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
