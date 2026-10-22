/**
 * Cold Storage Transfers — 视图模型。
 *
 * 原型：docs/prototype/.../pages-v2/ops-cold-storage.html 与 -detail.html。
 *
 * ⚠️ 后端尚未提供冷存储转账接口（live openapi 中没有任何 coldStorage / airgap 路径），
 * 因此当前数据由 features/ops/coldStorage/mock.ts 提供，页面会显示「接口待接入」提示。
 * 接口就绪后只需替换 mock 模块，本文件的类型与页面无需改动。
 */

/** 请求状态，取值与原型 status-badge 一一对应 */
export type ColdStorageTransferStatus =
  | 'pending'
  | 'signed'
  | 'broadcast'
  | 'confirmed'
  | 'failed'
  | 'aborted'

/** 工作流阶段：导出指令 → 导入签名交易 → 广播上链 */
export type ColdStorageWorkflowStep = 'export' | 'import' | 'broadcast'

export interface ColdStorageApprover {
  id: string
  name: string
  email: string
  /** 签名公钥，展示为 0x8f2a...4d1b */
  keyRef: string
  approved: boolean
  approvedAt: string | null
}

export interface ColdStorageTransferView {
  /** 请求单号，如 REQ-2024-0847 */
  requestId: string
  merchantName: string
  merchantCode: string
  /** 资产符号，如 BTC / USDT */
  coinId: string
  /** 原始金额（最小单位字符串） */
  amount: string
  /** 金额精度，用于格式化 */
  decimals: number
  network: string
  sourceAddress: string
  destinationAddress: string
  requestedAt: string
  status: ColdStorageTransferStatus
  /** 当前进行中的工作流步骤；已完结的单子为 null */
  currentStep: ColdStorageWorkflowStep | null
  /** 审批阈值说明，如 "2 of 3 signatures required" */
  approvalThreshold: { required: number; total: number }
  approvers: ColdStorageApprover[]
  /** 导出指令文件名（导出后才有） */
  exportedFile: { name: string; exportedAt: string } | null
  /** 导入签名交易文件名（导入后才有） */
  importedFile: { name: string; importedAt: string } | null
  /** 中止原因（仅 aborted 状态） */
  abortReason: string | null
  /** 链上交易哈希（广播后才有） */
  txHash: string | null
}

/**
 * 导出给离线签名系统（airgap）的指令文件结构。
 * 导入时按同一结构校验，保证导出的文件能被正确识别。
 */
export interface ColdStorageInstructionFile {
  /** 文件格式标识，用于导入时识别而非误传其他 JSON */
  format: 'cregis-cold-storage-instruction'
  version: 1
  requestId: string
  merchantName: string
  coinId: string
  amount: string
  decimals: number
  network: string
  sourceAddress: string
  destinationAddress: string
  /** 已收集到的审批人公钥引用 */
  approvals: string[]
  exportedAt: string
}

/** 离线签名系统回传的签名交易文件 */
export interface ColdStorageSignedTxFile {
  format: 'cregis-cold-storage-signed-tx'
  version: 1
  requestId: string
  /** 链上原始交易（hex） */
  rawTransaction: string
  /** 参与签名的公钥引用 */
  signatures: string[]
  signedAt: string
}

export interface ColdStorageTransferFilters {
  status: ColdStorageTransferStatus | ''
  merchantCode: string
  coinId: string
  keyword: string
}

export interface ColdStorageTransferPage {
  records: ColdStorageTransferView[]
  total: number
  current: number
  size: number
}
