import { AppRouteRecord } from '@/types/router'

export const auditRoutes: AppRouteRecord = {
  name: 'Audit',
  path: '/audit',
  component: '/index/index',
  meta: {
    title: 'menus.audit.title',
    icon: 'ri:search-eye-line',
    roles: ['AUDIT', 'ADMIN'],
    isHide: true
  },
  children: [
    {
      path: 'trail-query',
      name: 'AuditTrailQuery',
      component: '/audit/trail-query',
      meta: { title: 'menus.audit.trailQuery', icon: 'ri:file-search-line', keepAlive: true }
    },
    {
      path: 'supervision',
      name: 'AuditSupervision',
      component: '/audit/supervision',
      meta: { title: 'menus.audit.supervision', icon: 'ri:dashboard-2-line', keepAlive: true }
    },
    {
      path: 'export',
      name: 'AuditExport',
      component: '/audit/export',
      meta: { title: 'menus.audit.export', icon: 'ri:download-line', keepAlive: true }
    },
    {
      path: 'plan',
      name: 'AuditPlan',
      component: '/audit/plan',
      meta: { title: 'menus.audit.planManagement', icon: 'ri:file-list-3-line', keepAlive: true }
    },
    {
      path: 'finding',
      name: 'AuditFinding',
      component: '/audit/finding',
      meta: { title: 'menus.audit.findingRemediation', icon: 'ri:alert-line', keepAlive: true }
    },
    {
      path: 'regulatory-report',
      name: 'AuditRegulatoryReport',
      component: '/audit/regulatory-report',
      meta: { title: 'menus.audit.regulatoryReport', icon: 'ri:bar-chart-line', keepAlive: true }
    }
  ]
}
