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
      path: 'tx-lens',
      name: 'TransactionLens',
      component: '/compliance/tx-lens',
      meta: { title: 'menus.compliance.txLens', icon: 'ri:search-eye-line', keepAlive: false }
    },
    {
      path: 'tx-lens/:id',
      name: 'TransactionLensDetail',
      component: '/compliance/tx-lens/detail',
      meta: {
        title: 'menus.compliance.txLensDetail',
        icon: 'ri:search-eye-line',
        keepAlive: false,
        isHide: true
      }
    },
    {
      path: 'rules',
      name: 'ComplianceRules',
      component: '/compliance/rules',
      meta: { title: 'menus.compliance.rules', icon: 'ri:file-list-3-line', keepAlive: false }
    },
    {
      path: 'rules/:id',
      name: 'ComplianceRuleDetail',
      component: '/compliance/rules/detail',
      meta: {
        title: 'menus.compliance.ruleDetail',
        icon: 'ri:file-list-3-line',
        keepAlive: false,
        isHide: true
      }
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
    },
    {
      path: 'travel-rule/:id/share',
      name: 'TravelRuleShare',
      component: '/compliance/travel-rule/share',
      meta: {
        title: 'menus.compliance.travelRuleShare',
        icon: 'ri:global-line',
        keepAlive: false,
        isHide: true
      }
    },
    {
      path: 'outbox',
      name: 'ComplianceOutbox',
      component: '/compliance/outbox',
      meta: {
        title: 'menus.compliance.outbox',
        icon: 'ri:mail-send-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'travel-rule/exchange-status',
      name: 'TravelRuleExchange',
      component: '/compliance/travel-rule/exchange-status',
      meta: {
        title: 'menus.compliance.exchangeEvidence',
        icon: 'ri:exchange-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'travel-rule/configuration',
      name: 'TravelRuleConfig',
      component: '/compliance/travel-rule/configuration',
      meta: {
        title: 'menus.compliance.travelRuleConfig',
        icon: 'ri:settings-3-line',
        keepAlive: true,
        isHide: true
      }
    }
  ]
}
