// v2 API — Cold Storage (冷钱包任务)
// 使用 fetch 封装（apiRequest），走 /admin 代理到真实后端
import { apiRequest } from '@/utils/http/request'
import { useCoinStore } from '@/store/modules/coins'
import type {
  ColdFlushResult,
  ColdReceiptResult,
  SubTaskAttendee,
  ColdStorageTransferView,
  ColdStorageTransferStatus,
  ColdTaskType
} from '@/features/ops/coldStorage/types'

// ─── Normalize Functions ───

/** 后端 state → 前端归一化状态
 * 后端枚举: AUDIT_PASSED / AUDIT_REJECTED / AUDITING / EXPIRED / FAILED /
 * REJECTED / SIGN_FAILED / SIGN_REJECTED / SIGN_SUCCEED / SIGNING /
 * VERIFY_FAILED / VERIFY_SUCCEED / WAITING
 */
function normalizeStatus(rawState: string): ColdStorageTransferStatus {
  const state = (!rawState ? '' : rawState).toUpperCase()
  const map: Record<string, ColdStorageTransferStatus> = {
    // 待处理：等待审批 / 审批中 / 待签名 / 签名中
    WAITING: 'pending',
    AUDITING: 'pending',
    AUDIT_PASSED: 'pending',
    SIGNING: 'pending',
    SIGN_SUCCEED: 'pending',
    // 已签名（等待回执）
    SIGNED: 'signed',
    // 已广播
    BROADCASTED: 'broadcast',
    BROADCASTING: 'broadcast',
    BROADCAST: 'broadcast',
    VERIFY_SUCCEED: 'confirmed',
    // 失败终态
    FAILED: 'failed',
    SIGN_FAILED: 'failed',
    SIGN_REJECTED: 'failed',
    VERIFY_FAILED: 'failed',
    REJECTED: 'failed',
    AUDIT_REJECTED: 'failed',
    // 过期视为中止
    EXPIRED: 'aborted',
    CANCELLED: 'aborted',
    CANCELED: 'aborted',
    ABORTED: 'aborted'
  }
  return map[state] || 'pending'
}

/** 解析币种精度：接口不返回 decimals，需从币种元数据查 */
function resolveDecimals(coinId: string, network: string, raw?: unknown): number {
  if (typeof raw === 'number' && raw > 0) return raw
  try {
    return useCoinStore().getDecimalsByCoinId(coinId, network)
  } catch {
    // Pinia 尚未初始化时降级为 0，页面会按整数展示
    return 0
  }
}

/** 从原始任务对象取目标地址
 * 详情接口: payToList[0].to
 * 列表接口: cmdForm.txs[0].params.to
 */
function resolveDestination(raw: Record<string, unknown>): string {
  const payToList = raw.payToList as Record<string, unknown>[] | undefined
  if (Array.isArray(payToList) && payToList.length > 0) {
    return String(payToList[0].to || '')
  }
  const cmdForm = raw.cmdForm as Record<string, unknown> | undefined
  const txs = cmdForm?.txs as Record<string, unknown>[] | undefined
  if (Array.isArray(txs) && txs.length > 0) {
    const params = txs[0].params as Record<string, unknown> | undefined
    if (params?.to) return String(params.to)
  }
  return String(raw.destinationAddress || '')
}

/** 从原始任务对象取源地址
 * 详情接口: address 或 includes[0]
 * 列表接口: 无源地址字段（返回空，列表中不展示）
 */
function resolveSource(raw: Record<string, unknown>): string {
  if (raw.address) return String(raw.address)
  const includes = raw.includes as unknown[] | undefined
  if (Array.isArray(includes) && includes.length > 0 && typeof includes[0] === 'string') {
    return includes[0]
  }
  return String(raw.sourceAddress || '')
}

/** 从原始任务对象取金额
 * 详情接口: totalAmount / inputAmount
 * 列表接口: cmdForm.txs[0].params.amount
 */
