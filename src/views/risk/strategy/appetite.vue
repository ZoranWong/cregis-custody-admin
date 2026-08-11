<!-- Cregis Risk Profile & Appetite -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <el-radio-group v-model="activeTab" @change="switchTab">
        <el-radio-button value="profile">{{ $t('strategy.riskProfile') }}</el-radio-button>
        <el-radio-button value="appetite">{{ $t('strategy.riskAppetite') }}</el-radio-button>
      </el-radio-group>
      <ElButton @click="load">{{ $t('console.refresh') }}</ElButton>
    </div>

    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select v-model="profileFilters.riskLevel" :placeholder="$t('strategy.riskLevel')" clearable class="!w-36" @change="onProfileFilterChange">
            <el-option v-for="o in riskLevelOptions" :key="o" :label="o" :value="o" />
          </el-select>
          <el-select v-model="profileFilters.merchantType" :placeholder="$t('strategy.merchantType')" clearable class="!w-44" @change="onProfileFilterChange">
            <el-option v-for="o in merchantTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-input v-model="profileFilters.keyword" :placeholder="$t('risk.search')" clearable class="!w-48" @clear="onProfileFilterChange" @keyup.enter="onProfileFilterChange">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>
      <el-table :data="profiles" stripe size="small">
        <el-table-column prop="merchantName" :label="$t('risk.merchant')" min-width="160" />
        <el-table-column :label="$t('strategy.riskLevel')" width="100">
          <template #default="{ row }"><el-tag :type="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'medium' ? 'warning' : 'success'" size="small">{{ row.riskLevel }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="riskScore" :label="$t('strategy.score')" width="80" />
        <el-table-column :label="$t('strategy.trend')" width="80">
          <template #default="{ row }"><span :class="row.scoreTrend > 0 ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'">{{ row.scoreTrend > 0 ? '+' : '' }}{{ row.scoreTrend }}</span></template>
        </el-table-column>
        <el-table-column prop="recentEventCount" :label="$t('strategy.recentEvents')" width="100" />
        <el-table-column :label="$t('strategy.highRisk')" width="80">
          <template #default="{ row }">{{ row.highRiskFlag ? 'Yes' : 'No' }}</template>
        </el-table-column>
        <el-table-column prop="updatedAt" :label="$t('strategy.updatedAt')" width="160" />
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">{{ pagination.totalCount }} profiles</span>
        <el-pagination v-model:current-page="profilePage" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>updateProfileFilter({page:v})" @size-change="(v:number)=>updateProfileFilter({pageSize:v,page:1})" />
      </div>
    </div>

    <!-- Appetite Tab -->
    <div v-if="activeTab === 'appetite'" class="art-card p-5 mb-5">
      <h3 class="text-sm font-semibold text-g-900 mb-4">{{ $t('strategy.riskThresholds') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><span class="text-xs text-g-500">{{ $t('strategy.highRiskThreshold') }}</span>
          <el-slider v-model="appetiteForm.highRiskThreshold" :min="50" :max="100" show-input class="mt-2" /></div>
        <div><span class="text-xs text-g-500">{{ $t('strategy.mediumRiskThreshold') }}</span>
          <el-slider v-model="appetiteForm.mediumRiskThreshold" :min="20" :max="80" show-input class="mt-2" /></div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><span class="text-xs text-g-500">{{ $t('strategy.largeAmount') }}</span>
          <el-input-number v-model="appetiteForm.largeAmount" class="!w-full mt-2" /></div>
        <div><span class="text-xs text-g-500">{{ $t('strategy.reevaluation') }}</span>
          <el-input-number v-model="appetiteForm.reevaluationDays" :min="1" :max="365" class="!w-full mt-2" /></div>
      </div>
      <ElButton type="primary" :disabled="appetiteSaving" @click="submitAppetite">{{ $t('fee.save') }}</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'RiskProfileAppetite' })
const route = useRoute()
const router = useRouter()
const validTabs = ['profile', 'appetite'] as const
const activeTab = ref<'profile' | 'appetite'>(validTabs.includes(route.query.tab as any) ? (route.query.tab as 'profile' | 'appetite') : 'profile')

function switchTab(tab: 'profile' | 'appetite'): void {
  activeTab.value = tab
  const query: Record<string, string> = {}
  if (tab !== 'profile') query.tab = tab
  router.replace({ query }).catch(() => {})
}

// Profile stub
const profiles = ref<any[]>([])
const pagination = ref({ page: 1, pageSize: 20, totalPages: 0, totalCount: 0 })
const profileFilters = ref({ riskLevel: '', merchantType: '', keyword: '' })
const profilePage = ref(1)
const profileLoading = ref(false)

function load() { /* stub */ }
function onProfileFilterChange() { load() }
function updateProfileFilter(next: any) { Object.assign(profileFilters, next); load() }

// Appetite stub
const appetiteSaving = ref(false)
const appetiteForm = reactive({ highRiskThreshold: 85, mediumRiskThreshold: 50, largeAmount: 100000, reevaluationDays: 30 })
function submitAppetite() { appetiteSaving.value = true; setTimeout(() => { appetiteSaving.value = false }, 1000) }

const riskLevelOptions = ['high', 'medium', 'low']
const merchantTypeOptions = [{ value: 'enterprise', label: 'Enterprise' }, { value: 'exchange', label: 'Exchange' }, { value: 'payment_provider', label: 'Payment Provider' }]
</script>