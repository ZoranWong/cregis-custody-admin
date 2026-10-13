import { JsonRpcProvider, formatUnits } from 'ethers'
import type { ChainMeta, OnChainDetail } from './types'

/**
 * EVM 链上查询。
 *
 * 关键实现细节（均由实测反推，不是推测）：
 *
 * 1. **多端点降级**：`withFallback()` 依次尝试各 RPC，首个成功即返回。
 *    实测同一笔交易 publicnode 的 receipt 为 null、drpc 正常 —— 单端点会随机缺字段。
 *
 * 2. **receipt 缺失不等于失败**：交易可能已广播但未打包，此时
 *    `getTransactionReceipt` 返回 null，但 `getTransaction` 能拿到数据。
 *    这种情况标记为 `pending`，而不是错误。
 *
 * 3. **确认数以「最新块 - 交易块」实时计算**，不依赖后端返回值。
 */

/** 依次尝试多个 RPC，返回首个成功的结果 */
async function withFallback<T>(
  rpcs: string[],
  fn: (provider: JsonRpcProvider) => Promise<T>
): Promise<{ value: T; rpc: string }> {
  let lastErr: unknown = null
  for (const url of rpcs) {
    try {
      const provider = new JsonRpcProvider(url)
      const value = await fn(provider)
      return { value, rpc: url }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/**
 * 与 `withFallback` 相同，但把 **null 结果也当成该端点失败**，继续尝试下一个。
 *
 * 这是实测踩出来的坑：publicnode 对某些交易的 `eth_getTransactionReceipt`
 * 返回 `null` 而不报错，`withFallback` 会误判为成功，导致 gas / status 静默丢失。
 * 对「本应存在」的数据（收据、区块）必须用这个版本。
 */
async function withFallbackNonNull<T>(
  rpcs: string[],
  fn: (provider: JsonRpcProvider) => Promise<T | null>
): Promise<{ value: T | null; rpc: string }> {
  let sawNull: string | null = null
  let lastErr: unknown = null
  for (const url of rpcs) {
    try {
      const provider = new JsonRpcProvider(url)
      const value = await fn(provider)
      if (value != null) return { value, rpc: url }
      // 记住「所有端点都没数据」这种情况，与「全部报错」区分开
      sawNull = url
    } catch (e) {
      lastErr = e
    }
  }
  if (sawNull) return { value: null, rpc: sawNull }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

export async function queryEvm(txHash: string, meta: ChainMeta): Promise<OnChainDetail> {
  const base: OnChainDetail = {
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
    confirmationsRequired: meta.confirmationsRequired,
    finalized: null,
    gasUsed: null,
    gasPrice: null,
    fee: null,
    feeFormatted: null,
    status: 'unknown',
    error: null
  }

  try {
    // ① 交易本体 + 最新块号（这两个基本必定可用）
    const { value: core, rpc } = await withFallback(meta.rpcs, async (p) => {
      const [tx, latest] = await Promise.all([p.getTransaction(txHash), p.getBlockNumber()])
      return { tx, latest }
    })
    base.rpcUsed = rpc

    const { tx, latest } = core
    if (!tx) {
      base.status = 'unknown'
      base.error = 'tx-not-found'
      return base
    }

    base.from = tx.from ?? null
    base.to = tx.to ?? null
    base.nonce = tx.nonce ?? null
    base.valueRaw = tx.value != null ? tx.value.toString() : null
    if (tx.value != null) {
      base.value = formatUnits(tx.value, meta.nativeDecimals)
    }

    // 未打包：blockNumber 为 null
    if (tx.blockNumber == null) {
      base.status = 'pending'
      return base
    }

    base.blockNumber = tx.blockNumber
    base.blockHash = tx.blockHash ?? null

    // 合约地址：`to` 且有字节码 = 合约交互；无字节码 = 普通地址转账
    if (tx.to) {
      try {
        const { value: code } = await withFallback(meta.rpcs, (p) => p.getCode(tx.to!))
        if (code && code !== '0x') base.contractAddress = tx.to
      } catch {
        /* 取不到字节码就不标合约 */
      }
    }
    // 合约部署交易：新合约地址在收据里（下面取到 receipt 后回填）
    base.confirmations = Math.max(0, latest - tx.blockNumber)
    base.finalized = base.confirmations >= meta.confirmationsRequired

    // ② 区块时间（链上唯一的权威时间锚点）
    try {
      const { value: blk } = await withFallbackNonNull(meta.rpcs, (p) =>
        p.getBlock(tx.blockNumber!)
      )
      if (blk?.timestamp != null) {
        base.blockTime = new Date(blk.timestamp * 1000).toISOString()
      }
    } catch {
      /* 区块时间拿不到不影响其它字段 */
    }

    // ③ 收据：gas / 状态。可能缺失（见文件头注释 ②）
    try {
      const { value: rc } = await withFallbackNonNull(meta.rpcs, (p) =>
        p.getTransactionReceipt(txHash)
      )
      if (rc) {
        // 合约部署交易：收据里的 contractAddress 才是新合约地址
        const deployed = (rc as unknown as { contractAddress?: string | null }).contractAddress
        if (deployed) base.contractAddress = deployed
        base.gasUsed = rc.gasUsed != null ? rc.gasUsed.toString() : null
        base.status = rc.status === 1 ? 'success' : 'failed'

        // EIP-1559 用 effectiveGasPrice，老交易回退 gasPrice
        const eff = (rc as unknown as { effectiveGasPrice?: bigint }).effectiveGasPrice
        const price = eff ?? tx.gasPrice ?? null
        base.gasPrice = price != null ? price.toString() : null

        if (rc.gasUsed != null && price != null) {
          const fee = rc.gasUsed * price
          base.fee = fee.toString()
          base.feeFormatted = formatUnits(fee, meta.nativeDecimals)
        }
      } else {
        // 有区块号但取不到收据：保守标记为 pending，不臆断成功
        base.status = 'pending'
      }
    } catch {
      base.status = base.status === 'unknown' ? 'pending' : base.status
    }

    return base
  } catch (e) {
    base.error = e instanceof Error ? e.message : String(e)
    return base
  }
}
