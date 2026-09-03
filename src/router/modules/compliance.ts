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
      path: 'merchants',
      name: 'ComplianceMerchants',
      component: '/operations/merchants',
      meta: { title: 'menus.compliance.merchants', icon: 'ri:store-line', keepAlive: true }
    },
    {
      path: 'merchants/:merchantId',
      name: 'merchant-detail',
      component: '/operations/merchants/detail',
      meta: { title: 'menus.compliance.merchantDetail', icon: 'ri:store-line', isHide: true }
    },
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
      path: 'rules/editor/:id?',
      name: 'ComplianceRuleEditor',
      component: '/compliance/rules/editor',
      meta: {
        title: 'menus.compliance.ruleEditor',
        icon: 'ri:file-list-3-line',
        keepAlive: false,
        isHide: true
      }
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
    }
  ]
}
