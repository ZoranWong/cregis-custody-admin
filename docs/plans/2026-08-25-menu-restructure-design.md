# Admin 菜单与功能重构设计文档

Date: 2026-08-25

## 背景

根据原型 `cregis-custody-new/docs/prototype/custody-admin-bootstrap-prototype/pages-v2/` 重构后台菜单结构和功能页面。原型只作功能参考，UI 全部按 admin 现有 Element Plus 设计体系实现，数据使用 mock。

## 菜单结构

原型菜单三分类：

```
Operations
├── Overview              ← 新建
├── Merchant List         ← 保留
├── Fee Monitor           ← 保留
├── Business Analytics    ← 新建
├── Service Quality       ← 新建
├── Ticket Queue          ← 保留
└── Message Notification  ← 保留

Compliance
├── Transaction Lens      ← 新建
├── Rules                 ← 新建
├── Compliance Alerts     ← 现有 ComplianceQueue，改菜单名
└── Travel Rule Events    ← 现有 TravelRuleWorkbench，改菜单名

System Admin
└── Team Management       ← 保留，更新为新的 staff API
```

## 隐藏的菜单（isHide: true）

| 模块                         | 原因                 |
| ---------------------------- | -------------------- |
| Dashboard (Console/Analysis) | 原型无对应           |
| Audit 全部                   | 原型无对应           |
| Risk 全部                    | 原型无对应           |
| Exception (403/404/500)      | 菜单不显示，路由保留 |
| Safeguard                    | 原型无对应           |
| ComplianceOutbox             | 原型无对应           |
| TravelRuleExchange           | 原型无对应           |
| TravelRuleConfig             | 原型无对应           |
| SystemMonitor                | 原型无对应           |

## 新增页面

### 1. Operations Overview (`/operations/home`)

**原型参考:** `ops-home.html`

**功能:**

- 3 摘要卡片：Ticket Queue、Expiry Alerts、Critical Alerts
- Todo 列表：P0/P1/P2 优先级分组
- 数据源状态条：Onboarding、Tickets、Merchant Mgmt、Support

**API:** `GET /api/v1/ops/home/surface`（有接口，数据格式待确认，mock 兜底）

**UI:** 用 admin 现有卡片 + 标签组件实现

### 2. Business Analytics (`/operations/analytics`)

**原型参考:** `ops-analytics.html`（P1 Skeleton）

**功能:**

- 时间范围选择器：Daily/Weekly/Monthly/Custom
- 3 指标卡片：Total Revenue、Total Cost、Revenue Growth
- 4 图表占位：Revenue Trend（折线）、Cost Structure（饼图）、Merchant Contribution（柱状图）、Trend Analysis（折线）

**API:** 无，mock 数据

**UI:** 用 admin 现有图表组件（art-line-chart、art-bar-chart 等）实现骨架

### 3. Service Quality (`/operations/service-quality`)

**原型参考:** `ops-service-quality.html`

**功能:** 待从原型提取具体功能

**API:** 无，mock 数据

### 4. Transaction Lens (`/compliance/tx-lens`)

**原型参考:** `compliance-tx-lens.html`

**功能:**

- 4 摘要卡片：Total Transactions、Settled、Rejected、Pending Review
- 4 审查结果卡片：True Positive、True Negative、False Positive、False Negative
- 筛选栏：Merchant、Date Range、Search + 7 个筛选组（Direction、Compliance、Travel Rule、Sign-off、On-Chain、Fund Disposition、Review Result）
- 交易卡片列表：金额、Order ID、方向、生命周期阶段（Compliance → Travel Rule → Sign-off → On-Chain → Fund Disposition）

**API:** 无，mock 数据

**UI:** 用 admin 现有表格 + 筛选 + Tag 组件实现

### 5. Rules (`/compliance/rules`)

**原型参考:** `compliance-rules.html`

**功能:**

- 两个 Tab：Outgoing / Incoming
- 筛选：Status、Severity
- 规则卡片列表（按阶段分组）：规则名、严重级别、状态、描述、决策类型、范围
- 新增规则弹窗：Rule Name、Description、Direction、Stage、Min Amount、Severity、Scope、Decision、Risk Factors

**API:** 无，mock 数据

**UI:** 用 admin 现有卡片 + 弹窗组件实现

### 6. Compliance Alerts (`/compliance/alerts`)

**原型参考:** `compliance-review-queue.html`

**现状:** 已有 `ComplianceQueue`，功能完整

**改动:** 菜单名改为 Compliance Alerts，路径改为 `/compliance/alerts`

### 7. Travel Rule Events (`/compliance/travel-rule`)

