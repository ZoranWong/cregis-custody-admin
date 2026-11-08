# Cold Wallet Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign cold wallet pages — add Type column + batch operations to list page, remove 3-step workflow from detail page, keep current Element Plus styling.

**Architecture:** Incremental refactor of 2 Vue pages + types + mock data layer. Each phase builds on the previous: types first, then list page changes, then detail page cleanup.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Element Plus, Vue i18n

---

### Task 1: Add `type` field to types and seed data

**Files:**

- Modify: `src/features/ops/coldStorage/types.ts:1-20`
- Modify: `src/features/ops/coldStorage/mock.ts:53-193` (seed data)

**Step 1: Add type to types.ts**

Add after line 19 (after `ColdStorageTransferStatus` type):

```typescript
/** 冷钱包任务类型：transfer=转账，config=配置更新 */
export type ColdTaskType = 'transfer' | 'config'
```

**Step 2: Add `type` field to `ColdStorageTransferView` interface**

In `types.ts`, inside `ColdStorageTransferView` (around line 36), add after `merchantCode`:

```typescript
/** 任务类型：transfer 有金额转账，config 无金额配置更新 */
type: ColdTaskType
```

**Step 3: Update seed data in mock.ts**

For each entry in `seed` array, add the `type` field:

- REQ-2024-0847 (BTC transfer): `type: 'transfer'`
- REQ-2024-0846 (USDT transfer): `type: 'transfer'`
- REQ-2024-0845 (ETH, has amount): `type: 'transfer'`
- REQ-2024-0844 (SOL transfer): `type: 'transfer'`
- REQ-2024-0843 (USDC, but is Config in prototype): `type: 'config'`
- REQ-2024-0842 (ETH transfer): `type: 'transfer'`
- REQ-2024-0841 (TRX transfer): `type: 'transfer'`

**Step 4: Run TypeScript check**

Run: `npx vue-tsc --noEmit` Expected: No new errors related to coldStorage types.

**Step 5: Commit**

```bash
git add src/features/ops/coldStorage/types.ts src/features/ops/coldStorage/mock.ts
git commit -m "feat(cold-storage): add ColdTaskType field to types and seed data"
```

---

### Task 2: Add i18n keys for new features

**Files:**

- Modify: `src/locales/langs/en.json` (coldStorage section)
- Modify: `src/locales/langs/zh.json` (coldStorage section)

**Step 1: Add new keys to en.json**

In the `coldStorage` object, add:

```json
"type": "Type",
"type.transfer": "Transfer",
"type.config": "Config",
"allTypes": "All Types",
"exportBatch": "Export Batch",
"importSigned": "Import Signed File",
"batchExported": "Batch {batchId} exported",
"batchImported": "Batch {batchId} verified",
"batchExportMeta": "{count} transactions · SHA-256 {checksum}… · Ready for airgapped signing",
"batchImportMeta": "{count} signed transactions · Checksum verified · Broadcasting to network",
"batchEmpty": "No pending requests to export",
"importFileHint": "Select the signed batch file from the airgapped system"
```

Also add to the `status` object (keep existing entries, these are unchanged):

- `"pending": "Pending Signature"`
- `"signed": "Signed"`
- `"broadcast": "Broadcast"`
- `"confirmed": "Confirmed"`
- `"failed": "Failed"`
- `"aborted": "Aborted"`

**Step 2: Add corresponding Chinese keys to zh.json**

Read zh.json coldStorage section first, then add matching translations.

**Step 3: Commit**

```bash
git add src/locales/langs/en.json src/locales/langs/zh.json
git commit -m "feat(cold-storage): add i18n keys for type column and batch operations"
```

---

### Task 3: Add batch operation functions to mock.ts

**Files:**

- Modify: `src/features/ops/coldStorage/mock.ts` (append after line 379)
- Test: Manual browser testing after Task 4

**Step 1: Add batch export function**

Append to mock.ts:

