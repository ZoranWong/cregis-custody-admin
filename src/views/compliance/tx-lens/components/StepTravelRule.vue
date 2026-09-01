<!-- Step: Travel Rule — Travel Rule 事件 -->
<template>
  <div>
    <!-- VASP Identity -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.vaspIdentity') }}</span>
      </div>
      <div class="p-4">
        <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4 mb-3">
          <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspIdentity.name }}</div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.jurisdiction')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ vaspIdentity.jurisdiction }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.regulatoryStatus')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{
                vaspIdentity.regulatoryStatus
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t('txLens.detail.trCapable')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ vaspIdentity.trCapable }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">DID</span>
              <span class="text-xs text-g-800 font-medium font-mono">{{ vaspIdentity.did }}</span>
            </div>
          </div>
        </div>
        <div
          class="flex items-center justify-between px-3 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
        >
          <span class="text-xs font-semibold text-g-600">{{
            $t('txLens.detail.ivms101PiiExchange')
          }}</span>
          <span class="text-xs font-semibold text-success">{{ $t('txLens.detail.valid') }}</span>
        </div>
      </div>
    </div>

    <!-- IVMS101 PII Details -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{
          $t('txLens.detail.ivms101PiiDetails')
        }}</span>
      </div>
      <div class="p-4 grid grid-cols-2 gap-3">
        <div v-for="field in piiFields" :key="field.label" class="pii-field">
          <div class="pii-field-label">{{ field.label }}</div>
          <div class="pii-field-value">{{ field.value }}</div>
        </div>
      </div>
    </div>

    <!-- Manual Resolution / Network Negotiation -->
    <div class="art-card mb-4">
      <div class="p-4">
        <div class="sub-tab-bar mb-4">
          <button
            class="sub-tab"
            :class="{ active: opsTab === 'manual' }"
            @click="opsTab = 'manual'"
            >{{ $t('txLens.detail.manualResolution') }}</button
          >
          <button
            class="sub-tab"
            :class="{ active: opsTab === 'network' }"
            @click="opsTab = 'network'"
            >{{ $t('txLens.detail.networkNegotiation') }}</button
          >
        </div>

        <!-- Manual Resolution -->
        <div v-show="opsTab === 'manual'">
          <div class="text-xs text-g-500 mb-3 leading-relaxed">{{
            $t('txLens.detail.offNetworkDescription')
          }}</div>
          <div class="flex gap-3 mb-4 flex-wrap">
            <el-button size="small"
              ><ArtSvgIcon icon="ri:link" class="mr-1" />{{
                $t('txLens.detail.generateShareLink')
              }}</el-button
            >
            <el-button size="small"
              ><ArtSvgIcon icon="ri:upload-line" class="mr-1" />{{
                $t('txLens.detail.uploadProof')
              }}</el-button
            >
          </div>
          <div class="flex gap-3 mb-4">
            <el-button type="primary" size="small">{{ $t('txLens.detail.resolve') }}</el-button>
            <el-button type="danger" plain size="small">{{ $t('common.cancel') }}</el-button>
          </div>
          <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">{{
            $t('txLens.detail.manualTrace')
          }}</div>
          <div class="timeline-chain">
            <div v-for="node in manualTraceTimeline" :key="node.label" class="timeline-node">
              <div class="timeline-dot" :class="node.dotClass" />
              <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
              <div v-if="node.link" class="text-[11px] text-primary font-mono mt-1 break-all">{{
                node.link
              }}</div>
            </div>
          </div>
        </div>

        <!-- Network Negotiation -->
        <div v-show="opsTab === 'network'">
          <div class="text-xs text-g-500 mb-3 leading-relaxed">{{
            $t('txLens.detail.networkLifecycleDescription')
          }}</div>
          <div class="mb-4">
            <el-button type="danger" plain size="small">{{
              $t('txLens.detail.cancelTransfer')
            }}</el-button>
          </div>
          <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">{{
            $t('txLens.detail.networkTrace')
          }}</div>
          <div class="timeline-chain">
            <div v-for="node in networkTraceTimeline" :key="node.label" class="timeline-node">
              <div class="timeline-dot" :class="node.dotClass" />
              <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  defineProps<{ txData: any }>()

  const opsTab = ref('manual')

  const vaspIdentity = {
    name: 'The UCE DMCC',
    jurisdiction: 'AE (UAE)',
    regulatoryStatus: 'Exempt',
    trCapable: 'Yes ✓',
    did: 'did:web:cregisio-8f89b...am'
  }

  const piiFields = [
    { label: 'Originator Name', value: 'CryptoVault Ltd' },
    { label: 'Originator Account', value: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26' },
    { label: 'Originator Address', value: 'Unit 1203, The Opus, Dubai, UAE' },
    { label: 'Originator LEI', value: '52990098765432109876' },
    { label: 'Beneficiary Name', value: 'John Doe' },
    { label: 'Beneficiary Account', value: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75' }
  ]

  const manualTraceTimeline = [
    {
      label: 'VASP Not Found on Network',
      detail:
        'Beneficiary VASP not found on Notabene, SYGNA, or other supported networks. Automatic delivery failed.',
      time: '2026-07-28 09:01:15 UTC',
      dotClass: 'info',
      link: ''
    },
    {
      label: 'Share Link Generated',
      detail:
        'Secure share link generated by Compliance Officer to deliver transfer & PII to counterparty manually.',
      time: '2026-07-28 09:05:00 UTC',
      dotClass: 'pending',
      link: 'https://custody.cregis.com/tr-share/a3f8b2c1'
    },
    {
      label: 'Beneficiary Authorized',
      detail:
        'Beneficiary VASP authorized the transfer via share link. Proceeding to on-chain settlement.',
      time: '2026-07-28 09:30:00 UTC',
      dotClass: 'completed',
      link: ''
    }
  ]

  const networkTraceTimeline = [
    {
      label: 'Travel Rule Messaging Initiated',
      detail:
        'Transaction approved by compliance. Travel Rule messaging initiated (amount ≥ 3,500 AED threshold).',
      time: '2026-07-28 09:00:00 UTC',
      dotClass: 'info'
    },
    {
      label: 'Transfer Created',
      detail:
        'Originator created outgoing transfer with originator PII via Notabene network. Beneficiary VASP: The UCE DMCC.',
      time: '2026-07-28 09:00:12 UTC',
      dotClass: 'completed'
    },
    {
      label: 'Awaiting Counterparty Authorization',
      detail: 'Beneficiary VASP has been notified. Waiting for authorization or rejection.',
      time: '2026-07-28 09:00:12 UTC',
      dotClass: 'pending'
    }
  ]
</script>

<style scoped>
  .pii-field {
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
  }
  .pii-field-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--el-text-color-secondary);
    margin-bottom: 2px;
  }
  .pii-field-value {
    font-size: 12px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
  .sub-tab-bar {
    display: inline-flex;
    gap: 2px;
    background: var(--el-fill-color);
    border-radius: 8px;
    padding: 3px;
  }
  .sub-tab {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .sub-tab:hover {
    color: var(--el-text-color-primary);
  }
  .sub-tab.active {
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

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
  .timeline-dot.pending {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 2px var(--el-color-warning-light-5);
  }
  .timeline-dot.info {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
  }
</style>
