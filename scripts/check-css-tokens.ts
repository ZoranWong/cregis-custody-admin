#!/usr/bin/env tsx
/**
 * 设计 token 校验：确保代码里引用的每个 CSS 变量都在 :root / .dark 中有定义。
 *
 * 背景：业务页面曾出现 var(--ink-400, #fff) 这类「带 fallback 的未定义变量」，
 * 因为 fallback 永远生效，暗色模式下会残留浅色块，而且静态检查发现不了。
 *
 * 检查范围：业务代码 src/views、src/features、src/components/business
 * （模板自带的 art-* 组件与 tailwind 内部变量不在本脚本范围内）
 * 只检查「固定的 token 名」。以下情况跳过：
 *   - Element Plus 自带的 --el-* 变量
 *   - 组件内部用 style 动态绑定的变量（如 --textColor / --pwidth / --width）
 *   - JS 模板字符串拼出来的变量名（如 `var(--coin-${id}-bg)`）
 *   - 运行时由 JS 注入的变量（见 EXPLICIT_ALLOWLIST）
 *
 * 用法：tsx scripts/check-css-tokens.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SCAN_DIRS = ['src/views', 'src/features', 'src/components/business']
const TOKEN_FILES = ['src/assets/styles/core/tailwind.css', 'src/assets/styles/core/el-ui.scss']
const CODE_EXT = /\.(vue|scss|css|ts)$/
const VAR_REF = /var\(\s*--([a-zA-Z0-9_-]+)/g
/** 名字里带模板拼接痕迹，无法静态判定，跳过 */
const DYNAMIC_HINT = /-\$\{|^$|^-$|\$\{/
const TOKEN_DEF = /--([a-zA-Z0-9_-]+)\s*:/g

/** Element Plus 与第三方组件库变量，不属于本仓库 token */
const EXPLICIT_ALLOWLIST = new Set<string>([
  // 运行时由 JS 注入
  'custom-radius',
  // 组件内部 style 绑定
  'textColor',
  'pwidth',
  'width',
  'index',
  'menu-width',
  // 第三方编辑器 / 模板遗留，待 S2 收敛
  'art-gray-50',
  'art-bg-color',
  'ElColor-primary',
  'font-family-mono'
])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (CODE_EXT.test(full)) out.push(full)
  }
  return out
}

function definedTokens(): Set<string> {
  const defined = new Set<string>()
  for (const file of TOKEN_FILES) {
    const text = readFileSync(join(ROOT, file), 'utf8')
    for (const m of text.matchAll(TOKEN_DEF)) defined.add(m[1]!)
  }
  return defined
}

const defined = definedTokens()
const problems: Array<{ file: string; line: number; name: string }> = []

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    // token 定义文件自身允许定义变量
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(VAR_REF)) {
        const name = m[1]!
        if (defined.has(name)) continue
        if (name.startsWith('el-')) continue
        if (EXPLICIT_ALLOWLIST.has(name)) continue
        if (DYNAMIC_HINT.test(name) || /^[a-z]+-$/i.test(name)) continue
        problems.push({ file: relative(ROOT, file), line: i + 1, name })
      }
    })
  }
}

if (problems.length) {
  console.error(`\n✖ 发现 ${problems.length} 处引用了未定义的 CSS 变量：\n`)
  for (const p of problems) console.error(`  ${p.file}:${p.line}  var(--${p.name})`)
  console.error('\n请在 tailwind.css 的 :root 与 .dark 中补定义，或改用已有的语义 token。\n')
  process.exit(1)
}

console.log(`✔ CSS token 校验通过（已定义 ${defined.size} 个变量）`)