```typescript
/** SHA-256 hash of input text */
async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 批量取件导出（对应 POST /cold/task/flush） */
export async function flushColdTasks(
  merchantCode?: string
): Promise<{ batchId: string; count: number; checksum: string } | null> {
  const pending = records.filter(
    (r) => r.status === 'pending' && (!merchantCode || r.merchantCode === merchantCode)
  )
  if (!pending.length) return null

  const batchId = `BATCH-${new Date().toISOString().slice(0, 10)}-${String(
    records.length + 1
  ).padStart(4, '0')}`
  const transactions = pending.map((r) => ({
    requestId: r.requestId,
    merchant: r.merchantName,
    type: r.type,
    amount: r.amount,
    coinId: r.coinId,
    decimals: r.decimals,
    network: r.network,
    sourceAddress: r.sourceAddress,
    destinationAddress: r.destinationAddress
  }))

  const checksum = await sha256Hex(JSON.stringify(transactions))

  // 标记为已导出
  pending.forEach((r) => {
    r.exportedFile = { name: `${batchId}-instruction.json`, exportedAt: new Date().toISOString() }
    r.status = 'signed'
    r.currentStep = 'import'
  })
  persist()

  return { batchId, count: pending.length, checksum }
}

/** 批量导入回执（对应 POST /cold/task/receipt） */
export async function receiptColdTasks(
  fileContent: string
): Promise<{ batchId: string; count: number } | null> {
  let batch: unknown
  try {
    batch = JSON.parse(fileContent)
  } catch {
    throw new Error('INVALID_JSON')
  }

  const b = batch as Record<string, unknown>
  if (
    !b ||
    typeof b !== 'object' ||
    !Array.isArray(b.transactions) ||
    typeof b.batchId !== 'string'
  ) {
    throw new Error('INVALID_FORMAT')
  }

  const batchId = b.batchId as string
  const txs = b.transactions as Array<{ requestId: string }>
  const ids = new Set(txs.map((t) => t.requestId))

  // 校验 checksum 如果存在
  if (typeof b.manifest === 'object' && b.manifest !== null) {
    const manifest = b.manifest as Record<string, unknown>
    if (typeof manifest.checksum === 'string' && manifest.checksum.startsWith('sha256:')) {
      const expected = manifest.checksum.slice(7)
      const actual = await sha256Hex(JSON.stringify(txs))
      if (expected !== actual) throw new Error('CHECKSUM_MISMATCH')
    }
  }

  let updated = 0
  records.forEach((r) => {
    if (r.status === 'signed' && ids.has(r.requestId)) {
      r.importedFile = { name: `${batchId}-signed.json`, importedAt: new Date().toISOString() }
      r.status = 'broadcast'
      r.currentStep = 'broadcast'
      updated++
    }
  })
  persist()

  return { batchId, count: updated }
}
```

**Step 2: Commit**

```bash
git add src/features/ops/coldStorage/mock.ts
git commit -m "feat(cold-storage): add flush/receipt batch operation functions"
```

---

### Task 4: Update list page — Type column + batch actions

**Files:**

- Modify: `src/views/operations/cold-storage/index.vue` (full rewrite of template + script)

**Step 1: Update template — add Type column, remove Destination column**

Replace the table section (columns). Changes:

- Add Type column between Merchant and Amount
- Remove Destination column
- Keep: Request ID, Merchant, Amount, Time, Status

Type column template:

```vue
<el-table-column :label="$t('coldStorage.type')" min-width="110">
  <template #default="{ row }">
    <ArtStatusTag
      :status="row.type === 'transfer' ? 'info' : 'done'"
      :text="$t(`coldStorage.type.${row.type}`)"
    />
  </template>
</el-table-column>
```

**Step 2: Add batch action bar above table**

Insert between filter bar and table:

```vue
<!-- Batch Actions -->
<div class="flex flex-wrap items-center gap-3 mb-4">
  <ElButton
    type="primary"
    :disabled="pendingRecords.length === 0"
    :loading="acting"
    @click="handleExportBatch"
  >
    <ArtSvgIcon icon="ri:download-2-line" class="text-icon-sm" />
    {{ $t('coldStorage.exportBatch') }} ({{ pendingRecords.length }})
  </ElButton>
  <ElButton :loading="acting" @click="pickBatchFile">
    <ArtSvgIcon icon="ri:upload-2-line" class="text-icon-sm" />
    {{ $t('coldStorage.importSigned') }}
  </ElButton>
  <input
    ref="batchFileInputRef"
    type="file"
    accept="application/json,.json"
    class="hidden"
    @change="onBatchFileSelected"
  />
</div>

<!-- Batch Result Cards -->
<div
  v-if="batchResult"
  class="art-card p-4 mb-4"
  :class="batchResultClass"
>
  <div class="text-sm font-semibold text-g-900">{{ batchResult.title }}</div>
  <div class="text-xs text-tone-muted-text mt-1">{{ batchResult.meta }}</div>
</div>
```

**Step 3: Update script — add batch state and handlers**

Add to script section (after existing refs):

