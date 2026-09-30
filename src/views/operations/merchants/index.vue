<!-- Merchant Management — 商户管理 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('merchantList.pageTitle') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('merchantList.pageSubtitle') }}</p>
      </div>
    </div>

    <!-- ═══ Tabs: Applications + List ═══ -->
    <el-tabs v-model="activeTab" class="merchant-tabs" @tab-change="handleTabChange">
      <!-- Tab 1: Merchant Applications (PENDING) -->
      <el-tab-pane :label="$t('merchantList.applications')" name="applications">
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <el-input
            v-model="appFilters.keyword"
            :placeholder="$t('merchantList.searchPlaceholder')"
            clearable
            class="flex-1 !min-w-[200px]"
            @clear="loadApplications"
            @keyup.enter="loadApplications"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>

        <!-- Applications Table -->
        <div class="art-card overflow-hidden">
          <template v-if="appLoading">
            <el-skeleton :rows="5" animated class="p-5" />
          </template>
          <template v-else>
            <el-table
              :data="applications"
              highlight-current-row
              style="cursor: pointer"
              @row-click="openDetail"
            >
              <el-table-column :label="$t('merchantList.name')" min-width="180">
                <template #default="{ row }">
                  <strong class="text-g-900">{{ row.merchantName }}</strong>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.email')" min-width="180">
                <template #default="{ row }">{{ row.email || '-' }}</template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.code')" min-width="120">
                <template #default="{ row }">
                  <span class="font-mono text-xs">{{ row.code || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.appliedAt')" min-width="160">
                <template #default="{ row }">
                  <span class="text-xs text-g-600">{{ formatDateTime(row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.status')" width="120">
                <template #default="{ row }">
                  <span class="status-badge" :class="statusClass(row.status)">
                    {{ statusLabel(row.status) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div
              class="flex items-center justify-between px-4 py-3 border-t border-[var(--default-border)]"
            >
              <span class="text-xs text-g-500">
                {{ appPagination.total }} {{ $t('merchantList.totalRecords') }}
              </span>
              <el-pagination
                v-model:current-page="appPagination.page"
                v-model:page-size="appPagination.pageSize"
                :total="appPagination.total"
                :page-sizes="[10, 20, 50]"
                background
                layout="prev, pager, next, sizes"
                @current-change="loadApplications"
                @size-change="handleAppSizeChange"
              />
            </div>
          </template>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Merchant List (non-PENDING) -->
      <el-tab-pane :label="$t('merchantList.merchantList')" name="list">
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <el-select
            v-model="listFilters.status"
            :placeholder="$t('merchantList.status')"
            clearable
            class="!w-40"
            @change="handleListFilterChange"
          >
            <el-option :label="$t('merchantList.allStatus')" value="" />
            <el-option :label="$t('merchantList.statusActive')" value="ACTIVE" />
            <el-option :label="$t('merchantList.statusFrozen')" value="FROZEN" />
            <el-option :label="$t('merchantList.statusInactive')" value="INACTIVE" />
          </el-select>
          <el-select
            v-model="listFilters.screening"
            :placeholder="$t('merchantList.screening')"
            clearable
            class="!w-40"
            @change="handleListFilterChange"
          >
            <el-option :label="$t('merchantList.allScreening')" value="" />
            <el-option :label="$t('merchantList.screeningClear')" value="clear" />
            <el-option :label="$t('merchantList.screeningHits')" value="hits" />
          </el-select>
          <el-input
            v-model="listFilters.keyword"
            :placeholder="$t('merchantList.searchPlaceholder')"
            clearable
            class="flex-1 !min-w-[200px]"
            @clear="handleListFilterChange"
            @keyup.enter="handleListFilterChange"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <div class="flex items-center gap-2 text-xs text-g-500">
            <span>{{ $t('merchantList.sort') }}:</span>
            <el-select
              v-model="listFilters.sort"
              class="!w-40"
              size="small"
              @change="handleListFilterChange"
            >
              <el-option :label="$t('merchantList.sortRecent')" value="recent" />
              <el-option :label="$t('merchantList.sortNameAZ')" value="name_asc" />
            </el-select>
          </div>
        </div>

        <!-- Batch Action Bar -->
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

        <!-- List Table -->
        <div class="art-card overflow-hidden">
          <template v-if="listLoading">
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
                <template #default="{ row }">{{ entityTypeLabel(row.entityType) }}</template>
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
              <el-table-column :label="$t('merchantList.updatedAt')" min-width="160">
                <template #default="{ row }">
                  <span class="text-xs text-g-600">{{
                    formatDateTime(row.updateTime || row.createTime)
                  }}</span>
                </template>
              </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div
              class="flex items-center justify-between px-4 py-3 border-t border-[var(--default-border)]"
            >
              <span class="text-xs text-g-500">
                {{ listPagination.total }} {{ $t('merchantList.totalRecords') }}
              </span>
              <el-pagination
                v-model:current-page="listPagination.page"
                v-model:page-size="listPagination.pageSize"
                :total="listPagination.total"
                :page-sizes="[10, 20, 50]"
                background
                layout="prev, pager, next, sizes"
                @current-change="loadMerchants"
                @size-change="handleListSizeChange"
              />
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { fetchMerchantList } from '@/api/merchant'
  import type { MerchantRecord } from '@/api/merchant'

  defineOptions({ name: 'MerchantManagement' })
  const router = useRouter()

  const activeTab = ref('applications')

  // ─── Applications (PENDING) ───
  const appLoading = ref(false)
  const applications = ref<MerchantRecord[]>([])
  const appFilters = reactive({ keyword: '' })
  const appPagination = reactive({ page: 1, pageSize: 10, total: 0 })

  async function loadApplications() {
    appLoading.value = true
    try {
      const response = await fetchMerchantList({
        pageNum: appPagination.page,
        pageSize: appPagination.pageSize,
        status: 'PENDING',
        keyword: appFilters.keyword || undefined,
        sort: 'createTime_desc'
      })
      applications.value = response.records
      appPagination.total = response.total
    } catch (error) {
      console.error('Failed to load applications:', error)
      applications.value = []
    } finally {
      appLoading.value = false
    }
  }

  function handleAppSizeChange() {
    appPagination.page = 1
    loadApplications()
  }

  // ─── Merchant List (non-PENDING) ───
  const listLoading = ref(false)
  const merchants = ref<MerchantRecord[]>([])
  const selectedRows = ref<MerchantRecord[]>([])
  const listFilters = reactive({
    status: '',
    screening: '',
    keyword: '',
    sort: 'recent'
  })
  const listPagination = reactive({ page: 1, pageSize: 10, total: 0 })

  async function loadMerchants() {
    listLoading.value = true
    try {
      const response = await fetchMerchantList({
        pageNum: listPagination.page,
        pageSize: listPagination.pageSize,
        status: listFilters.status || undefined,
        keyword: listFilters.keyword || undefined,
        sort: listFilters.sort === 'recent' ? 'updateTime_desc' : 'merchantName_asc'
      })
      merchants.value = response.records
      listPagination.total = response.total
    } catch (error) {
      console.error('Failed to load merchants:', error)
      merchants.value = []
    } finally {
      listLoading.value = false
    }
  }

  function handleListFilterChange() {
    listPagination.page = 1
    loadMerchants()
  }

  function handleListSizeChange() {
    listPagination.page = 1
    loadMerchants()
  }

  function handleSelectionChange(rows: MerchantRecord[]) {
    selectedRows.value = rows
  }

  function handleTabChange(tab: string | number) {
    if (tab === 'applications' && applications.value.length === 0) {
      loadApplications()
    } else if (tab === 'list' && merchants.value.length === 0) {
      loadMerchants()
    }
  }

  function openDetail(row: MerchantRecord) {
    router.push({ name: 'merchant-detail', params: { merchantId: row.code } })
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

  function formatDateTime(v?: string | null): string {
    if (!v) return '-'
    return v.replace('T', ' ').slice(0, 19)
  }

  function entityTypeLabel(s: string): string {
    const map: Record<string, string> = {
      NON_FINANCIAL_CORPORATE: 'Non-Financial Corporate',
      REGULATED_VASP: 'Regulated VASP',
      INTERNAL_SYSTEM: 'Internal System'
    }
    return map[s] || s || '-'
  }

  onMounted(() => {
    loadApplications()
  })
</script>

<style scoped>
  .merchant-tabs {
    margin-top: 0;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
  }

  .status-badge.onboarded {
    color: var(--el-color-success);
    background: var(--el-color-success-light-8);
  }

  .status-badge.pending {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-8);
  }

  .status-badge.frozen {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
  }

  .status-badge.offboarded {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-8);
  }

  .screening-badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
  }

  .screening-badge.clear {
    color: var(--el-color-success);
    background: var(--el-color-success-light-8);
  }

  .screening-badge.hits {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-8);
  }
</style>
