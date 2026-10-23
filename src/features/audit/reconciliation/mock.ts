/**
 * Daily Reconciliation — 本地数据源。
 *
 * 后端没有「日终对账」聚合接口（openapi 只有流水与余额查询），
 * 这里按最新原型（2026-10 改版）构造 商户 → 资产 → 财资单元 → 交易 的完整层级：
 *   - 可展开的商户总览（资产数 / 阻塞数 / 最长与累计未对账天数）
 *   - 单个资产的已对账日、未对账日、待入账交易
 *   - 财资单元当日 Included / Backfill 明细
 *
 * 数据在后端接口就绪前只读；替换为 api/auditReconciliation.ts 时保持导出函数签名即可。
 */
import BigNumber from 'bignumber.js'
import type {
  CounterpartyView,
  ReconciliationAccountView,
  ReconciliationAssetRowView,
  ReconciliationAssetView,
  ReconciliationDayView,
  ReconciliationMerchantRowView,
  ReconciliationOverviewView,
  ReconciliationTxView,
  ReconciliationTxStatus,
  ReconciliationUnitDayView,
  ReconciliationUnitView,
  UnreconciledDayView
} from './types'

/** mock 基准「今天」；未对账日期与列表页 staleness 均以此为准 */
export const RECONCILIATION_SEED_DATE = '2026-10-20'

const UNIT_NAMES = ['Everypay', 'GlobalMall', 'FinSecure Bank']
const UNIT_DISPLAY: Record<string, string> = {
  Everypay: 'Everypay Treasury',
  GlobalMall: 'GlobalMall Treasury',
  'FinSecure Bank': 'FinSecure Vault'
}

/** 商户（与原型一致；资产逐项配置） */
interface MerchantConfig {
  code: string
  merchantName: string
  initials: string
  assets: AssetConfig[]
}

interface AssetConfig {
  coinId: string
  network: string
  decimals: number
  /** 最近一次已关闭日期 yyyy-MM-dd */
  lastClosedDate: string
  /** 未对账天数（与原型列表列一致） */
  unreconciledDays: number
  /** 各财资单元的基准余额（主币种，未乘精度） */
  unitBalances: number[]
}

function asset(
  coinId: string,
  network: string,
  decimals: number,
  lastClosedDate: string,
  unreconciledDays: number,
  unitBalances: number[]
): AssetConfig {
  return { coinId, network, decimals, lastClosedDate, unreconciledDays, unitBalances }
}

const MERCHANTS: MerchantConfig[] = [
  {
    code: '1225',
    merchantName: 'CryptoVault Ltd',
    initials: 'CV',
    assets: [
      asset('USDT', 'ethereum', 6, '2026-10-19', 0, [1_200_000, 850_000, 300_000]),
      asset('BTC', 'bitcoin', 8, '2026-10-18', 1, [8, 4.5]),
      asset('ETH', 'ethereum', 18, '2026-10-19', 0, [60, 55, 35]),
      asset('USDC', 'ethereum', 6, '2026-10-19', 0, [500_000, 350_000]),
      asset('SOL', 'solana', 9, '2026-10-17', 2, [2_400]),
      asset('USDT', 'tron', 6, '2026-10-19', 0, [500_000])
    ]
  },
  {
    code: '1524',
    merchantName: 'PayFlow Inc',
    initials: 'PF',
    assets: [
      asset('USDT', 'ethereum', 6, '2026-10-19', 0, [700_000, 500_000]),
      asset('USDC', 'ethereum', 6, '2026-10-19', 0, [250_000, 200_000]),
      asset('ETH', 'ethereum', 18, '2026-10-18', 1, [45.5, 40]),
      asset('BTC', 'bitcoin', 8, '2026-10-19', 0, [5.25])
    ]
  },
  {
    code: '1269',
    merchantName: 'NodeSphere',
    initials: 'NS',
    assets: [
      asset('USDT', 'ethereum', 6, '2026-10-19', 0, [450_000, 300_000]),
      asset('USDC', 'ethereum', 6, '2026-10-19', 0, [320_000]),
      asset('ETH', 'ethereum', 18, '2026-10-19', 0, [45])
    ]
  },
  {
    code: '1541',
    merchantName: 'TokenGuard',
    initials: 'TG',
    assets: [
      asset('USDT', 'ethereum', 6, '2026-10-19', 0, [180_000]),
      asset('BTC', 'bitcoin', 8, '2026-10-19', 0, [2.1])
    ]
  }
]

