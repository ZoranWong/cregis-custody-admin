# Menu & Function Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure admin menu to match prototype, hide unused modules, create new placeholder pages, update Team Management and Personal Center APIs.

**Architecture:** Add `isHide: true` to unused route modules, restructure compliance/operations routes, create 5 new pages with mock data in admin Element Plus style, update i18n keys.

**Tech Stack:** Vue 3 + TypeScript + Pinia + Element Plus

---

### Task 1: Hide unused menu modules

**Files:**

- Modify: `src/router/modules/dashboard.ts`
- Modify: `src/router/modules/audit.ts`
- Modify: `src/router/modules/risk.ts`
- Modify: `src/router/modules/safeguard.ts`
- Modify: `src/router/modules/index.ts`

**Step 1: Add `isHide: true` to Dashboard**

In `src/router/modules/dashboard.ts`, add `isHide: true` to the parent route meta:

```typescript
meta: {
  title: 'menus.dashboard.title',
  icon: 'ri:pie-chart-line',
  roles: ['ADMIN'],
  isHide: true
}
```

**Step 2: Add `isHide: true` to Audit**

In `src/router/modules/audit.ts`, add `isHide: true` to the parent route meta:

```typescript
meta: { title: 'menus.audit.title', icon: 'ri:search-eye-line', roles: ['AUDIT', 'ADMIN'], isHide: true }
```

**Step 3: Add `isHide: true` to Risk**

In `src/router/modules/risk.ts`, add `isHide: true` to the parent route meta:

```typescript
meta: { title: 'menus.risk.title', icon: 'ri:alert-line', roles: ['RISK', 'ADMIN'], isHide: true }
```

**Step 4: Add `isHide: true` to Safeguard**

In `src/router/modules/safeguard.ts`, add `isHide: true` to the parent route meta:

```typescript
meta: {
  title: 'menus.safeguard.title',
  icon: 'ri:shield-check-line',
  keepAlive: false,
  isHide: true
}
```

**Step 5: Commit**

```bash
git add src/router/modules/dashboard.ts src/router/modules/audit.ts src/router/modules/risk.ts src/router/modules/safeguard.ts
git commit -m "chore: hide unused menu modules (dashboard, audit, risk, safeguard)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Restructure Operations routes

**Files:**

- Modify: `src/router/modules/operations.ts`

**Step 1: Add new routes, keep existing**

In `src/router/modules/operations.ts`, add three new child routes before the existing ones:

```typescript
// Add at the top of children array:
{
  path: 'home',
  name: 'OperationsHome',
  component: '/operations/home',
  meta: {
    title: 'menus.operations.overview',
    icon: 'ri:home-4-line',
    keepAlive: false
  }
},
{
  path: 'analytics',
  name: 'BusinessAnalytics',
  component: '/operations/analytics',
  meta: {
    title: 'menus.operations.businessAnalytics',
    icon: 'ri:bar-chart-2-line',
    keepAlive: false
  }
},
{
  path: 'service-quality',
  name: 'ServiceQuality',
  component: '/operations/service-quality',
  meta: {
    title: 'menus.operations.serviceQuality',
    icon: 'ri:heart-line',
    keepAlive: false
  }
},
```

**Step 2: Remove onboarding from menu (hide)**

Add `isHide: true` to the `MerchantOnboarding` route (keep route accessible, just hide from menu).

**Step 3: Commit**

```bash
git add src/router/modules/operations.ts
git commit -m "feat: add operations home, analytics, service-quality routes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Restructure Compliance routes

**Files:**

- Modify: `src/router/modules/compliance.ts`

**Step 1: Rewrite compliance routes**

Replace the entire children array with the new menu structure:

```typescript
children: [
  {
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
  },
  // Keep old routes accessible but hidden
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
```

**Step 2: Commit**

```bash
git add src/router/modules/compliance.ts
git commit -m "feat: restructure compliance routes (tx-lens, rules, alerts, travel-rule)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Restructure System routes

**Files:**

- Modify: `src/router/modules/system.ts`

**Step 1: Simplify system routes**

Add `isHide: true` to SystemMonitor, keep employees and personal-center visible:

```typescript
children: [
  {
    path: 'team',
    name: 'TeamManagement',
    component: '/system/employees',
    meta: { title: 'menus.system.teamManagement', icon: 'ri:team-line', keepAlive: true }
  },
  {
    path: 'monitor',
    name: 'SystemMonitor',
    component: '/system/monitor',
    meta: {
      title: 'menus.system.monitor',
      icon: 'ri:heart-pulse-line',
      keepAlive: true,
      isHide: true
    }
  },
  {
    path: 'personal-center',
    name: 'PersonalCenter',
    component: '/system/personal-center',
    meta: { title: 'menus.system.personalCenter', icon: 'ri:user-settings-line', keepAlive: false }
  }
]
```

**Step 2: Commit**

```bash
git add src/router/modules/system.ts
git commit -m "feat: restructure system routes (team management, hide monitor)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Update redirect and i18n

