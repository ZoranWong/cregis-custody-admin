/**
 * Cold Storage Transfers — 本地数据源。
 *
 * 后端冷存储转账接口尚未实现（live openapi 无对应路径），
 * 这里按原型 ops-cold-storage*.html 构造一批请求，覆盖全部 5 种状态与 3 个工作流阶段，
 * 便于先把交互与视觉验收掉。接口就绪后把本文件替换为 api/operationsColdStorage.ts 即可，
 * 页面与 composable 的调用签名保持不变。
 */
import type {
  ColdStorageInstructionFile,
  ColdStorageSignedTxFile,
  ColdStorageTransferView
} from './types'

const HOUR = 3600 * 1000
const now = Date.now()
const iso = (hoursAgo: number) => new Date(now - hoursAgo * HOUR).toISOString()

const APPROVERS_2OF3 = (approvedCount: number) => [
  {
    id: 'u1',
    name: 'John Doe',
    email: 'john.doe@cryptovault.com',
    keyRef: '0x8f2a...4d1b',
    approved: approvedCount > 0,
    approvedAt: approvedCount > 0 ? iso(2) : null
  },
  {
    id: 'u2',
    name: 'Alex Morgan',
    email: 'alex.morgan@cryptovault.com',
    keyRef: '0x3c7e...9a2f',
    approved: approvedCount > 1,
    approvedAt: approvedCount > 1 ? iso(2) : null
  },
  {
    id: 'u3',
    name: 'Sam Lee',
    email: 'sam.lee@cryptovault.com',
    keyRef: '0x5d1f...7c3e',
    approved: approvedCount > 2,
    approvedAt: approvedCount > 2 ? iso(2) : null
  }
]

/**
 * 数据持久化：把工作流操作结果写入 localStorage。
 * 冷存储接口未就绪前，这能让刷新页面后状态不回退；
 * 接口接入后删除这段持久化逻辑即可。
 */
const STORAGE_KEY = 'cregis.cold-storage.transfers'