function resolveAmount(raw: Record<string, unknown>): string {
  if (raw.totalAmount != null) return String(raw.totalAmount)
  if (raw.inputAmount != null) return String(raw.inputAmount)
  const cmdForm = raw.cmdForm as Record<string, unknown> | undefined
  const txs = cmdForm?.txs as Record<string, unknown>[] | undefined
  if (Array.isArray(txs) && txs.length > 0) {
    const params = txs[0].params as Record<string, unknown> | undefined
    if (params?.amount != null) return String(params.amount)
  }
  return String(raw.amount ?? '0')
}

/** 业务类型 → transfer/config
 * 详情: businessType = TRANSFER
 * 列表: businessType = SYSTEM/BTC_TRANSFER/... 或 taskType = orders/issues
 */
function resolveTaskType(raw: Record<string, unknown>): ColdTaskType {
  const businessType = String(raw.businessType ?? '').toUpperCase()
  const taskType = String(raw.taskType ?? '').toUpperCase()
  // issues / 配置类 视为 config；其余资金类视为 transfer
  if (businessType.includes('CONFIG') || businessType === 'SYSTEM' || taskType === 'ISSUES') {
    return 'config'
  }
  return 'transfer'
}

function normalizeColdTask(raw: Record<string, unknown>): ColdStorageTransferView {
  const status = normalizeStatus(String(raw.state || raw.status || ''))
  const coinId = String(raw.coinId || '')
  const network = String(raw.network || '')
  const amount = resolveAmount(raw)
  const decimals = resolveDecimals(coinId, network, raw.decimals)
  const approversRaw = Array.isArray(raw.approvers)
    ? (raw.approvers as Record<string, unknown>[])
    : []

  // 审批阈值：后端直接给 threshold / total
  const threshold = (raw.approvalThreshold || {}) as Record<string, unknown>
  const required = Number(raw.threshold ?? raw.requiredSignatures ?? threshold.required ?? 0)
  const total = Number(raw.total ?? raw.totalSignatures ?? threshold.total ?? approversRaw.length)

  return {
    requestId: String(raw.taskId || raw.requestId || ''),
    merchantName: (raw.merchantName || raw.ecode || '') as string,
    merchantCode: (raw.ecode || raw.merchantCode || '') as string,
    type: resolveTaskType(raw),
    coinId,
    amount,
    decimals,
    network,
    sourceAddress: resolveSource(raw),
    destinationAddress: resolveDestination(raw),
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

/** 前端归一化状态 → 后端 state */
function toBackendState(status?: string): string | undefined {
  if (!status) return undefined
  const map: Record<string, string> = {
    pending: 'SIGN_SUCCEED',
    signed: 'SIGNED',
    broadcast: 'BROADCASTED',
    confirmed: 'COMPLETED',
    failed: 'FAILED',
    aborted: 'CANCELLED'
  }
  return map[status] || status
}

/** 确保币种元数据已加载，decimals 才能正确解析金额 */
async function ensureCoinsLoaded(): Promise<void> {
  try {
    await useCoinStore().ensureLoaded()
  } catch {
    // 币种列表非关键路径，失败时降级为 decimals=0
  }
}

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
  await ensureCoinsLoaded()
  const raw = (await apiRequest('/cold/task/page/tasks', {
    method: 'GET',
    body: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ecode: params.ecode || undefined,
      state: toBackendState(params.status),
      coinId: params.coinId || undefined,
      type:
        params.type === 'transfer' ? 'PAYMENT' : params.type === 'config' ? 'CONFIG' : undefined,
      keyword: params.keyword || undefined
    }
  })) as Record<string, unknown>

  // apiRequest 已解包 envelope.data；兼容 { data: {...} } 的二次包裹
  const data = ((raw && 'records' in raw) || (raw && 'list' in raw) ? raw : raw?.data) as
    | Record<string, unknown>
    | undefined

  // 列表字段在不同分页实现下可能叫 records / list / rows / items
  const recordsRaw = (data?.records ?? data?.list ?? data?.rows ?? data?.items) as
    | Record<string, unknown>[]
    | undefined
  const records = Array.isArray(recordsRaw) ? recordsRaw.map(normalizeColdTask) : []

  return {
    records,
    total: Number(data?.total ?? data?.totalCount ?? records.length),
    current: Number(data?.current ?? data?.page ?? params.page ?? 1),
    size: Number(data?.size ?? data?.pageSize ?? params.pageSize ?? 10)
  }
}

