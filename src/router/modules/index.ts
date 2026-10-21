import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { exceptionRoutes } from './exception'
import { operationsRoutes } from './operations'
import { riskRoutes } from './risk'
import { complianceRoutes } from './compliance'
import { auditRoutes } from './audit'
import { systemRoutes } from './system'
import { personalCenterRoutes } from './personalCenter'

export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  exceptionRoutes,
  operationsRoutes,
  riskRoutes,
  complianceRoutes,
  auditRoutes,
  systemRoutes,
  personalCenterRoutes
]
