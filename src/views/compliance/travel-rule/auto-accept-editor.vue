<!-- Travel Rule Auto-Accept Editor — Travel Rule 自动接受规则编辑 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ pageTitle }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ pageSubtitle }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('rules.backToRules') }}
      </el-button>
    </div>

    <!-- Rule Form Card -->
    <div class="art-card mb-5">
      <div class="p-5 border-b border-[var(--default-border)]">
        <h2 class="text-lg font-semibold text-g-900">{{ $t('rules.basicInfo') }}</h2>
      </div>
      <div class="p-5">
        <el-form label-width="140px" :model="form">
          <el-form-item :label="$t('rules.ruleName')">
            <el-input v-model="form.ruleName" />
          </el-form-item>
          <el-form-item :label="$t('rules.description')">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
          <div class="grid grid-cols-2 gap-x-6">
            <el-form-item :label="$t('rules.scope')">
              <el-select v-model="form.scopeType" class="w-full">
                <el-option
                  v-for="item in SCOPE_DICT"
                  :key="item.value"
                  :label="$t(item.labelKey)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.scopeType === 'MERCHANT'" :label="$t('rules.scopeValue')">
              <el-select
                v-model="form.scopeValue"
                class="w-full"
                filterable
                :loading="merchantLoading"
                :placeholder="$t('rules.scopeValuePlaceholder')"
              >
                <el-option
                  v-for="m in merchantOptions"
                  :key="m.value"
                  :label="m.label"
                  :value="m.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <!-- Acceptance Conditions Card -->
    <div class="art-card mb-5">
      <div class="p-5 border-b border-[var(--default-border)]">
        <h2 class="text-lg font-semibold text-g-900">{{ $t('rules.acceptanceConditions') }}</h2>
        <p class="text-xs text-g-500 mt-1">{{ $t('rules.acceptanceConditionsHint') }}</p>
      </div>
      <div class="p-5">
        <!-- Beneficiary name match -->
        <div class="condition-row">
          <div class="flex items-start gap-3">
            <div class="condition-toggle locked">
              <ArtSvgIcon icon="ri:lock-line" class="text-white text-[10px]" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium text-g-900">{{
                $t('rules.beneficiaryNameMatch')
              }}</div>
              <div class="text-xs text-g-500 mt-1">{{ $t('rules.beneficiaryNameMatchDesc') }}</div>
            </div>
          </div>
        </div>

        <!-- Alias match -->
        <div class="condition-row">
          <div class="flex items-start gap-3">
            <div
              class="condition-toggle"
              :class="{ active: form.aliasMatch }"
              @click="form.aliasMatch = !form.aliasMatch"
            >
              <span v-if="form.aliasMatch" class="text-white text-[10px]">✓</span>
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium text-g-900">{{ $t('rules.aliasMatch') }}</div>
              <div class="text-xs text-g-500 mt-1">{{ $t('rules.aliasMatchDesc') }}</div>
              <!-- Inline alias editing -->
              <div v-if="form.aliasMatch" class="mt-3">
                <div class="text-xs font-semibold text-g-600 mb-2">{{ $t('rules.aliases') }}</div>
                <div class="flex flex-col gap-2">
                  <div
                    v-for="(alias, index) in form.aliases"
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <el-input
                      v-model="form.aliases[index]"
                      size="small"
                      class="flex-1"
                      :placeholder="$t('rules.aliasPlaceholder')"
                    />
                    <el-button size="small" text type="danger" @click="removeAlias(index)">
                      <ArtSvgIcon icon="ri:delete-bin-line" />
                    </el-button>
                  </div>
                  <el-button size="small" text type="primary" @click="addAlias">
                    <ArtSvgIcon icon="ri:add-line" class="mr-1" />{{ $t('rules.addAlias') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Onboarding status -->
        <div class="condition-section">
          <div class="text-sm font-medium text-g-900 mb-2">{{ $t('rules.onboardingStatus') }}</div>
          <div class="text-xs text-g-500 mb-3">{{ $t('rules.onboardingStatusDesc') }}</div>
          <div class="flex flex-wrap gap-4">
            <el-checkbox
              v-for="status in onboardingStatusOptions"
              :key="status.value"
              v-model="form.onboardingStatus"
              :label="status.value"
            >
              {{ $t(status.labelKey) }}
            </el-checkbox>
          </div>
        </div>

        <!-- Risk level -->
        <div class="condition-section">
          <div class="text-sm font-medium text-g-900 mb-2">{{ $t('rules.riskLevel') }}</div>
          <div class="text-xs text-g-500 mb-3">{{ $t('rules.riskLevelDesc') }}</div>
          <div class="flex flex-wrap gap-4">
            <el-checkbox
              v-for="level in riskLevelOptions"
              :key="level.value"
              v-model="form.riskLevel"
              :label="level.value"
            >
              {{ $t(level.labelKey) }}
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <el-button @click="router.back()">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="saveRule">{{ $t('common.save') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { SCOPE_DICT } from '@/features/compliance/dictionaries'
  import { fetchMerchantList } from '@/api/merchant'

  defineOptions({ name: 'TravelRuleAutoAcceptEditor' })

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const isEdit = computed(() => !!route.params.id)
  const pageTitle = computed(() =>
    isEdit.value ? t('rules.editTravelRuleAutoAccept') : t('rules.addTravelRuleAutoAccept')
  )
  const pageSubtitle = computed(() =>
    isEdit.value
      ? t('rules.editTravelRuleAutoAcceptSubtitle')
      : t('rules.addTravelRuleAutoAcceptSubtitle')
  )

  const form = ref({
    ruleName: '',
    description: '',
    scopeType: 'GLOBAL',
    scopeValue: '',
    aliasMatch: false,
    aliases: [] as string[],
    onboardingStatus: ['ONBOARDED'] as string[],
    riskLevel: ['LOW'] as string[]
  })

  const merchantLoading = ref(false)
  const merchantOptions = ref<Array<{ label: string; value: string }>>([])

  const onboardingStatusOptions = [
    { value: 'ONBOARDED', labelKey: 'rules.onboardingStatusOptions.onboarded' },
    { value: 'PENDING', labelKey: 'rules.onboardingStatusOptions.pending' },
    { value: 'LABELED', labelKey: 'rules.onboardingStatusOptions.labeled' },
    { value: 'FROZEN', labelKey: 'rules.onboardingStatusOptions.frozen' }
  ]

  const riskLevelOptions = [
    { value: 'LOW', labelKey: 'rules.riskLevelOptions.low' },
    { value: 'MEDIUM', labelKey: 'rules.riskLevelOptions.medium' },
    { value: 'HIGH', labelKey: 'rules.riskLevelOptions.high' }
  ]

  function addAlias() {
    form.value.aliases.push('')
  }

  function removeAlias(index: number) {
    form.value.aliases.splice(index, 1)
  }

  async function loadMerchants() {
    merchantLoading.value = true
    try {
      const res = await fetchMerchantList({ pageSize: 200 })
      merchantOptions.value = (res.records || []).map((m) => ({
        label: m.merchantName || m.code,
        value: m.code
      }))
    } catch {
      ElMessage.error(t('common.loadFailed'))
    } finally {
      merchantLoading.value = false
    }
  }

  function saveRule() {
    // TODO: Implement API call
    ElMessage.success(t('rules.saveSuccess'))
    router.back()
  }

  onMounted(() => {
    loadMerchants()
    // TODO: Load rule data if editing
  })
</script>

<style scoped>
  .condition-row {
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--default-border);
    border-radius: 8px;
  }

  .condition-toggle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 2px solid var(--el-border-color);
    border-radius: 4px;
    transition: all 0.15s;
  }

  .condition-toggle:hover {
    border-color: var(--el-color-primary);
  }

  .condition-toggle.active {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  .condition-toggle.locked {
    cursor: not-allowed;
    background: var(--el-text-color-placeholder);
    border-color: var(--el-text-color-placeholder);
  }

  .condition-section {
    padding: 16px 0;
    margin-top: 16px;
    border-top: 1px solid var(--default-border);
  }
</style>
