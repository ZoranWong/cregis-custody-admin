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
      meta: {
        title: 'menus.operations.gasDetail',
        icon: 'ri:flashlight-line',
        isHide: true,
        activePath: '/operations/gas'
      }
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
        isHide: true,
        activePath: '/operations/fee'
      }
    },
    {
      path: 'cold-storage',
      name: 'ColdStorageTransfers',
      component: '/operations/cold-storage',
      meta: {
        title: 'menus.operations.coldStorageTransfers',
        icon: 'ri:lock-2-line',
        keepAlive: true
      }
    },
    {
      path: 'cold-storage/:requestId',
      name: 'cold-storage-detail',
      component: '/operations/cold-storage/detail',
      meta: {
        title: 'menus.operations.coldStorageDetail',
        icon: 'ri:lock-2-line',
        isHide: true,
        activePath: '/operations/cold-storage'
      }
    }
  ]
}
