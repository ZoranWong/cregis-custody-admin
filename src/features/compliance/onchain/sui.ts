import { SuiGraphQLClient } from '@mysten/sui/graphql'
import type { ChainMeta, OnChainDetail } from './types'

/**
 * Sui 链上查询。
 *
 * ⚠️ 必须用 **GraphQL**，不能用 JSON-RPC：
 *    Sui 官方已弃用公共全节点的 JSON-RPC（`Method not found`），
 *    现只提供 gRPC 与 GraphQL。这里选 GraphQL —— 它对浏览器直连友好。
 *
 * 与 EVM 的差异：
 *   - 没有「交易在哪个块」的概念，改为**检查点（checkpoint）**
 *   - 时间戳单位是**毫秒**
 *   - 无 gasPrice 概念，手续费 = computationCost + storageCost - storageRebate
 *   - 一笔交易可含多条指令，参与方需从指令中提取，可能是多对多
 */

/** Sui 交易查询语句 */
const TX_QUERY = `query($d: String!) {
  transaction(digest: $d) {
    digest
    effects {
      status
      checkpoint { sequenceNumber timestamp }
      gasEffects { gasSummary { computationCost storageCost storageRebate } }
    }
    transactionJson
  }
}`

interface SuiTxResult {
  transaction?: {
    digest: string
    effects?: {
      status?: string | null
      checkpoint?: { sequenceNumber: number | string; timestamp: string } | null
      gasEffects?: {
        gasSummary?: {
          computationCost?: string | null
          storageCost?: string | null
          storageRebate?: string | null
        } | null
      } | null
    } | null
    transactionJson?: unknown
  } | null
}

export async function querySui(txHash: string, meta: ChainMeta): Promise<OnChainDetail> {
  const base: OnChainDetail = {
    chainFamily: 'sui',
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

  let lastErr: unknown = null
  for (const url of meta.rpcs) {
    try {
      const client = new SuiGraphQLClient({ url })
      const res = (await client.query({
        query: TX_QUERY,
        variables: { d: txHash }
      })) as { data?: SuiTxResult; errors?: { message: string }[] }

      if (res.errors?.length) {
        lastErr = new Error(res.errors[0].message)
        continue
      }
      const tx = res.data?.transaction
      if (!tx) {
        lastErr = new Error('tx-not-found')
        continue
      }
      base.rpcUsed = url

      /*
       * 解析 transactionJson —— 结构是【扁平】的，不是嵌套的：
       *   { digest, version, kind: { kind: 'PROGRAMMABLE_TRANSACTION',
       *                              programmableTransaction: { inputs, commands } },
       *     sender, gasPayment: { price, budget }, expiration }
       *
       * 易错点：kind 本身也是 { kind: '...', ... } 的形状，
       * 且「系统交易」（如 CONSENSUS_COMMIT_PROLOGUE）没有 programmableTransaction，
       * sender 会是全 0 地址、gas 为 0 —— 需区分对待。
       */
      interface SuiCommand {
        moveCall?: { package?: string; module?: string; function?: string }
        transferObjects?: { address?: unknown }[]
        transferSui?: { recipient?: unknown }
        splitCoins?: unknown
      }
      const json = tx.transactionJson as
        | {
            sender?: string
            kind?: { kind?: string; programmableTransaction?: { commands?: SuiCommand[] } }
            gasPayment?: { price?: string | number }
          }
        | undefined

      const ZERO_ADDR = '0x' + '0'.repeat(64)
      const sender = json?.sender
      if (sender && sender !== ZERO_ADDR) base.from = sender

      const commands = json?.kind?.programmableTransaction?.commands || []

      // 合约地址：优先取第一个 moveCall 的 package
      const moveCall = commands.find((c) => c.moveCall)?.moveCall
      if (moveCall?.package) base.contractAddress = moveCall.package

      // 接收方：从转账指令里取
      for (const c of commands) {
        const addr = c.transferObjects?.[0]?.address ?? c.transferSui?.recipient
        if (addr) {
          base.to = typeof addr === 'string' ? addr : String(addr)
          break
        }
      }

      // Sui 的 gas 单价在 gasPayment.price（单位 MIST）
      const price = json?.gasPayment?.price
      if (price != null) base.gasPrice = String(price)

      const eff = tx.effects
      const st = eff?.status
      if (st === 'SUCCESS') base.status = 'success'
      else if (st) base.status = 'failed'

      // 检查点（Sui 无块号概念）
      const cp = eff?.checkpoint
      const cpSeq = cp?.sequenceNumber
      if (cpSeq != null) {
        base.blockNumber = Number(cpSeq)
        if (cp?.timestamp) base.blockTime = new Date(cp.timestamp).toISOString()
        // Sui 采用 DAG 共识，进入检查点即终局
        base.finalized = true
      } else {
        base.status = 'pending'
        return base
      }

      // 手续费：computation + storage - rebate
      const gs = eff?.gasEffects?.gasSummary
      if (gs) {
        const computation = BigInt(gs.computationCost || '0')
        const storage = BigInt(gs.storageCost || '0')
        const rebate = BigInt(gs.storageRebate || '0')
        const fee = computation + storage - rebate
        base.gasUsed = (computation + storage).toString()
        base.fee = fee.toString()
        base.feeFormatted = String(Number(fee) / 10 ** meta.nativeDecimals)
      }

      return base
    } catch (e) {
      lastErr = e
    }
  }

  base.error = lastErr instanceof Error ? lastErr.message : String(lastErr)
  return base
}
