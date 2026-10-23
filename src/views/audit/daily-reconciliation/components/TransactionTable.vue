<!-- Daily Reconciliation — 交易明细表（Reconciled / Pending / 单元明细共用） -->
<template>
  <div class="overflow-x-auto">
    <el-table
      :data="rows"
      size="small"
      style="min-width: 1100px"
      :row-style="linkable ? { cursor: 'pointer' } : undefined"
      @row-click="onRowClick"
    >
      <el-table-column type="index" width="48" :index="1" />
      <el-table-column :label="$t('dailyReconciliation.treasuryUnit')" width="140">
        <template #default="{ row }">
          <span class="unit-badge">{{ row.treasuryUnitName }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.type')" width="110">
        <template #default="{ row }">
          <span class="text-sm font-semibold text-g-900">{{ activityLabel(row.activity) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.amount')" width="160" align="right">
        <template #default="{ row }">
          <span
            class="text-sm font-semibold tabular-nums"
            :class="row.direction === 'IN' ? 'text-tone-done-text' : 'text-tone-error-text'"
          >
            {{ row.direction === 'IN' ? '+' : '-'
            }}{{ formatBaseAmount(row.amount, rowDecimals(row)) }}
          </span>
        </template>
      </el-table-column>
      <template v-if="showBalance">
        <el-table-column :label="$t('dailyReconciliation.preBalance')" width="150" align="right">
          <template #default="{ row }">
            <span class="text-xs tabular-nums text-g-500">{{
              formatBaseAmount(row.preBalance, rowDecimals(row))
            }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dailyReconciliation.postBalance')" width="150" align="right">
          <template #default="{ row }">
            <span class="text-xs font-semibold tabular-nums text-g-900">{{
              formatBaseAmount(row.postBalance, rowDecimals(row))
            }}</span>
          </template>
        </el-table-column>
      </template>
      <el-table-column :label="$t('dailyReconciliation.txid')" width="150">
        <template #default="{ row }">
          <span class="font-mono text-xs text-g-600">{{ compactHex(row.txId, 8, 6) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.from')" width="140">
        <template #default="{ row }">
          <span class="font-mono text-xs text-g-600">{{ compactHex(row.fromAddress, 6, 4) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.to')" width="140">
        <template #default="{ row }">
          <span class="font-mono text-xs text-g-600">{{ compactHex(row.toAddress, 6, 4) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.originator')" min-width="180">
        <template #default="{ row }">
          <PartyCell :party="row.originator" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.beneficiary')" min-width="180">
        <template #default="{ row }">
          <PartyCell :party="row.beneficiary" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.createdAt')" width="150">
        <template #default="{ row }">
          <span class="text-xs text-g-500">{{ formatTime(row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="showSettledAt"
        :label="$t('dailyReconciliation.settledAt')"
        width="150"
      >
        <template #default="{ row }">
          <span class="text-xs text-g-500">{{ formatTime(row.settledAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('dailyReconciliation.statusLabel')" width="120">
        <template #default="{ row }">
          <ArtStatusTag :status="statusTone(row.status)" :text="statusText(row.status)" />
        </template>
      </el-table-column>
      <el-table-column v-if="linkable" width="48">
        <template #default>
          <ArtSvgIcon icon="ri:arrow-right-s-line" class="text-lg text-g-400" />
        </template>
      </el-table-column>
      <template #empty>
        <div class="p-10 text-center text-g-500">
          {{ $t('dailyReconciliation.noTransactions') }}
        </div>
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
  import { defineComponent, h, type PropType } from 'vue'
  import { useRouter } from 'vue-router'
  import { compactHex, formatTime } from '@/utils/format'
  import type {
    CounterpartyView,
    ReconciliationTxStatus,
    ReconciliationTxView
  } from '@/features/audit/reconciliation/types'
  import { activityLabel, formatBaseAmount } from '@/views/audit/_shared/format'

  defineOptions({ name: 'ReconciliationTransactionTable' })

  const props = withDefaults(
    defineProps<{
      rows: ReconciliationTxView[]
      decimals: number
      /** Pending TX 没有前后余额，隐藏余额列 */
      showBalance?: boolean
      /** 单元明细页展示结算时间 */
      showSettledAt?: boolean
      /** 交易行可跳转 Compliance → Transaction Lens 详情 */
      linkable?: boolean
    }>(),
    { showBalance: true, showSettledAt: false, linkable: false }
  )

  const router = useRouter()

  /** 每笔交易自带精度（汇总页会混排 BTC/USDT 等不同精度资产） */
  function rowDecimals(row: ReconciliationTxView): number {
    return row.decimals ?? props.decimals
  }

  function onRowClick(row: ReconciliationTxView): void {
    if (!props.linkable || !row.orderId) return
    router.push({ name: 'TransactionLensDetail', params: { id: row.orderId } })
  }

  /** 交易对手三行展示：姓名 / 城市 / VASP（对齐原型 Originator / Beneficiary 列） */
  const PartyCell = defineComponent({
    name: 'PartyCell',
    props: { party: { type: Object as PropType<CounterpartyView>, required: true } },
    setup(props) {
      return () =>
        h('div', { class: 'text-xs leading-snug' }, [
          h('div', { class: 'font-semibold text-g-900' }, props.party.name || '—'),
          h('div', { class: 'text-g-500' }, props.party.location || '—'),
          h('div', { class: 'text-g-600' }, `VASP: ${props.party.vasp || '—'}`)
        ])
    }
  })

  function statusTone(status: ReconciliationTxStatus): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'forfeited') return 'danger'
    if (status === 'held') return 'warning'
    if (status === 'reconciled') return 'success'
    return 'info'
  }

  function statusText(status: ReconciliationTxStatus): string {
    const map: Record<ReconciliationTxStatus, string> = {
      reconciled: 'Reconciled',
      held: 'Held',
      forfeited: 'Forfeited',
      pending: 'Pending'
    }
    return map[status] ?? status
  }
</script>

<style scoped>
  .unit-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--tone-info-text);
    background: var(--tone-info-bg);
    border-radius: 4px;
  }
</style>
