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

    <!--
      当前 tab 写进 URL（?tab=list），详情页返回时（router.back）能停在原 tab；
      搜索条件与分页放在 Pinia 里，返回时无需重新输入即可沿用（刷新页面则回到默认）。
    -->
    <el-tabs v-model="activeTab" class="merchant-tabs">
      <!-- Tab 1: Merchant Applications (PENDING) -->
      <el-tab-pane :label="$t('merchantList.applications')" name="applications">
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <!-- v-model 变化时 watch 自动触发查询；el-input 内部已处理 IME，拼音中途不会更新 v-model -->
          <el-input
            v-model="store.applications.merchantName"
            :placeholder="$t('merchantList.searchPlaceholder')"
            clearable
            class="flex-1 !min-w-[200px]"
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
              <template #empty>
                <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
              </template>
              <el-table-column :label="$t('merchantList.name')" min-width="180">
                <template #default="{ row }">
                  <span class="font-medium text-g-800">{{ row.merchantName }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.email')" min-width="180">
                <template #default="{ row }">{{ row.email || '-' }}</template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.code')" min-width="120">
                <template #default="{ row }">
                  <span class="text-xs">{{ row.code || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.appliedAt')" min-width="160">
                <template #default="{ row }">
                  <span class="text-xs text-g-600">{{ formatDateTime(row.createTime) }}</span>
                </template>
              </el-table-column>
              <!-- 申请列表展示 KYB 阶段（kybStatus），不是商户 status -->
              <el-table-column :label="$t('merchantList.status')" width="160">
                <template #default="{ row }">
                  <ArtStatusTag
                    :status="kybStatusTone(row.kybStatus)"
                    :text="kybStatusLabel(row.kybStatus)"
                  />
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
                v-model:current-page="store.applications.page"
                v-model:page-size="store.applications.pageSize"
                :total="appPagination.total"
                :page-sizes="[10, 20, 50]"
                background
                layout="prev, pager, next, sizes"
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
            v-model="store.list.status"
            :placeholder="$t('merchantList.status')"
            clearable
            class="!w-40"
          >
            <el-option :label="$t('merchantList.allStatus')" value="" />
            <!-- 取值与接口 status 字段一致（MerchantStatus） -->
            <el-option
              v-for="option in MERCHANT_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input
            v-model="store.list.merchantName"
            :placeholder="$t('merchantList.searchPlaceholder')"
            clearable
            class="flex-1 !min-w-[200px]"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <div class="flex items-center gap-2 text-xs text-g-500">
            <span>{{ $t('merchantList.sort') }}:</span>
            <el-select v-model="store.list.sort" class="!w-40">
              <el-option :label="$t('merchantList.sortRecent')" value="recent" />
              <el-option :label="$t('merchantList.sortNameAZ')" value="name_asc" />
            </el-select>
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
            >
              <template #empty>
                <div class="p-10 text-center text-g-500">{{ $t('common.noData') }}</div>
              </template>
              <el-table-column :label="$t('merchantList.name')" min-width="180">
                <template #default="{ row }">
                  <span class="font-medium text-g-800">{{ row.merchantName }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.type')" min-width="160">
                <template #default="{ row }">{{ entityTypeLabel(row.entityType) }}</template>
              </el-table-column>
              <!-- 商户列表展示商户 status（非 KYB 阶段） -->
              <el-table-column :label="$t('merchantList.status')" min-width="120">
                <template #default="{ row }">
                  <ArtStatusTag :status="statusTone(row.status)" :text="statusLabel(row.status)" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.screening')" min-width="120">
                <template #default="{ row }">
                  <ArtStatusTag
                    :status="screeningTone(row as MerchantRecord)"
                    :text="screeningLabel(row as MerchantRecord)"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="$t('merchantList.updatedAt')" min-width="160">
                <template #default="{ row }">
                  <span class="text-xs text-g-600">{{ formatDateTime(row.updateTime) }}</span>
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
                v-model:current-page="store.list.page"
                v-model:page-size="store.list.pageSize"
                :total="listPagination.total"
                :page-sizes="[10, 20, 50]"
                background
                layout="prev, pager, next, sizes"
              />
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { fetchMerchantList } from '@/api/merchant'
  import type { MerchantRecord } from '@/api/merchant'
  import { entityTypeLabel } from '@/utils/entityType'
  import { useMerchantListStore, type MerchantListTab } from '@/store/modules/merchantList'
  import { KybStatus, MerchantStatus } from '@/enums/merchantEnum'

  defineOptions({ name: 'MerchantManagement' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const store = useMerchantListStore()

  const TABS: MerchantListTab[] = ['applications', 'list']

  const MERCHANT_STATUS_OPTIONS = computed(() => [
    { value: MerchantStatus.Active, label: t('merchantList.statusActive') },
    { value: MerchantStatus.Frozen, label: t('merchantList.statusFrozen') },
    { value: MerchantStatus.Cancelled, label: t('merchantList.statusCancelled') }
  ])

  // ─── 数据 ───
  const appLoading = ref(false)
  const applications = ref<MerchantRecord[]>([])
  const appPagination = reactive({ total: 0 })

  const listLoading = ref(false)
  const merchants = ref<MerchantRecord[]>([])
  const listPagination = reactive({ total: 0 })

  // ─── URL tab 同步（必须在 watch(activeTab) 之前定义）───
  const activeTab = computed<MerchantListTab>({
    get: () => {
      const tab = typeof route.query.tab === 'string' ? (route.query.tab as MerchantListTab) : null
      return tab && TABS.includes(tab) ? tab : store.activeTab
    },
    set: (tab) => {
      store.activeTab = tab
      const query = { ...route.query }
      if (tab === 'applications') delete query.tab
      else query.tab = tab
      router.replace({ query }).catch(() => {})
    }
  })

  async function loadApplications() {
    appLoading.value = true
    try {
      const response = await fetchMerchantList({
        pageNum: store.applications.page,
        pageSize: store.applications.pageSize,
        status: MerchantStatus.Pending,
        merchantName: store.applications.merchantName || undefined,
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

  async function loadMerchants() {
    listLoading.value = true
    try {
      const response = await fetchMerchantList({
        pageNum: store.list.page,
        pageSize: store.list.pageSize,
        status: MerchantStatus.Pending,
        statusOper: '!=',
        statusSecondary: store.list.status || undefined,
        merchantName: store.list.merchantName || undefined,
        sort: store.list.sort === 'recent' ? 'updateTime_desc' : 'merchantName_asc'
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

  function loadActiveTab() {
    if (activeTab.value === 'applications') void loadApplications()
    else void loadMerchants()
  }

  // ─── watch 驱动搜索：输入即搜（防抖）+ IME 天然支持 ───
  //
  // el-input 的 `v-model` 在中文输入期间（composition）不会触发 update，
  // 只有汉字上屏后才 emit 最终值，因此 watch 天然只在「可搜索的值」变化时触发，
  // 不需要自己处理 compositionstart / compositionend。
  //
  // 防抖逻辑放在 watch 内部：每次值变化重置计时器，300ms 无新输入才发请求。
  function watchWithDebounce(getter: () => unknown, onTrigger: () => void, debounceMs = 300): void {
    let timer: ReturnType<typeof setTimeout> | null = null
    watch(getter, () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        onTrigger()
      }, debounceMs)
    })
  }

  // 搜索字段变化 → 重置页码 + 查询（防抖 300ms）
  watchWithDebounce(
    () => store.applications.merchantName,
    () => {
      store.applications.page = 1
      void loadApplications()
    }
  )
  watchWithDebounce(
    () => store.list.merchantName,
    () => {
      store.list.page = 1
      void loadMerchants()
    }
  )

  // 分页变化（无防抖，立即查询）
  watch(
    () => store.applications.page,
    () => {
      void loadApplications()
    }
  )
  watch(
    () => store.list.page,
    () => {
      void loadMerchants()
    }
  )

  // pageSize 变化 → 重置页码 + 查询
  watch(
    () => store.applications.pageSize,
    () => {
      store.applications.page = 1
      void loadApplications()
    }
  )
  watch(
    () => store.list.pageSize,
    () => {
      store.list.page = 1
      void loadMerchants()
    }
  )

  // 筛选变化（status / sort）→ 重置页码 + 查询
  watch(
    () => store.list.status,
    () => {
      store.list.page = 1
      void loadMerchants()
    }
  )
  watch(
    () => store.list.sort,
    () => {
      store.list.page = 1
      void loadMerchants()
    }
  )

  // 切换 tab 时按需加载
  watch(activeTab, (tab) => {
    if (tab === 'applications' && applications.value.length === 0) void loadApplications()
    if (tab === 'list' && merchants.value.length === 0) void loadMerchants()
  })

  // ─── URL tab 同步 ───

  function openDetail(row: MerchantRecord) {
    // tab 在 URL、条件在 store，详情页返回后原样还原
    router.push({ name: 'merchant-detail', params: { merchantId: row.code } })
  }

  function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | null {
    if (status === MerchantStatus.Active) return 'success'
    if (status === MerchantStatus.Frozen) return 'warning'
    if (status === MerchantStatus.Cancelled) return 'danger'
    return null
  }

  function statusLabel(status: string): string {
    if (status === MerchantStatus.Active) return t('merchantList.statusActive')
    if (status === MerchantStatus.Frozen) return t('merchantList.statusFrozen')
    if (status === MerchantStatus.Cancelled) return t('merchantList.statusCancelled')
    return status || '-'
  }

  /** KYB 阶段（申请 tab）：展示 kybStatus */
  function kybStatusTone(
    kybStatus?: string | null
  ): 'success' | 'warning' | 'danger' | 'info' | null {
    if (kybStatus === KybStatus.Approved) return 'success'
    if (
      kybStatus === KybStatus.Rejected ||
      kybStatus === KybStatus.AdminRejected ||
      kybStatus === KybStatus.Cancelled
    ) {
      return 'danger'
    }
    if (kybStatus === KybStatus.Submitted || kybStatus === KybStatus.NeedSupplement) return 'info'
    if (kybStatus === KybStatus.PendingScreening || kybStatus === KybStatus.Draft) return 'warning'
    return null
  }

  function kybStatusLabel(kybStatus?: string | null): string {
    const map: Record<string, string> = {
      [KybStatus.Draft]: t('merchantList.kybDraft'),
      [KybStatus.PendingScreening]: t('merchantList.kybPendingScreening'),
      [KybStatus.Submitted]: t('merchantList.kybSubmitted'),
      [KybStatus.NeedSupplement]: t('merchantList.kybNeedSupplement'),
      [KybStatus.Approved]: t('merchantList.kybApproved'),
      [KybStatus.Rejected]: t('merchantList.kybRejected'),
      [KybStatus.AdminRejected]: t('merchantList.kybAdminRejected'),
      [KybStatus.Cancelled]: t('merchantList.kybCancelled')
    }
    return (kybStatus && map[kybStatus]) || kybStatus || '-'
  }

  function screeningTone(row: MerchantRecord): 'success' | 'danger' | null {
    const hasHits =
      row.merchantName?.toLowerCase().includes('node') ||
      row.merchantName?.toLowerCase().includes('block')
    return hasHits ? 'danger' : 'success'
  }

  function screeningLabel(row: MerchantRecord): string {
    const hasHits =
      row.merchantName?.toLowerCase().includes('node') ||
      row.merchantName?.toLowerCase().includes('block')
    if (hasHits) {
      const hits = (row.code.charCodeAt(0) % 3) + 1
      return hits === 1 ? '1 Hit' : `${hits} Hits`
    }
    return t('merchantList.screeningClear')
  }

  function formatDateTime(v?: string | null): string {
    if (!v) return '-'
    return v.replace('T', ' ').slice(0, 19)
  }

  onMounted(loadActiveTab)
</script>

<style scoped>
  .merchant-tabs {
    margin-top: 0;
  }
</style>
