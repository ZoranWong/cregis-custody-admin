import { resolveChain } from './chains'
import { queryEvm } from './evm'
import { queryTron } from './tron'
import { querySui } from './sui'
import type { OnChainDetail } from './types'

export * from './types'
export { resolveChain, CHAINS } from './chains'

/** 不支持的链返回的统一结果（视图据此提示，而不是报错） */
function unsupported(network: string): OnChainDetail {
  return {
    chainFamily: 'evm',
    rpcUsed: null,
    from: null,
    to: null,
    contractAddress: null,
    value: null,
    valueRaw: null,
    nonce: null,
    blockNumber: null,
    blockHash: null,
    blockTime: null,
    confirmations: null,
    confirmationsRequired: null,
    finalized: null,
    gasUsed: null,
    gasPrice: null,
    fee: null,
    feeFormatted: null,
    status: 'unknown',
    error: `unsupported-chain:${network}`
  }
}

/**
 * 查询一笔交易的链上详情。
 *
 * 按链族分派到对应 SDK；网络未登记时返回 `unsupported-chain` 而非抛错 ——
 * 视图可以据此优雅降级（例如只显示「该链暂不支持链上核验」）。
 */
export async function queryOnChain(txHash: string, network: string): Promise<OnChainDetail> {
  if (!txHash) return { ...unsupported(network), error: 'no-tx-hash' }
  const meta = resolveChain(network)
  if (!meta) return unsupported(network)

  switch (meta.family) {
    case 'evm':
      return queryEvm(txHash, meta)
    case 'tron':
      return queryTron(txHash, meta)
    case 'sui':
      return querySui(txHash, meta)
    default:
      return unsupported(network)
  }
}
