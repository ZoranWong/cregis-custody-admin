import { TronWeb } from 'tronweb'
import type { ChainMeta, OnChainDetail } from './types'

/**
 * Tron 链上查询。
 *
 * ⚠️ 关键：**区块信息不在 `getTransaction` 里**
 *    `trx.getTransaction()` 只返回 { raw_data, signature, ret, raw_data_hex, txID }，
 *    **没有 blockNumber / blockID / timestamp**。
 *    区块、时间、手续费、执行结果都在 `trx.getTransactionInfo()` 中。
 *    （此前误从 getTransaction 取 blockNumber，导致已上链的交易被误判为 pending。）
 *
 * 与 EVM 的其它差异：
 *   - 时间戳单位是 **毫秒**
 *   - 无 receipt 概念，用 `ret[0].contractRet` / `receipt.result` 表示结果
 *   - 「能量」对应 gas，单位为 sun
 *   - 无统一 gasPrice，这里用「手续费 ÷ 能量」给出综合单价
 */
export async function queryTron(txHash: string, meta: ChainMeta): Promise<OnChainDetail> {
  const base: OnChainDetail = {
    chainFamily: 'tron',
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
      const tw = new TronWeb({ fullHost: url })

      // ① 交易本体：参与方与金额
      const tx = await tw.trx.getTransaction(txHash)
      if (!tx || !tx.txID) {
        lastErr = new Error('tx-not-found')
        continue
      }
      base.rpcUsed = url

      const contract = tx.raw_data?.contract?.[0]
      const contractType: string = contract?.type || ''
      const param = (contract?.parameter as unknown as { value?: Record<string, unknown> })?.value
      const owner = param?.owner_address as string | undefined

      const toBase58 = (hex?: string): string | null => {
        if (!hex) return null
        try {
          return tw.address.fromHex(hex)
        } catch {
          return hex
        }
      }
      base.from = toBase58(owner)

      if (contractType === 'TransferContract') {
        // 原生 TRX 转账：to / amount 直接在参数里
        base.to = toBase58(param?.to_address as string | undefined)
        const amount = param?.amount as number | undefined
        if (amount != null) {
          base.valueRaw = String(amount)
          base.value = String(amount / 10 ** meta.nativeDecimals)
        }
      } else if (contractType === 'TriggerSmartContract') {
        /*
         * TRC20 代币转账。
         * to / amount 编码在合约调用 data 里，需按 ABI 解码：
         *   data = 4字节方法选择器 + 32字节地址 + 32字节金额
         * 标准 transfer(address,uint256) 的选择器是 a9059cbb。
         * 非标准方法（自定义合约）无法解码，此时只给出代币合约地址，
         * value 留空 —— 不臆造金额。
         */
        base.contractAddress = toBase58(param?.contract_address as string | undefined)
        const data = String(param?.data || '')
        const selector = data.slice(0, 8).toLowerCase()
        if (selector === 'a9059cbb' && data.length >= 8 + 64 + 64) {
          const addrHex = '41' + data.slice(8 + 24, 8 + 64) // 补 Tron 的 0x41 前缀
          base.to = toBase58(addrHex)
          const raw = BigInt('0x' + data.slice(8 + 64, 8 + 128))
          base.valueRaw = raw.toString()
          // 代币精度未知，这里不给可读值（由业务层的币种信息补充）
        } else {
          // 非标准方法：给出代币合约地址供人工核对
          base.to = toBase58(param?.contract_address as string | undefined)
        }
      }

      // 交易层面已能判定的结果
      const contractRet = tx.ret?.[0]?.contractRet
      if (contractRet === 'SUCCESS') base.status = 'success'
      else if (contractRet) base.status = 'failed'

      // ② 交易回执：区块 / 时间 / 手续费 / 最终结果
      //    —— 这些字段 getTransaction 里没有，必须单独取
      try {
        const info = await tw.trx.getTransactionInfo(txHash)
        const blockNum: number | undefined = info?.blockNumber

        if (blockNum != null && blockNum > 0) {
          base.blockNumber = blockNum

          const ts = info?.blockTimeStamp
          if (ts != null) base.blockTime = new Date(Number(ts)).toISOString()

          /*
           * 确认数 = 最新块 − 交易块。
           *
           * 这里必须额外请求 getnowblock —— 它是为了拿「当前块号」这一个数字。
           * 因此只在【可能未终局】时才值得查：Tron 出块约 3 秒，
           * 若交易所在块距今已超过 confirmationsRequired 个块的时间窗，
           * 就不可能未终局，直接按终局处理，省掉这次请求。
           *
           * 注意：无出块时间时的降级判断由调用方（视图层）控制，
           * 视图仅在 finalized !== true 时轮询，因此已终局交易不会反复打这个接口。
           */
          try {
            const now = await tw.trx.getCurrentBlock()
            const latest: number | undefined = now?.block_header?.raw_data?.number
            if (latest != null) {
              base.confirmations = Math.max(0, latest - blockNum)
              base.finalized = base.confirmations >= meta.confirmationsRequired
            }
          } catch {
            /* 确认数拿不到不影响其它字段 */
          }

          const feeSun: number | undefined = info?.fee
          if (feeSun != null) {
            base.fee = String(feeSun)
            base.feeFormatted = String(feeSun / 10 ** meta.nativeDecimals)
          }

          const energy = info?.receipt?.energy_usage_total
          if (energy != null) base.gasUsed = String(energy)

          if (feeSun != null && energy != null && energy > 0) {
            base.gasPrice = String(Math.round(feeSun / energy))
          }

          // 回执里的结果更权威（覆盖 contractRet）
          const receiptResult = info?.receipt?.result
          if (receiptResult === 'SUCCESS') base.status = 'success'
          else if (receiptResult) base.status = 'failed'
        } else {
          // 无区块号 = 尚未打包
          base.status = 'pending'
        }
      } catch {
        // 回执取不到：若交易层面已判定则沿用，否则保守标 pending
        if (base.status === 'unknown') base.status = 'pending'
      }

      return base
    } catch (e) {
      lastErr = e
    }
  }

  base.error = lastErr instanceof Error ? lastErr.message : String(lastErr)
  return base
}
