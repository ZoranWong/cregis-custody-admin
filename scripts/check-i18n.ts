#!/usr/bin/tsx
/**
 * i18n 校验：
 *   1. en / zh key 一致性（缺失或多余）
 *   2. 代码里 `$t('literal.key')` / `t('literal.key')` 的字面量 key 是否在 en 中存在
 *
 * 跳过动态 key（含模板字符串）与白名单（第三方菜单键等）。
 *
 * 用法：tsx scripts/check-i18n.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['src/views', 'src/components', 'src/features']
const CODE_EXT = /\.(vue|ts)$/

/** 已知只存在于一侧的键（后端菜单下发 / 路由已注释），暂不阻断 */
const KNOWN_ONE_SIDE = new Set<string>(['menus.dashboard.analysis', 'menus.dashboard.ecommerce'])

type Dict = Record<string, unknown>

function flatten(obj: Dict, prefix = '', out = new Map<string, unknown>()): Map<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v as Dict, path, out)
    else out.set(path, v)
  }
  return out
}

/** 解析 `notice.text[0]` 这类带数组下标的 key */
function resolve(dict: Dict, key: string): unknown {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (cur == null) return undefined
    const m = part.match(/^([^[]+)((\[\d+])*)$/)
    const name = m ? m[1]! : part
    cur = (cur as Record<string, unknown>)[name!]
    if (m && m[2]) {
      for (const idx of m[2].match(/\d+/g) ?? []) cur = (cur as unknown[])[Number(idx)]
    }
  }
  return cur
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (CODE_EXT.test(full)) out.push(full)
  }
  return out
}

const en = JSON.parse(readFileSync(join(ROOT, 'src/locales/langs/en.json'), 'utf8')) as Dict
const zh = JSON.parse(readFileSync(join(ROOT, 'src/locales/langs/zh.json'), 'utf8')) as Dict
const enFlat = flatten(en)
const zhFlat = flatten(zh)

let failed = false

// ─── 1. en / zh 一致性 ───
const onlyEn = [...enFlat.keys()].filter((k) => !zhFlat.has(k))
const onlyZh = [...zhFlat.keys()].filter((k) => !enFlat.has(k))

if (onlyEn.length || onlyZh.length) {
  const filteredEn = onlyEn.filter((k) => !KNOWN_ONE_SIDE.has(k))
  const filteredZh = onlyZh.filter((k) => !KNOWN_ONE_SIDE.has(k))
  if (filteredEn.length || filteredZh.length) {
    failed = true
    if (filteredEn.length)
      console.error(`✖ 仅 en 有（${filteredEn.length}）：\n  ${filteredEn.join('\n  ')}`)
    if (filteredZh.length)
      console.error(`✖ 仅 zh 有（${filteredZh.length}）：\n  ${filteredZh.join('\n  ')}`)
  }
}

// ─── 2. 代码里的字面量 key ───
const KEY_REF = /(?:\$t|\bt)\(\s*['"]([a-zA-Z0-9_.\-[\]]+)['"]/g
const missing: Array<{ file: string; line: number; key: string }> = []

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(KEY_REF)) {
        const key = m[1]!
        // 纯单词多半是 local t() 函数（如 label(x)），只校验带点的命名空间 key
        if (!key.includes('.') && !key.includes('[')) continue
        if (resolve(en, key) === undefined)
          missing.push({ file: relative(ROOT, file), line: i + 1, key })
      }
    })
  }
}

if (missing.length) {
  failed = true
  console.error(`✖ 代码引用了 en.json 中不存在的 key（${missing.length}）：`)
  for (const m of missing) console.error(`  ${m.file}:${m.line}  ${m.key}`)
}

if (failed) {
  console.error('\ni18n 校验未通过。\n')
  process.exit(1)
}

console.log(`✔ i18n 校验通过（en/zh 各 ${enFlat.size} 个 key，字面量引用全部可解析）`)
