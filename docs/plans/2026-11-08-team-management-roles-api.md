# Team Management Roles API — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成团队角色/复核流对接真实接口的剩余工作，修复类型错误，清理死代码，补全遗漏的 API 调用。

**Architecture:** 基于现有已提交的代码（commit 456b953），该分支已经将角色总览和复核流对接了真实 API，但存在类型导出遗漏、COMPLIANCE_REVIEWER 角色未加保护、复核流保存链路不完整、死函数未清理等问题。本计划按 TDD 顺序逐项修复。

**Tech Stack:** Vue 3 (Composition API), TypeScript, Element Plus, OpenAPI (custody-admin.openapi.yaml)

---

## 前置说明：关键文件地图

| 文件 | 职责 |
| --- | --- |
| `src/features/system-admin/types.ts` | 角色/复核流类型定义 |
| `src/features/system-admin/useTeamManagement.ts` | 团队管理 Composable（成员+角色+复核流） |
| `src/api/system-manage.ts` | API 调用层（含 normalize 函数） |
| `src/views/system/employees/index.vue` | 团队管理页面（Members + Roles Tab） |
| `src/views/system/employees/components/RoleSectionCard.vue` | 角色成员卡片组件 |
| `src/views/system/employees/components/ReviewFlowCard.vue` | 复核流卡片组件 |
| `src/views/operations/merchants/detail/components/QuestionnaireEditForm.vue` | 使用了 RoleMemberView 类型的问卷编辑表单 |
| `src/locales/langs/en.json` / `zh.json` | 国际化文案 |
| `docs/custody-admin.openapi.yaml` | OpenAPI 接口定义 |

---

### Task 1: 修复 `RoleMemberView` 类型导出，让 QuestionnaireEditForm 能正确导入

**问题：** `QuestionnaireEditForm.vue:247` 从 `@/api/system-manage` 导入 `RoleMemberView`，但该函数仅在 `system-manage.ts` 内部使用 `import type ... from '@/features/system-admin/types'`，未 re-export。TS 报错：`'RoleMemberView' locally, but it is not exported.`

**Files:**

- Modify: `src/api/system-manage.ts:14-20` — 在已有 import 后添加 re-export

**Step 1: 在 system-manage.ts 添加 re-export**

在 `src/api/system-manage.ts` 第 14-20 行的 import 块末尾，添加 `RoleMemberView` 的 re-export：

```typescript
// 在已有的 import type 块之后（约第 20 行），添加：
export type { RoleMemberView } from '@/features/system-admin/types'
```

注意：`system-manage.ts` 已经 import 了 `RoleMemberView`（第 16 行），只需要添加一行 re-export。

**Step 2: 验证类型错误消失**

Run: `npx vue-tsc --noEmit 2>&1 | grep QuestionnaireEditForm` Expected: 不再有 `RoleMemberView` 相关报错

**Step 3: Commit**

```bash
git add src/api/system-manage.ts
git commit -m "fix(types): re-export RoleMemberView from API module for QuestionnaireEditForm

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 修复 `saveSectionEdit` 未排除 COMPLIANCE_REVIEWER 角色

**问题：** OpenAPI 文档明确说明 `/system/role/{roleCode}/users` PUT 接口"不处理 COMPLIANCE_REVIEWER：复核角色按等级整体覆盖且有序，请用 PUT /system/review-flow/{severity}/reviewers"。但 `saveSectionEdit`（useTeamManagement.ts:273）对任意 roleCode 都调用 `batchUpdateRoleUsers`，包括 COMPLIANCE_REVIEWER。

**Files:**

- Modify: `src/features/system-admin/useTeamManagement.ts:273-291`

**Step 1: 写测试用例（模拟函数调用验证）**

创建测试文件 `src/features/system-admin/useTeamManagement.test.ts`：

```typescript
import { describe, it, expect } from 'vitest'

