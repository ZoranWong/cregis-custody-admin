<!-- Step: On-Chain — 链上信息 -->
<template>
  <div>
    <!-- 无链上交易 -->
    <div v-if="!hasOnchainTx" class="art-card mb-4">
      <div class="p-4 flex items-center gap-2">
        <ArtSvgIcon icon="ri:links-line" class="text-[var(--el-color-info)] text-base" />
        <span class="text-sm text-g-700">{{ $t('txLens.detail.noOnchainTx') }}</span>
      </div>
    </div>

    <template v-else>
      <!-- Block Information -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{
            $t('txLens.detail.blockInformation')
          }}</span>
        </div>
        <div class="p-4">
          <div
            v-if="!hasBlockInfo"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:time-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.awaitingBlockConfirm') }}</span>
          </div>
          <div v-else class="grid grid-cols-3 gap-4">
            <div v-for="item in blockInfo" :key="item.label" class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                $t(item.label)
              }}</span>
              <span
                class="text-sm font-medium"
                :class="{
                  'font-mono text-xs': item.mono,
                  'text-success': item.green,
                  'break-all': item.mono
                }"
                >{{ item.value }}</span
              >
            </div>
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
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{ $t(item.label) }}</span>
            <span
              class="text-sm font-medium"
              :class="{
                'font-mono text-xs': item.mono,
                'text-success': item.green,
                'text-[var(--el-color-danger)]': item.red,
                'break-all': item.mono
              }"
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
          <div
            v-if="!timeline.length"
            class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
          >
            <ArtSvgIcon icon="ri:information-line" class="text-[var(--el-color-info)] text-base" />
            <span class="text-sm text-g-700">{{ $t('txLens.detail.noTimeline') }}</span>
          </div>
          <div v-else class="timeline-chain">
            <div v-for="node in timeline" :key="node.label + node.time" class="timeline-node">
              <div class="timeline-dot" :style="toneDotStyle(toneOf(node.status))" />
              <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
              <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
              <div class="text-[11px] text-g-400 mt-0.5">{{ formatTime(node.time) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { OnChainTabView } from '@/features/compliance/types'
  import { toneDotStyle, toneOf } from '@/features/compliance/txState'
  import { compactHex, formatTime } from '@/utils/format'

  const props = defineProps<{ data: OnChainTabView | null }>()

  // 是否有链上交易（txHash 存在）
  const hasOnchainTx = computed(() => !!props.data?.txHash)

  // 是否有区块信息（blockNumber/blockHash/blockTime 任一存在）
  const hasBlockInfo = computed(() => {
    const d = props.data
    return !!(d?.blockNumber || d?.blockHash || d?.blockTime)
  })

  const blockInfo = computed(() => {
    const data = props.data
    return [
      {
        label: 'txLens.detail.blockNetwork',
        value: data?.network || '--',
        mono: false,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.blockNumber',
        value: data?.blockNumber || '--',
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.blockHash',
        value: compactHex(data?.blockHash),
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.blockConfirmations',
        value: data?.confirmations?.toString() || '--',
        mono: false,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.blockTime',
        value: formatTime(data?.blockTime),
        mono: false,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.blockFinalized',
        value: data?.finalized == null ? '--' : data.finalized ? $tYes() : $tNo(),
        mono: false,
        green: data?.finalized === true,
        red: false
      }
    ]
  })

  function $tYes(): string {
    return 'Yes'
  }
  function $tNo(): string {
    return 'No'
  }

  const txDetails = computed(() => {
    const data = props.data
    const isSuccess = data?.status === 'Success'
    return [
      {
        label: 'txLens.detail.txHash',
        value: data?.txHash || '--',
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.txNonce',
        value: data?.nonce || '--',
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.txStatus',
        value: data?.status || '--',
        mono: false,
        green: isSuccess,
        red: data?.status === 'Failed'
      },
      {
        label: 'txLens.detail.txGasUsed',
        value: data?.gasUsed || '--',
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.txGasPrice',
        value: data?.gasPrice || '--',
        mono: true,
        green: false,
        red: false
      },
      {
        label: 'txLens.detail.txFee',
        value: data?.fee || '--',
        mono: true,
        green: false,
        red: false
      }
    ]
  })

  const timeline = computed(() => props.data?.timeline || [])
</script>

<style scoped>
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  .timeline-chain::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 7px;
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
    border: 2px solid #fff;
    border-radius: 50%;
  }

  /* 圆点颜色由 toneDotStyle 内联注入 */
</style>