**Files:**

- Modify: `src/router/routes/staticRoutes.ts`
- Modify: `src/locales/langs/zh.json`
- Modify: `src/locales/langs/en.json`

**Step 1: Update redirect**

In `src/router/routes/staticRoutes.ts` line 36, change redirect:

```typescript
redirect: '/operations/home',
```

**Step 2: Update i18n - zh.json**

Add new keys to `menus.compliance`:

```json
"compliance": {
  "title": "合规管理",
  "txLens": "Transaction Lens",
  "rules": "规则管理",
  "alerts": "合规告警",
  "travelRuleEvents": "Travel Rule 事件",
  "queue": "合规队列",
  "outbox": "发件箱",
  "travelRuleWorkbench": "Travel Rule 工作台",
  "exchangeEvidence": "交易所与证据",
  "travelRuleConfig": "Travel Rule 配置"
}
```

Update `menus.system`:

```json
"system": {
  "title": "系统管理",
  "teamManagement": "团队管理",
  "employees": "员工管理",
  "monitor": "系统监控",
  "personalCenter": "个人中心"
}
```

**Step 3: Update i18n - en.json**

Add new keys to `menus.compliance`:

```json
"compliance": {
  "title": "Compliance",
  "txLens": "Transaction Lens",
  "rules": "Rules",
  "alerts": "Compliance Alerts",
  "travelRuleEvents": "Travel Rule Events",
  "queue": "Compliance Queue",
  "outbox": "Outbox",
  "travelRuleWorkbench": "Travel Rule Workbench",
  "exchangeEvidence": "Exchange & Evidence",
  "travelRuleConfig": "Travel Rule Configuration"
}
```

Update `menus.system`:

```json
"system": {
  "title": "System Admin",
  "teamManagement": "Team Management",
  "employees": "Employee Management",
  "monitor": "System Monitor",
  "personalCenter": "Personal Center"
}
```

**Step 4: Commit**

