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
      path: 'queue',
      name: 'ComplianceQueue',
      component: '/compliance/queue',
      meta: { title: 'menus.compliance.queue', icon: 'ri:file-check-line', keepAlive: true }
    },
    {
      path: 'outbox',
      name: 'ComplianceOutbox',
      component: '/compliance/outbox',
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
      }
    },
    {
      path: 'travel-rule/exchange-status',
      name: 'TravelRuleExchange',
      component: '/compliance/travel-rule/exchange-status',
      meta: {
        title: 'menus.compliance.exchangeEvidence',
        icon: 'ri:exchange-line',
        keepAlive: true
      }
    },
    {
      path: 'travel-rule/configuration',
      name: 'TravelRuleConfig',
      component: '/compliance/travel-rule/configuration',
      meta: {
        title: 'menus.compliance.travelRuleConfig',
        icon: 'ri:settings-3-line',
        keepAlive: true
      }
    }
  ]
}
