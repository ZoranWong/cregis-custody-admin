/**
 * 统一的「返回」导航。
 *
 * 规则：有浏览器历史就 router.go(-1)，没有上级页面（直接打开详情链接）才回落到指定路由。
 * 列表页把 tab / 筛选 / 页码写进 URL，历史返回才能原样恢复现场；push 固定路由会丢状态。
 */
import type { Router } from 'vue-router'

/** 当前是否还能在应用内后退（直接打开 / 新标签页打开时为 false） */
export function canGoBack(): boolean {
  return Boolean(window.history.state?.back)
}

/**
 * 返回上一页；无法后退时跳到 fallback。
 *
 * @param router vue-router 实例（页面里用 useRouter() 取，组件外直接 import）
 * @param fallback 无历史时的兜底路由名，如 'ComplianceMerchants'
 */
export function goBack(router: Router, fallback?: string): void {
  if (canGoBack()) {
    router.go(-1)
    return
  }
  if (fallback) {
    router.push({ name: fallback }).catch(() => {})
    return
  }
  router.back()
}