```bash
git add src/router/routes/staticRoutes.ts src/locales/langs/zh.json src/locales/langs/en.json
git commit -m "feat: update redirect to /operations/home, add new i18n keys

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Create Operations Home page

**Files:**

- Create: `src/views/operations/home/index.vue`

**Step 1: Create the page**

Create `src/views/operations/home/index.vue` with mock data:

```vue
<template>
  <div class="p-5">
    <div class="grid grid-cols-3 gap-4 mb-6">
      <el-card shadow="never">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-g-500 text-sm">{{ $t('opsHome.ticketQueue') }}</p>
            <p class="text-2xl font-semibold text-g-900">8</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ArtSvgIcon icon="ri:file-list-3-line" class="text-blue-500 text-lg" />
          </div>
        </div>
      </el-card>
      <el-card shadow="never">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-g-500 text-sm">{{ $t('opsHome.expiryAlerts') }}</p>
            <p class="text-2xl font-semibold text-g-900">2</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <ArtSvgIcon icon="ri:timer-line" class="text-orange-500 text-lg" />
          </div>
        </div>
      </el-card>
      <el-card shadow="never">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-g-500 text-sm">{{ $t('opsHome.criticalAlerts') }}</p>
            <p class="text-2xl font-semibold text-g-900">1</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <ArtSvgIcon icon="ri:error-warning-line" class="text-red-500 text-lg" />
          </div>
        </div>
      </el-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <el-card shadow="never" :header="$t('opsHome.todoList')">
        <div v-for="group in todoGroups" :key="group.priority" class="mb-4 last:mb-0">
          <div class="flex items-center gap-2 mb-2">
            <el-tag :type="group.tagType" size="small">{{ group.label }}</el-tag>
            <span class="text-xs text-g-400">({{ group.items.length }})</span>
          </div>
          <div
            v-for="item in group.items"
            :key="item.id"
            class="flex items-center justify-between py-2 px-3 rounded hover:bg-g-50"
          >
            <div>
              <p class="text-sm text-g-800">{{ item.title }}</p>
              <p class="text-xs text-g-400">{{ item.source }}</p>
            </div>
            <div class="flex gap-2">
              <el-button size="small" text>{{ $t('common.view') }}</el-button>
              <el-button size="small" type="primary">{{ $t('common.process') }}</el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" :header="$t('opsHome.dataSourceStatus')">
        <div class="flex flex-wrap gap-2">
          <el-tag
            v-for="ds in dataSources"
            :key="ds.name"
            :type="ds.status === 'ok' ? 'success' : 'warning'"
            size="default"
          >
            {{ ds.name }}: {{ ds.status === 'ok' ? 'OK' : ds.label }}
          </el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'OperationsHome' })

  const todoGroups = [
    {
      priority: 'P0',
      label: 'Urgent',
      tagType: 'danger',
      items: [
        { id: 1, title: 'CryptoVault onboarding documents', source: 'Onboarding' },
        { id: 2, title: 'ChainBridge suspicious address investigation', source: 'Compliance' }
      ]
    },
    {
      priority: 'P1',
      label: 'Important',
      tagType: 'warning',
      items: [
        { id: 3, title: 'PayFlow contract expiry', source: 'Merchant' },
        { id: 4, title: 'NodeSphere KYB review', source: 'Onboarding' },
        { id: 5, title: 'DataTrust audit materials', source: 'Audit' }
      ]
    },
    {
      priority: 'P2',
      label: 'Routine',
      tagType: 'info',
      items: [
        { id: 6, title: 'TokenGuard activity', source: 'Monitoring' },
        { id: 7, title: 'Q2 upgrade notice', source: 'System' },
        { id: 8, title: 'BlockSafe onboarding', source: 'Onboarding' }
      ]
    }
  ]

  const dataSources = [
    { name: 'Onboarding', status: 'ok' },
    { name: 'Tickets', status: 'ok' },
    { name: 'Merchant Mgmt', status: 'ok' },
    { name: 'Support', status: 'degraded', label: 'Not Connected' }
  ]
</script>
```

**Step 2: Commit**

```bash
git add src/views/operations/home/index.vue
git commit -m "feat: create operations home page with mock data

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Create remaining placeholder pages

**Files:**

- Create: `src/views/operations/analytics/index.vue`
- Create: `src/views/operations/service-quality/index.vue`
- Create: `src/views/compliance/tx-lens/index.vue`
- Create: `src/views/compliance/rules/index.vue`

**Step 1: Create Business Analytics page**

```vue
<template>
  <div class="p-5">
    <div class="flex items-center gap-2 mb-6">
      <el-radio-group v-model="timeRange" size="small">
        <el-radio-button value="daily">Daily</el-radio-button>
        <el-radio-button value="weekly">Weekly</el-radio-button>
        <el-radio-button value="monthly">Monthly</el-radio-button>
        <el-radio-button value="custom">Custom</el-radio-button>
      </el-radio-group>
    </div>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <el-card shadow="never">
        <p class="text-g-500 text-sm">Total Revenue</p>
        <p class="text-2xl font-semibold text-g-900">$128,450</p>
        <p class="text-xs text-green-500 mt-1">+12.4%</p>
      </el-card>
      <el-card shadow="never">
        <p class="text-g-500 text-sm">Total Cost</p>
        <p class="text-2xl font-semibold text-g-900">$32,180</p>
        <p class="text-xs text-red-500 mt-1">+5.2%</p>
      </el-card>
      <el-card shadow="never">
        <p class="text-g-500 text-sm">Revenue Growth</p>
        <p class="text-2xl font-semibold text-g-900">+12.4%</p>
        <p class="text-xs text-green-500 mt-1">vs last month</p>
      </el-card>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <el-card shadow="never" header="Revenue Trend"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="Cost Structure"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="Merchant Contribution"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="Trend Analysis"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'BusinessAnalytics' })
  const timeRange = ref('weekly')
</script>
```

**Step 2: Create Service Quality page**

