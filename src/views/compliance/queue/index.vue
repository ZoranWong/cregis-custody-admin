<!-- Compliance Alerts — 合规告警 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('alerts.pageTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('alerts.pageSubtitle') }}</p>
      </div>
      <el-button>
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- View Tabs -->
    <el-tabs v-model="currentView" class="mb-4">
      <el-tab-pane :label="`${$t('alerts.tabAll')} (${mockAlerts.length})`" name="all" />
      <el-tab-pane :label="`${$t('alerts.tabMine')} (${pendingCount})`" name="mine" />
    </el-tabs>

    <!-- Filter Bar -->
    <div class="art-card mb-5 p-4">
      <!-- Top row: Merchant + Date + Search -->
      <div
        class="flex flex-wrap items-center gap-4 pb-3 mb-3 border-b border-[var(--default-border)]"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.merchant') }}:</span>
          <el-select v-model="filters.merchant" clearable class="!w-44" size="small">
            <el-option :label="$t('alerts.allMerchants')" value="" />
            <el-option v-for="m in merchantOptions" :key="m" :label="m" :value="m" />
          </el-select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.date') }}:</span>
          <el-date-picker
            v-model="filters.dateFrom"
            type="date"
            :placeholder="$t('alerts.from')"
            size="small"
            class="!w-32"
          />
          <span class="text-xs text-g-500">{{ $t('alerts.to') }}</span>
          <el-date-picker
            v-model="filters.dateTo"
            type="date"
            :placeholder="$t('alerts.to')"
            size="small"
            class="!w-32"
          />
        </div>
        <el-input
          v-model="filters.search"
          :placeholder="$t('alerts.searchPlaceholder')"
          clearable
          size="small"
          class="flex-1 !min-w-[200px]"
        >
          <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
        </el-input>
      </div>
      <!-- Bottom row: Direction + Status + Severity + Rule -->
      <div class="flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.direction') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in directionOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: filters.direction === opt.value }"
              @click="filters.direction = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.status') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: filters.status === opt.value }"
              @click="filters.status = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.severity') }}:</span>
          <div class="flex gap-1">
            <button
              v-for="opt in severityOptions"
              :key="opt.value"
              class="filter-btn"
              :class="{ active: filters.severity === opt.value }"
              @click="filters.severity = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-g-600">{{ $t('alerts.rule') }}:</span>
          <el-select v-model="filters.rule" clearable class="!w-52" size="small">
            <el-option :label="$t('alerts.allRules')" value="" />
            <el-option v-for="r in ruleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Alert Cards -->
    <div v-if="filteredAlerts.length === 0" class="art-card py-10 text-center text-g-400 text-sm">
      {{ $t('alerts.noResults') }}
    </div>
    <div
      v-for="alert in filteredAlerts"
      :key="alert.orderId"
      class="art-card mb-3 alert-card-hover p-4 cursor-pointer"
      :data-direction="alert.direction"
      @click="openAlert(alert)"
    >
      <!-- Header: Amount + Meta -->
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="flex items-center gap-1.5 mb-0.5">
            <ArtSvgIcon
              :icon="alert.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
              :class="
                alert.direction === 'outgoing'
                  ? 'text-[var(--el-color-primary)]'
                  : 'text-[var(--el-color-success)]'
              "
              class="text-base"
            />
            <span class="text-lg font-bold text-g-900">{{ alert.amount }}</span>
          </div>
          <div class="text-[11px] text-g-500 font-medium">≈ {{ alert.fiatAmount }}</div>
        </div>
        <div class="text-right">
          <div class="text-[11px] font-semibold text-g-700 font-mono">{{ alert.orderId }}</div>
          <div class="text-[10px] text-g-500 mt-0.5">{{ alert.timeAgo }}</div>
          <div class="flex gap-1 justify-end mt-1">
            <span
              class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
              :class="
                alert.direction === 'outgoing'
                  ? 'bg-[var(--el-color-primary-light-8)] text-[var(--el-color-primary)]'
                  : 'bg-[var(--el-color-success-light-8)] text-[var(--el-color-success)]'
              "
              >{{
                alert.direction === 'outgoing' ? $t('alerts.outgoing') : $t('alerts.incoming')
              }}</span
            >
            <span
              class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
              :class="statusBadgeClass(alert.status)"
              >{{ statusLabel(alert.status) }}</span
            >
            <span
              class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
              :class="severityBadgeClass(alert.severity)"
              >{{ alert.severity }}</span
            >
          </div>
        </div>
      </div>

      <!-- Parties -->
      <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center mb-3">
        <div class="originator-box rounded-md p-2.5">
          <div class="text-[8px] font-bold text-g-500 uppercase tracking-wider mb-0.5">
            {{
              alert.direction === 'outgoing'
                ? $t('alerts.originatorOurCustomer')
                : $t('alerts.originatorCounterparty')
            }}
          </div>
          <div class="text-xs font-semibold text-g-900 truncate">{{ alert.originator.name }}</div>
          <div class="text-[10px] text-g-600 truncate">{{ alert.originator.detail }}</div>
          <div class="text-[10px] text-g-500 font-mono truncate">{{
            alert.originator.address
          }}</div>
        </div>
        <div
          class="text-lg font-bold"
          :class="alert.direction === 'outgoing' ? 'text-blue-500' : 'text-green-500'"
        >
          →
        </div>
        <div class="beneficiary-box rounded-md p-2.5">
          <div class="text-[8px] font-bold text-g-500 uppercase tracking-wider mb-0.5">
            {{
              alert.direction === 'outgoing'
                ? $t('alerts.beneficiaryCounterparty')
                : $t('alerts.beneficiaryOurCustomer')
            }}
          </div>
          <div class="text-xs font-semibold text-g-900 truncate">{{ alert.beneficiary.name }}</div>
          <div class="text-[10px] text-g-600 truncate">{{ alert.beneficiary.detail }}</div>
          <div class="text-[10px] text-g-500 font-mono truncate">{{
            alert.beneficiary.address
          }}</div>
        </div>
      </div>

      <!-- Footer: Status text + Full Review -->
      <div class="flex items-center justify-between pt-2.5 border-t border-[var(--default-border)]">
        <div class="text-[11px] font-medium" :class="statusTextClass(alert.status)">
          {{ alert.flagReason }}
        </div>
        <el-button size="small" type="primary" plain @click.stop="openAlert(alert)">
          {{ $t('alerts.fullReview') }} →
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ComplianceAlerts' })
  const router = useRouter()
  const currentView = ref('all')

  const filters = reactive({
    merchant: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    direction: 'all',
    status: 'all',
    severity: 'all',
    rule: ''
  })

  const directionOptions = [
    { label: 'All', value: 'all' },
    { label: 'Outgoing', value: 'outgoing' },
    { label: 'Incoming', value: 'incoming' }
  ]
  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ]
  const severityOptions = [
    { label: 'All', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'Medium', value: 'medium' },
    { label: 'Routine', value: 'routine' }
  ]
  const merchantOptions = [
    'CryptoVault Ltd',
    'PayFlow Inc',
    'NodeSphere',
    'TokenGuard',
    'BlockSafe',
    'ChainBridge'
  ]
  const ruleOptions = [
    'Sanctions Hit Block',
    'Large Transaction Review',
    'Tainted Address Block',
    'High-Risk Jurisdiction Block',
    'IVMS101 Mismatch',
    'Unlicensed VASP Counterparty'
  ]

  // ─── Mock Data ───
  interface AlertData {
    orderId: string
    amount: string
    fiatAmount: string
    timeAgo: string
    direction: 'outgoing' | 'incoming'
    status: 'pending' | 'approved' | 'rejected'
    severity: 'Critical' | 'Medium' | 'Routine'
    rule: string
    merchant: string
    originator: { name: string; detail: string; address: string }
    beneficiary: { name: string; detail: string; address: string }
    flagReason: string
    date: string
  }

  const mockAlerts: AlertData[] = [
    {
      orderId: 'ORDER-2026-07-28-0042',
      amount: '0.1 BTC',
      fiatAmount: '15,000 AED',
      timeAgo: '2 min ago',
      direction: 'outgoing',
      status: 'pending',
      severity: 'Critical',
      rule: 'Sanctions Hit Block',
      merchant: 'CryptoVault Ltd',
      originator: {
        name: 'CryptoVault Ltd',
        detail: 'Unit: Treasury · Account: Primary Pay-Out',
        address: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26'
      },
      beneficiary: {
        name: 'John Doe',
        detail: '',
        address: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75'
      },
      flagReason: 'Flagged: Sanctions Hit Block — requires manual review',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0041',
      amount: '2.5 ETH',
      fiatAmount: '75,000 AED',
      timeAgo: '8 min ago',
      direction: 'outgoing',
      status: 'pending',
      severity: 'Medium',
      rule: 'Large Transaction Review',
      merchant: 'PayFlow Inc',
      originator: {
        name: 'PayFlow Inc',
        detail: 'Unit: Operations · Account: Settlement',
        address: '0x1a2b...3c4d'
      },
      beneficiary: { name: 'Jane Smith', detail: '', address: '0x9a4f...3c21' },
      flagReason: 'Flagged: Large Transaction Review — amount exceeds threshold',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0039',
      amount: '12,000 USDT',
      fiatAmount: '44,040 AED',
      timeAgo: '22 min ago',
      direction: 'outgoing',
      status: 'rejected',
      severity: 'Critical',
      rule: 'High-Risk Jurisdiction Block',
      merchant: 'TokenGuard',
      originator: {
        name: 'TokenGuard',
        detail: 'Unit: Treasury · Account: Primary',
        address: '0x5e6f...7a8b'
      },
      beneficiary: { name: 'Kim Jong', detail: '', address: '0x7c2d...4e89' },
      flagReason: 'Rejected: High-Risk Jurisdiction Block — KP (North Korea)',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0037',
      amount: '0.035 BTC',
      fiatAmount: '5,200 AED',
      timeAgo: '1 hour ago',
      direction: 'outgoing',
      status: 'pending',
      severity: 'Medium',
      rule: 'Unlicensed VASP Counterparty',
      merchant: 'ChainBridge',
      originator: {
        name: 'ChainBridge',
        detail: 'Unit: Operations · Account: Default',
        address: '0x9c0d...1e2f'
      },
      beneficiary: { name: 'Unknown', detail: '', address: '0x8d3e...2b67' },
      flagReason: 'Flagged: Unlicensed VASP Counterparty — no Travel Rule identity found',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0040',
      amount: '8,500 USDC',
      fiatAmount: '31,195 AED',
      timeAgo: '15 min ago',
      direction: 'incoming',
      status: 'rejected',
      severity: 'Critical',
      rule: 'Tainted Address Block',
      merchant: 'NodeSphere',
      originator: { name: 'Unknown Sender', detail: '', address: '0x3e7a...9f12' },
      beneficiary: {
        name: 'NodeSphere',
        detail: 'Unit: Treasury · Account: Inbound',
        address: '0xab12...cd34'
      },
      flagReason: 'Rejected: Tainted Address Block — originator address linked to darknet',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0038',
      amount: '6,800 USDT',
      fiatAmount: '24,956 AED',
      timeAgo: '35 min ago',
      direction: 'incoming',
      status: 'pending',
      severity: 'Routine',
      rule: 'IVMS101 Mismatch',
      merchant: 'BlockSafe',
      originator: { name: 'John Smith', detail: '', address: '0x1f9b...6a34' },
      beneficiary: {
        name: 'BlockSafe',
        detail: 'Unit: Operations · Account: Settlement',
        address: '0xef56...7890'
      },
      flagReason: 'Flagged: IVMS101 Mismatch — originator PII incomplete',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0036',
      amount: '17,000 USDT',
      fiatAmount: '62,390 AED',
      timeAgo: '1.5 hours ago',
      direction: 'incoming',
      status: 'pending',
      severity: 'Medium',
      rule: 'Large Transaction Review',
      merchant: 'CryptoVault Ltd',
      originator: { name: 'Alice Johnson', detail: '', address: '0x5a1c...8d45' },
      beneficiary: {
        name: 'CryptoVault Ltd',
        detail: 'Unit: Treasury · Account: Primary Pay-In',
        address: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26'
      },
      flagReason: 'Flagged: Large Transaction Review — amount exceeds threshold',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0035',
      amount: '3,800 USDC',
      fiatAmount: '13,946 AED',
      timeAgo: '45 min ago',
      direction: 'outgoing',
      status: 'approved',
      severity: 'Routine',
      rule: 'Sanctions Hit Block',
      merchant: 'PayFlow Inc',
      originator: {
        name: 'PayFlow Inc',
        detail: 'Unit: Operations · Account: Default',
        address: '0x2b3c...4d5e'
      },
      beneficiary: { name: 'Robert Chen', detail: '', address: '0x6f7g...8h9i' },
      flagReason: 'Approved after review — sanctions screening cleared',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0034',
      amount: '5,200 USDT',
      fiatAmount: '19,084 AED',
      timeAgo: '2 hours ago',
      direction: 'incoming',
      status: 'approved',
      severity: 'Routine',
      rule: 'IVMS101 Mismatch',
      merchant: 'BlockSafe',
      originator: { name: 'David Wilson', detail: '', address: '0x9a0b...1c2d' },
      beneficiary: {
        name: 'BlockSafe',
        detail: 'Unit: Treasury · Account: Inbound',
        address: '0x3e4f...5g6h'
      },
      flagReason: 'Auto-approved — all compliance checks passed',
      date: '2026-07-28'
    },
    {
      orderId: 'ORDER-2026-07-28-0031',
      amount: '7,500 USDT',
      fiatAmount: '27,525 AED',
      timeAgo: '25 min ago',
      direction: 'incoming',
      status: 'rejected',
      severity: 'Medium',
      rule: 'Large Transaction Review',
      merchant: 'CryptoVault Ltd',
      originator: { name: 'Global Trade Ltd', detail: '', address: '0x8k9l...0m1n' },
      beneficiary: {
        name: 'CryptoVault',
        detail: 'Unit: Operations · Account: Settlement',
        address: '0x2o3p...4q5r'
      },
      flagReason:
        'Rejected by Compliance: PII mismatch — beneficiary details do not match on-chain address',
      date: '2026-07-28'
    }
  ]

  const pendingCount = computed(() => mockAlerts.filter((a) => a.status === 'pending').length)

  const filteredAlerts = computed(() => {
    let list = [...mockAlerts]
    // View filter
    if (currentView.value === 'mine') {
      list = list.filter((a) => a.status === 'pending')
    }
    // Field filters
    if (filters.direction !== 'all') {
      list = list.filter((a) => a.direction === filters.direction)
    }
    if (filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status)
    }
    if (filters.severity !== 'all') {
      list = list.filter((a) => a.severity.toLowerCase() === filters.severity)
    }
    if (filters.rule) {
      list = list.filter((a) => a.rule === filters.rule)
    }
    if (filters.merchant) {
      list = list.filter((a) => a.merchant === filters.merchant)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (a) =>
          a.orderId.toLowerCase().includes(q) ||
          a.originator.name.toLowerCase().includes(q) ||
          a.beneficiary.name.toLowerCase().includes(q) ||
          a.merchant.toLowerCase().includes(q)
      )
    }
    return list
  })

  function statusBadgeClass(status: string) {
    const map: Record<string, string> = {
      pending: 'bg-[var(--el-color-warning-light-8)] text-[var(--el-color-warning)]',
      approved: 'bg-[var(--el-color-success-light-8)] text-[var(--el-color-success)]',
      rejected: 'bg-[var(--el-color-danger-light-8)] text-[var(--el-color-danger)]'
    }
    return map[status] || 'bg-[var(--el-fill-color)] text-[var(--el-text-color-regular)]'
  }
  function severityBadgeClass(severity: string) {
    const map: Record<string, string> = {
      Critical: 'bg-[var(--el-color-danger-light-8)] text-[var(--el-color-danger)]',
      Medium: 'bg-[var(--el-color-warning-light-8)] text-[var(--el-color-warning)]',
      Routine: 'bg-[var(--el-color-primary-light-8)] text-[var(--el-color-primary)]'
    }
    return map[severity] || 'bg-[var(--el-fill-color)] text-[var(--el-text-color-regular)]'
  }
  function statusLabel(status: string) {
    const map: Record<string, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    return map[status] || status
  }
  function statusTextClass(status: string) {
    const map: Record<string, string> = {
      pending: 'text-warning',
      approved: 'text-success',
      rejected: 'text-danger'
    }
    return map[status] || 'text-g-500'
  }

  function openAlert(alert: AlertData) {
    router.push({ name: 'TransactionLensDetail', params: { id: alert.orderId } })
  }
</script>

<style scoped>
  .originator-box {
    background: var(--el-color-primary-light-9);
    border-left: 3px solid var(--el-color-primary);
  }

  .beneficiary-box {
    background: var(--el-color-success-light-9);
    border-left: 3px solid var(--el-color-success);
  }

  .filter-btn {
    padding: 4px 10px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--default-border);
    border-radius: 5px;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
  }

  .filter-btn.active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .alert-card-hover {
    transition: all 0.15s;
  }

  .alert-card-hover:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
  }
</style>
