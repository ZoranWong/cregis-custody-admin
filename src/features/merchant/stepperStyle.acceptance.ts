/**
 * 商户详情 · 审核步骤条验收。
 *
 * 仓库没有 UI 测试框架，沿用 merchantStatus.acceptance.ts 的做法，用 tsx 直接跑：
 *   npx tsx src/features/merchant/stepperStyle.acceptance.ts
 *
 * 覆盖：
 *   1. 结构：两个视图共用同一套 StepFlow 组件与 .step 结构，无遗留类
 *   2. 样式：实心圆圈（背景=状态色，前景亮色白/暗色近黑）
 *   3. 状态映射：完成=绿 / 进行中·等待=琥珀 / 拒绝=红 / 待处理=灰
 *   4. 步骤数据：直接调用 merchantStepper 纯函数，校验每个 kybStatus 的派生结果
 *   5. 对比度：亮/暗分别校验 ≥ 4.5:1（WCAG AA）
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildFlowSteps,
  buildKybSubSteps,
  reviewStageOf,
  stepCircleIcon,
  type StepVisual
} from './merchantStepper'

const ROOT = process.cwd()
const SFC = join(ROOT, 'src/views/operations/merchants/detail/index.vue')
const ONBOARDING = join(ROOT, 'src/views/operations/merchants/detail/components/OnboardingView.vue')
const STEP_FLOW = join(ROOT, 'src/views/operations/merchants/detail/components/StepFlow.vue')
const API = join(ROOT, 'src/api/merchant.ts')
const TOKENS = join(ROOT, 'src/assets/styles/core/tailwind.css')

const read = (p: string) => readFileSync(p, 'utf8')
const sfc = read(SFC)
const onboarding = read(ONBOARDING)
const stepFlow = read(STEP_FLOW)

let failed = 0
let total = 0

function check(name: string, ok: boolean, detail = '') {
  total += 1
  if (!ok) {
    failed += 1
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** 取某个选择器所在规则体（逗号分组也能命中），先剥注释再按花括号配对 */
function ruleBody(css: string, selector: string): string {
  const target = selector.replace(/\s+/g, ' ').trim()
  const norm = stripComments(css).replace(/\s+/g, ' ')
  let from = 0
  for (;;) {
    const idx = norm.indexOf(target, from)
    if (idx === -1) return ''
    from = idx + target.length
    const start = Math.max(norm.lastIndexOf('}', idx), norm.lastIndexOf(';', idx)) + 1
    const open = norm.indexOf('{', idx)
    if (open === -1) continue
    if (norm.slice(idx + target.length, open).includes(';')) continue // 命中的是声明
    const between = norm.slice(start, open)
    if (!between.split(',').some((s) => s.trim() === target)) continue
    let depth = 0
    for (let i = open; i < norm.length; i += 1) {
      if (norm[i] === '{') depth += 1
      else if (norm[i] === '}') {
        depth -= 1
        if (depth === 0) return norm.slice(open + 1, i)
      }
    }
    return ''
  }
}