/** 真实数据里账户类型来自 ProjectUnitAccount.type，这里按原型 Primary / Payout / Payin 三种展示 */
const ACCOUNT_TYPES: Array<ReconciliationAccountView['type']> = ['PRIMARY', 'PAYOUT', 'PAYIN']

const COUNTERPARTIES: Array<Omit<CounterpartyView, 'address'>> = [
  { name: 'John Smith', location: 'London, UK', vasp: 'Binance' },
  { name: 'Jane Doe', location: 'New York, US', vasp: 'Coinbase' },
  { name: 'Acme Corp', location: 'Tokyo, JP', vasp: 'OKX' },
  { name: 'Alice Chen', location: 'Taipei, TW', vasp: 'OKX' },
  { name: 'Bob Wilson', location: 'Sydney, AU', vasp: 'Kraken' },
  { name: 'Michael Brown', location: 'Toronto, CA', vasp: 'Kraken' },
  { name: 'David Lee', location: 'Tokyo, JP', vasp: 'Kraken' },
  { name: 'Frank Miller', location: 'Berlin, DE', vasp: 'Nuri' },
  { name: 'Grace Kim', location: 'Seoul, KR', vasp: 'Upbit' },
  { name: 'Hiroshi Tanaka', location: 'Osaka, JP', vasp: 'bitFlyer' },
  { name: 'Maria Santos', location: 'Manila, PH', vasp: 'Coins.ph' },
  { name: 'James Wilson', location: 'London, UK', vasp: 'Binance' },
  { name: 'Anika Patel', location: 'Mumbai, IN', vasp: 'CoinDCX' },
  { name: 'Sophie Laurent', location: 'Paris, FR', vasp: 'Coinhouse' },
  { name: 'Liu Wei', location: 'Shanghai, CN', vasp: 'Huobi' }
]

const SELF_LOCATION = 'Singapore, SG'

