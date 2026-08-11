import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  name: 'SystemAdmin',
  path: '/system',
  component: '/index/index',
  meta: { title: 'menus.system.title', icon: 'ri:settings-4-line', roles: ['SYSTEM_ADMIN', 'ADMIN'] },
  children: [
    { path: 'employees', name: 'EmployeeManagement', component: '/system/employees', meta: { title: 'menus.system.employees', icon: 'ri:team-line', keepAlive: true } },
    { path: 'monitor', name: 'SystemMonitor', component: '/system/monitor', meta: { title: 'menus.system.monitor', icon: 'ri:heart-pulse-line', keepAlive: true } },
  ]
}