```vue
<template>
  <div class="p-5">
    <h1 class="text-xl font-semibold text-g-900 mb-6">Service Quality</h1>
    <div class="grid grid-cols-3 gap-4 mb-6">
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Avg Response Time</p
        ><p class="text-2xl font-semibold text-g-900">2.4h</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Satisfaction Rate</p
        ><p class="text-2xl font-semibold text-g-900">94.2%</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Active Tickets</p
        ><p class="text-2xl font-semibold text-g-900">8</p></el-card
      >
    </div>
    <div class="grid grid-cols-2 gap-4">
      <el-card shadow="never" header="Customer Sentiment Trend"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="Complaint Statistics"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="Feedback Summary"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
      <el-card shadow="never" header="SLA Compliance"
        ><div class="h-64 bg-g-50 rounded flex items-center justify-center text-g-400"
          >Chart Placeholder</div
        ></el-card
      >
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ServiceQuality' })
</script>
```

**Step 3: Create Transaction Lens page**

```vue
<template>
  <div class="p-5">
    <h1 class="text-xl font-semibold text-g-900 mb-6">Transaction Lens</h1>
    <div class="grid grid-cols-4 gap-4 mb-4">
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Total Transactions</p
        ><p class="text-2xl font-semibold text-g-900">1,247</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Settled</p
        ><p class="text-2xl font-semibold text-green-600">1,189</p
        ><p class="text-xs text-g-400">95.3%</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Rejected</p
        ><p class="text-2xl font-semibold text-red-600">8</p
        ><p class="text-xs text-g-400">0.6%</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">Pending Review</p
        ><p class="text-2xl font-semibold text-orange-600">24</p></el-card
      >
    </div>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">True Positive</p
        ><p class="text-2xl font-semibold text-g-900">22</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">True Negative</p
        ><p class="text-2xl font-semibold text-g-900">1,194</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">False Positive</p
        ><p class="text-2xl font-semibold text-g-900">12</p></el-card
      >
      <el-card shadow="never"
        ><p class="text-g-500 text-sm">False Negative</p
        ><p class="text-2xl font-semibold text-g-900">3</p></el-card
      >
    </div>
    <el-card shadow="never" header="Transactions">
      <el-table :data="mockTransactions" stripe>
        <el-table-column prop="orderId" label="Order ID" width="200" />
        <el-table-column prop="amount" label="Amount" width="150" />
        <el-table-column prop="direction" label="Direction" width="100">
          <template #default="{ row }"
            ><el-tag :type="row.direction === 'Outgoing' ? 'warning' : 'success'" size="small">{{
              row.direction
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="compliance" label="Compliance" width="100">
          <template #default="{ row }"
            ><el-tag :type="row.compliance === 'Clear' ? 'success' : 'danger'" size="small">{{
              row.compliance
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="travelRule" label="Travel Rule" width="120" />
        <el-table-column prop="onChain" label="On-Chain" width="120" />
        <el-table-column prop="time" label="Time" width="160" />
        <el-table-column label="Action" width="100">
          <template #default><el-button size="small" text>Inspect</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'TransactionLens' })

  const mockTransactions = [
    {
      orderId: 'ORDER-001',
      amount: '3,500 USDT',
      direction: 'Outgoing',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Settled',
      time: '2026-08-25 10:30'
    },
    {
      orderId: 'ORDER-002',
      amount: '1,200 USDT',
      direction: 'Incoming',
      compliance: 'Flagged',
      travelRule: 'Pending',
      onChain: 'Confirmed',
      time: '2026-08-25 09:15'
    },
    {
      orderId: 'ORDER-003',
      amount: '5,000 USDT',
      direction: 'Outgoing',
      compliance: 'In Review',
      travelRule: 'Mismatch',
      onChain: 'Broadcasted',
      time: '2026-08-24 16:45'
    },
    {
      orderId: 'ORDER-004',
      amount: '800 USDT',
      direction: 'Incoming',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Settled',
      time: '2026-08-24 14:20'
    },
    {
      orderId: 'ORDER-005',
      amount: '2,100 USDT',
      direction: 'Outgoing',
      compliance: 'Clear',
      travelRule: 'Complete',
      onChain: 'Failed',
      time: '2026-08-24 11:00'
    }
  ]
</script>
```

**Step 4: Create Rules page**

