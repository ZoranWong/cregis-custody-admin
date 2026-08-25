import { AppRouteRecord } from '@/types/router'

export const complianceRoutes: AppRouteRecord = {
  name: 'Compliance',
  path: '/compliance',
  component: '/index/index',
  meta: {
    title: 'menus.compliance.title',
    icon: 'ri:checkbox-line',
    roles: ['COMPLIANCE', 'ADMIN']
  },
  children: [
    {
<<<<<<< HEAD
      path: 'queue',
      name: 'ComplianceQueue',
      component: '/compliance/queue',
      meta: { title: 'menus.compliance.queue', icon: 'ri:file-check-line', keepAlive: true }
=======
      path: 'tx-lens',
      name: 'TransactionLens',
      component: '/compliance/tx-lens',
      meta: { title: 'menus.compliance.txLens', icon: 'ri:search-eye-line', keepAlive: false }
    },
    {
      path: 'rules',
      name: 'ComplianceRules',
      component: '/compliance/rules',
      meta: { title: 'menus.compliance.rules', icon: 'ri:file-list-3-line', keepAlive: false }
    },
    {
      path: 'alerts',
      name: 'ComplianceAlerts',
      component: '/compliance/queue',
      meta: { title: 'menus.compliance.alerts', icon: 'ri:alert-line', keepAlive: true }
    },
    {
      path: 'travel-rule',
      name: 'TravelRuleEvents',
      component: '/compliance/travel-rule/workbench',
      meta: { title: 'menus.compliance.travelRuleEvents', icon: 'ri:global-line', keepAlive: true }
>>>>>>> worktree-menu-restructure
    },
    {
      path: 'outbox',
      name: 'ComplianceOutbox',
      component: '/compliance/outbox',
<<<<<<< HEAD
      meta: { title: 'menus.compliance.outbox', icon: 'ri:mail-send-line', keepAlive: true }
    },
    {
      path: 'travel-rule/workbench',
      name: 'TravelRuleWorkbench',
      component: '/compliance/travel-rule/workbench',
      meta: {
        title: 'menus.compliance.travelRuleWorkbench',
        icon: 'ri:global-line',
        keepAlive: true
=======
      meta: {
        title: 'menus.compliance.outbox',
        icon: 'ri:mail-send-line',
        keepAlive: true,
        isHide: true
>>>>>>> worktree-menu-restructure
      }
    },
    {
      path: 'travel-rule/exchange-status',
      name: 'TravelRuleExchange',
      component: '/compliance/travel-rule/exchange-status',
      meta: {
        title: 'menus.compliance.exchangeEvidence',
        icon: 'ri:exchange-line',
<<<<<<< HEAD
        keepAlive: true
=======
        keepAlive: true,
        isHide: true
>>>>>>> worktree-menu-restructure
      }
    },
    {
      path: 'travel-rule/configuration',
      name: 'TravelRuleConfig',
      component: '/compliance/travel-rule/configuration',
      meta: {
        title: 'menus.compliance.travelRuleConfig',
        icon: 'ri:settings-3-line',
<<<<<<< HEAD
        keepAlive: true
=======
        keepAlive: true,
        isHide: true
>>>>>>> worktree-menu-restructure
      }
    }
  ]
}
