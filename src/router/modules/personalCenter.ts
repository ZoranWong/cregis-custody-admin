import { AppRouteRecord } from '@/types/router'

/**
 * 个人中心 —— 独立顶级模块。
 * 之前挂在 /system 下，但个人中心是全员可用的账号页面，
 * 不应受「系统管理」的角色（SYSTEM_ADMIN / ADMIN）与菜单归属约束。
 * 仅通过右上角用户菜单进入，不出现在侧边菜单。
 */
export const personalCenterRoutes: AppRouteRecord = {
  path: '/personal-center',
  name: 'PersonalCenterRoot',
  component: '/index/index',
  meta: {
    title: 'menus.personalCenter',
    icon: 'ri:user-3-line',
    isHide: true
  },
  children: [
    {
      path: '',
      name: 'PersonalCenter',
      component: '/personal-center/index',
      meta: {
        title: 'menus.personalCenter',
        keepAlive: false,
        isHide: true
      }
    }
  ]
}
