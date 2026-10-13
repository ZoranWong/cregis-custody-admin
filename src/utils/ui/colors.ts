/**
 * 颜色处理工具模块
 *
 * 提供完整的颜色格式转换和处理功能
 *
 * ## 主要功能
 *
 * - Hex 与 RGB/RGBA 格式互转
 * - 颜色混合计算
 * - 颜色变浅/变深处理
 * - Element Plus 主题色自动生成
 * - 颜色格式验证
 * - CSS 变量读取
 * - 暗黑模式颜色适配
 *
 * ## 使用场景
 *
 * - 主题色动态切换
 * - Element Plus 组件主题定制
 * - 颜色渐变生成
 * - 明暗主题颜色计算
 * - 颜色格式标准化
 *
 * ## 核心功能
 *
 * - hexToRgba: Hex 转 RGBA（支持透明度）
 * - hexToRgb: Hex 转 RGB 数组
 * - rgbToHex: RGB 转 Hex
 * - colourBlend: 两种颜色混合
 * - getLightColor: 生成变浅的颜色
 * - getDarkColor: 生成变深的颜色
 * - handleElementThemeColor: 处理 Element Plus 主题色
 * - setElementThemeColor: 设置完整的主题色系统
 *
 * ## 支持格式
 *
 * - Hex: #FFF, #FFFFFF
 * - RGB: rgb(255, 255, 255)
 * - RGBA: rgba(255, 255, 255, 0.5)
 *
 * @module utils/ui/colors
 * @author Art Design Pro Team
 */
import { useSettingStore } from '@/store/modules/setting'

/**
 * 颜色转换结果接口
 */
interface RgbaResult {
  red: number
  green: number
  blue: number
  rgba: string
}

/**
 * 获取CSS变量值（别名函数）
 * @param name CSS变量名
 * @returns CSS变量值
 */
export function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name)
}

/**
 * 验证hex颜色格式
 * @param hex hex颜色值
 * @returns 是否为有效的hex颜色
 */
function isValidHexColor(hex: string): boolean {
  const cleanHex = hex.trim().replace(/^#/, '')
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)
}

/**
 * 验证RGB颜色值
 * @param r 红色值
 * @param g 绿色值
 * @param b 蓝色值
 * @returns 是否为有效的RGB值
 */
function isValidRgbValue(r: number, g: number, b: number): boolean {
  const isValid = (value: number) => Number.isInteger(value) && value >= 0 && value <= 255
  return isValid(r) && isValid(g) && isValid(b)
}

/**
 * 将hex颜色转换为RGBA
 * @param hex hex颜色值 (支持 #FFF 或 #FFFFFF 格式)
 * @param opacity 透明度 (0-1)
 * @returns 包含RGB值和RGBA字符串的对象
 */
export function hexToRgba(hex: string, opacity: number): RgbaResult {
  if (!isValidHexColor(hex)) {
    throw new Error('Invalid hex color format')
  }

  // 移除可能存在的 # 前缀并转换为大写
  let cleanHex = hex.trim().replace(/^#/, '').toUpperCase()

  // 如果是缩写形式（如 FFF），转换为完整形式
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char.repeat(2))
      .join('')
  }

  // 解析 RGB 值
  const [red, green, blue] = cleanHex.match(/\w\w/g)!.map((x) => parseInt(x, 16))

  // 确保 opacity 在有效范围内
  const validOpacity = Math.max(0, Math.min(1, opacity))

  // 构建 RGBA 字符串
  const rgba = `rgba(${red}, ${green}, ${blue}, ${validOpacity.toFixed(2)})`

  return { red, green, blue, rgba }
}

/**
 * 将hex颜色转换为RGB数组
 * @param hexColor hex颜色值
 * @returns RGB数组 [r, g, b]
 */
export function hexToRgb(hexColor: string): number[] {
  if (!isValidHexColor(hexColor)) {
    ElMessage.warning('输入错误的hex颜色值')
    throw new Error('Invalid hex color format')
  }

  const cleanHex = hexColor.replace(/^#/, '')
  let hex = cleanHex

  // 处理缩写形式
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char.repeat(2))
      .join('')
  }

  const hexPairs = hex.match(/../g)
  if (!hexPairs) {
    throw new Error('Invalid hex color format')
  }

  return hexPairs.map((hexPair) => parseInt(hexPair, 16))
}

/**
 * 将RGB颜色转换为hex
 * @param r 红色值 (0-255)
 * @param g 绿色值 (0-255)
 * @param b 蓝色值 (0-255)
 * @returns hex颜色值
 */
