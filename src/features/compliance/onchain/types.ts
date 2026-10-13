/**
 * 链上查询：统一数据契约。
 *
 * 设计原则
 * ─────────
 * 1. **只呈现链上事实**：区块、确认数、gas、上链时间等 —— 这些可从链上独立核验。
 *    平台内部的业务节点（签名 / 合规审核 / 人工审核）链上不存在，不在此列。
 * 2. **链无关的统一形状**：EVM / Tron / Sui 的原始返回差异很大，
 *    这里归一成同一结构，视图层不必关心链的类型。
 * 3. **部分失败可降级**：任一 RPC 挂了只影响对应字段，不整体报错 ——
 *    实测同一笔交易在不同 RPC 上的返回并不一致（有的不返回 receipt）。
 */

/** 链族 —— 决定用哪个 SDK */
export type ChainFamily = 'evm' | 'tron' | 'sui'

/** 交易在链上的执行结果 */
export type OnChainStatus = 'success' | 'failed' | 'pending' | 'unknown'

/** 字段来源：链上实查 / 无法获取 */
export interface OnChainDetail {
  chainFamily: ChainFamily
  /** 实际使用的 RPC，便于排查（多端点会轮询） */
  rpcUsed: string | null

  // ── 交易 ──
  from: string | null
  to: string | null
  /**
   * 本次调用的合约地址。
   *   EVM  : `to` 且该地址有字节码时即合约；合约部署交易的地址在收据里
   *   Tron : TriggerSmartContract 的 contract_address
   *   Sui  : moveCall.package
   * 非合约交互（原生币转账 / EOA 转账）时为 null。
   */
  contractAddress: string | null
  /** 转账金额（已按精度格式化的可读值，如 0.02） */
  value: string | null
  /** 原始最小单位值（字符串，避免大数精度丢失） */
  valueRaw: string | null
  nonce: number | null

  // ── 区块 ──
  blockNumber: number | null
  blockHash: string | null
  /** 上链时间（ISO 8601）。链上能提供的【唯一】权威时间锚点 */
  blockTime: string | null

  // ── 确认 ──
  /** 当前确认数 = 最新块 - 交易所在块 */
  confirmations: number | null
  /** 达到该确认数即视为终局（各链不同，见 CHAIN_META） */
  confirmationsRequired: number | null
  /** 是否已终局（EVM 用 finalized 标签；其它链用确认数阈值） */
  finalized: boolean | null

  // ── 费用 ──
  /** 实际消耗的 gas（EVM）/ 能量（Tron） */
  gasUsed: string | null
  /** 实际单价（EVM 为 wei；Tron 为 sun） */
  gasPrice: string | null
  /** 该笔交易的实际手续费（原始单位） */
  fee: string | null
  /** 手续费可读值（已按本币精度格式化） */
  feeFormatted: string | null

  // ── 结果 ──
  status: OnChainStatus

  /** 查询失败原因（部分字段可能仍有值） */
  error: string | null
}

/** 各链的静态元信息 */
export interface ChainMeta {
  family: ChainFamily
  /** 本币符号，用于展示手续费 */
  nativeSymbol: string
  /** 本币精度（用于格式化 value / fee） */
  nativeDecimals: number
  /** 视为终局所需的确认数 */
  confirmationsRequired: number
  /** RPC 端点（按顺序尝试，前者失败自动降级到下一个） */
  rpcs: string[]
  /** 区块浏览器地址模板 */
  explorer?: (hash: string) => string
}