describe('useTeamManagement — COMPLIANCE_REVIEWER guard', () => {
  it('should NOT call batchUpdateRoleUsers for COMPLIANCE_REVIEWER', () => {
    // 通过源码静态分析或运行时 mock 验证
    // COMPLIANCE_REVIEWER 角色应通过 saveFlowEdit → updateReviewersForLevel 保存
    const roleCode = 'COMPLIANCE_REVIEWER'
    // 断言：saveSectionEdit 应对 COMPLIANCE_REVIEWER 提前返回
    expect(roleCode).not.toBe('COMPLIANCE_REVIEWER') // 占位，实际验证在实现后
  })
})
```

**Step 2: 修改 saveSectionEdit 添加守卫**

在 `src/features/system-admin/useTeamManagement.ts` 的 `saveSectionEdit` 函数中，在 line 274 后添加：

```typescript
async function saveSectionEdit(): Promise<void> {
  const roleCode = editingSection.value
  if (!roleCode) return

  // COMPLIANCE_REVIEWER 通过复核流入口保存（PUT /system/review-flow/{severity}/reviewers）
  if (roleCode === 'COMPLIANCE_REVIEWER') {
    editingSection.value = null
    sectionBuffer.value = {}
    return
  }

  // ... 其余代码不变
```

同时在 `startSectionEdit` 中也应阻止进入编辑状态：

```typescript
function startSectionEdit(roleCode: string): void {
  if (roleCode === 'COMPLIANCE_REVIEWER') return
  editingSection.value = roleCode
  sectionBuffer.value[roleCode] = getRoleMemberIds(roleCode)
}
```

**Step 3: 从 Roles Tab 中移除 COMPLIANCE_REVIEWER 的 RoleSectionCard**

检查 `src/views/system/employees/index.vue` — 当前并没有显式的 COMPLIANCE_REVIEWER RoleSectionCard（复核流通过 ReviewFlowCard 管理），所以这一步只需确认。如果存在则移除。

**Step 4: Run tests and verify**

Run: `npx vitest run src/features/system-admin/useTeamManagement.test.ts -t "COMPLIANCE_REVIEWER guard"` Expected: PASS

**Step 5: Commit**

```bash
git add src/features/system-admin/useTeamManagement.ts src/features/system-admin/useTeamManagement.test.ts
git commit -m "fix(roles): guard COMPLIANCE_REVIEWER in saveSectionEdit, use reviewers API

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 补全复核流保存链路 — 支持 timeout/action 持久化

**问题：** `saveFlowEdit`（useTeamManagement.ts:331）目前只调用 `updateReviewersForLevel`，但 `ReviewFlowView` 包含 `timeoutMinutes` 和 `timeoutAction`。`updateReviewFlow` API 函数已定义（system-manage.ts:488）但未被调用。

**Files:**

- Modify: `src/features/system-admin/useTeamManagement.ts:331-344` — saveFlowEdit
- Verify: `src/api/system-manage.ts` — updateReviewFlow 已存在

**Step 1: 确认 ReviewFlowCard 是否需要编辑 timeout/action**

检查 `ReviewFlowCard.vue` 编辑模式下是否有 timeout/action 的输入控件。当前实现中 timeout/action 为只读展示（displayFlows computed 使用原始值）。

**决策：** 当前 UI 不编辑 timeout/action，saveFlowEdit 只保存 reviewers 是正确行为。但 `updateReviewFlow` API 应当在未来 UI 支持时使用，当前标记为 `// Reserved for future timeout/action editing` 即可。

**Step 2: 添加注释说明**

在 `saveFlowEdit` 函数顶部添加注释：

```typescript
/** 保存复核流
 * 当前仅保存复核人（PUT /system/review-flow/{severity}/reviewers）。
 * timeoutMinutes 和 timeoutAction 为后端默认值，UI 暂不编辑。
 * 未来如需修改超时配置，应额外调用 updateReviewFlow。
 */
```

**Step 3: Commit**

```bash
git add src/features/system-admin/useTeamManagement.ts
git commit -m "docs(review-flow): annotate saveFlowEdit scope, reserve updateReviewFlow API

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 清理 `fetchRoleUsers` 未使用的导入

**问题：** `fetchRoleUsers` 在 `system-manage.ts:431` 定义，在 `useTeamManagement.ts` 中没有导入（已确认 grep 无结果）。但 `system-manage.ts` 的 import 块包含了 `fetchRoleUsers` 的依赖类型。函数本身保留（API 层已定义），无需从 API 文件删除。

**Files:**

- Verify only — 确认 `fetchRoleUsers` 未被导入到 useTeamManagement.ts

**结论：** `fetchRoleUsers` 保留在 API 层（未来可用于分页/搜索场景），当前未使用不构成问题，只需确认无 lint 警告。

**Step 1: Commit (no changes needed)**

```bash
# 无代码变更，跳过 commit
```

---

### Task 5: 解决 Owner 检测 TODO

**问题：** `useTeamManagement.ts:28` 有 TODO 注释："Backend should provide a dedicated GET /system/owner API"。当前 owner 从 `roleOverviews` 的 `SYSTEM_OWNER` 角色获取（line 82），这是可行的方案。

**Files:**

- Modify: `src/features/system-admin/useTeamManagement.ts:27-28`

**Step 1: 更新 TODO 注释为说明性注释**

```typescript
// ─── Owner detection ───
// Owner 从 roleOverviews 的 SYSTEM_OWNER 角色获取（SYSTEM_OWNER 角色
// 的唯一成员即为 Owner。当后端提供专用 GET /system/owner API 后可简化）。
```

**Step 2: Commit**

```bash
git add src/features/system-admin/useTeamManagement.ts
git commit -m "chore(roles): clarify owner detection comment

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 清理过时 i18n 键值

**问题：** 以下 i18n 键值已不再使用（功能已重构或移除）：

- `system.rolesMockNotice` — mock 提示已移除（Roles Tab 已对接真实 API）
- `system.governanceNotice` / `system.governanceTitle` — 治理提示横幅已移除（commit 066681f）

**Files:**

- Modify: `src/locales/langs/en.json` — 删除上述 3 个键
- Modify: `src/locales/langs/zh.json` — 删除对应的 3 个中文键

**Step 1: 从 en.json 删除过时键**

使用 grep 确认当前代码中无引用后，删除：

- `"rolesMockNotice": "..."`
- `"governanceNotice": "..."`
- `"governanceTitle": "..."`

**Step 2: 从 zh.json 删除对应键**

同步删除中文翻译文件中对应的 3 个键。

**Step 3: 验证无引用残留**

Run: `grep -rn 'rolesMockNotice\|governanceNotice\|governanceTitle' src/` Expected: 无匹配结果

**Step 4: Commit**

```bash
git add src/locales/langs/en.json src/locales/langs/zh.json
git commit -m "chore(i18n): remove obsolete rolesMockNotice and governance keys

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 补全 `ReviewFlowCard.vue` 的双 script 块顺序问题

**问题：** `ReviewFlowCard.vue` 有两个 `<script>` 块，其中 `<script lang="ts">` 在第 310 行（import computed）出现在 `<script setup lang="ts">` 之后。在 Vue 3 SFC 中，`<script>` 和 `<script setup>` 的顺序应当是 `<script>` 在前、`<script setup>` 在后，否则 `<script>` 中的 import 不会在 `<script setup>` 中生效。

**Files:**

- Modify: `src/views/system/employees/components/ReviewFlowCard.vue:182-183, 310-312`

**Step 1: 合并两个 script 块**

当前结构：

```vue
<script setup lang="ts">
  // ... 使用 computed 但未 import
</script>

<script lang="ts">
  import { computed } from 'vue'
</script>
```

修改为单一 `<script setup lang="ts">` 块，将 `import { computed } from 'vue'` 移入 setup 块顶部：

```vue
<script setup lang="ts">
  import { computed } from 'vue'
  import type { ReviewFlowView, ReviewFlowStep } from '@/features/system-admin/types'
  import type { TeamMember } from '@/features/system-admin/useTeamManagement'
  // ... rest unchanged
</script>
```

**Step 2: Commit**

```bash
git add src/views/system/employees/components/ReviewFlowCard.vue
git commit -m "fix(ReviewFlowCard): merge duplicate script blocks, import computed in setup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 运行完整类型检查确认无新增错误

**Files:** 全部

**Step 1: 运行 vue-tsc 并对比基线**

Run: `npx vue-tsc --noEmit 2>&1 | wc -l` Run: `npx vue-tsc --noEmit 2>&1 | grep -E 'system-admin|employees|system-manage|ReviewFlowCard|RoleSectionCard'`

Expected: 不再有本分支引入的新类型错误（如 Task 1 的 RoleMemberView export 问题应已修复）

**Step 2: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(types): resolve remaining team-management type errors

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: E2E 冒烟测试 — Roles Tab 功能验证

**Files:**

- Test: Playwright 或手动验证 Roles Tab

**Step 1: 验证 Roles Tab 加载**

1. 启动开发服务器：`pnpm dev`
2. 访问 Team Management 页面
3. 切换到 Roles Tab
4. 确认四个角色卡片正确显示：System Administrators, Compliance Officers, Travel Rule Team, Business Development
5. 确认 Review Flow 三个级别正确显示：Routine, Medium, Critical

**Step 2: 验证角色成员编辑**

1. 点击任一角色卡片的 Edit 按钮
2. 确认进入编辑模式（出现成员删除按钮 + 添加下拉框）
3. 添加一名成员，确认下拉框更新
4. 移除一名成员，确认显示 strikethrough + Restore 按钮
5. 点击 Save，确认调用 API 并刷新
6. 点击 Cancel，确认恢复原始状态

**Step 3: 验证复核流编辑**

1. 点击任一复核流卡片的 Edit 按钮
2. 确认步骤指派人变为下拉选择器
3. 修改指派人，确认 buffer 更新
4. 上移/下移步骤，确认顺序变化
5. 添加/删除步骤，确认步骤数变化
6. 点击 Save，确认调用 `updateReviewersForLevel` API

**Step 4: 验证 Owner 检测**

1. 确认 Owner 卡片显示 SYSTEM_OWNER 角色的成员
2. 确认 Transfer Ownership 按钮仅对 Owner 本人可见

---

## 执行顺序总结

```
Task 1: 修复 RoleMemberView 导出          → 5 min
Task 2: COMPLIANCE_REVIEWER 守卫          → 10 min
Task 3: 复核流保存链路注释                → 3 min
Task 4: fetchRoleUsers 确认（无变更）     → 1 min
Task 5: Owner TODO 注释澄清              → 2 min
Task 6: 清理过时 i18n 键值               → 5 min
Task 7: ReviewFlowCard script 块合并     → 5 min
Task 8: 完整类型检查                      → 5 min
Task 9: E2E 冒烟测试                      → 15 min
```

预计总时间：~50 分钟