const seed: ColdStorageTransferView[] = [
  {
    requestId: 'REQ-2024-0847',
    merchantName: 'CryptoVault Ltd',
    merchantCode: '1225',
    coinId: 'BTC',
    amount: '1250000000',
    decimals: 8,
    network: 'bitcoin',
    sourceAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    destinationAddress: 'bc1qar0srrr7xfkvy5l643ledn8v6r9z3x8y5w4t2u',
    requestedAt: iso(2),
    status: 'pending',
    currentStep: 'export',
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(2),
    exportedFile: null,
    importedFile: null,
    abortReason: null,
    txHash: null
  },
  {
    requestId: 'REQ-2024-0846',
    merchantName: 'PayFlow Inc',
    merchantCode: '1524',
    coinId: 'USDT',
    amount: '850000000000',
    decimals: 6,
    network: 'ethereum-sepolia',
    sourceAddress: '0x0f44Ce5D7140a9FBD2A7b5e9457075443358c214',
    destinationAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    requestedAt: iso(5),
    status: 'pending',
    currentStep: 'export',
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(2),
    exportedFile: null,
    importedFile: null,
    abortReason: null,
    txHash: null
  },
  {
    requestId: 'REQ-2024-0845',
    merchantName: 'NodeSphere',
    merchantCode: '1269',
    coinId: 'ETH',
    amount: '150750000000000000000',
    decimals: 18,
    network: 'ethereum-sepolia',
    sourceAddress: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    destinationAddress: '0x45911Fd0a88C5F7CAAb56C975a2042E411c32337',
    requestedAt: iso(24),
    status: 'signed',
    currentStep: 'import',
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(3),
    exportedFile: { name: 'REQ-2024-0845-instruction.json', exportedAt: iso(20) },
    importedFile: null,
    abortReason: null,
    txHash: null
  },
  {
    requestId: 'REQ-2024-0844',
    merchantName: 'TokenGuard',
    merchantCode: '1541',
    coinId: 'SOL',
    amount: '2400000000000',
    decimals: 9,
    network: 'solana-testnet',
    sourceAddress: '7EcDhSYGxXyscszYEp3fK1k9pJzq8mLqRvWxYzAbCDE',
    destinationAddress: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
    requestedAt: iso(48),
    status: 'broadcast',
    currentStep: 'broadcast',
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(3),
    exportedFile: { name: 'REQ-2024-0844-instruction.json', exportedAt: iso(44) },
    importedFile: { name: 'REQ-2024-0844-signed.json', importedAt: iso(40) },
    abortReason: null,
    txHash: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM74bf'
  },
  {
    requestId: 'REQ-2024-0843',
    merchantName: 'CryptoVault Ltd',
    merchantCode: '1225',
    coinId: 'USDC',
    amount: '420000000000',
    decimals: 6,
    network: 'ethereum-sepolia',
    sourceAddress: '0x285c5a2b8e5c6e9d4f3a2b1c0d9e8f7a6b5c4d3',
    destinationAddress: '0x0f44Ce5D7140a9FBD2A7b5e9457075443358c214',
    requestedAt: iso(72),
    status: 'confirmed',
    currentStep: null,
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(3),
    exportedFile: { name: 'REQ-2024-0843-instruction.json', exportedAt: iso(70) },
    importedFile: { name: 'REQ-2024-0843-signed.json', importedAt: iso(66) },
    abortReason: null,
    txHash: '0x8f3a7b2c4d6e8f90123456789abcdef0123456789abcdef0123456789abc91d'
  },
  {
    requestId: 'REQ-2024-0842',
    merchantName: 'PayFlow Inc',
    merchantCode: '1524',
    coinId: 'ETH',
    amount: '25000000000000000000',
    decimals: 18,
    network: 'ethereum-sepolia',
    sourceAddress: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75',
    destinationAddress: '0xd785fff000a8e55dea379f9caf8b8cb13608a86a',
    requestedAt: iso(96),
    status: 'failed',
    currentStep: null,
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(3),
    exportedFile: { name: 'REQ-2024-0842-instruction.json', exportedAt: iso(94) },
    importedFile: { name: 'REQ-2024-0842-signed.json', importedAt: iso(90) },
    abortReason: null,
    txHash: null
  },
  {
    requestId: 'REQ-2024-0841',
    merchantName: 'NodeSphere',
    merchantCode: '1269',
    coinId: 'TRX',
    amount: '1280000000000',
    decimals: 6,
    network: 'tron-nile',
    sourceAddress: 'TGSgQ3xxdD5Ls99sAxgHVo5B9J2u6kmgRv',
    destinationAddress: 'TU1TkBCosx7YkacJ2CyNhmzgybX3rfxDci',
    requestedAt: iso(110),
    status: 'aborted',
    currentStep: null,
    approvalThreshold: { required: 2, total: 3 },
    approvers: APPROVERS_2OF3(1),
    exportedFile: null,
    importedFile: null,
    abortReason: 'Customer withdrew the request before the second signature was collected.',
    txHash: null
  }
]

