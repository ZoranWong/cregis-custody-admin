import type { ChainMeta } from './types'

/**
 * 链注册表。
 *
 * ⚠️ 每个链都配了【多个 RPC】并会依次降级重试 —— 这不是冗余，是实测必需：
 *    同一笔 sepolia 交易，publicnode 的 eth_getTransactionReceipt 返回 null，
 *    而 drpc 正常返回。只配单一端点会导致「gas/状态」等字段随机缺失。
 *
 * 公共 RPC 均无鉴权、支持浏览器直连（已实测 CORS）。
 * 若后续要接入自建节点或付费 RPC（Alchemy/Infura），
 * 把 URL 插到数组最前面即可自动优先使用。
 *
 * ⚠️ 付费 RPC 的 API Key 不能写进前端代码 —— 那等于公开泄露。
 *    如需密钥，须由后端代理。
 */

/** 归一化网络名：小写、去空格 */
export function normalizeNetwork(network: string): string {
  return (network || '').toLowerCase().trim()
}

const EVM_COMMON_DECIMALS = 18

/** EVM 链的通用默认确认数（多数公链 12~64，这里取 64 作为「安全终局」参考） */
const EVM_FINALITY = 64

export const CHAINS: Record<string, ChainMeta> = {
  // ─────────────── Ethereum ───────────────
  'ethereum-sepolia': {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: EVM_FINALITY,
    rpcs: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://sepolia.drpc.org',
      'https://1rpc.io/sepolia'
    ]
  },
  sepolia: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: EVM_FINALITY,
    rpcs: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org']
  },
  ethereum: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: EVM_FINALITY,
    rpcs: ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org', 'https://1rpc.io/eth']
  },
  goerli: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: EVM_FINALITY,
    rpcs: ['https://goerli.drpc.org']
  },

  // ─────────────── 其它 EVM ───────────────
  bsc: {
    family: 'evm',
    nativeSymbol: 'BNB',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 15,
    rpcs: ['https://bsc-rpc.publicnode.com', 'https://bsc.drpc.org']
  },
  polygon: {
    family: 'evm',
    nativeSymbol: 'POL',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 128,
    rpcs: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon.drpc.org']
  },
  arbitrum: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1, // L2 单确认即终局
    rpcs: ['https://arbitrum-one-rpc.publicnode.com', 'https://arbitrum.drpc.org']
  },
  optimism: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1,
    rpcs: ['https://optimism-rpc.publicnode.com', 'https://optimism.drpc.org']
  },
  base: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1,
    rpcs: ['https://base-rpc.publicnode.com', 'https://base.drpc.org']
  },
  linea: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1,
    rpcs: ['https://linea-rpc.publicnode.com', 'https://linea.drpc.org']
  },
  mantle: {
    family: 'evm',
    nativeSymbol: 'MNT',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1,
    rpcs: ['https://mantle-rpc.publicnode.com', 'https://mantle.drpc.org']
  },
  zksync: {
    family: 'evm',
    nativeSymbol: 'ETH',
    nativeDecimals: EVM_COMMON_DECIMALS,
    confirmationsRequired: 1,
    rpcs: ['https://zksync.drpc.org']
  },

  // ─────────────── Tron ───────────────
  'tron-nile': {
    family: 'tron',
    nativeSymbol: 'TRX',
    nativeDecimals: 6, // Tron 的 TRX 精度是 6
    confirmationsRequired: 19, // Tron SR 共识，19 个块约 1 分钟
    rpcs: ['https://nile.trongrid.io']
  },
  tron: {
    family: 'tron',
    nativeSymbol: 'TRX',
    nativeDecimals: 6,
    confirmationsRequired: 19,
    rpcs: ['https://api.trongrid.io']
  },

  // ─────────────── Sui ───────────────
  sui: {
    family: 'sui',
    nativeSymbol: 'SUI',
    nativeDecimals: 9, // MIST → SUI
    confirmationsRequired: 1, // Sui 采用 DAG 共识，检查点即终局
    // ⚠️ Sui 公共全节点的 JSON-RPC 已废弃，必须用 GraphQL 端点
    rpcs: ['https://graphql.mainnet.sui.io/graphql']
  },
  'sui-testnet': {
    family: 'sui',
    nativeSymbol: 'SUI',
    nativeDecimals: 9,
    confirmationsRequired: 1,
    rpcs: ['https://graphql.testnet.sui.io/graphql']
  }
}

/** 按网络名模糊匹配链配置（形如 `ethereum-sepolia`、`tron-nile` 都能命中） */
export function resolveChain(network: string): ChainMeta | null {
  const n = normalizeNetwork(network)
  if (!n) return null
  if (CHAINS[n]) return CHAINS[n]
  // 退化为「包含匹配」，兼容后端返回带前缀/后缀的网络名
  const hit = Object.keys(CHAINS).find((k) => n.includes(k) || k.includes(n))
  return hit ? CHAINS[hit] : null
}