export function rgbToHex(r: number, g: number, b: number): string {
  if (!isValidRgbValue(r, g, b)) {
    ElMessage.warning('输入错误的RGB颜色值')
    throw new Error('Invalid RGB color values')
  }

  const toHex = (value: number) => {
    const hex = value.toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 颜色混合
 * @param color1 第一个颜色
 * @param color2 第二个颜色
 * @param ratio 混合比例 (0-1)
 * @returns 混合后的颜色
 */
export function colourBlend(color1: string, color2: string, ratio: number): string {
  const validRatio = Math.max(0, Math.min(1, Number(ratio)))

  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const blendedRgb = rgb1.map((value1, index) => {
    const value2 = rgb2[index]
    return Math.round(value1 * (1 - validRatio) + value2 * validRatio)
  })

  return rgbToHex(blendedRgb[0], blendedRgb[1], blendedRgb[2])
}

/**
 * 获取变浅的颜色
 * @param color 原始颜色
 * @param level 变浅程度 (0-1)
 * @param isDark 是否为暗色主题
 * @returns 变浅后的颜色
 */
export function getLightColor(color: string, level: number, isDark: boolean = false): string {
  if (!isValidHexColor(color)) {
    ElMessage.warning('输入错误的hex颜色值')
    throw new Error('Invalid hex color format')
  }

  if (isDark) {
    return getDarkColor(color, level)
  }

  const rgb = hexToRgb(color)
  const lightRgb = rgb.map((value) => Math.floor((255 - value) * level + value))

  return rgbToHex(lightRgb[0], lightRgb[1], lightRgb[2])
}

/**
 * 获取变深的颜色
 * @param color 原始颜色
 * @param level 变深程度 (0-1)
 * @returns 变深后的颜色
 */
export function getDarkColor(color: string, level: number): string {
  if (!isValidHexColor(color)) {
    ElMessage.warning('输入错误的hex颜色值')
    throw new Error('Invalid hex color format')
  }

  const rgb = hexToRgb(color)
  const darkRgb = rgb.map((value) => Math.floor(value * (1 - level)))

  return rgbToHex(darkRgb[0], darkRgb[1], darkRgb[2])
}

/**
 * 计算颜色的相对亮度（WCAG 2.1 定义）
 * @param color hex 颜色
 * @returns 相对亮度 0-1
 */
export function getRelativeLuminance(color: string): number {
  const [r, g, b] = hexToRgb(color).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * 计算两色对比度（WCAG 2.1）
 * @returns 对比度比值，1-21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1)
  const l2 = getRelativeLuminance(color2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/**
 * 计算「主色底上的前景色」—— 用于主按钮、实心标签等填充底上的文字。
 * 保留供后续使用（当前主按钮走 EP 默认白字方案，未启用）。
 *
 * 参考数据：品牌绿 #00BE78 配白字 2.43:1，配深色 #0F172A 可达 7.34:1。
 */
const ON_PRIMARY_LIGHT = '#0F172A' // 深色前景（配亮底色）
const ON_PRIMARY_DARK = '#FFFFFF' // 白色前景（配暗底色）

export function getOnPrimaryColor(bg: string): string {
  // 优先深色字；不达标则退到白字。二者必有一个 ≥4.5:1。
  if (getContrastRatio(bg, ON_PRIMARY_LIGHT) >= 4.5) return ON_PRIMARY_LIGHT
  if (getContrastRatio(bg, ON_PRIMARY_DARK) >= 4.5) return ON_PRIMARY_DARK
  // 兜底：取对比度更高的那个（极端中间色，如纯红）
  return getContrastRatio(bg, ON_PRIMARY_LIGHT) >= getContrastRatio(bg, ON_PRIMARY_DARK)
    ? ON_PRIMARY_LIGHT
    : ON_PRIMARY_DARK
}

/**
 * 计算主题色作为【文字】使用时的变体。
 *
 * 主题色是为「实心底 + 白字」设计的，直接当文字压在白底/浅色底上通常不达标：
 *   #12805A 压白底 4.93:1 尚可，但压侧边栏选中态的浅绿底(#e7f2ee)只有 4.3:1；
 *   而暗色模式下它压深底只有 3.67:1，更差。
 *
 * 因此按明暗模式向黑/白混合，逐档逼近直到留出余量：
 *   亮色 → 向黑混合（压深），目标 5.5:1（保证压在浅色底上仍 ≥4.5:1）
 *   暗色 → 向白混合（提亮），目标 5.0:1
 * 对应 WCAG「暗色用提亮的色调变体，而非直接反色」。
 *
 * @param theme 主题色
 * @param isDark 是否暗色模式
 */
export function getThemeTextColor(theme: string, isDark: boolean): string {
  /*
   * 基准底取「最不利的那一层」：
   *   亮色取白 #fff（最亮），但要求 5.5:1 而不是 4.5:1 —— 因为侧边栏选中项
   *     还要压在一层浅绿底(#e7f2ee)上，留出余量后仍能 ≥4.5:1；
   *   暗色取 #27282d（比页面底 #161618 更亮，是最不利的深色面），要求 4.7:1。
   */
  const target = isDark ? 4.7 : 5.5
  const bg = isDark ? '#27282d' : '#ffffff'
  const anchor = isDark ? '#ffffff' : '#000000'

  let color = theme
  for (let i = 0; i <= 10; i++) {
    if (getContrastRatio(color, bg) >= target) return color
    color = colourBlend(theme, anchor, i / 10)
  }
  return color
}

/**
 * 处理 Element Plus 主题颜色
 * @param theme 主题颜色
 * @param isDark 是否为暗色主题
 */
export function handleElementThemeColor(theme: string, isDark: boolean = false): void {
  document.documentElement.style.setProperty('--el-color-primary', theme)

  // 主题色作为文字使用时的变体（侧边栏选中项、链接等），详见 getThemeTextColor
  document.documentElement.style.setProperty('--theme-text', getThemeTextColor(theme, isDark))

  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(
      `--el-color-primary-light-${i}`,
      getLightColor(theme, i / 10, isDark)
    )
  }

  for (let i = 1; i <= 9; i++) {
    document.documentElement.style.setProperty(
      `--el-color-primary-dark-${i}`,
      getDarkColor(theme, i / 10)
    )
  }
}

/**
 * 设置 Element Plus 主题颜色
 * @param color 主题颜色
 */
export function setElementThemeColor(color: string): void {
  const mixColor = '#ffffff'
  const elStyle = document.documentElement.style

  elStyle.setProperty('--el-color-primary', color)
  handleElementThemeColor(color, useSettingStore().isDark)

  // 生成更淡一点的颜色
  for (let i = 1; i < 16; i++) {
    const itemColor = colourBlend(color, mixColor, i / 16)
    elStyle.setProperty(`--el-color-primary-custom-${i}`, itemColor)
  }
}
