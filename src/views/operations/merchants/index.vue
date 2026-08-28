<!-- Merchant List — 商户列表 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('merchantList.pageTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('merchantList.pageSubtitle') }}</p>
      </div>
      <!-- <el-button type="primary">
        <ArtSvgIcon icon="ri:add-line" class="mr-1" />{{ $t('merchantList.addMerchant') }}
      </el-button> -->
    </div>

    <!-- ═══ Filter Bar ═══ -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-select
        v-model="filters.status"
        :placeholder="$t('merchantList.status')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option label="All Status" value="" />
        <el-option label="Onboarded" value="ACTIVE" />
        <el-option label="Pending" value="PENDING" />
        <el-option label="Frozen" value="FROZEN" />
        <el-option label="Offboarded" value="INACTIVE" />
      </el-select>
      <el-select
        v-model="filters.screening"
        :placeholder="$t('merchantList.screening')"
        clearable
        class="!w-40"
        @change="handleFilterChange"
      >
        <el-option label="All Screening" value="" />
        <el-option label="Clear" value="clear" />
        <el-option label="Hits" value="hits" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        :placeholder="$t('merchantList.searchPlaceholder')"
        clearable
        class="flex-1 !min-w-[200px]"
        @clear="handleFilterChange"
        @keyup.enter="handleFilterChange"
      >
        <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
      </el-input>
      <div class="flex items-center gap-2 text-xs text-g-500">
        <span>{{ $t('merchantList.sort') }}:</span>
        <el-select v-model="filters.sort" class="!w-40" size="small" @change="handleFilterChange">
          <el-option :label="$t('merchantList.sortNameAZ')" value="name_asc" />
          <el-option :label="$t('merchantList.sortRecent')" value="recent" />
        </el-select>
      </div>
    </div>

    <!-- ═══ Batch Action Bar ═══ -->
    <div
      v-if="selectedRows.length > 0"
      class="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg bg-[var(--el-color-primary-light-9)] border border-[var(--el-color-primary-light-5)]"
    >
      <span class="text-xs font-medium text-[var(--el-color-primary)]">
        {{ selectedRows.length }} {{ $t('merchantList.selected') }}
      </span>
      <div class="flex gap-2 ml-auto">
        <el-button size="small" type="primary">{{ $t('merchantList.sendNotice') }}</el-button>
        <el-button size="small" @click="selectedRows = []">{{
          $t('merchantList.deselect')
        }}</el-button>
      </div>
    </div>

    <!-- ═══ Table ═══ -->
    <div class="art-card overflow-hidden">
      <template v-if="loading">
        <el-skeleton :rows="8" animated class="p-5" />
      </template>
      <template v-else>
        <el-table
          :data="merchants"
          highlight-current-row
          style="cursor: pointer"
          @row-click="openDetail"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="40" @click.stop />
          <el-table-column :label="$t('merchantList.name')" min-width="180">
            <template #default="{ row }">
              <strong class="text-g-900">{{ row.merchantName }}</strong>
            </template>
          </el-table-column>
          <el-table-column :label="$t('merchantList.type')" min-width="160">
            <template #default="{ row }">{{ row.entityType || '-' }}</template>
          </el-table-column>
          <el-table-column :label="$t('merchantList.status')" min-width="120">
            <template #default="{ row }">
              <span class="status-badge" :class="statusClass(row.status)">
                {{ statusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('merchantList.screening')" min-width="120">
            <template #default="{ row }">
              <span class="screening-badge" :class="screeningClass(row as MerchantRecord)">
                {{ screeningLabel(row as MerchantRecord) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div
          class="flex items-center justify-between px-4 py-3 border-t border-[var(--default-border)]"
        >
          <span class="text-xs text-g-500">
            {{ pagination.total }} {{ $t('merchantList.totalRecords') }}
          </span>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            background
            layout="prev, pager, next, sizes"
            @current-change="loadMerchants"
            @size-change="handleSizeChange"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchMerchantList } from '@/api/merchant'
  import type { MerchantRecord } from '@/api/merchant'

  defineOptions({ name: 'MerchantList' })
  const router = useRouter()

  const loading = ref(false)
  const merchants = ref<MerchantRecord[]>([])
  const selectedRows = ref<MerchantRecord[]>([])

  const filters = reactive({
    status: '',
    screening: '',
    keyword: '',
    sort: 'name_asc'
  })

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  async function loadMerchants() {
    loading.value = true
    try {
      const response = await fetchMerchantList({
        pageNum: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        keyword: filters.keyword || undefined
      })
      merchants.value = response.records
      pagination.total = response.total
    } catch (error) {
      console.error('Failed to load merchants:', error)
      merchants.value = []
    } finally {
      loading.value = false
    }
  }

  function handleFilterChange() {
    pagination.page = 1
    loadMerchants()
  }

  function handleSizeChange() {
    pagination.page = 1
    loadMerchants()
  }

  function handleSelectionChange(rows: MerchantRecord[]) {
    selectedRows.value = rows
  }

  function openDetail(row: MerchantRecord) {
    router.push({ name: 'merchant-detail', params: { merchantId: row.id } })
  }

  function statusClass(status: string): string {
    const s = status?.toUpperCase()
    if (s === 'ACTIVE') return 'onboarded'
    if (s === 'PENDING') return 'pending'
    if (s === 'FROZEN') return 'frozen'
    if (s === 'INACTIVE') return 'offboarded'
    return ''
  }

  function statusLabel(status: string): string {
    const s = status?.toUpperCase()
    if (s === 'ACTIVE') return 'Onboarded'
    if (s === 'PENDING') return 'Pending'
    if (s === 'FROZEN') return 'Frozen'
    if (s === 'INACTIVE') return 'Offboarded'
    return status || '-'
  }

  function screeningClass(row: MerchantRecord): string {
    // Mock screening status - in real implementation, this would come from API
    const hasHits =
      row.merchantName?.toLowerCase().includes('node') ||
      row.merchantName?.toLowerCase().includes('block')
    return hasHits ? 'hits' : 'clear'
  }

  function screeningLabel(row: MerchantRecord): string {
    const hasHits =
      row.merchantName?.toLowerCase().includes('node') ||
      row.merchantName?.toLowerCase().includes('block')
    if (hasHits) {
      const hits = Math.floor(Math.random() * 3) + 1
      return hits === 1 ? '1 Hit' : `${hits} Hits`
    }
    return 'CLEAR'
  }

  onMounted(() => {
    loadMerchants()
  })
</script>

<style scoped>
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .status-badge.onboarded {
    background: var(--el-color-success-light-8);
    color: var(--el-color-success);
  }
  .status-badge.pending {
    background: var(--el-color-warning-light-8);
    color: var(--el-color-warning-dark-2);
  }
  .status-badge.frozen {
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }
  .status-badge.offboarded {
    background: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
  }

  .screening-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
  }
  .screening-badge.clear {
    background: var(--el-color-success-light-8);
    color: var(--el-color-success);
  }
  .screening-badge.hits {
    background: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
  }
</style>
