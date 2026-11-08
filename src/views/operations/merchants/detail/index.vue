<!--
  Merchant Detail（KYB 审核）—— 外壳。

  职责只有三件：加载详情、错误处理、按商户状态分发视图。
    · 未入驻（审核中 / 被拒 / 冻结 / 取消）→ OnboardingView
    · 已入驻（KYB 通过且未被冻结）        → OverviewView
  两个视图共用 MerchantDetailHeader（页头 + 拒绝原因），详情只加载一次，
  审批后通过 reload 统一刷新，避免拆分路由导致的重复请求。
-->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-4"><el-skeleton :rows="3" animated /></div>
      <div class="art-card h-64 p-5 mb-4"><el-skeleton :rows="6" animated /></div>
    </template>

    <template v-else-if="detail">
      <MerchantDetailHeader :detail="detail" />
      <OverviewView v-if="isOnboarded" :detail="detail" :reload="load" />
      <OnboardingView v-else :detail="detail" :reload="load" />
    </template>

    <template v-else>
      <div class="art-card p-10 text-center">
        <p class="text-g-500 mb-4">{{ errorMessage }}</p>
        <ElButton type="primary" @click="backToList">{{
          $t('merchantDetail.backToList')
        }}</ElButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { fetchMerchantKybDetail, type AdminMerchantKybDetailView } from '@/api/merchant'
  import { useCountryStore } from '@/store/modules/country'
  import { KybStatus } from '@/enums/merchantEnum'
  import { MerchantStatus, merchantStatusOf } from '@/utils/merchantStatus'
  import MerchantDetailHeader from './components/MerchantDetailHeader.vue'
  import OnboardingView from './components/OnboardingView.vue'
  import OverviewView from './components/OverviewView.vue'

  defineOptions({ name: 'MerchantDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t, locale } = useI18n()
  const countryStore = useCountryStore()

  const loading = ref(false)
  const detail = ref<AdminMerchantKybDetailView | null>(null)
  const errorMessage = ref('')

  /** 「已入驻」= KYB 通过且商户未被冻结 */
  const isOnboarded = computed(() => {
    const kybState = detail.value?.kybStatus?.toUpperCase()
    const status = merchantStatusOf({
      merchantStatus: detail.value?.merchantStatus,
      latestKybStatus: detail.value?.kybStatus,
      apiStatus: detail.value?.enterpriseStatus,
      ecode: detail.value?.ecode
    })
    return kybState === KybStatus.Approved && status === MerchantStatus.Active
  })

  async function load() {
    const ecode = String(route.params.merchantId || '')
    if (!ecode) return
    loading.value = true
    try {
      detail.value = await fetchMerchantKybDetail(ecode)
    } catch {
      errorMessage.value = t('merchantDetail.notFound')
    } finally {
      loading.value = false
    }
  }

  function backToList() {
    router.back()
  }

  onMounted(() => {
    void countryStore.ensureLoaded(locale.value)
    void load()
  })
</script>
