<!-- Cold Storage Transfers — 冷存储转账请求列表 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-hero font-semibold text-g-900">{{ $t('coldStorage.pageTitle') }}</h1>
          <span
            v-if="pendingCount > 0"
            class="inline-flex items-center rounded-full px-2 py-0.5 text-label font-semibold bg-tone-progress-bg text-tone-progress-text"
          >
            {{ $t('coldStorage.pendingCount', { count: pendingCount }) }}
          </span>
        </div>
        <p class="text-sm text-g-700 mt-1">{{ $t('coldStorage.pageSubtitle') }}</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-select
        v-model="filters.status"
        :placeholder="$t('coldStorage.allStatus')"
        clearable
        class="!w-44"
        @change="reload"
      >
        <el-option :label="$t('coldStorage.allStatus')" value="" />
        <el-option
          v-for="s in STATUS_OPTIONS"
          :key="s"
          :label="$t(`coldStorage.status.${s}`)"
          :value="s"
        />
      </el-select>
      <el-select
        v-model="filters.coinId"
        :placeholder="$t('coldStorage.allAssets')"
        clearable
        class="!w-36"
        @change="reload"
      >
        <el-option :label="$t('coldStorage.allAssets')" value="" />
        <el-option v-for="c in assetOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select
        v-model="filters.type"
        :placeholder="$t('coldStorage.allTypes')"
        clearable
        class="!w-36"
        @change="reload"
      >
        <el-option :label="$t('coldStorage.allTypes')" value="" />
        <el-option :label="$t('coldStorage.typeValues.transfer')" value="transfer" />
        <el-option :label="$t('coldStorage.typeValues.config')" value="config" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        :placeholder="$t('coldStorage.searchPlaceholder')"
        clearable
        class="flex-1 !min-w-[220px]"
        @clear="reload"
        @keyup.enter="reload"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
    </div>

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
    <div v-if="batchResult" class="art-card p-4 mb-4" :class="batchResultClass">
      <div class="text-sm font-semibold text-g-900">{{ batchResult.title }}</div>
      <div class="text-xs text-tone-muted-text mt-1">{{ batchResult.meta }}</div>
    </div>

    <!-- Table -->
    <div class="art-card art-table-card overflow-hidden">
      <template v-if="loading">
        <el-skeleton :rows="8" animated class="p-5" />
      </template>
      <template v-else-if="loadError">
        <div class="p-10 text-center">
          <p class="text-tone-error-text mb-3">{{ loadError }}</p>
          <ElButton type="primary" @click="reload">{{ $t('console.refresh') }}</ElButton>
        </div>
      </template>
      <template v-else>
        <el-table
          :data="records"
          size="small"
          highlight-current-row
          style="cursor: pointer"
          @row-click="openDetail"
        >
          <template #empty>
            <div class="p-10 text-center text-g-500">{{ $t('coldStorage.noRecords') }}</div>
          </template>
          <el-table-column :label="$t('coldStorage.requestId')" min-width="160">
            <template #default="{ row }">
              <span class="font-mono text-xs text-g-700">{{ row.requestId }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('coldStorage.merchant')" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <div class="merchant-avatar">{{ initials(row.merchantName) }}</div>
                <span class="text-sm font-medium text-g-800">{{ row.merchantName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('coldStorage.type')" min-width="110">
            <template #default="{ row }">
              <ArtStatusTag
                :status="row.type === 'config' ? 'success' : 'info'"
                :text="$t(`coldStorage.typeValues.${row.type ?? 'transfer'}`)"
              />
            </template>
          </el-table-column>
          <el-table-column :label="$t('coldStorage.amount')" min-width="150">
            <template #default="{ row }">
              <span class="text-sm font-semibold tabular-nums text-g-900">
                {{ formatCoinBalance(row.amount, row.decimals) }}
                <span class="text-xs font-normal text-tone-muted-text">{{ row.coinId }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('coldStorage.requested')" width="130">
            <template #default="{ row }">
              <span class="text-xs text-tone-muted-text">{{
                formatRelativeTime(row.requestedAt)
              }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('coldStorage.statusLabel')" width="160">
            <template #default="{ row }">
              <ArtStatusTag
                :status="statusTone(row.status)"
                :text="$t(`coldStorage.status.${row.status ?? 'pending'}`)"
              />
            </template>
          </el-table-column>
        </el-table>

        <div
          class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
        >
          <span class="text-xs text-g-500">{{
            $t('common.recordCount', { count: pagination.total })
          }}</span>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            background
            layout="prev,pager,next,sizes"
            @current-change="loadList"
            @size-change="handleSizeChange"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { formatCoinBalance, formatRelativeTime } from '@/utils/format'
  import { fetchColdTaskPage, flushColdTasks, importColdReceipt } from '@/api/coldStorage'
  import type {
    ColdStorageTransferStatus,
    ColdStorageTransferView,
    ColdTaskType
  } from '@/features/ops/coldStorage/types'

  defineOptions({ name: 'ColdStorageTransfers' })

  const router = useRouter()
  const { t } = useI18n()

  const STATUS_OPTIONS: ColdStorageTransferStatus[] = [
    'pending',
    'signed',
    'broadcast',
    'confirmed',
    'failed',
    'aborted'
  ]

  const loading = ref(false)
  const loadError = ref('')
  const records = ref<ColdStorageTransferView[]>([])
  const pendingCount = ref(0)
  const filters = reactive({
    status: '' as ColdStorageTransferStatus | '',
    coinId: '',
    type: '' as ColdTaskType | '',
    keyword: ''
  })
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  // Batch operation state
  const acting = ref(false)
  const batchFileInputRef = ref<HTMLInputElement | null>(null)
  const pendingRecords = ref<ColdStorageTransferView[]>([])
  const batchResult = ref<{
    title: string
    meta: string
    type: 'exported' | 'imported' | 'error'
  } | null>(null)

  const batchResultClass = computed(() => {
    if (!batchResult.value) return ''
    const map = {
      exported: 'border-l-4 border-l-[var(--tone-progress-mark)] bg-tone-progress-bg',
      imported: 'border-l-4 border-l-[var(--tone-done-mark)] bg-tone-done-bg',
      error: 'border-l-4 border-l-[var(--tone-error-mark)] bg-tone-error-bg'
    }
    return map[batchResult.value.type] || ''
  })

  const assetOptions = computed(() => {
    const set = new Set(records.value.map((r) => r.coinId))
    return Array.from(set).sort()
  })

  async function loadList(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const result = await fetchColdTaskPage({
        status: filters.status || undefined,
        coinId: filters.coinId || undefined,
        type: filters.type || undefined,
        keyword: filters.keyword || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      records.value = result.records
      pagination.total = result.total
      // Populate pending records for batch operations
      pendingRecords.value = records.value.filter((r) => r.status === 'pending')
      // Derive pending count from loaded page
      pendingCount.value = records.value.filter((r) => r.status === 'pending').length
    } catch (caught) {
      loadError.value = caught instanceof Error ? caught.message : 'Unable to load transfers.'
    } finally {
      loading.value = false
    }
  }

  function reload(): void {
    pagination.page = 1
    batchResult.value = null
    void loadList()
  }

  function handleSizeChange(): void {
    pagination.page = 1
    void loadList()
  }

  function openDetail(row: ColdStorageTransferView): void {
    router.push({ name: 'cold-storage-detail', params: { requestId: row.requestId } })
  }

  /** 状态 → ArtStatusTag 语义色：pending 待处理、signed 已签名、broadcast 已广播 */
  function statusTone(
    status: ColdStorageTransferStatus
  ): 'success' | 'warning' | 'danger' | 'info' | null {
    if (status === 'confirmed') return 'success'
    if (status === 'pending') return 'warning'
    if (status === 'failed') return 'danger'
    if (status === 'signed' || status === 'broadcast') return 'info'
    return null
  }

  function initials(name: string): string {
    return (name || '')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  // ─── Batch operation handlers ───

  async function handleExportBatch(): Promise<void> {
    acting.value = true
    try {
      const result = await flushColdTasks()
      if (result) {
        batchResult.value = {
          title: t('coldStorage.batchExported', { batchId: result.batchId }),
          meta:
            result.state === 'EMPTY'
              ? t('coldStorage.batchEmpty')
              : `Bundle state: ${result.state} · Ready for airgapped signing`,
          type: result.state === 'EMPTY' ? 'error' : 'exported'
        }
        await loadList()
      } else {
        batchResult.value = {
          title: 'Export returned no result',
          meta: 'The server returned an empty response.',
          type: 'error'
        }
      }
    } catch (err) {
      batchResult.value = {
        title: 'Export failed',
        meta: err instanceof Error ? err.message : 'Unknown error',
        type: 'error'
      }
    } finally {
      acting.value = false
    }
  }

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
      const result = await importColdReceipt({ receipt: raw })
      if (result) {
        batchResult.value = {
          title: result.duplicate
            ? 'Duplicate receipt imported'
            : t('coldStorage.batchImported', { batchId: 'receipt' }),
          meta: result.core2Applied
            ? 'Receipt forwarded to core2 for broadcasting'
            : 'Receipt received (core2 not yet confirmed)',
          type: 'imported'
        }
        await loadList()
      } else {
        batchResult.value = {
          title: 'Import returned no result',
          meta: 'The server returned an empty response.',
          type: 'error'
        }
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

  onMounted(async () => {
    await loadList()
  })
</script>

<style scoped>
  .merchant-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: var(--theme-text, #1f2937);
    border-radius: 8px;
  }
</style>
