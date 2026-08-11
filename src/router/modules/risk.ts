import { AppRouteRecord } from '@/types/router'

export const riskRoutes: AppRouteRecord = {
  name: 'Risk',
  path: '/risk',
  component: '/index/index',
  meta: { title: 'menus.risk.title', icon: 'ri:alert-line', roles: ['RISK', 'ADMIN'] },
  children: [
    { path: 'queue', name: 'RiskQueue', component: '/risk/queue', meta: { title: 'menus.risk.queue', icon: 'ri:shield-line', keepAlive: true } },
    { path: 'outbox', name: 'RiskOutbox', component: '/risk/outbox', meta: { title: 'menus.risk.outbox', icon: 'ri:mail-send-line', keepAlive: true } },
    { path: 'strategy/rules', name: 'RiskRuleGovernance', component: '/risk/strategy/rules', meta: { title: 'menus.risk.ruleGovernance', icon: 'ri:settings-line', keepAlive: true } },
    { path: 'strategy/effectiveness', name: 'RiskEffectiveness', component: '/risk/strategy/effectiveness', meta: { title: 'menus.risk.effectivenessAnalysis', icon: 'ri:bar-chart-line', keepAlive: true } },
    { path: 'strategy/appetite', name: 'RiskProfileAppetite', component: '/risk/strategy/appetite', meta: { title: 'menus.risk.profileAppetite', icon: 'ri:pie-chart-line', keepAlive: true } },
  ]
}