function restore(): ColdStorageTransferView[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return raw ? (JSON.parse(raw) as ColdStorageTransferView[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function persist(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    }
  } catch {
    /* 存储不可用时忽略，内存态仍然有效 */
  }
}

const records: ColdStorageTransferView[] = restore()

/** 列表查询（本地筛选 + 分页，模拟后端行为） */
export function queryColdStorageTransfers(params: {
  status?: string
  merchantCode?: string
  coinId?: string
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ records: ColdStorageTransferView[]; total: number; current: number; size: number }> {
  const keyword = (params.keyword || '').trim().toLowerCase()
  const filtered = records.filter((r) => {
    if (params.status && r.status !== params.status) return false
    if (params.merchantCode && r.merchantCode !== params.merchantCode) return false
    if (params.coinId && r.coinId !== params.coinId) return false
    if (keyword) {
      const hit =
        r.requestId.toLowerCase().includes(keyword) ||
        r.destinationAddress.toLowerCase().includes(keyword) ||
        r.sourceAddress.toLowerCase().includes(keyword)
      if (!hit) return false
    }
    return true
  })
  const page = params.page ?? 1
  const size = params.pageSize ?? 10
  const start = (page - 1) * size
  return Promise.resolve({
    records: filtered.slice(start, start + size),
    total: filtered.length,
    current: page,
    size
  })
}

export function fetchColdStorageTransfer(
  requestId: string
): Promise<ColdStorageTransferView | null> {
  const hit = records.find((r) => r.requestId === requestId)
  // 返回副本，避免页面直接改到源数据；写操作统一走下面的 mutation 函数
  return Promise.resolve(hit ? structuredClone(hit) : null)
}

/**
 * 工作流写操作。
 *
 * 后端接口就绪后由真实 API 调用替代，页面侧的调用签名保持不变：
 *   buildInstructionFile       → 生成导出给离线签名系统的指令文件
 *   exportColdStorageInstruction → 记录导出结果（pending → signed）
 *   importColdStorageSignedTx  → 校验并导入签名文件（signed → broadcast）
 *   abortColdStorageTransfer   → 中止请求（进行中 → aborted）
 * 结果写回源 records，使列表与详情在同一会话内保持一致。
 */

/** 生成指令文件内容（导出时下载为 JSON） */
export function buildInstructionFile(
  transfer: ColdStorageTransferView
): ColdStorageInstructionFile {
  return {
    format: 'cregis-cold-storage-instruction',
    version: 1,
    requestId: transfer.requestId,
    merchantName: transfer.merchantName,
    coinId: transfer.coinId,
    amount: transfer.amount,
    decimals: transfer.decimals,
    network: transfer.network,
    sourceAddress: transfer.sourceAddress,
    destinationAddress: transfer.destinationAddress,
    approvals: transfer.approvers.filter((a) => a.approved).map((a) => a.keyRef),
    exportedAt: new Date().toISOString()
  }
}

export function exportColdStorageInstruction(
  requestId: string,
  fileName?: string
): Promise<ColdStorageTransferView | null> {
  const hit = records.find((r) => r.requestId === requestId)
  if (!hit || hit.status !== 'pending') return Promise.resolve(hit ? structuredClone(hit) : null)
  hit.exportedFile = {
    name: fileName || `${hit.requestId}-instruction.json`,
    exportedAt: new Date().toISOString()
  }
  hit.status = 'signed'
  hit.currentStep = 'import'
  persist()
  return Promise.resolve(structuredClone(hit))
}

/** 导入失败的原因：供页面直接展示 */
export class ColdStorageImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ColdStorageImportError'
  }
}

/**
 * 校验并导入签名交易文件。
 *
 * 校验项（任一不满足即抛错，页面据此提示用户）：
 *   1. JSON 可解析
 *   2. format 为 signed-tx，避免误传导出的指令文件
 *   3. requestId 与当前请求一致
 *   4. rawTransaction 非空
 */
export function parseSignedTxFile(raw: string): ColdStorageSignedTxFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new ColdStorageImportError('INVALID_JSON')
  }
  const file = parsed as Partial<ColdStorageSignedTxFile>
  if (!file || file.format !== 'cregis-cold-storage-signed-tx') {
    throw new ColdStorageImportError('INVALID_FORMAT')
  }
  if (!file.requestId) throw new ColdStorageImportError('MISSING_REQUEST_ID')
  if (!file.rawTransaction) throw new ColdStorageImportError('MISSING_RAW_TX')
  return file as ColdStorageSignedTxFile
}

export function importColdStorageSignedTx(
  requestId: string,
  fileName: string,
  signedTx: ColdStorageSignedTxFile
): Promise<ColdStorageTransferView | null> {
  const hit = records.find((r) => r.requestId === requestId)
  if (!hit) return Promise.resolve(null)
  if (hit.status !== 'signed') return Promise.resolve(structuredClone(hit))
  if (signedTx.requestId !== hit.requestId) {
    throw new ColdStorageImportError('REQUEST_ID_MISMATCH')
  }
  hit.importedFile = {
    name: fileName,
    importedAt: new Date().toISOString()
  }
  hit.status = 'broadcast'
  hit.currentStep = 'broadcast'
  // 广播后由链上返回 txHash；接口就绪前用 rawTransaction 的摘要占位，
  // 保证「导入 → 广播」链路在 UI 上可见且可核对。
  hit.txHash = signedTx.rawTransaction.slice(0, 66)
  persist()
  return Promise.resolve(structuredClone(hit))
}

export function abortColdStorageTransfer(
  requestId: string,
  reason: string
): Promise<ColdStorageTransferView | null> {
  const hit = records.find((r) => r.requestId === requestId)
  if (!hit) return Promise.resolve(null)
  hit.abortReason = reason
  hit.status = 'aborted'
  hit.currentStep = null
  persist()
  return Promise.resolve(structuredClone(hit))
}

/** 待签名的请求数（列表页头部徽章） */
export function countPendingTransfers(): Promise<number> {
  return Promise.resolve(records.filter((r) => r.status === 'pending').length)
}