/** 简单线性同余，保证同一会话内数据稳定（Math.random 会让表格每次渲染都变） */
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function seedOf(value: string): number {
  return Array.from(value).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function shiftDate(value: string, days: number): string {
  const d = toDate(value)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

function toBaseUnits(amount: BigNumber.Value, decimals: number): string {
  return new BigNumber(amount).times(new BigNumber(10).pow(decimals)).toFixed(0)
}

function pseudoAddress(seed: string, network = 'ethereum'): string {
  const rng = makeRng(seedOf(seed))
  const hex = (length: number) =>
    Array.from({ length }, () => Math.floor(rng() * 16).toString(16)).join('')
  const base58 = (length: number) => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return Array.from({ length }, () => alphabet[Math.floor(rng() * alphabet.length)]).join('')
  }
  if (network === 'bitcoin') return `bc1q${base58(38).toLowerCase()}`
  if (network === 'solana') return base58(44)
  if (network === 'tron') return `T${base58(33)}`
  return `0x${hex(40)}`
}

function unitsFor(config: AssetConfig, merchant: MerchantConfig): ReconciliationUnitView[] {
  const unitCount = config.unitBalances.length
  const accountTotal = Math.max(unitCount, Math.round(config.unitBalances.length * 1.5))
  const base = Math.floor(accountTotal / unitCount)
  const extra = accountTotal % unitCount
  return config.unitBalances.map((_, index) => {
    const id = Number(`${merchant.code}${config.coinId.length}${index}`)
    const name = UNIT_NAMES[index] ?? `Unit ${index + 1}`
    const count = Math.max(1, base + (index < extra ? 1 : 0))
    const accounts: ReconciliationAccountView[] = Array.from({ length: count }, (_, i) => ({
      id: `${id}-${i + 1}`,
      name: `${name} ${ACCOUNT_TYPES[(index + i) % ACCOUNT_TYPES.length]!.toLowerCase()}`,
      type: ACCOUNT_TYPES[(index + i) % ACCOUNT_TYPES.length]!,
      address: pseudoAddress(`${merchant.code}-${name}-${i}`, config.network)
    }))
    return {
      id,
      name,
      displayName: UNIT_DISPLAY[name] ?? `${name} Treasury`,
      accounts
    }
  })
}

/** 生成某单元某日的一批交易（含补录） */
function buildDayTxs(params: {
  config: AssetConfig
  merchant: MerchantConfig
  unit: ReconciliationUnitView
  date: string
  dayIndex: number
  opening: BigNumber
  rng: () => number
}): { included: ReconciliationTxView[]; backfill: ReconciliationTxView[]; closing: BigNumber } {
  const { config, merchant, unit, date, dayIndex, rng } = params
  const includedCount = 1 + Math.floor(rng() * 3)
  const backfillCount = dayIndex % 3 === 0 ? 1 : 0
  const included: ReconciliationTxView[] = []
  const backfill: ReconciliationTxView[] = []
  let balance = params.opening

  const createTx = (isBackfill: boolean, seq: number): ReconciliationTxView => {
    const isIn = rng() > 0.45
    // 金额取基准余额的 0.1% ~ 1.5%，保证与余额量级匹配
    const amount = new BigNumber(config.unitBalances[0] ?? 1)
      .times(0.001 + rng() * 0.014)
      .decimalPlaces(config.decimals, BigNumber.ROUND_DOWN)
    const amountBase = new BigNumber(toBaseUnits(amount, config.decimals))
    const pre = balance
    balance = isIn ? balance.plus(amountBase) : balance.minus(amountBase)
    const post = balance
    const day = date.replace(/-/g, '')
    const id = `${merchant.code}-${config.coinId}-${config.network}-${day}-${unit.id}-${seq}`
    const cp = COUNTERPARTIES[Math.floor(rng() * COUNTERPARTIES.length)]!
    const ours: CounterpartyView = {
      name: unit.displayName,
      address: unit.accounts[0]?.address ?? '',
      location: SELF_LOCATION,
      vasp: 'Self'
    }
    const counterparty: CounterpartyView = {
      ...cp,
      address: pseudoAddress(`${id}-${cp.name}`, config.network)
    }
    const hour = 8 + Math.floor(rng() * 12)
    const minute = Math.floor(rng() * 60)
    return {
      id,
      orderId: `ORD-${day}-${String(seq + 1).padStart(4, '0')}`,
      txId: pseudoAddress(`${id}-tx`, config.network),
      activity: isIn ? 'PAYIN' : 'PAYOUT',
      direction: isIn ? 'IN' : 'OUT',
      amount: amountBase.toFixed(0),
      coinId: config.coinId,
      decimals: config.decimals,
      network: config.network,
      belongDate: date,
      createTime: `${date}T${pad(hour)}:${pad(minute)}:00`,
      settledAt: `${date}T${pad(hour)}:${pad(Math.min(59, minute + 2))}:00`,
      fromAddress: isIn ? counterparty.address : ours.address,
      toAddress: isIn ? ours.address : counterparty.address,
      preBalance: pre.toFixed(0),
      postBalance: post.toFixed(0),
      treasuryUnitId: unit.id,
      treasuryUnitName: unit.name,
      status: 'reconciled',
      originator: isIn ? counterparty : ours,
      beneficiary: isIn ? ours : counterparty,
      backfill: isBackfill
    }
  }

  let seq = 0
  for (let i = 0; i < includedCount; i++) included.push(createTx(false, seq++))
  for (let i = 0; i < backfillCount; i++) backfill.push(createTx(true, seq++))
  return { included, backfill, closing: balance }
}

/** 已对账日：最近关闭日往前 4 天，每个单元一条连续余额链 */
function buildDays(config: AssetConfig, merchant: MerchantConfig): ReconciliationDayView[] {
  const units = unitsFor(config, merchant)
  const dayCount = 4
  const dates: string[] = []
  for (let i = dayCount - 1; i >= 0; i--) dates.push(shiftDate(config.lastClosedDate, -i))

  // 从「最近关闭日往前第 4 天」的开盘余额开始累加，末日的收盘余额即列表页展示值
  const chains = units.map((unit, unitIndex) => {
    const rng = makeRng(seedOf(`${merchant.code}-${config.coinId}-${unit.name}-balance`))
    return new BigNumber(toBaseUnits(config.unitBalances[unitIndex] ?? 1, config.decimals)).times(
      0.94 + rng() * 0.05
    )
  })

  return dates.map((date, dayIndex) => {
    const includedTx: ReconciliationTxView[] = []
    const backfillTx: ReconciliationTxView[] = []
    const unitRows: ReconciliationUnitDayView[] = []

    units.forEach((unit, unitIndex) => {
      const rng = makeRng(seedOf(`${merchant.code}-${config.coinId}-${unit.name}-${date}`))
      const opening = chains[unitIndex]!
      const built = buildDayTxs({
        config,
        merchant,
        unit,
        date,
        dayIndex,
        opening,
        rng
      })
      chains[unitIndex] = built.closing
      includedTx.push(...built.included)
      backfillTx.push(...built.backfill)
      unitRows.push({
        unitId: unit.id,
        unitName: unit.name,
        openingBalance: opening.toFixed(0),
        closingBalance: built.closing.toFixed(0),
        includedCount: built.included.length,
        backfillCount: built.backfill.length
      })
    })

    const opening = unitRows.reduce((sum, row) => sum.plus(row.openingBalance), new BigNumber(0))
    const closing = unitRows.reduce((sum, row) => sum.plus(row.closingBalance), new BigNumber(0))

    return {
      date,
      openingBalance: opening.toFixed(0),
      closingBalance: closing.toFixed(0),
      includedTx,
      backfillTx,
      units: unitRows
    }
  })
}

/**
 * 待入账交易：最近关闭日之后逐日生成（日期不超过今天），分布在各单元上。
 * Held 待放行 / Forfeited 罚没 —— 与原型 Pending TX 一致。
 */
function buildPendingTxs(config: AssetConfig, merchant: MerchantConfig): ReconciliationTxView[] {
  const units = unitsFor(config, merchant)
  const days: string[] = []
  for (let d = 1; d <= Math.max(1, config.unreconciledDays); d++) {
    const date = shiftDate(config.lastClosedDate, d)
    if (date < RECONCILIATION_SEED_DATE) days.push(date)
  }
  if (days.length === 0) days.push(shiftDate(config.lastClosedDate, 1))

  const perDay = Math.min(3, units.length)
  const result: ReconciliationTxView[] = []
  days.forEach((date, dayIndex) => {
    const rng = makeRng(seedOf(`${merchant.code}-${config.coinId}-pending-${date}`))
    for (let i = 0; i < perDay; i++) {
      const unit = units[(dayIndex + i) % units.length]!
      const isIn = i % 3 !== 2
      const amount = new BigNumber(config.unitBalances[0] ?? 1)
        .times(0.005 + rng() * 0.02)
        .decimalPlaces(config.decimals, BigNumber.ROUND_DOWN)
      const cp = COUNTERPARTIES[(i * 3 + unit.id) % COUNTERPARTIES.length]!
      const id = `${merchant.code}-${config.coinId}-${config.network}-pending-${date}-${i}`
      const ours: CounterpartyView = {
        name: unit.displayName,
        address: unit.accounts[0]?.address ?? '',
        location: SELF_LOCATION,
        vasp: 'Self'
      }
      const counterparty: CounterpartyView = {
        ...cp,
        address: pseudoAddress(`${id}-cp`, config.network)
      }
      const hour = 15 + Math.floor(rng() * 8)
      const minute = Math.floor(rng() * 60)
      const status: ReconciliationTxStatus = i === 1 && dayIndex === 0 ? 'forfeited' : 'held'
      result.push({
        id,
        orderId: `ORD-${date.replace(/-/g, '')}-P${String(i + 1).padStart(3, '0')}`,
        txId: pseudoAddress(`${id}-tx`, config.network),
        activity: isIn ? 'PAYIN' : 'PAYOUT',
        direction: isIn ? 'IN' : 'OUT',
        amount: toBaseUnits(amount, config.decimals),
        coinId: config.coinId,
        decimals: config.decimals,
        network: config.network,
        belongDate: date,
        createTime: `${date}T${pad(Math.min(23, hour))}:${pad(minute)}:00`,
        settledAt: '',
        fromAddress: isIn ? counterparty.address : ours.address,
        toAddress: isIn ? ours.address : counterparty.address,
        preBalance: null,
        postBalance: null,
        treasuryUnitId: unit.id,
        treasuryUnitName: unit.name,
        status,
        originator: isIn ? counterparty : ours,
        beneficiary: isIn ? ours : counterparty,
        backfill: false
      })
    }
  })
  return result
}

/**
 * 未对账日期：最近关闭日之后逐日。
 * 第一天为 Blockchain Mismatch（含预期下次更新），其余为 Pending Previous。
 */
function buildUnreconciled(config: AssetConfig): UnreconciledDayView[] {
  const result: UnreconciledDayView[] = []
  for (let d = 1; d <= config.unreconciledDays; d++) {
    const cursor = shiftDate(config.lastClosedDate, d)
    const mismatch = d === 1
    const previousDate = shiftDate(cursor, -1)
    result.push({
      date: cursor,
      statDate: `${cursor} ${mismatch ? '14:22' : '09:30'}`,
      reason: mismatch ? 'blockchain_mismatch' : 'pending_previous',
      detail: mismatch
        ? `3 transactions missing confirmations on ${config.network}`
        : `${formatShortDate(previousDate)} reconciliation still in progress`,
      affectedUnits: config.unitBalances.length,
      expectedNextUpdate: mismatch ? `${shiftDate(cursor, 1)} 14:22` : null
    })
  }
  return result
}

function formatShortDate(date: string): string {
  const d = toDate(date)
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`
}

function findAsset(
  merchant: MerchantConfig,
  coinId: string,
  network: string
): AssetConfig | undefined {
  const target = network.toLowerCase().replace(/[^a-z]/g, '')
  return merchant.assets.find(
    (a) =>
      a.coinId === coinId.toUpperCase() &&
      target.startsWith(
        a.network
          .toLowerCase()
          .replace(/[^a-z]/g, '')
          .slice(0, 4)
      )
  )
}

function buildAsset(config: AssetConfig, merchant: MerchantConfig): ReconciliationAssetView {
  const days = buildDays(config, merchant)
  const latest = days[days.length - 1]!
  return {
    coinId: config.coinId,
    network: config.network,
    decimals: config.decimals,
    lastClosedBalance: latest.closingBalance,
    lastClosedDate: config.lastClosedDate,
    stalenessDays: config.unreconciledDays,
    units: unitsFor(config, merchant),
    days,
    pendingTx: buildPendingTxs(config, merchant),
    unreconciled: buildUnreconciled(config)
  }
}

/** 列表页资产行：关闭余额取「最近关闭日」当天单元链终点的合计 */
function buildAssetRow(config: AssetConfig, merchant: MerchantConfig): ReconciliationAssetRowView {
  const asset = buildAsset(config, merchant)
  return {
    coinId: asset.coinId,
    network: asset.network,
    decimals: asset.decimals,
    treasuryUnitCount: asset.units.length,
    accountCount: asset.units.reduce((sum, unit) => sum + unit.accounts.length, 0),
    lastClosedBalance: asset.lastClosedBalance,
    lastClosedDate: asset.lastClosedDate,
    unreconciledDays: config.unreconciledDays
  }
}

function buildMerchantRow(merchant: MerchantConfig): ReconciliationMerchantRowView {
  const assets = merchant.assets.map((config) => buildAssetRow(config, merchant))
  const blocked = assets.filter((row) => row.unreconciledDays > 0)
  return {
    code: merchant.code,
    merchantName: merchant.merchantName,
    initials: merchant.initials,
    assetCount: assets.length,
    blockedAssets: blocked.length,
    maxUnreconciledDays: assets.reduce((max, row) => Math.max(max, row.unreconciledDays), 0),
    totalUnreconciledDays: assets.reduce((sum, row) => sum + row.unreconciledDays, 0),
    assets
  }
}

/** 商户下拉（列表页搜索用） */
export function listReconciliationMerchants(): Promise<
  Array<{ code: string; merchantName: string; initials: string }>
> {
  return Promise.resolve(
    MERCHANTS.map((m) => ({ code: m.code, merchantName: m.merchantName, initials: m.initials }))
  )
}

/** 列表页：全部商户（原型为一次性展开的全部商户列表） */
export function fetchReconciliationOverview(): Promise<ReconciliationOverviewView> {
  return Promise.resolve({ merchants: MERCHANTS.map(buildMerchantRow) })
}

/** 详情页：单个资产的完整对账数据 */
export function fetchReconciliationAsset(
  merchantCode: string,
  coinId: string,
  network: string
): Promise<ReconciliationAssetView | null> {
  const merchant = MERCHANTS.find((m) => m.code === merchantCode)
  if (!merchant) return Promise.resolve(null)
  const config = findAsset(merchant, coinId, network)
  if (!config) return Promise.resolve(null)
  return Promise.resolve(buildAsset(config, merchant))
}

/** 待入账交易页：商户下全部资产的待入账交易（对齐原型 "All treasury units"） */
export function fetchReconciliationPending(merchantCode: string): Promise<{
  merchantName: string
  date: string
  rows: ReconciliationTxView[]
}> {
  const merchant = MERCHANTS.find((m) => m.code === merchantCode)
  if (!merchant) {
    return Promise.resolve({ merchantName: '', date: RECONCILIATION_SEED_DATE, rows: [] })
  }
  const rows: ReconciliationTxView[] = []
  merchant.assets.forEach((config) => {
    rows.push(...buildPendingTxs(config, merchant))
  })
  // 日期取最晚一批（原型标题展示单一对账日）
  const latest = rows.reduce((max, row) => (row.belongDate > max ? row.belongDate : max), '')
  return Promise.resolve({ merchantName: merchant.merchantName, date: latest, rows })
}
