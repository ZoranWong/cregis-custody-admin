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
      getPrec,
      getUnit,
      getMainCoin,
      getMainCoinDecimals
    }
  },
  { persist: false }
)
