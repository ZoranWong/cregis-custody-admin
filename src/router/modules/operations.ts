import { AppRouteRecord } from '@/types/router'

export const operationsRoutes: AppRouteRecord = {
  name: 'Operations',
  path: '/operations',
  component: '/index/index',
  meta: {
    title: 'menus.operations.title',
    icon: 'ri:dashboard-line',
    roles: ['OPERATIONS', 'ADMIN']
  },
  children: [
    {
      path: 'gas',
      name: 'GasOperations',
      component: '/operations/gas',
      meta: { title: 'menus.operations.gasOperations', icon: 'ri:flashlight-line', keepAlive: true }
    },
    {
      path: 'gas/:cusAccountId',
      name: 'gas-detail',
      component: '/operations/gas/detail',
      meta: { title: 'menus.operations.gasDetail', icon: 'ri:flashlight-line', isHide: true }
    },
    {
      path: 'fee',
      name: 'FeeMonitor',
      component: '/operations/fee',
      meta: {
        title: 'menus.operations.feeMonitor',
        icon: 'ri:money-dollar-circle-line',
        keepAlive: true
      }
    },
    {
      path: 'fee/:merchantEcode',
      name: 'merchant-fee-monitor',
      component: '/operations/fee/detail',
      meta: {
        title: 'menus.operations.merchantFeeDetail',
        icon: 'ri:money-dollar-circle-line',
        isHide: true
      }
    }
  ]
}
