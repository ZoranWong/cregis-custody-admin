<!-- Step: On-Chain — 链上信息（Tx Hash + Status，hash 跳区块链浏览器） -->
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
      <!-- Transaction Details（仅 Tx Hash / Status） -->
      <div class="art-card mb-4">
        <div class="p-4 border-b border-[var(--default-border)]">
          <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.txDetails') }}</span>
        </div>
        <div class="p-4 grid grid-cols-3 gap-4 items-start">
          <div class="flex flex-col gap-0.5 col-span-2">
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{
              $t('txLens.detail.txHash')
            }}</span>
            <!-- 有浏览器链接时可点击跳转，无链接回退纯文本 -->
            <a
              v-if="txExplorerUrl"
              :href="txExplorerUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-medium font-mono break-all text-[var(--el-color-primary)] hover:underline"
            >
              {{ props.data?.txHash }}
              <ArtSvgIcon icon="ri:external-link-line" class="ml-0.5 align-middle" />
            </a>
            <span v-else class="text-sm font-medium font-mono text-xs break-all">{{
              props.data?.txHash
            }}</span>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-[11px] font-semibold text-g-500 uppercase">{{
              $t('txLens.detail.txStatus')
            }}</span>
            <span
              class="text-sm font-medium"
              :class="{
                'text-success': isSuccess,
                'text-[var(--el-color-danger)]': isFailed
              }"
              >{{ props.data?.status || '--' }}</span
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
  import { buildTxLink, formatTime } from '@/utils/format'

  const props = defineProps<{ data: OnChainTabView | null }>()

  // 是否有链上交易（txHash 存在）
  const hasOnchainTx = computed(() => !!props.data?.txHash)

  const isSuccess = computed(() => props.data?.status === 'Success')
  const isFailed = computed(() => props.data?.status === 'Failed')

  /** 区块链浏览器链接（与 custody-manager 的 buildTxLink 同源规则） */
  const txExplorerUrl = computed(() =>
    buildTxLink(props.data?.txHash || '', props.data?.network || '')
  )

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
