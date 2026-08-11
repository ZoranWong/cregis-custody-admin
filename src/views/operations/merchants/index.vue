<!-- Cregis Merchant List -->
<template>
  <div class="page-content">
    <!-- ═══ Summary 卡片 ═══ -->
    <template v-if="loading && !summary">
      <ElRow :gutter="20" class="flex">
        <ElCol v-for="i in 4" :key="i" :sm="12" :md="6">
          <div class="art-card h-28 mb-5 flex flex-col justify-center px-5"><el-skeleton :rows="2" animated /></div>
        </ElCol>
      </ElRow>
    </template>
    <template v-else>
      <ElRow :gutter="20" class="flex">
        <ElCol :sm="12" :md="6" v-for="card in summaryCards" :key="card.key">
          <div class="art-card relative flex flex-col justify-center h-28 px-5 mb-5 max-sm:mb-4">
            <span class="text-g-700 text-sm">{{ $t(card.labelKey) }}</span>
            <span class="text-[22px] font-medium mt-1 text-g-900">{{ card.value }}</span>
          </div>
        </ElCol>
      </ElRow>
    </template>

    <!-- ═══ Filter + 表格 ═══ -->
    <div class="art-card art-table-card mb-5 overflow-hidden">
      <!-- Filter 栏 -->
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex border-full-d rounded-lg overflow-hidden">
          <el-radio-group :model-value="filters.view" @change="(v: string) => setView(v)">
            <el-radio-button v-for="v in views" :key="v.key" :value="v.key">{{ $t(v.labelKey) }}</el-radio-button>
          </el-radio-group>
          </div>
          <div class="w-px h-6 bg-g-300" />
          <el-select v-model="filterForm.status" :placeholder="$t('merchantList.status')" clearable class="!w-36" @change="onFilterChange">
            <el-option v-for="o in filterOptions?.statuses" :key="o.code" :value="o.code"><span>{{ translateOption(o) }}</span></el-option>
          </el-select>
          <el-select v-model="filterForm.merchantType" :placeholder="$t('merchantList.type')" clearable class="!w-44" @change="onFilterChange">
            <el-option v-for="o in filterOptions?.merchantTypes" :key="o.code" :value="o.code"><span>{{ translateOption(o) }}</span></el-option>
          </el-select>
          <el-select v-model="filterForm.watchBucket" :placeholder="$t('merchantList.viewWatch')" clearable class="!w-36" @change="onFilterChange">
            <el-option v-for="o in filterOptions?.watchBuckets" :key="o.code" :value="o.code"><span>{{ translateOption(o) }}</span></el-option>
          </el-select>
          <el-input v-model="filterForm.keyword" :placeholder="$t('merchantList.search')" clearable class="!w-56" @clear="onFilterChange" @keyup.enter="onFilterChange">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
          <ElButton @click="resetFilters">{{ $t('console.refresh') }}</ElButton>
        </div>
      </div>

      <!-- 表格 -->
      <template v-if="loading">
        <el-skeleton :rows="10" animated class="p-5" />
      </template>
      <el-table v-else :data="records" stripe size="small" highlight-current-row style="cursor:pointer" @row-click="openDetail">
        <el-table-column prop="code" :label="$t('merchantList.id')" width="100" />
        <el-table-column prop="merchantName" :label="$t('merchantList.merchant')" min-width="180" />
        <el-table-column :label="$t('merchantList.status')" width="110">
          <template #default="{ row }"><el-tag :type="statusTagType(row.statusLabel)" size="small">{{ row.statusLabel ?? '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('merchantList.type')" width="160">
          <template #default="{ row }">{{ row.merchantTypeLabel ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="email" :label="$t('merchantList.contact')" width="180" />
        <el-table-column :label="$t('merchantList.updated')" width="150">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="$t('merchantList.action')" width="80" fixed="right">
          <template #default="{ row }"><ElButton size="small" @click.stop="openDetail(row)">{{ $t('merchantList.open') }}</ElButton></template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="page" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">{{ page.total }} {{ $t('merchantList.records') }}</span>
        <el-pagination v-model:current-page="filters.pageNum" v-model:page-size="filters.pageSize" :total="page.total" :page-sizes="[10, 20, 50]" background layout="total, sizes, prev, pager, next" @current-change="goToPage" @size-change="setPageSize" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useMerchantList } from '@/features/merchant/useMerchantList'
  import { formatTime } from '@/utils/format'

  defineOptions({ name: 'MerchantList' })
  const { t } = useI18n()
  const router = useRouter()
  const { loading, summary, filterOptions, page, filters, setView, submitFilters, goToPage, setPageSize, resetFilters } = useMerchantList()
  const records = computed(() => (page.value as any)?.records ?? [])

  const filterForm = reactive({ status: '', merchantType: '', watchBucket: '', keyword: '' })
  function onFilterChange() { submitFilters({ target: { elements: { status: { value: filterForm.status }, merchantType: { value: filterForm.merchantType }, watchBucket: { value: filterForm.watchBucket }, keyword: { value: filterForm.keyword } } } } as any) }
  function openDetail(row: any) { router.push({ name: 'merchant-detail', params: { merchantId: row.id } }) }

  const summaryCards = computed(() => {
    const s = summary.value as any
    return [
      { key: 'total', labelKey: 'merchantList.total', value: s?.totalCount ?? '-' },
      { key: 'active', labelKey: 'merchantList.active', value: s?.activeCount ?? '-' },
      { key: 'onboarding', labelKey: 'merchantList.onboarding', value: s?.onboardingCount ?? '-' },
      { key: 'watch', labelKey: 'merchantList.watch', value: s?.vaspHandoffCount ?? '-' },
    ]
  })
  const views = [
    { key: 'ALL', labelKey: 'merchantList.viewAll' }, { key: 'ACTIVE', labelKey: 'merchantList.viewActive' }, { key: 'WATCH', labelKey: 'merchantList.viewWatch' },
  ]

  function statusTagType(s: string) { if (!s) return 'info'; if (/active/i.test(s)) return 'success'; if (/frozen|suspend|inactive/i.test(s)) return 'danger'; if (/pending|review|collecting/i.test(s)) return 'warning'; return 'info' }
  function translateByCode(code: string | undefined) { if (!code) return '-'; const tk = `merchantType.${code}`; const tt = t(tk); if (tt !== tk) return tt; const sk = `merchantStatus.${code}`; const st = t(sk); if (st !== sk) return st; return code }
  function translateOption(o: { code: string; label: string }) { return translateByCode(o.code) !== o.code ? translateByCode(o.code) : o.label }
</script>