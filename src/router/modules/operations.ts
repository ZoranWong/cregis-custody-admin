import { AppRouteRecord } from '@/types/router'

export const operationsRoutes: AppRouteRecord = {
  name: 'Operations',
  path: '/operations',
  component: '/index/index',
  meta: { title: 'menus.operations.title', icon: 'ri:dashboard-line', roles: ['OPERATIONS', 'ADMIN'] },
  children: [
    { path: 'merchants', name: 'MerchantList', component: '/operations/merchants', meta: { title: 'menus.operations.merchantList', icon: 'ri:store-line', keepAlive: true } },
    { path: 'merchants/:merchantId', name: 'merchant-detail', component: '/operations/merchants/detail', meta: { title: 'menus.operations.merchantDetail', icon: 'ri:store-line', isHide: true } },
    { path: 'onboarding', name: 'MerchantOnboarding', component: '/operations/onboarding', meta: { title: 'menus.operations.merchantOnboarding', icon: 'ri:user-add-line', keepAlive: true } },
    { path: 'tickets', name: 'TicketQueue', component: '/operations/tickets', meta: { title: 'menus.operations.ticketQueue', icon: 'ri:file-list-3-line', keepAlive: true } },
    { path: 'gas', name: 'GasOperations', component: '/operations/gas', meta: { title: 'menus.operations.gasOperations', icon: 'ri:flashlight-line', keepAlive: true } },
    { path: 'gas/:cusAccountId', name: 'gas-detail', component: '/operations/gas/detail', meta: { title: 'menus.operations.gasDetail', icon: 'ri:flashlight-line', isHide: true } },
    { path: 'fee', name: 'FeeMonitor', component: '/operations/fee', meta: { title: 'menus.operations.feeMonitor', icon: 'ri:money-dollar-circle-line', keepAlive: true } },
    { path: 'fee/:merchantEcode', name: 'merchant-fee-monitor', component: '/operations/fee/detail', meta: { title: 'menus.operations.merchantFeeDetail', icon: 'ri:money-dollar-circle-line', isHide: true } },
    { path: 'notifications', name: 'MessageNotifications', component: '/operations/notifications', meta: { title: 'menus.operations.messageNotifications', icon: 'ri:mail-line', keepAlive: true } },
  ]
}