```vue
<template>
  <div class="p-5">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-g-900">Rules</h1>
      <el-button type="primary" @click="showAddRule = true">+ Add Rule</el-button>
    </div>
    <div class="flex items-center gap-4 mb-4">
      <el-radio-group v-model="direction" size="small">
        <el-radio-button value="outgoing">Outgoing</el-radio-button>
        <el-radio-button value="incoming">Incoming</el-radio-button>
      </el-radio-group>
      <el-select v-model="statusFilter" placeholder="Status" size="small" clearable>
        <el-option label="All" value="" />
        <el-option label="Active" value="active" />
        <el-option label="Pending" value="pending" />
        <el-option label="Cancelled" value="cancelled" />
      </el-select>
      <el-select v-model="severityFilter" placeholder="Severity" size="small" clearable>
        <el-option label="All" value="" />
        <el-option label="Routine" value="routine" />
        <el-option label="Medium" value="medium" />
        <el-option label="Critical" value="critical" />
      </el-select>
    </div>
    <div v-for="step in filteredSteps" :key="step.name" class="mb-6">
      <h3 class="text-sm font-medium text-g-500 mb-3">{{ step.name }}</h3>
      <div class="grid gap-3">
        <el-card v-for="rule in step.rules" :key="rule.id" shadow="never" class="rule-card">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-g-900">{{ rule.name }}</span>
                <el-tag
                  :type="
                    rule.severity === 'Critical'
                      ? 'danger'
                      : rule.severity === 'Medium'
                        ? 'warning'
                        : 'info'
                  "
                  size="small"
                  >{{ rule.severity }}</el-tag
                >
                <el-tag
                  :type="
                    rule.status === 'Active'
                      ? 'success'
                      : rule.status === 'Pending'
                        ? 'warning'
                        : 'info'
                  "
                  size="small"
                  >{{ rule.status }}</el-tag
                >
              </div>
              <p class="text-sm text-g-500 mb-2">{{ rule.description }}</p>
              <div class="flex items-center gap-4 text-xs text-g-400">
                <span>Decision: {{ rule.decision }}</span>
                <span>Scope: {{ rule.scope }}</span>
              </div>
            </div>
            <el-button size="small" text @click="editRule(rule)">Edit</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="showAddRule" title="Add Rule" width="560px">
      <el-form label-width="120px">
        <el-form-item label="Rule Name"><el-input v-model="newRule.name" /></el-form-item>
        <el-form-item label="Description"
          ><el-input v-model="newRule.description" type="textarea"
        /></el-form-item>
        <el-form-item label="Direction"
          ><el-input v-model="newRule.direction" disabled
        /></el-form-item>
        <el-form-item label="Stage"><el-input v-model="newRule.stage" /></el-form-item>
        <el-form-item label="Min Amount"><el-input v-model="newRule.minAmount" /></el-form-item>
        <el-form-item label="Severity"
          ><el-select v-model="newRule.severity"
            ><el-option label="Routine" value="Routine" /><el-option
              label="Medium"
              value="Medium" /><el-option label="Critical" value="Critical" /></el-select
        ></el-form-item>
        <el-form-item label="Scope"
          ><el-select v-model="newRule.scope"
            ><el-option label="Global" value="Global" /><el-option
              label="Merchant Specific"
              value="Merchant Specific" /></el-select
        ></el-form-item>
        <el-form-item label="Decision"
          ><el-select v-model="newRule.decision"
            ><el-option label="Auto Reject" value="Auto Reject" /><el-option
              label="Submit for Review"
              value="Submit for Review" /><el-option label="Hold" value="Hold" /></el-select
        ></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRule = false">Cancel</el-button>
        <el-button type="primary" @click="showAddRule = false">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ComplianceRules' })

  const direction = ref('outgoing')
  const statusFilter = ref('')
  const severityFilter = ref('')
  const showAddRule = ref(false)

  const newRule = reactive({
    name: '',
    description: '',
    direction: 'Outgoing',
    stage: '',
    minAmount: '',
    severity: 'Routine',
    scope: 'Global',
    decision: 'Submit for Review'
  })

  const rules = ref([
    // Outgoing
    {
      id: 1,
      name: 'Sanctions Hit Block',
      severity: 'Critical',
      status: 'Active',
      description: 'Block transactions where any party matches sanctions lists.',
      decision: 'Auto Reject',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 2,
      name: 'High-Risk Jurisdiction Block',
      severity: 'Critical',
      status: 'Active',
      description: 'Block transactions involving high-risk jurisdictions.',
      decision: 'Auto Reject',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 3,
      name: 'Large Transaction Review',
      severity: 'Routine',
      status: 'Active',
      description: 'Submit large transactions for manual review.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    {
      id: 4,
      name: 'Unlicensed VASP Counterparty',
      severity: 'Medium',
      status: 'Pending',
      description: 'Flag transactions with unlicensed VASP counterparties.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Outgoing'
    },
    // Incoming
    {
      id: 5,
      name: 'Tainted Address Block',
      severity: 'Critical',
      status: 'Active',
      description: 'Block incoming transactions from tainted addresses.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 6,
      name: 'High Volume Review',
      severity: 'Medium',
      status: 'Active',
      description: 'Review incoming high-volume transactions.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Due Diligence',
      direction: 'Incoming'
    },
    {
      id: 7,
      name: 'IVMS101 Mismatch',
      severity: 'Routine',
      status: 'Active',
      description: 'Submit when IVMS101 PII data does not match.',
      decision: 'Submit for Review',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    },
    {
      id: 8,
      name: 'Amount Mismatch Hold',
      severity: 'Critical',
      status: 'Active',
      description: 'Hold transactions with amount discrepancies.',
      decision: 'Hold',
      scope: 'Global',
      stage: 'Mismatch Hold',
      direction: 'Incoming'
    }
  ])

  const filteredSteps = computed(() => {
    const filtered = rules.value.filter((r) => {
      if (r.direction.toLowerCase() !== direction.value) return false
      if (statusFilter.value && r.status.toLowerCase() !== statusFilter.value) return false
      if (severityFilter.value && r.severity.toLowerCase() !== severityFilter.value) return false
      return true
    })
    const stages = [...new Set(filtered.map((r) => r.stage))]
    return stages.map((name) => ({ name, rules: filtered.filter((r) => r.stage === name) }))
  })

  function editRule(rule: any) {
    Object.assign(newRule, rule)
  }
</script>
```