function decl(body: string, prop: string): string {
  const m = new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;]+);`).exec(body)
  return m ? m[1]!.trim() : ''
}

// ─── 1. 结构：视图拆分 + 共用步骤条组件 ────────────────────────
check('index.vue 不再内联步骤条样式', !sfc.includes('.step-flow'))
check('index.vue 按状态渲染两个视图', /OnboardingView|OverviewView/.test(sfc))
check('OnboardingView 使用 StepFlow 组件', /<StepFlow/.test(onboarding))
check(
  '主步骤条与子进度通过 size 区分而非复制组件',
  /size="lg"/.test(onboarding) && /size="sm"/.test(onboarding)
)
check(
  'StepFlow 暴露 .step-flow / .step / .step-circle',
  ['.step-flow', '.step {', '.step-circle'].every((s) => stepFlow.includes(s))
)
check('StepFlow 用 --step-size 驱动尺寸', stepFlow.includes('--step-size'))
check('StepFlow 用 ::before 画连线', /\.step::before/.test(stepFlow))
for (const legacy of [
  'progress-step',
  'kyb-progress-step',
  'kyb-progress-line',
  'kyb-progress-dot'
]) {
  check(`无遗留类 ${legacy}`, !stepFlow.includes(legacy) && !onboarding.includes(legacy))
}
// 圆圈内不覆盖图标字号，字号由 --step-size 统一驱动
const circleBlocks = stepFlow.match(/<div class="step-circle">[\s\S]*?<\/div>/g) || []
check(
  '圆圈内不覆盖图标字号',
  circleBlocks.length > 0 && circleBlocks.every((b) => !/text-icon-(xs|sm|md|lg)/.test(b))
)

// ─── 2. 实心模式 ──────────────────────────────────────────────
const circle = ruleBody(stepFlow, '.step-circle')
check('圆圈无描边（实心）', !/border\s*:/.test(circle))
check('圆圈默认前景为白色', decl(circle, 'color') === '#fff', decl(circle, 'color'))
check('圆圈尺寸由 --step-size 驱动', decl(circle, 'width') === 'var(--step-size)')

// ─── 3. 状态 → 颜色映射 ───────────────────────────────────────
for (const [selector, token] of [
  ['.step.completed .step-circle', '--tone-done-text'],
  ['.step.active .step-circle', '--tone-progress-text'],
  ['.step.waiting .step-circle', '--tone-progress-text'],
  ['.step.failed .step-circle', '--tone-error-text'],
  ['.step.completed .step-label', '--tone-done-text'],
  ['.step.active .step-label', '--tone-progress-text'],
  ['.step.failed .step-label', '--tone-error-text']
] as const) {
  const body = ruleBody(stepFlow, selector)
  const prop = selector.endsWith('.step-label') ? 'color' : 'background'
  check(
    `${selector} ${prop} 为 var(${token})`,
    decl(body, prop).replace(/\s+/g, '') === `var(${token})`,
    decl(body, prop)
  )
}
check(
  '待处理默认背景为中性灰',
  decl(circle, 'background').replace(/\s+/g, '') === 'var(--tone-neutral-text)',
  decl(circle, 'background')
)

// ─── 4. 步骤数据（直接调用纯函数）─────────────────────────────
const t = (key: string) => key.split('.').pop()!
const LABELS: [string, string, string] = ['Pre-screening', 'KYB', 'Compliance Review']
const APPLIED = '2026-11-03T15:32:54'
const flow = (status: string, extra: Record<string, string> = {}) =>
  buildFlowSteps({ kybStatus: status, labels: LABELS, appliedAt: APPLIED, t, ...extra })
const subs = (status: string, extra: Record<string, string> = {}) =>
  buildKybSubSteps({ kybStatus: status, appliedAt: APPLIED, t, ...extra })
const states = (items: { state: string }[]) => items.map((s) => s.state || 'pending').join(',')

const FLOW_CASES: Array<[string, string]> = [
  ['PENDING_SCREENING', 'active,pending,pending'],
  ['ADMIN_REJECTED', 'failed,pending,pending'],
  ['DRAFT', 'completed,waiting,pending'],
  ['SUBMITTED', 'completed,waiting,pending'],
  ['NEED_SUPPLEMENT', 'completed,waiting,pending'],
  ['REJECTED', 'completed,failed,pending'],
  ['PENDING_FINAL_REVIEW', 'completed,completed,active'],
  ['FINAL_REJECTED', 'completed,completed,failed'],
  ['APPROVED', 'completed,completed,completed'],
  ['CANCELLED', 'completed,completed,completed']
]
for (const [status, expected] of FLOW_CASES) {
  check(
    `主步骤 ${status}`,
    states(flow(status)) === expected,
    `${states(flow(status))} ≠ ${expected}`
  )
}

const STAGE_CASES: Array<[string, string | null]> = [
  ['PENDING_SCREENING', 'INITIAL'],
  ['DRAFT', 'KYB'],
  ['SUBMITTED', 'KYB'],
  ['PENDING_FINAL_REVIEW', 'FINAL'],
  ['APPROVED', 'DONE'],
  ['FINAL_REJECTED', 'FINAL'],
  ['CANCELLED', null],
  ['UNKNOWN', null]
]
for (const [status, expected] of STAGE_CASES) {
  check(
    `阶段 ${status} → ${expected}`,
    reviewStageOf(status) === expected,
    String(reviewStageOf(status))
  )
}

// 进行中/等待一律琥珀（不再出现 info 蓝）
// PENDING_SCREENING 是 Admin 待决策 → active；其余三种在等客户/三方 → waiting
check('待初审为 active（Admin 动作）', flow('PENDING_SCREENING')[0]!.state === 'active')
for (const status of ['DRAFT', 'SUBMITTED', 'NEED_SUPPLEMENT']) {
  check(`KYB ${status} 等待外部 → waiting`, flow(status)[1]!.state === 'waiting')
}

// KYB 步骤 waiting 文案按子状态区分
check('DRAFT 文案=等待客户', flow('DRAFT')[1]!.meta === 'awaitingCustomer', flow('DRAFT')[1]!.meta)
check(
  'SUBMITTED 文案=三方审核中',
  flow('SUBMITTED')[1]!.meta === 'verificationReviewing',
  flow('SUBMITTED')[1]!.meta
)
check(
  'NEED_SUPPLEMENT 文案=待补件',
  flow('NEED_SUPPLEMENT')[1]!.meta === 'supplementRequired',
  flow('NEED_SUPPLEMENT')[1]!.meta
)

// 子步骤
const SUB_CASES: Array<[string, string]> = [
  ['DRAFT', 'waiting,pending'],
  ['SUBMITTED', 'completed,waiting'],
  ['NEED_SUPPLEMENT', 'completed,waiting'],
  ['REJECTED', 'completed,failed'],
  ['APPROVED', 'completed,completed'],
  ['CANCELLED', 'completed,pending']
]
for (const [status, expected] of SUB_CASES) {
  check(
    `子步骤 ${status}`,
    states(subs(status)) === expected,
    `${states(subs(status))} ≠ ${expected}`
  )
}

// ─── 4b. 操作时间（approvalTimeline）──────────────────────────
check('接口类型含 approvalTimeline', /approvalTimeline\?/.test(read(API)))
const withTimeline = flow('APPROVED', {
  timeline: {
    screeningReviewedAt: '2026-11-04T10:00:00',
    providerApprovedAt: '2026-11-05T11:00:00',
    finalReviewedAt: '2026-11-06T12:00:00'
  } as never
})
check(
  '主步骤完成时间取 approvalTimeline',
  withTimeline[0]!.meta === '2026-11-04 10:00:00' &&
    withTimeline[1]!.meta === '2026-11-05 11:00:00' &&
    withTimeline[2]!.meta === '2026-11-06 12:00:00',
  withTimeline.map((s) => s.meta).join(' | ')
)
check(
  '初审时间缺 timeline 时回退问卷 reviewedAt',
  flow('SUBMITTED', { questionnaireReviewedAt: '2026-11-02T09:00:00' })[0]!.meta ===
    '2026-11-02 09:00:00'
)
check(
  '子步骤结果节点显示三方通过时间',
  subs('APPROVED', { providerApprovedAt: '2026-11-05 11:00:00' })[1]!.meta === '2026-11-05 11:00:00'
)

// 图标
const ICON: Array<[StepVisual, string | null]> = [
  ['completed', 'ri:check-line'],
  ['active', 'ri:time-line'],
  ['waiting', 'ri:time-line'],
  ['failed', 'ri:close-line'],
  ['pending', null]
]
for (const [visual, expected] of ICON) {
  check(`图标 ${visual}`, stepCircleIcon(visual) === expected, String(stepCircleIcon(visual)))
}

// ─── 5. 对比度（亮/暗分别校验）────────────────────────────────
const tokenCss = stripComments(read(TOKENS))

/** 按出现顺序取 token：第 1 个在 :root（亮色），第 2 个在 .dark（暗色） */
function tokenHex(name: string, mode: 'light' | 'dark'): string {
  const values = [...tokenCss.matchAll(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map(
    (m) => m[1]!
  )
  return (mode === 'light' ? values[0] : values[1]) || ''
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(fg: string, bg: string): number {
  const a = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!a || !b) return 0
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const AA = 4.5
for (const name of [
  'tone-done-text',
  'tone-progress-text',
  'tone-error-text',
  'tone-neutral-text'
]) {
  const bg = tokenHex(name, 'light')
  const ratio = contrast('#ffffff', bg)
  check(`亮色 白字/${name} ≥ ${AA}`, ratio >= AA, `${bg} → ${ratio.toFixed(2)}:1`)
}

const NEAR_BLACK = '#0b0b0c'
for (const name of ['tone-done-mark', 'tone-progress-mark', 'tone-error-mark']) {
  const bg = tokenHex(name, 'dark')
  const ratio = contrast(NEAR_BLACK, bg)
  check(`暗色 近黑/${name} ≥ ${AA}`, ratio >= AA, `${bg} → ${ratio.toFixed(2)}:1`)
}
{
  const bg = tokenHex('tone-neutral-mark', 'dark')
  const ratio = contrast('#ffffff', bg)
  check(`暗色 白字/tone-neutral-mark ≥ ${AA}`, ratio >= AA, `${bg} → ${ratio.toFixed(2)}:1`)
}

// 暗色覆盖只改彩色状态前景，不改待处理
check('暗色覆盖不含待处理前景', !/:global\(\.dark\)\s*\.step-circle\s*\{[^}]*color/.test(stepFlow))

if (failed > 0) {
  console.error(`\n步骤条验收：${failed} 项失败 / 共 ${total} 项`)
  process.exit(1)
}

console.log(`步骤条验收通过：${total} 项全部符合预期`)
