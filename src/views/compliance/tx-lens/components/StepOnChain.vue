<!-- Step: On-Chain — 链上信息（Tx Hash + Status，hash 跳区块链浏览器） -->
<template>
  <div>
    <!-- 无链上交易 -->
    <div v-if="!hasOnchainTx" class="art-card mb-4">
      <div class="p-4 flex items-center gap-2">
        <ArtSvgIcon icon="ri:links-line" class="text-tone-info-text text-icon-md" />
        <span class="text-sm text-g-700">{{ $t('txLens.detail.noOnchainTx') }}</span>
      </div>
    </div>

    <template v-else>
      <!-- ═══ 链上信息 ═══
           数据全部来自链上节点查询（ethers / TronWeb / Sui GraphQL），
           不经后端接口 —— 因此可与平台记录交叉核验。 -->
      <div class="art-card mb-4">
        <div
          class="p-4 border-b border-[var(--default-border)] flex items-center justify-between gap-3"
        >
          <span class="text-sm font-semibold text-g-900">{{ $t('txLens.oc.onchainTitle') }}</span>
          <span v-if="detail && !detail.error" class="text-label text-tone-muted-text">{{
            $t('txLens.oc.onchainSource')
          }}</span>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="p-4"><el-skeleton :rows="5" animated /></div>

        <!-- 查询失败 / 不支持的链 -->
        <div v-else-if="errorText" class="p-4">
          <div
            class="flex items-center justify-between gap-3 px-4 py-3 bg-tone-progress-bg border border-[var(--tone-progress-border)] rounded-lg"
          >
            <div class="flex items-center gap-2 min-w-0">
              <ArtSvgIcon
                icon="ri:alert-line"
                class="text-tone-progress-text text-icon-md flex-shrink-0"
              />
              <span class="text-sm text-g-800 truncate">{{ errorText }}</span>
            </div>
            <el-button size="small" @click="() => load()">{{
              $t('txLens.oc.onchainRetry')
            }}</el-button>
          </div>
        </div>

        <!-- 详情 -->
        <div v-else-if="detail" class="p-4">
          <!--
            链上字段统一网格。
            用「单一 grid + 自动流」而非多个 3 列 grid 分行 ——
            分行会在字段数不是 3 的倍数时留下空位（实测 NONCE / Gas 单价那行右边就空了一格）。
            tx 哈希等长字段跨 3 列独占一行，其余字段每行 3 个。
          -->
          <div class="grid grid-cols-3 gap-x-4 gap-y-4">
            <!-- 交易哈希：与其它字段同样占一格（不跨列），缩写成一行、悬停看全量 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.detail.txHash')
              }}</span>
              <a
                v-if="txExplorerUrl"
                :href="txExplorerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-medium font-mono truncate text-tone-info-text hover:underline"
                :title="props.data?.txHash ?? undefined"
              >
                {{ shortTxHash }}
                <ArtSvgIcon icon="ri:external-link-line" class="text-icon-xs ml-0.5 align-middle" />
              </a>
              <span
                v-else
                class="text-xs font-medium font-mono truncate text-g-800"
                :title="props.data?.txHash ?? undefined"
                >{{ shortTxHash }}</span
              >
            </div>

            <!-- 执行结果 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldStatus')
              }}</span>
              <span class="text-sm font-semibold" :class="statusClass">{{ statusText }}</span>
            </div>

            <!-- 区块 / 检查点 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                isSui ? $t('txLens.oc.fieldCheckpoint') : $t('txLens.oc.fieldBlock')
              }}</span>
              <span class="text-sm font-medium font-mono text-g-900">{{
                detail.blockNumber ?? '--'
              }}</span>
            </div>

            <!-- 上链时间 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldBlockTime')
              }}</span>
              <span class="text-sm font-medium text-g-900">{{ chainTime }}</span>
            </div>

            <!-- 确认数：数值与终局状态并排一行，避免这格比同行高出一截 -->
            <div v-if="!isSui" class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldConfirmations')
              }}</span>
              <span class="text-sm font-medium text-g-900 flex items-center gap-2 flex-wrap">
                <span>
                  {{ detail.confirmations?.toLocaleString() ?? '--' }}
                  <!--
                    只在「未达阈值」时显示分母 —— 已达终局还显示 61293 / 19
                    会被读成除法，且分母已无意义。
                  -->
                  <span v-if="showRequired" class="text-label text-tone-muted-text">
                    / {{ detail.confirmationsRequired }}</span
                  >
                </span>
                <span class="text-label font-medium" :class="finalizedClass">
                  {{ finalizedText }}
                </span>
              </span>
            </div>

            <!-- Gas 用量 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldGasUsed')
              }}</span>
              <span class="text-sm font-medium font-mono text-g-900">{{ gasUsedText }}</span>
            </div>

            <!-- 手续费 -->
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldFee')
              }}</span>
              <span class="text-sm font-medium font-mono text-g-900">{{ feeText }}</span>
            </div>

            <!-- Gas 单价（EVM / Tron / Sui 均有，单位不同） -->
            <div v-if="detail.gasPrice" class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldGasPrice')
              }}</span>
              <span class="text-sm font-medium font-mono text-g-900">{{ gasPriceText }}</span>
            </div>

            <!-- Nonce（仅 EVM 有） -->
            <div v-if="detail.nonce != null" class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldNonce')
              }}</span>
              <span class="text-sm font-medium font-mono text-g-900">{{ detail.nonce }}</span>
            </div>

            <!-- 调用的合约 -->
            <div v-if="detail.contractAddress" class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.oc.fieldContract')
              }}</span>
              <span class="text-xs font-medium font-mono text-g-800 break-all">{{
                detail.contractAddress
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { OnChainTabView } from '@/features/compliance/types'
  import { queryOnChain, type OnChainDetail } from '@/features/compliance/onchain'
  import { buildTxLink } from '@/utils/format'

  const { t } = useI18n()
  const props = defineProps<{ data: OnChainTabView | null }>()

  const hasOnchainTx = computed(() => !!props.data?.txHash)

  /** 区块链浏览器链接（与 custody-manager 的 buildTxLink 同源规则） */
  const txExplorerUrl = computed(() =>
    buildTxLink(props.data?.txHash || '', props.data?.network || '')
  )

  /**
   * 交易哈希缩写：保头尾，保证一格内一行显示（完整值在 title 悬停与浏览器链接里）。
   * 与 StepCompliance 的地址摘要同款截断风格。
   */
  const shortTxHash = computed(() => {
    const h = props.data?.txHash || ''
    return h.length > 14 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h || '--'
  })

  // ─────────── 链上查询 ───────────
  const detail = ref<OnChainDetail | null>(null)
  const loading = ref(false)

  /** 定时刷新确认数：链在推进，确认数是时间的函数 */
  const REFRESH_MS = 15_000
  let timer: ReturnType<typeof setInterval> | null = null

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  async function load(isBackground = false) {
    const hash = props.data?.txHash
    const network = props.data?.network
    if (!hash || !network) return
    if (!isBackground) loading.value = true
    try {
      detail.value = await queryOnChain(hash, network)
    } finally {
      if (!isBackground) loading.value = false
    }
  }

  /*
   * ⚠️ 不能用 `watch(() => [a, b], ...)` 这种数组 getter：
   *    每次求值都会新建一个数组，Vue 按引用比较 → 判定为「变了」，
   *    于是每次 props.data 更新（父组件任何重渲染）都会重启定时器并重新查询，
   *    表现为链上接口被重复调用。
   *
   * 正确做法：把两个来源拆成独立的 watch，各自按值比较。
   */
  function restart(hash?: string, network?: string) {
    stopTimer()
    detail.value = null
    if (!hash || !network) return
    load()
    // 仅对「未终局」的交易轮询：终局后确认数不再变化，无需再打接口
    timer = setInterval(() => {
      if (detail.value?.finalized) {
        stopTimer()
        return
      }
      load(true)
    }, REFRESH_MS)
  }

  watch(
    () => props.data?.txHash,
    () => restart(props.data?.txHash, props.data?.network),
    {
      immediate: true
    }
  )

  watch(
    () => props.data?.network,
    (net) => {
      // 网络变了才需要重查（txHash 的 watch 已覆盖首次与哈希变化）
      if (net !== undefined && props.data?.txHash) {
        restart(props.data.txHash, net)
      }
    }
  )

  onBeforeUnmount(stopTimer)

  // ─────────── 展示映射 ───────────
  const isSui = computed(() => detail.value?.chainFamily === 'sui')

  const errorText = computed(() => {
    const e = detail.value?.error
    if (!e) return ''
    if (e.startsWith('unsupported-chain')) return t('txLens.oc.onchainUnsupported')
    if (e === 'no-tx-hash') return t('txLens.detail.noOnchainTx')
    return `${t('txLens.oc.onchainFailed')}（${e}）`
  })

  const statusText = computed(() => {
    const s = detail.value?.status
    if (s === 'success') return t('txLens.oc.statusSuccess')
    if (s === 'failed') return t('txLens.oc.statusFailed')
    if (s === 'pending') return t('txLens.oc.statusPending')
    return t('txLens.oc.statusUnknown')
  })

  const statusClass = computed(() => {
    const s = detail.value?.status
    if (s === 'success') return 'text-tone-done-text'
    if (s === 'failed') return 'text-tone-error-text'
    return 'text-tone-muted-text'
  })

  /** 上链时间按本地时区展示 */
  const chainTime = computed(() => {
    const iso = detail.value?.blockTime
    if (!iso) return '--'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  })

  /** 未达终局阈值时才显示分母（如 12 / 64）；已终局只显示数字 */
  const showRequired = computed(() => {
    const d = detail.value
    if (!d?.confirmationsRequired || d.confirmations == null) return false
    return d.confirmations < d.confirmationsRequired
  })

  const finalizedText = computed(() => {
    const f = detail.value?.finalized
    if (f == null) return '--'
    // 用「已终局 / 确认中」而非「是 / 确认中」—— 单独的「是」没有语义指向
    return f ? t('txLens.oc.finalizedYes') : t('txLens.oc.confirming')
  })

  const finalizedClass = computed(() => {
    const f = detail.value?.finalized
    if (f == null) return 'text-tone-muted-text'
    return f ? 'text-tone-done-text' : 'text-tone-progress-text'
  })

  /**
   * Gas 用量 + 单位。
   * 单位随链而异：EVM = gas · Tron = energy · Sui = MIST。
   * 不写单位会让人误以为所有链都是「gas」。
   */
  const gasUsedText = computed(() => {
    const g = detail.value?.gasUsed
    if (!g) return '--'
    // EVM 的 gas 用量本身就是「gas」这个单位，再加后缀会变成「152,631 Gas」重复
    const unit = gasUnit.value
    return unit ? `${Number(g).toLocaleString()} ${unit}` : Number(g).toLocaleString()
  })

  /** Gas 单价 + 单位（EVM 的 wei 对人不友好，换算成 Gwei） */
  const gasPriceText = computed(() => {
    const raw = detail.value?.gasPrice
    if (!raw) return '--'
    const n = Number(raw)
    if (!Number.isFinite(n)) return `${raw} ${gasPriceUnit.value}`
    if (detail.value?.chainFamily === 'evm') {
      // wei → Gwei（1 Gwei = 1e9 wei），保留 3 位有效小数
      const gwei = n / 1e9
      return `${gwei < 1 ? gwei.toFixed(9).replace(/0+$/, '').replace(/\.$/, '') : gwei.toFixed(3)} Gwei`
    }
    return `${n.toLocaleString()} ${gasPriceUnit.value}`
  })

  const gasUnit = computed(() => {
    switch (detail.value?.chainFamily) {
      case 'tron':
        return 'Energy'
      case 'sui':
        return 'MIST'
      default:
        return '' // EVM 的 gas 用量单位就是 gas 本身，无需后缀
    }
  })

  const gasPriceUnit = computed(() => {
    switch (detail.value?.chainFamily) {
      case 'tron':
        return 'Sun'
      case 'sui':
        return 'MIST'
      default:
        return 'Gwei'
    }
  })

  const feeText = computed(() => {
    const raw = detail.value?.feeFormatted
    if (!raw) return '--'
    /*
     * 各链精度不同（EVM 18 / Tron 6 / Sui 9），除法会留下大量尾随 0：
     *   Tron 的 0.378000 → 应显示 0.378
     * 但不能直接 toFixed 截断 —— EVM 的手续费可能小到 0.000000305，
     * 截断后会变成 0。因此保留原始小数字符串、只去尾部 0。
     */
    const trimmed = String(raw).includes('.')
      ? String(raw).replace(/0+$/, '').replace(/\.$/, '')
      : String(raw)
    return `${trimmed} ${nativeSymbol.value}`
  })

  const nativeSymbol = computed(() => {
    const n = (props.data?.network || '').toLowerCase()
    if (n.includes('tron')) return 'TRX'
    if (n.includes('sui')) return 'SUI'
    if (n.includes('bsc')) return 'BNB'
    if (n.includes('polygon')) return 'POL'
    if (n.includes('mantle')) return 'MNT'
    return 'ETH'
  })
</script>

<style scoped>
  /* 本组件已改为「链上详情」结构，不再有时间线节点，
     原先的 .timeline-* 样式已移除。 */
</style>