**Step 5: Commit**

```bash
git add src/views/operations/analytics/index.vue src/views/operations/service-quality/index.vue src/views/compliance/tx-lens/index.vue src/views/compliance/rules/index.vue
git commit -m "feat: create analytics, service-quality, tx-lens, rules pages with mock data

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Update Team Management with new staff API

**Files:**

- Modify: `src/api/system-manage.ts`

**Step 1: Add new staff API functions**

Add to `src/api/system-manage.ts`:

```typescript
export function addStaff(payload: { displayName: string; email: string; initialRoleCode: string }) {
  return apiRequest('/system/staff/add', { method: 'POST', body: payload })
}

export function grantRole(email: string, roleCode: string) {
  return apiRequest(`/system/staff/role/grant/${encodeURIComponent(email)}`, {
    method: 'POST',
    body: { roleCode }
  })
}

export function enable2FA(userId: string) {
  return apiRequest(`/system/staff/${userId}/2fa/enable`, { method: 'POST' })
}

export function disable2FA(userId: string) {
  return apiRequest(`/system/staff/${userId}/2fa/disable`, { method: 'POST' })
}

export function forceLogout(userId: string) {
  return apiRequest(`/system/staff/${userId}/force-logout`, { method: 'POST' })
}
```

**Step 2: Update useEmployeeManagement composable**

In `src/features/system-admin/useEmployeeManagement.ts`, update the role options to match new API:

```typescript
// Update domain options to remove 'audit'
const domainOptions = [
  { id: 'operations', label: 'Operations' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'system_administration', label: 'System Admin' }
]

// Update role options to remove 'AUDIT'
const roleOptions = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'OPERATIONS', label: 'Operations' },
  { code: 'COMPLIANCE', label: 'Compliance' },
  { code: 'SYSTEM_ADMIN', label: 'System Admin' }
]
```

**Step 3: Commit**

```bash
git add src/api/system-manage.ts src/features/system-admin/useEmployeeManagement.ts
git commit -m "feat: add new staff API functions, update role options

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Update workbenchEntry and types

**Files:**

- Modify: `src/features/workbench/workbenchEntry.ts`
- Modify: `src/types/models.ts`
- Modify: `src/features/tickets/types.ts`

**Step 1: Remove audit from workbenchEntry**

Remove `audit` from domain types, route map, and role map in `workbenchEntry.ts`.

**Step 2: Remove audit from type unions**

In `src/types/models.ts` and `src/features/tickets/types.ts`, remove `audit` from union types.

**Step 3: Commit**

```bash
git add src/features/workbench/workbenchEntry.ts src/types/models.ts src/features/tickets/types.ts
git commit -m "chore: remove audit from domain/role mappings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Verify build

**Step 1: Run build**

```bash
npm run build:test
```

Expected: Build succeeds.

**Step 2: Commit if needed**

```bash
git commit -m "chore: verify build passes after menu restructure

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