/** 查询付款任务明细 */
export async function fetchColdTaskDetail(taskId: string): Promise<ColdStorageTransferView | null> {
  await ensureCoinsLoaded()
  const raw = (await apiRequest(`/cold/task/transfer/detail/${encodeURIComponent(taskId)}`, {
    method: 'POST',
    body: {}
  })) as Record<string, unknown>

  // apiRequest 已解包 envelope.data；兼容 { data: {...} } 二次包裹
  const data = ((raw && 'taskId' in raw) || (raw && 'cmdBasic' in raw) ? raw : raw?.data) as
    | Record<string, unknown>
    | undefined
  if (!data || Object.keys(data).length === 0) return null
  return normalizeColdTask(data)
}

/** 获取子任务审批人列表
 * apiRequest 已解包 envelope.data，这里 data 本身就是数组；
 * 同时兼容被二次包裹为 { data: [...] } 的情况。
 */
export async function fetchColdTaskApprovers(taskId: string): Promise<SubTaskAttendee[]> {
  const raw = (await apiRequest('/cold/task/getSubTaskUsersByTaskId', {
    method: 'GET',
    body: { taskId }
  })) as Record<string, unknown>[] | Record<string, unknown>

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as Record<string, unknown>[])
      : []
  return list.map(normalizeSubTaskAttendee)
}

/** 冷钱包取件导出（POST /cold/task/flush） */
/** 冷钱包取件导出（POST /cold/task/flush）
 * 返回的 bundle 原样交付冷机，可能是 JSON 字符串或对象，统一序列化为字符串。
 */
export async function flushColdTasks(params?: {
  operator?: string
}): Promise<ColdFlushResult | null> {
  const raw = (await apiRequest('/cold/task/flush', {
    method: 'POST',
    body: { operator: params?.operator || undefined }
  })) as Record<string, unknown>

  // apiRequest 已解包 envelope.data；兼容 { data: {...} } 二次包裹
  const data = ((raw && 'state' in raw) || (raw && 'bundle' in raw) ? raw : raw?.data) as
    | Record<string, unknown>
    | undefined
  if (!data) return null

  const rawBundle = data.bundle
  const bundle =
    typeof rawBundle === 'string' ? rawBundle : rawBundle != null ? JSON.stringify(rawBundle) : ''

  return {
    bundle,
    state: (data.state || 'EMPTY') as string,
    batchId: (data.batchId || data.bundleId || '') as string
  }
}

/** 冷钱包回执导入（POST /cold/task/receipt）
 * 回执原文必须逐字节透传，所以 body 为 { payload: <原文> }，后端签名校验依赖原文完整性。
 */
export async function importColdReceipt(params: {
  importedBy?: string
  receipt: string
}): Promise<ColdReceiptResult | null> {
  const raw = (await apiRequest('/cold/task/receipt', {
    method: 'POST',
    body: {
      ...(JSON.parse(params.receipt) ?? {}),
      importedBy: params.importedBy || undefined
    }
  })) as Record<string, unknown>

  // apiRequest 已解包 envelope.data；兼容 { data: {...} } 二次包裹
  const data = (
    (raw && 'duplicate' in raw) || (raw && 'core2_applied' in raw) ? raw : raw?.data
  ) as Record<string, unknown> | undefined
  if (!data) return null

  return {
    duplicate: Boolean(data.duplicate),
    core2Applied: Boolean(data.core2_applied ?? data.core2Applied)
  }
}
