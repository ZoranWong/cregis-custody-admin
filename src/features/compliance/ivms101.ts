/**
 * IVMS101 PII 解析 — 将 Notabene 原始 PII JSON 解析为可读字段。
 *
 * 原始结构（ivms101Pii / ivms101Payload 同构）：
 *   originator: { accountNumber, originatorPerson: [{ legalPerson | naturalPerson }] }
 *   beneficiary: { accountNumber, beneficiaryPerson: [...] }
 * legalPerson:  { name: { nameIdentifier: [{ legalPersonName }] },
 *                 geographicAddress: [{ country, townName, addressLine: [], addressType }],
 *                 nationalIdentification: { nationalIdentifier } }
 *
 * travel-rule/detail 与 tx-lens StepTravelRule 共用这份解析，
 * 避免两处各写一份遍历逻辑导致字段口径漂移。
 */

export interface Ivms101Party {
  /** 名称（legalPersonName / naturalPersonName / name） */
  name: string
  /** 账户号（side.accountNumber 或 person.accountNumber[0]，通常是 did:pkh） */
  accountNumber: string
  /** 国家代码（如 AE / AL，未翻译） */
  country: string
  /** 城市 */
  townName: string
  /** 地址行（逗号连接） */
  addressLine: string
  /** 地址类型（BIZZ 等） */
  addressType: string
  /** 国民身份识别号 */
  nationalIdentifier: string
}

function extractName(entity: Record<string, unknown>): string {
  const nameObj = entity.name as Record<string, unknown> | undefined
  const identifiers = (nameObj?.nameIdentifier as unknown[]) || []
  for (const id of identifiers) {
    const rec = id as Record<string, unknown>
    const v = rec.legalPersonName || rec.naturalPersonName || rec.name
    if (v) return v as string
  }
  return ''
}

/** 解析一侧（originator / beneficiary）的 PII；无数据返回 null */
export function parseIvms101Party(
  pii: Record<string, unknown> | null | undefined,
  sideKey: 'originator' | 'beneficiary'
): Ivms101Party | null {
  if (!pii) return null
  const side = pii[sideKey] as Record<string, unknown> | undefined
  if (!side) return null
  const personKey = sideKey === 'originator' ? 'originatorPerson' : 'beneficiaryPerson'
  const persons = (side[personKey] as unknown[]) || []
  const person = (persons[0] as Record<string, unknown>) || {}
  const legal = (person.legalPerson as Record<string, unknown>) || {}
  const natural = (person.naturalPerson as Record<string, unknown>) || {}
  const entity = Object.keys(legal).length ? legal : natural

  const address = ((entity.geographicAddress as unknown[]) || [])[0] as
    | Record<string, unknown>
    | undefined

  return {
    name: extractName(entity),
    accountNumber:
      (side.accountNumber as string) || ((person.accountNumber as unknown[])?.[0] as string) || '',
    country: (address?.country as string) || '',
    townName: (address?.townName as string) || '',
    addressLine: ((address?.addressLine as unknown[]) || []).join(', '),
    addressType: (address?.addressType as string) || '',
    nationalIdentifier:
      ((entity.nationalIdentification as Record<string, unknown>)?.nationalIdentifier as string) ||
      ''
  }
}
