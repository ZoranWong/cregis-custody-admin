<!-- Compliance Alerts — 合规告警 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="mb-2">
      <h1 class="text-xl font-semibold text-g-900">{{ $t('alerts.pageTitle') }}</h1>
      <p class="text-sm text-g-500 mt-1">{{ $t('alerts.pageSubtitle') }}</p>
    </div>

    <!-- ═══ Primary filters (above cards, matching tx-lens) ═══ -->
    <div class="filter-bar mb-5">
      <el-select
        v-model="filters.merchant"
        :placeholder="$t('alerts.merchant')"
        clearable
        class="filter-select !w-48"
      >
        <el-option :label="$t('alerts.allMerchants')" value="" />
        <el-option v-for="m in merchantOptions" :key="m" :label="m" :value="m" />
      </el-select>
      <el-date-picker
        v-model="filters.dateFrom"
        type="date"
        :placeholder="$t('alerts.from')"
        class="filter-date !w-36"
      />
      <el-input
        v-model="filters.search"
        :placeholder="$t('alerts.searchPlaceholder')"
        clearable
        class="filter-input !w-64"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
      <el-button type="primary" plain>
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />{{ $t('common.export') }}
      </el-button>
    </div>

    <!-- ═══ View Tabs ═══ -->
    <el-tabs v-model="currentView" class="mb-5">
      <el-tab-pane :label="`${$t('alerts.tabAll')} (${mockAlerts.length})`" name="all" />
      <el-tab-pane :label="`${$t('alerts.tabMine')} (${pendingCount})`" name="mine" />
    </el-tabs>

    <!-- ═══ Secondary filters (inside card, matching tx-lens) ═══ -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-4">
          <el-select
            v-model="filters.direction"
            :placeholder="$t('alerts.direction')"
            clearable
            class="!w-36"
          >
            <el-option :label="$t('alerts.outgoing')" value="outgoing" />
            <el-option :label="$t('alerts.incoming')" value="incoming" />
          </el-select>
          <el-select
            v-model="filters.status"
            :placeholder="$t('alerts.status')"
            clearable
            class="!w-40"
          >
            <el-option :label="$t('alerts.statusPending')" value="pending" />
            <el-option :label="$t('alerts.statusApproved')" value="approved" />
            <el-option :label="$t('alerts.statusRejected')" value="rejected" />
          </el-select>
          <el-select
            v-model="filters.severity"
            :placeholder="$t('alerts.severity')"
            clearable
            class="!w-36"
          >
            <el-option :label="$t('alerts.sevCritical')" value="critical" />
            <el-option :label="$t('alerts.sevMedium')" value="medium" />
            <el-option :label="$t('alerts.sevRoutine')" value="routine" />
          </el-select>
          <el-select
            v-model="filters.rule"
            :placeholder="$t('alerts.rule')"
            clearable
            class="!w-52"
          >
            <el-option :label="$t('alerts.allRules')" value="" />
            <el-option v-for="r in ruleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </div>
      </div>

      <!-- ═══ Alert cards list ═══ -->
      <div class="p-4">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.orderId"
          class="tx-card mb-4 last:mb-0 cursor-pointer"
          @click="openAlert(alert)"
        >
          <!-- Header: Amount + Direction/Status/Severity -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <ArtSvgIcon
                  :icon="alert.direction === 'outgoing' ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
                  :class="
                    alert.direction === 'outgoing'
                      ? 'text-[var(--el-color-primary)]'
                      : 'text-[var(--el-color-success)]'
                  "
                  class="text-lg"
                />
                <span class="text-lg font-semibold text-g-900">{{ alert.amount }}</span>
                <span class="text-sm text-g-400">≈ {{ alert.fiatAmount }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-g-500">{{ alert.orderId }}</span>
                <span class="text-xs text-g-400">· {{ alert.timeAgo }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-tag :type="alert.direction === 'outgoing' ? 'warning' : 'success'" size="small">
                {{ alert.direction === 'outgoing' ? $t('alerts.outgoing') : $t('alerts.incoming') }}
              </el-tag>
              <el-tag :type="statusTagType(alert.status)" size="small">{{
                statusLabel(alert.status)
              }}</el-tag>
              <el-tag :type="severityTagType(alert.severity)" size="small" effect="light">{{
                alert.severity
              }}</el-tag>
            </div>
          </div>

          <!-- Parties -->
          <div class="flex items-stretch gap-3 mb-3 py-3">
            <div
              class="flex-1 min-w-0 rounded-lg p-3"
              :class="
                alert.direction === 'outgoing'
                  ? 'bg-[var(--el-color-primary-light-9)]'
                  : 'bg-[var(--el-color-success-light-9)]'
              "
            >
              <div class="text-xs text-g-600 mb-1.5 font-medium">
                {{
                  alert.direction === 'outgoing'
                    ? $t('alerts.originatorOurCustomer')
                    : $t('alerts.originatorCounterparty')
                }}
              </div>
              <div class="text-sm font-semibold text-g-900 truncate">{{
                alert.originator.name
              }}</div>
              <div v-if="alert.originator.detail" class="text-xs text-g-700 mt-1.5">
                {{ alert.originator.detail }}
              </div>
              <div class="text-xs text-g-600 font-mono truncate mt-1">
                {{ alert.originator.address }}
              </div>
            </div>
            <div class="flex items-center px-2">
              <ArtSvgIcon
                :icon="
                  alert.direction === 'outgoing'
                    ? 'ri:arrow-right-long-line'
                    : 'ri:arrow-left-long-line'
                "
                :class="
                  alert.direction === 'outgoing'
                    ? 'text-[var(--el-color-primary)]'
                    : 'text-[var(--el-color-success)]'
                "
                class="text-2xl"
              />
            </div>
            <div
              class="flex-1 min-w-0 rounded-lg p-3"
              :class="
                alert.direction === 'outgoing'
                  ? 'bg-[var(--el-color-success-light-9)]'
                  : 'bg-[var(--el-color-primary-light-9)]'
              "
            >
              <div class="text-xs text-g-600 mb-1.5 font-medium">
                {{
                  alert.direction === 'outgoing'
                    ? $t('alerts.beneficiaryCounterparty')
                    : $t('alerts.beneficiaryOurCustomer')
                }}
              </div>
              <div class="text-sm font-semibold text-g-900 truncate">{{
                alert.beneficiary.name
              }}</div>
              <div v-if="alert.beneficiary.detail" class="text-xs text-g-700 mt-1.5">
                {{ alert.beneficiary.detail }}
              </div>
              <div class="text-xs text-g-600 font-mono truncate mt-1">
                {{ alert.beneficiary.address }}
              </div>
            </div>
          </div>

          <!-- Flag reason -->
          <div class="bg-g-50 rounded-lg p-3 mb-3">
            <div class="text-xs text-g-400 mb-1">{{ $t('alerts.flagReason') }}</div>
            <div
              class="text-sm font-medium"
              :class="
                alert.status === 'pending'
                  ? 'text-[var(--el-color-warning)]'
                  : alert.status === 'rejected'
                    ? 'text-[var(--el-color-danger)]'
                    : 'text-[var(--el-color-success)]'
              "
            >
              {{ alert.flagReason }}
            </div>
          </div>

          <!-- Full Review -->
          <div class="flex justify-end pt-3 border-t border-[var(--default-border)]">
            <el-button size="small" type="primary" @click.stop="openAlert(alert)">
              {{ $t('alerts.fullReview') }} →
            </el-button>
          </div>
        </div>
        <div v-if="filteredAlerts.length === 0" class="py-10 text-center text-g-400 text-sm">
          {{ $t('alerts.noResults') }}
        </div>
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
    search: '',
    direction: '',
    status: '',
    severity: '',
    rule: ''
  })

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
      flagReason: 'Flagged: Sanctions Hit Block — requires manual review'
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
      flagReason: 'Flagged: Large Transaction Review — amount exceeds threshold'
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
      flagReason: 'Rejected: High-Risk Jurisdiction Block — KP (North Korea)'
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
      flagReason: 'Flagged: Unlicensed VASP Counterparty — no Travel Rule identity found'
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
      flagReason: 'Rejected: Tainted Address Block — originator address linked to darknet'
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
      flagReason: 'Flagged: IVMS101 Mismatch — originator PII incomplete'
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
      flagReason: 'Flagged: Large Transaction Review — amount exceeds threshold'
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
      flagReason: 'Approved after review — sanctions screening cleared'
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
      flagReason: 'Auto-approved — all compliance checks passed'
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
        'Rejected by Compliance: PII mismatch — beneficiary details do not match on-chain address'
    }
  ]

  const pendingCount = computed(() => mockAlerts.filter((a) => a.status === 'pending').length)

  const filteredAlerts = computed(() => {
    let list = [...mockAlerts]
    if (currentView.value === 'mine') {
      list = list.filter((a) => a.status === 'pending')
    }
    if (filters.direction) {
      list = list.filter((a) => a.direction === filters.direction)
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status)
    }
    if (filters.severity) {
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

  function statusTagType(status: string) {
    if (status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    return 'warning'
  }
  function severityTagType(severity: string) {
    if (severity === 'Critical') return 'danger'
    if (severity === 'Medium') return 'warning'
    return 'info'
  }
  function statusLabel(status: string) {
    const map: Record<string, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected'
    }
    return map[status] || status
  }

  function openAlert(alert: AlertData) {
    router.push({ name: 'TransactionLensDetail', params: { id: alert.orderId } })
  }
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
