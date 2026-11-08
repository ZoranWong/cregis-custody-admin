# Cold Wallet Page Redesign

> 日期: 2026-11-06状态: 已确认范围: `src/views/operations/cold-storage/index.vue` + `detail.vue` 原型参考: `cregis-custody-new/docs/prototype/.../pages-v2/ops-cold-storage.html`

---

## 1. 目标

根据更新后的 API 文档和原型页面，重新设计冷钱包页面。原则：**功能按照原型，样式保持当前设计风格**（Element Plus 组件、`--tone-*` 颜色体系、8px 圆角）。

## 2. 变更总览

| 文件 | 变更 |
| --- | --- |
| `src/views/operations/cold-storage/index.vue` | 加 Type 列 + 批量操作栏，保留筛选/状态列 |
| `src/views/operations/cold-storage/detail.vue` | 去掉 3 步工作流，保留 Request Details + Approval Status |
| `src/features/ops/coldStorage/types.ts` | 新增 `type` 字段 |
| `src/features/ops/coldStorage/mock.ts` | 对接新 API（flush/receipt） |

## 3. 列表页设计

### 3.1 页面结构

```
[Page Header]  Cold Storage Transfers  [N pending]
               Process cold storage transfer requests...

[Filter Bar]   状态筛选 | 资产筛选 | 关键词搜索

[Batch Actions]
  [Export Batch (N)]  [Import Signed File]  [hidden file input]

[Batch Result Card]  (导出/导入后显示，用当前 info/warning/success 语义色卡片)

[Table]
  列: Request ID | Merchant | Type | Amount | Time | Status

[Pagination]  (保持现有)
```

### 3.2 列定义

| 列名       | 内容                         | 样式                         |
| ---------- | ---------------------------- | ---------------------------- |
| Request ID | `requestId` (monospace 小字) | 现有样式                     |
| Merchant   | 头像 + `merchantName`        | 现有 merchant-avatar 样式    |
| **Type**   | **Transfer** / **Config**    | **ArtStatusTag (info/done)** |
| Amount     | 格式化金额 + 资产符号        | 现有样式                     |
| **Time**   | **相对时间**                 | **现有 formatRelativeTime**  |
| Status     | ArtStatusTag                 | 现有样式                     |

### 3.3 删除的列

- **Destination** — 原型没有，详情可看

### 3.4 新增：批量操作

- **Export Batch**: 收集 pending 行 → 调 `/cold/task/flush` → 下载 bundle → 显示结果卡片
- **Import Signed File**: 文件选择器 → 调 `/cold/task/receipt` → 更新状态 → 显示结果卡片

### 3.5 保留的筛选栏

- 状态筛选 (status select)
- 资产筛选 (coinId select)
- 关键词搜索 (keyword input)

## 4. 详情页设计

### 4.1 页面结构

```
[Breadcrumb] Cold Storage Transfers › {requestId}

[Request Header Card]
  {requestId}  [StatusTag]
  {merchantName} · {amount} {coinId} · Requested {time}

[Request Details Card]  (2列grid)
  Merchant | Amount
  Source Wallet | Destination Address
  Requested At | Network

[Approval Status Card]
  "Threshold: N of M signatures required"
  Approver 列表: 头像 + 名称 + 邮箱 + Key · Approved/Pending
```

### 4.2 删除的内容

- ❌ Processing Workflow 3步工作流（Export / Import / Broadcast）
- ❌ Abort Dialog
- ❌ 所有 workflow 相关 state 和函数 (`canAct`, `stepClass`, `stepIndex`, `handleExport`, `onSignedFileSelected`, etc.)

### 4.3 保留的内容

- Request Header (requestId + status + meta)
- Request Details (2 列 grid)
- Approval Status (threshold + approvers)

## 5. API 映射

| 功能       | 旧 (mock)                        | 新 API                                     |
| ---------- | -------------------------------- | ------------------------------------------ |
| 列表分页   | `queryColdStorageTransfers()`    | `GET /cold/task/page/tasks`                |
| 任务详情   | `fetchColdStorageTransfer()`     | `POST /cold/task/transfer/detail/{taskId}` |
| 审批人列表 | 内嵌在 transfer 对象             | `GET /cold/task/getSubTaskUsersByTaskId`   |
| 取件导出   | `exportColdStorageInstruction()` | `POST /cold/task/flush`                    |
| 回执导入   | `importColdStorageSignedTx()`    | `POST /cold/task/receipt`                  |
| 批次重试   | `abortColdStorageTransfer()`     | `POST /cold/task/batches/{bundleId}/retry` |
| 操作历史   | 无                               | `GET /cold/task/operations/his` (后续扩展) |

## 6. 类型变更

```typescript
// 新增
export type ColdTaskType = 'transfer' | 'config'

// ColdStorageTransferView 增加
type: ColdTaskType
```

## 7. 样式约束

- 所有组件保持当前 Element Plus 风格
- 颜色使用 `--tone-*` 体系
- 卡片圆角 8px（不采用原型的 12px）
- 字体使用现有系统字体栈
- 状态标签统一 `ArtStatusTag`
