// v2 store — 币种元数据（参考 v1 src/stores/coins.ts）
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchCoinList, type CoinOnChainView } from '@/api/coin'

/**
 * 全局币种元数据。
 *
 * `/coin/list` 只在系统刷新后加载一次（路由后置守卫触发），页面切换直接读内存；
 * loaded / fetchedAt 为会话内状态不持久化，list 持久化以便刷新后请求失败时仍可展示。
 */
export const useCoinStore = defineStore(
  'coins',
  () => {
    const list = ref<CoinOnChainView[]>([])
    const loaded = ref(false)
    const loading = ref(false)
    /** 上次拉取时间戳 */
    const fetchedAt = ref(0)

    // 旧版本把 loaded 也持久化了：清掉，保证每次系统刷新后重新加载一次币种
    loaded.value = false

    /** 系统刷新后加载一次：拉取 `/coin/list`，失败时保留持久化的上一次列表 */
    async function ensureLoaded(): Promise<void> {
      if (loading.value || loaded.value) return

      loading.value = true
      try {
        const data = await fetchCoinList()
        list.value = Array.isArray(data) ? data : []
        fetchedAt.value = Date.now()
      } catch {
        // 币种列表非关键数据：失败时沿用持久化缓存里的列表
      } finally {
        loaded.value = true
        loading.value = false
      }
    }

    /** 清空缓存（登出 / 切换账号时调用，避免串用上一个账号的币种数据） */
    function reset(): void {
      list.value = []
      loaded.value = false
      loading.value = false
      fetchedAt.value = 0
    }

    /** 未软删除的币种（选择器 / 资产行展示用） */
    const activeList = computed(() => list.value.filter((c) => c.isDeleted !== 1))

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
      activeList,
      loaded,
      loading,
      fetchedAt,
      ensureLoaded,
      reset,
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
  {
    persist: {
      key: 'coins',
      storage: localStorage,
      // 只持久化列表：loaded / fetchedAt 是会话内状态，系统刷新后重新加载一次
      pick: ['list']
    }
  }
)
