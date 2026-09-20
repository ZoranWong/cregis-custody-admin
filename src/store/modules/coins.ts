// v2 store — 币种元数据（参考 v1 src/stores/coins.ts）
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchCoinList, type CoinOnChainView } from '@/api/coin'

export const useCoinStore = defineStore(
  'coins',
  () => {
    const list = ref<CoinOnChainView[]>([])
    const loaded = ref(false)
    const loading = ref(false)

    async function ensureLoaded(): Promise<void> {
      if (loaded.value || loading.value) return
      loading.value = true
      try {
        const data = await fetchCoinList()
        // 防御：确保赋值的是数组（后端可能包裹在 MessageResult 中）
        list.value = Array.isArray(data) ? data : []
        loaded.value = true
      } catch {
        list.value = []
        // Coin list is non-critical; consumers handle missing data gracefully.
      } finally {
        loading.value = false
      }
    }

    function getCoin(coinId: string, network: string): CoinOnChainView | undefined {
      return list.value.find(
        (c) =>
          c.coinId.toUpperCase() === coinId.toUpperCase() &&
          c.network.toLowerCase().includes(network.toLowerCase().split(/[-_]/)[0])
      )
    }

    /** 基础单位精度，用于 rawAmount / 10^decimals */
    function getDecimals(coinId: string, network: string): number {
      return getCoin(coinId, network)?.decimals ?? 0
    }

    /**
     * 根据 coinId（+可选 network）获取 decimals；coinId 未知时返回 0。
     * 优先按 coinId + network 精确匹配，其次按 coinId 兜底匹配。
     */
    function getDecimalsByCoinId(
      coinId: string | null | undefined,
      network?: string | null
    ): number {
      if (!coinId) return 0
      if (network) {
        const c = getCoin(coinId, network)
        if (c) return c.decimals
      }
      const fallback = list.value.find((c) => c.coinId.toUpperCase() === coinId.toUpperCase())
      return fallback?.decimals ?? 0
    }

    /**
     * 根据 CAIP-19 assetCode 解析 coinId：
     * 形如 "eip155:11155111/erc20:0xA2c7..." → 用合约地址（appendix）匹配 coin；
     * 或直接是 "NBU" 这类裸 coinId。
     */
    function resolveCoinIdByAssetCode(assetCode: string | null | undefined): string | null {
      if (!assetCode) return null
      if (!assetCode.includes('/')) return assetCode.toUpperCase()
      const parts = assetCode.split('/')
      const contract = parts[parts.length - 1]
      if (!contract) return null
      const hit = list.value.find(
        (c) => c.appendix && c.appendix.toLowerCase() === contract.toLowerCase()
      )
      return hit?.coinId ?? null
    }

    /** 显示精度，用于 toFixed(prec) */
    function getPrec(coinId: string, network: string): number {
      return getCoin(coinId, network)?.prec ?? 4
    }

    /** 货币缩写，如 ETH、USDT、SOL */
    function getUnit(coinId: string, network: string): string {
      return getCoin(coinId, network)?.unit ?? coinId
    }

    /** 根据 network 查找主币（tokenFlag === 0） */
    function getMainCoin(network: string): CoinOnChainView | undefined {
      return list.value.find(
        (c) =>
          c.tokenFlag === 0 &&
          c.network.toLowerCase().includes(network.toLowerCase().split(/[-_]/)[0])
      )
    }

    /** 根据 network 获取主币 decimals */
    function getMainCoinDecimals(network: string): number {
      return getMainCoin(network)?.decimals ?? 0
    }

    return {
      list,
      loaded,
      loading,
      ensureLoaded,
      getCoin,
      getDecimals,
      getDecimalsByCoinId,
      resolveCoinIdByAssetCode,
      getPrec,
      getUnit,
      getMainCoin,
      getMainCoinDecimals
    }
  },
  { persist: false }
)
