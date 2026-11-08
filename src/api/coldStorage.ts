// v2 API — Cold Storage (冷钱包任务)
// 使用 fetch 封装（apiRequest），走 /admin 代理到真实后端
import { apiRequest } from '@/utils/http/request'
import type {
  ColdFlushResult,
  ColdReceiptResult,
  SubTaskAttendee,
  ColdStorageTransferView,
  ColdStorageTransferStatus,
  ColdTaskType
} from '@/features/ops/coldStorage/types'

// ─── Normalize Functions ───

function normalizeStatus(rawState: string): ColdStorageTransferStatus {
  // 后端 state 映射: SIGN_SUCCEED 待签名, SIGNED 已签名, BROADCASTED 已广播
  // COMPLETED 已确认, FAILED 失败, CANCELLED 已中止
  const map: Record<string, ColdStorageTransferStatus> = {
    SIGN_SUCCEED: 'pending',
    SIGNED: 'signed',
    BROADCASTED: 'broadcast',
    COMPLETED: 'confirmed',
    FAILED: 'failed',
    CANCELLED: 'aborted'
  }
  return map[rawState] || 'pending'
}

function normalizeColdTask(raw: Record<string, unknown>): ColdStorageTransferView {
  const status = normalizeStatus(String(raw.state || raw.status || ''))
  const amount = String(raw.amount || raw.totalAmount || '0')
  const decimals = Number(raw.decimals || 0)
  const approversRaw = Array.isArray(raw.approvers)
    ? (raw.approvers as Record<string, unknown>[])
    : []

  const required = Number(raw.requiredSignatures || raw.approvalThreshold?.required || 0)
  const total = Number(raw.totalSignatures || raw.approvalThreshold?.total || approversRaw.length)

  return {
    requestId: String(raw.taskId || raw.requestId || ''),
    merchantName: (raw.merchantName || raw.ecode || '') as string,
    merchantCode: (raw.ecode || raw.merchantCode || '') as string,
    type: (raw.type === 'CONFIG' ? 'config' : 'transfer') as ColdTaskType,
    coinId: (raw.coinId || '') as string,
    amount,
    decimals,
    network: (raw.network || '') as string,
    sourceAddress: (raw.sourceAddress || '') as string,
    destinationAddress: (raw.destinationAddress || '') as string,
    requestedAt: (raw.createTime || raw.requestedAt || '') as string,
    status,
    currentStep: null,
    approvalThreshold: { required, total },
    approvers: approversRaw.map((a) => ({
      id: String(a.userId || ''),
      name: (a.username || a.name || '') as string,
      email: (a.email || '') as string,
      keyRef: (a.pk || '') as string,
      approved: Number(a.status) === 1,
      approvedAt: a.status === 1 ? (a.updateTime as string | null) : null
    })),
    exportedFile: null,
    importedFile: null,
    abortReason: (raw.abortReason || raw.rejectReason || null) as string | null,
    txHash: (raw.txHash || null) as string | null
  }
}

function normalizeSubTaskAttendee(raw: Record<string, unknown>): SubTaskAttendee {
  return {
    status: Number(raw.status || 0),
    userId: Number(raw.userId || 0),
    updateTime: (raw.updateTime || '') as string,
    username: (raw.username || '') as string,
    email: (raw.email || '') as string,
    pk: (raw.pk || '') as string
  }
}

// ─── API Functions ───

/** 分页查询冷钱包任务 */
export async function fetchColdTaskPage(params: {
  page?: number
  pageSize?: number
  ecode?: string
  status?: string
  coinId?: string
  type?: string
  keyword?: string
}): Promise<{ records: ColdStorageTransferView[]; total: number; current: number; size: number }> {
  const raw = (await apiRequest('/cold/task/page/tasks', {
    method: 'GET',
    body: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ecode: params.ecode || undefined,
      state: params.status || undefined,
      coinId: params.coinId || undefined,
      type: params.type || undefined,
      keyword: params.keyword || undefined
    }
  })) as Record<string, unknown>

  const data = (raw?.data as Record<string, unknown> | undefined) || raw
  const records = Array.isArray(data?.records)
    ? (data.records as Record<string, unknown>[]).map(normalizeColdTask)
    : []

  return {
    records,
    total: Number(data?.total || records.length),
    current: Number(data?.current || params.page || 1),
    size: Number(data?.size || params.pageSize || 10)
  }
}

/** 查询付款任务明细 */
export async function fetchColdTaskDetail(taskId: string): Promise<ColdStorageTransferView | null> {
  const raw = (await apiRequest(`/cold/task/transfer/detail/${encodeURIComponent(taskId)}`, {
    method: 'POST',
    body: {}
  })) as Record<string, unknown>

  const data = (raw?.data as Record<string, unknown> | undefined) || raw
  if (!data) return null
  return normalizeColdTask(data)
}

/** 获取子任务审批人列表 */
export async function fetchColdTaskApprovers(taskId: string): Promise<SubTaskAttendee[]> {
  const raw = (await apiRequest('/cold/task/getSubTaskUsersByTaskId', {
    method: 'GET',
    body: { taskId }
  })) as Record<string, unknown>

  const data = raw?.data as Record<string, unknown>[] | undefined
  if (!Array.isArray(data)) return []
  return data.map(normalizeSubTaskAttendee)
}

/** 冷钱包取件导出（POST /cold/task/flush） */
export async function flushColdTasks(params?: {
  operator?: string
}): Promise<ColdFlushResult | null> {
  const raw = (await apiRequest('/cold/task/flush', {
    method: 'POST',
    body: { operator: params?.operator || undefined }
  })) as Record<string, unknown>

  const data = (raw?.data as Record<string, unknown> | undefined) || raw
  if (!data) return null

  return {
    bundle: (data.bundle || '') as string,
    state: (data.state || 'EMPTY') as string,
    batchId: (data.batchId || data.bundleId || '') as string
  }
}

/** 冷钱包回执导入（POST /cold/task/receipt） */
export async function importColdReceipt(params: {
  importedBy?: string
  receipt: string
}): Promise<ColdReceiptResult | null> {
  const raw = (await apiRequest('/cold/task/receipt', {
    method: 'POST',
    body: {
      ...params.receipt,
      importedBy: params.importedBy || undefined
    }
  })) as Record<string, unknown>

  const data = (raw?.data as Record<string, unknown> | undefined) || raw
  if (!data) return null

  return {
    duplicate: Boolean(data.duplicate),
    core2Applied: Boolean(data.core2_applied ?? data.core2Applied)
  }
}
