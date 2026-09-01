<!-- Step: On-Chain — 链上信息 -->
<template>
  <div>
    <!-- Block Information -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{
          $t('txLens.detail.blockInformation')
        }}</span>
      </div>
      <div class="p-4 grid grid-cols-3 gap-4">
        <div v-for="item in blockInfo" :key="item.label" class="flex flex-col gap-0.5">
          <span class="text-[11px] font-semibold text-g-500 uppercase">{{ item.label }}</span>
          <span
            class="text-sm font-medium"
            :class="{ 'font-mono text-xs': item.mono, 'text-success': item.green }"
            >{{ item.value }}</span
          >
        </div>
      </div>
    </div>

    <!-- Transaction Details -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.txDetails') }}</span>
      </div>
      <div class="p-4 grid grid-cols-3 gap-4">
        <div v-for="item in txDetails" :key="item.label" class="flex flex-col gap-0.5">
          <span class="text-[11px] font-semibold text-g-500 uppercase">{{ item.label }}</span>
          <span
            class="text-sm font-medium"
            :class="{ 'font-mono text-xs': item.mono, 'text-success': item.green }"
            >{{ item.value }}</span
          >
        </div>
      </div>
    </div>

    <!-- On-Chain Timeline -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{
          $t('txLens.detail.onChainTimeline')
        }}</span>
      </div>
      <div class="p-4">
        <div class="timeline-chain">
          <div v-for="node in onChainTimeline" :key="node.label" class="timeline-node">
            <div class="timeline-dot completed" />
            <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
            <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
            <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ txData: any }>()

  const blockInfo = [
    { label: 'Network', value: 'Ethereum Mainnet', mono: false, green: false },
    { label: 'Block Number', value: '19,847,231', mono: true, green: false },
    { label: 'Block Hash', value: '0x8f2d4e6a...4421b3c9', mono: true, green: false },
    { label: 'Confirmations', value: '128', mono: false, green: false },
    { label: 'Block Time', value: '2026-07-28 10:28:42 UTC', mono: false, green: false },
    { label: 'Finalized', value: 'Yes', mono: false, green: true }
  ]

  const txDetails = [
    {
      label: 'TX Hash',
      value: '0x8f2d1a3b5c7e9f0d2b4c6e8a0f2d4e6a1b3c5e7f9d0b2c4e6a8f0d2b4c6e',
      mono: true,
      green: false
    },
    { label: 'Nonce', value: '347', mono: true, green: false },
    { label: 'Status', value: 'Success', mono: false, green: true },
    { label: 'Gas Used', value: '21,000', mono: true, green: false },
    { label: 'Gas Price', value: '25 Gwei', mono: true, green: false },
    { label: 'Transaction Fee', value: '0.000525 ETH (≈ 1.84 AED)', mono: true, green: false }
  ]

  const onChainTimeline = [
    {
      label: 'Broadcasted',
      detail: 'Signed and submitted to mempool',
      time: '2026-07-28 10:28:15 UTC'
    },
    { label: 'Included in Block', detail: 'Block #19,847,231', time: '2026-07-28 10:28:42 UTC' },
    {
      label: 'Confirmations Reached',
      detail: '128 confirmations — fully finalized',
      time: '2026-07-28 10:35:00 UTC'
    },
    {
      label: 'Settlement Complete',
      detail: 'Funds credited to beneficiary wallet',
      time: '2026-07-28 10:35:00 UTC'
    }
  ]
</script>

<style scoped>
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }
  .timeline-chain::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
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
    left: -20px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
  }
  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }
</style>
