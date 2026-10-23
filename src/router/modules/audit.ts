import { AppRouteRecord } from '@/types/router'

export const auditRoutes: AppRouteRecord = {
  name: 'Audit',
  path: '/audit',
  component: '/index/index',
  meta: {
    title: 'menus.audit.title',
    icon: 'ri:search-eye-line',
    roles: ['AUDIT', 'ADMIN']
  },
  // 排序：原型中的 Daily Reconciliation / Accounting 排在最前；历史审计页保持 isHide，
  // 路由仍可访问，但不在侧边栏出现（与重构前行为一致）。
  children: [
    {
      path: 'daily-reconciliation',
      name: 'DailyReconciliation',
      component: '/audit/daily-reconciliation',
      meta: {
        title: 'menus.audit.dailyReconciliation',
        icon: 'ri:calendar-check-line',
        keepAlive: true
      }
    },
    {
      path: 'daily-reconciliation/detail',
      name: 'daily-reconciliation-detail',
      component: '/audit/daily-reconciliation/detail',
      meta: {
        title: 'menus.audit.dailyReconciliation',
        icon: 'ri:calendar-check-line',
        isHide: true,
        activePath: '/audit/daily-reconciliation'
      }
    },
    {
      path: 'daily-reconciliation/unit',
      name: 'daily-reconciliation-unit-detail',
      component: '/audit/daily-reconciliation/unit-detail',
      meta: {
        title: 'menus.audit.dailyReconciliation',
        icon: 'ri:calendar-check-line',
        isHide: true,
        activePath: '/audit/daily-reconciliation'
      }
    },
    {
      path: 'daily-reconciliation/pending',
      name: 'daily-reconciliation-pending',
      component: '/audit/daily-reconciliation/pending',
      meta: {
        title: 'menus.audit.dailyReconciliation',
        icon: 'ri:calendar-check-line',
        isHide: true,
        activePath: '/audit/daily-reconciliation'
      }
    },
    {
      path: 'accounting',
      name: 'AuditAccounting',
      component: '/audit/accounting',
      meta: {
        title: 'menus.audit.accounting',
        icon: 'ri:calculator-line',
        keepAlive: true
      }
    },
    {
      path: 'trail-query',
      name: 'AuditTrailQuery',
      component: '/audit/trail-query',
      meta: {
        title: 'menus.audit.trailQuery',
        icon: 'ri:file-search-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'supervision',
      name: 'AuditSupervision',
      component: '/audit/supervision',
      meta: {
        title: 'menus.audit.supervision',
        icon: 'ri:dashboard-2-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'export',
      name: 'AuditExport',
      component: '/audit/export',
      meta: {
        title: 'menus.audit.export',
        icon: 'ri:download-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'plan',
      name: 'AuditPlan',
      component: '/audit/plan',
      meta: {
        title: 'menus.audit.planManagement',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'finding',
      name: 'AuditFinding',
      component: '/audit/finding',
      meta: {
        title: 'menus.audit.findingRemediation',
        icon: 'ri:alert-line',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'regulatory-report',
      name: 'AuditRegulatoryReport',
      component: '/audit/regulatory-report',
      meta: {
        title: 'menus.audit.regulatoryReport',
        icon: 'ri:bar-chart-line',
        keepAlive: true,
        isHide: true
      }
    }
  ]
}