**现状:** 已有 `TravelRuleWorkbench`、`TravelRuleExchange`、`TravelRuleConfig`

**改动:** 菜单名改为 Travel Rule Events，Workbench 作为主页面，Config 和 Exchange 隐藏

## 更新页面

### Team Management (`/system/team`)

**现状:** 已有 `EmployeeManagement`，功能完整

**更新:**

- 使用新的 `/system/staff/*` API
- 新增邀请成员功能（`POST /system/staff/add`）
- 角色授权（`POST /system/staff/role/grant/{email}`）
- 2FA 启用/禁用（`POST /system/staff/{id}/2fa/enable`、`disable`）
- 强制登出（`POST /system/staff/{id}/force-logout`）

### Personal Center

**现状:** 已有 `PersonalCenter`，功能完整

**更新:**

- Passkey 注册/列表/检查（`POST /v1/auth/passkey/registration/*`、`GET /v1/auth/passkey/check`）
- 使用新的 API 端点

## 路由设计

```typescript
// 新菜单路由
{
  name: 'Operations',
  path: '/operations',
  children: [
    { path: 'home', name: 'OperationsHome', component: '/operations/home' },
    { path: 'merchants', name: 'MerchantList', ... },
    { path: 'onboarding', name: 'MerchantOnboarding', ... },
    { path: 'fee', name: 'FeeMonitor', ... },
    { path: 'gas', name: 'GasOperations', ... },
    { path: 'analytics', name: 'BusinessAnalytics', component: '/operations/analytics' },
    { path: 'service-quality', name: 'ServiceQuality', component: '/operations/service-quality' },
    { path: 'tickets', name: 'TicketQueue', ... },
    { path: 'notifications', name: 'MessageNotifications', ... },
  ]
},
{
  name: 'Compliance',
  path: '/compliance',
  children: [
    { path: 'tx-lens', name: 'TransactionLens', component: '/compliance/tx-lens' },
    { path: 'rules', name: 'ComplianceRules', component: '/compliance/rules' },
    { path: 'alerts', name: 'ComplianceAlerts', component: '/compliance/alerts' },
    { path: 'travel-rule', name: 'TravelRuleEvents', component: '/compliance/travel-rule' },
  ]
},
{
  name: 'SystemAdmin',
  path: '/system',
  children: [
    { path: 'team', name: 'TeamManagement', component: '/system/team' },
  ]
}
```

## 文件清单

### 新建文件

- `src/views/operations/home/index.vue`
- `src/views/operations/analytics/index.vue`
- `src/views/operations/service-quality/index.vue`
- `src/views/compliance/tx-lens/index.vue`
- `src/views/compliance/rules/index.vue`

### 修改文件

- `src/router/modules/operations.ts` — 新增 home/analytics/service-quality
- `src/router/modules/compliance.ts` — 重构菜单
- `src/router/modules/system.ts` — 简化为仅 team management
- `src/router/modules/index.ts` — 移除 audit/dashboard
- `src/router/modules/dashboard.ts` — 全部 isHide: true
- `src/router/modules/audit.ts` — 全部 isHide: true
- `src/router/modules/risk.ts` — 全部 isHide: true
- `src/router/modules/exception.ts` — 顶级 isHide: true
- `src/router/modules/safeguard.ts` — 顶级 isHide: true
- `src/router/routes/staticRoutes.ts` — redirect 改为 /operations/home
- `src/locales/langs/zh.json` — 新增/更新菜单 i18n
- `src/locales/langs/en.json` — 新增/更新菜单 i18n
- `src/features/workbench/workbenchEntry.ts` — 更新域名映射
- `src/features/system-admin/useEmployeeManagement.ts` — 更新角色选项
- `src/types/models.ts` — 更新类型联合
- `src/features/tickets/types.ts` — 更新类型联合
- `src/api/system-manage.ts` — 更新 staff API

### 隐藏（不删除）

- `src/views/dashboard/` — 保留
- `src/views/audit/` — 保留
- `src/views/risk/` — 保留
- `src/views/exception/` — 保留
- `src/views/safeguard/` — 保留
- `src/views/system/monitor/` — 保留
- `src/views/system/menu/` — 保留
- `src/views/system/role/` — 保留
- `src/views/system/user/` — 保留
- `src/views/system/user-center/` — 保留
- `src/views/system/nested/` — 保留

## 不改变

- 所有现有页面 UI 保持不变
- 所有现有 API 调用保持不变
- Personal Center 功能保持不变（仅接口更新）
- 顶部栏、侧边栏、面包屑等布局组件保持不变
