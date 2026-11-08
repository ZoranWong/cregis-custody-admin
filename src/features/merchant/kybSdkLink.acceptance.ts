/**
 * KYB 验证链接缓存验收用例。
 *
 * 仓库没有引入测试框架（无 vitest/jest），用 tsx 直接跑：
 *   npx tsx src/features/merchant/kybSdkLink.acceptance.ts
 *
 * 覆盖：写入后 30 分钟内可读、过期自动清除、按 ecode 隔离、损坏数据兜底。
 */
import {
  KYB_SDK_LINK_TTL_MS,
  clearKybSdkLink,
  readKybSdkLink,
  saveKybSdkLink,
  type KybSdkLinkStorage
} from '@/features/merchant/kybSdkLink'

function createMemoryStorage(): KybSdkLinkStorage & { dump(): Record<string, string> } {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map)
  }
}

const cases: Array<{ name: string; run: () => void }> = []
let failed = 0

function test(name: string, run: () => void): void {
  cases.push({ name, run })
}

function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message)
}

const START = 1_760_000_000_000 // 固定基准时间，避免依赖当前时钟

test('写入后可在有效期内读到', () => {
  const storage = createMemoryStorage()
  saveKybSdkLink(
    'M001',
    { url: 'https://verify.sumsub.com/abc', externalUserId: 'M001' },
    { now: START, storage }
  )
  const read = readKybSdkLink('M001', { now: START + 60_000, storage })
  assert(read?.url === 'https://verify.sumsub.com/abc', '链接应可读')
  assert(read?.externalUserId === 'M001', 'externalUserId 应回读')
  assert(read?.expiresAt === START + KYB_SDK_LINK_TTL_MS, '默认有效期为 30 分钟')
})

test('恰好到期时视为过期', () => {
  const storage = createMemoryStorage()
  saveKybSdkLink('M001', { url: 'u', externalUserId: 'M001' }, { now: START, storage })
  const atExpiry = readKybSdkLink('M001', { now: START + KYB_SDK_LINK_TTL_MS, storage })
  assert(atExpiry === null, '到期时间点应返回 null')
  assert(Object.keys(storage.dump()).length === 0, '过期记录应被清除')
})

test('过期后读不到且缓存被删除', () => {
  const storage = createMemoryStorage()
  saveKybSdkLink('M001', { url: 'u', externalUserId: 'M001' }, { now: START, ttl: 1000, storage })
  const after = readKybSdkLink('M001', { now: START + 1001, storage })
  assert(after === null, '超过 ttl 应返回 null')
  assert(Object.keys(storage.dump()).length === 0, '超过 ttl 应删除记录')
})

test('不同 ecode 互不影响', () => {
  const storage = createMemoryStorage()
  saveKybSdkLink('M001', { url: 'u1', externalUserId: 'M001' }, { now: START, storage })
  assert(readKybSdkLink('M002', { now: START, storage }) === null, '未缓存的 ecode 应为 null')
  clearKybSdkLink('M001', storage)
  assert(readKybSdkLink('M001', { now: START, storage }) === null, '清除后应为 null')
})

test('损坏数据被清除并返回 null', () => {
  const storage = createMemoryStorage()
  storage.setItem('cregis:kyb-sdk-link:M001', '{not-json')
  assert(readKybSdkLink('M001', { now: START, storage }) === null, '损坏 JSON 应返回 null')
  assert(Object.keys(storage.dump()).length === 0, '损坏记录应被删除')
})

test('无 storage 时安全返回', () => {
  const saved = saveKybSdkLink(
    'M001',
    { url: 'u', externalUserId: 'M001' },
    { now: START, storage: null }
  )
  assert(saved.expiresAt === START + KYB_SDK_LINK_TTL_MS, '无 storage 也应返回记录')
  assert(readKybSdkLink('M001', { now: START, storage: null }) === null, '无 storage 读应为 null')
})

for (const { name, run } of cases) {
  try {
    run()
    console.log(`✅ ${name}`)
  } catch (error) {
    failed += 1
    console.error(`❌ ${name}\n   ${error instanceof Error ? error.message : String(error)}`)
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`)
if (failed > 0) process.exit(1)