```typescript
import { flushColdTasks, receiptColdTasks } from '@/features/ops/coldStorage/mock'

// New state
const acting = ref(false)
const batchFileInputRef = ref<HTMLInputElement | null>(null)
const pendingRecords = ref<ColdStorageTransferView[]>([])
const batchResult = ref<{
  title: string
  meta: string
  type: 'exported' | 'imported' | 'error'
} | null>(null)

// Computed for batch result card class
const batchResultClass = computed(() => {
  if (!batchResult.value) return ''
  const map = {
    exported: 'border-l-4 border-l-[var(--tone-progress-mark)] bg-tone-progress-bg',
    imported: 'border-l-4 border-l-[var(--tone-done-mark)] bg-tone-done-bg',
    error: 'border-l-4 border-l-[var(--tone-error-mark)] bg-tone-error-bg'
  }
  return map[batchResult.value.type] || ''
})

// Batch export handler
async function handleExportBatch(): Promise<void> {
  if (!pendingRecords.value.length) return
  acting.value = true
  try {
    const result = await flushColdTasks()
    if (result) {
      batchResult.value = {
        title: $t('coldStorage.batchExported', { batchId: result.batchId }),
        meta: $t('coldStorage.batchExportMeta', {
          count: result.count,
          checksum: result.checksum.slice(0, 16)
        }),
        type: 'exported'
      }
      await reload()
    }
  } finally {
    acting.value = false
  }
}

// Batch file handlers
function pickBatchFile(): void {
  batchFileInputRef.value?.click()
}

async function onBatchFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  acting.value = true
  try {
    const raw = await file.text()
    const result = await receiptColdTasks(raw)
    if (result) {
      batchResult.value = {
        title: $t('coldStorage.batchImported', { batchId: result.batchId }),
        meta: $t('coldStorage.batchImportMeta', { count: result.count }),
        type: 'imported'
      }
      await reload()
    }
  } catch (err) {
    batchResult.value = {
      title: 'Import failed',
      meta: err instanceof Error ? err.message : 'Unknown error',
      type: 'error'
    }
  } finally {
    acting.value = false
  }
}
```

**Step 4: Update `onMounted` to populate `pendingRecords`**

In the existing `onMounted`, after loading the list, filter pending records:

```typescript
onMounted(async () => {
  void countPendingTransfers().then((count) => {
    pendingCount.value = count
  })
  await loadList()
  // Populate pending records for batch operations
  pendingRecords.value = records.value.filter((r) => r.status === 'pending')
})
```

**Step 5: Clear batch result on filter change**

In `reload()` function, add:

```typescript
function reload(): void {
  pagination.page = 1
  batchResult.value = null
  void loadList().then(() => {
    pendingRecords.value = records.value.filter((r) => r.status === 'pending')
  })
}
```

**Step 6: Run TypeScript check**

Run: `npx vue-tsc --noEmit` Expected: No errors.

**Step 7: Commit**

```bash
git add src/views/operations/cold-storage/index.vue
git commit -m "feat(cold-storage): add Type column + batch export/import to list page"
```

---

### Task 5: Update detail page — remove workflow, keep essentials

**Files:**

- Modify: `src/views/operations/cold-storage/detail.vue` (template + script)

**Step 1: Remove Processing Workflow section from template**

Delete lines 128-250 (the entire `<!-- Processing Workflow -->` section through the Aborted banner).

**Step 2: Remove Abort Dialog from template**

Delete lines 268-283 (the `<!-- Abort Dialog -->` section).

**Step 3: Clean up script — remove workflow-related imports and functions**

Remove from imports:

- `buildInstructionFile`
- `exportColdStorageInstruction`
- `parseSignedTxFile`
- `importColdStorageSignedTx`
- `abortColdStorageTransfer`
- `ColdStorageImportError`

Remove from types import:

- `ColdStorageWorkflowStep`

Remove state variables:

- `acting` ref (if still present after removing workflow)
- `abortDialogVisible`
- `abortReasonInput`
- `abortStep`
- `abortNote`
- `importError`
- `fileInputRef`

Remove functions:

- `canAct()`
- `stepClass()`
- `stepIndex()`
- `downloadInstruction()`
- `handleExport()`
- `redownloadInstruction()`
- `pickSignedFile()`
- `onSignedFileSelected()`
- `describeImportError()`
- `openAbortDialog()`
- `confirmAbort()`

Remove from template references:

- `v-if="transfer.exportedFile"` and related export UI in workflow
- `v-if="canAct('export')"` buttons
- `v-if="abortNote?.step === 'export'"` text
- `v-if="transfer.importedFile"` and related import UI in workflow
- `v-if="canAct('import')"` buttons
- `v-if="importError"` text
- `v-if="abortNote?.step === 'import'"` text
- `v-if="transfer.txHash"` broadcast section

**Step 4: Keep — Request Header, Request Details, Approval Status**

These three sections stay exactly as they are. Only the workflow and abort dialog are removed.

**Step 5: Run TypeScript check**

Run: `npx vue-tsc --noEmit` Expected: No errors.

**Step 6: Commit**

```bash
git add src/views/operations/cold-storage/detail.vue
git commit -m "feat(cold-storage): remove 3-step workflow from detail page"
```

---

### Task 6: Verification and cleanup

**Files:**

- All modified files

**Step 1: Run full type check**

Run: `npx vue-tsc --noEmit` Expected: 0 errors.

**Step 2: Run lint**

Run: `pnpm lint` Expected: No lint errors.

**Step 3: Start dev server and verify**

Run: `pnpm dev`

- Navigate to Operations → Cold Storage Transfers
- Verify list page shows: Type column, batch action buttons, pending count badge
- Click on a row to open detail page
- Verify detail page shows: Request Header, Request Details, Approval Status (no workflow)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore(cold-storage): final cleanup and verification"
```
