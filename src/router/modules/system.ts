import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  name: 'SystemAdmin',
  path: '/system',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:settings-4-line',
    roles: ['SYSTEM_ADMIN', 'ADMIN']
  },
  children: [
    {
      path: 'team',
      name: 'TeamManagement',
      component: '/system/employees',
      meta: { title: 'menus.system.teamManagement', icon: 'ri:team-line', keepAlive: true }
    },
    {
      path: 'employees',
      name: 'EmployeeManagement',
      component: '/system/employees',
      meta: { title: 'menus.system.employees', icon: 'ri:team-line', keepAlive: true, isHide: true }
    },
    {
      path: 'monitor',
      name: 'SystemMonitor',
      component: '/system/monitor',
      meta: {
        title: 'menus.system.monitor',
        icon: 'ri:heart-pulse-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'personal-center',
      name: 'PersonalCenter',
      component: '/system/personal-center',
      meta: {
        title: 'menus.system.personalCenter',
        icon: 'ri:user-settings-line',
        keepAlive: false,
        isHide: true
      }
    }
  ]
}
