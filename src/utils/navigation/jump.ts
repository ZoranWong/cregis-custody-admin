/**
 * 导航跳转工具模块
 *
 * 提供统一的页面跳转和导航功能
 *
 * ## 主要功能
 *
 * - 外部链接打开（新窗口）
 * - 菜单项跳转处理（支持内部路由和外部链接）
 * - iframe 页面跳转支持
 * - 递归查找并跳转到第一个可见的子菜单
 * - 智能判断跳转目标类型（外部链接/内部路由）
 *
 * @module utils/navigation/jump
 * @author Art Design Pro Team
 */
import { loadRouteLocation } from 'vue-router'
import type { AppRouteRecord } from '@/types/router'
import { router } from '@/router'
import { findFirstLeafMenu } from './route'

// 打开外部链接
export const openExternalLink = (link: string) => {
  window.open(link, '_blank')
}

type MenuTarget = { kind: 'external'; link: string } | { kind: 'route'; path: string }

/**
 * 计算菜单项实际的跳转目标
 * 父级菜单（jumpToFirst）落到第一个可导航的叶子菜单
 */
const resolveMenuTarget = (item: AppRouteRecord, jumpToFirst: boolean): MenuTarget | undefined => {
  // 处理外部链接
  const { link, isIframe } = item.meta
  if (link && !isIframe) {
    return { kind: 'external', link }
  }

  // 如果不需要跳转到第一个子菜单，或者没有子菜单，直接跳转当前路径
  if (!jumpToFirst || !item.children?.length) {
    return { kind: 'route', path: item.path }
  }

  const firstChild = findFirstLeafMenu(item.children)

  // 如果子菜单都不可见，则回退到父级页面自身。
  if (!firstChild) {
    return { kind: 'route', path: item.path }
  }

  // 如果第一个子菜单是外部链接则打开新窗口
  if (firstChild.meta?.link) {
    return { kind: 'external', link: firstChild.meta.link }
  }

  // 跳转到子菜单路径
  return { kind: 'route', path: firstChild.path }
}

/**
 * 菜单跳转
 * @param item 菜单项
 * @param jumpToFirst 是否跳转到第一个子菜单
 * @returns
 */
export const handleMenuJump = (item: AppRouteRecord, jumpToFirst: boolean = false) => {
  const target = resolveMenuTarget(item, jumpToFirst)
  if (!target) return

  return target.kind === 'external' ? openExternalLink(target.link) : router.push(target.path)
}

/**
 * 路由预加载
 *
 * 菜单 hover / 展开子菜单时提前加载目标路由的懒加载组件。
 * 点击时 `beforeRouteEnter` 的组件解析已经完成，导航只剩守卫 + 渲染，
 * 地址栏更新不再被首屏模块 import 阻塞。
 *
 * loadRouteLocation 会把解析结果写回路由记录，后续导航直接命中缓存。
 */
const PREFETCH_MAX_CONCURRENT = 3
const prefetchedTargets = new Set<string>()
const inFlightPrefetch = new Map<string, Promise<void>>()

export const prefetchRoute = (path: string): void => {
  if (!path || prefetchedTargets.has(path) || inFlightPrefetch.has(path)) return
  // 同时加载太多模块会反过来阻塞主线程，超出的交给用户真正点击时再加载
  if (inFlightPrefetch.size >= PREFETCH_MAX_CONCURRENT) return

  let resolved: ReturnType<typeof router.resolve>
  try {
    resolved = router.resolve(path)
  } catch {
    return
  }
  if (!resolved.matched.length) return

  const task = loadRouteLocation(resolved)
    .then(() => {
      prefetchedTargets.add(path)
    })
    .catch(() => {
      // 预加载失败不提示，点击时还会走正常加载流程
    })
    .finally(() => {
      inFlightPrefetch.delete(path)
    })

  inFlightPrefetch.set(path, task)
}

/**
 * 预加载菜单项的跳转目标（外链和 iframe 无需预加载）
 * @param item 菜单项
 * @param jumpToFirst 是否跳转到第一个子菜单
 */
export const prefetchMenuTarget = (item: AppRouteRecord, jumpToFirst: boolean = false): void => {
  if (item.meta?.isIframe) return

  const target = resolveMenuTarget(item, jumpToFirst)
  if (target?.kind === 'route') {
    prefetchRoute(target.path)
  }
}
