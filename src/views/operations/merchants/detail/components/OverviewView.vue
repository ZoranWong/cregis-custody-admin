<!--
  已入驻视图（ACTIVE）。

  Compliance Status / Pre-screening / Identity / Agreements / Team Members 五个 Tab。
  数据由父页面加载一次后传入，避免拆分后重复请求。
-->
<template>
  <el-tabs v-model="activeTab">
    <!-- Tab 1: Compliance Status（五张 summary-card，可编辑） -->
    <el-tab-pane :label="$t('merchantDetail.tabCompliance')" name="compliance">
      <div class="screening-grid">
        <!-- Onboarding Status -->
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.cddOnboardingStatus') }}</div>
          <el-select
            v-if="complianceEditing"
            v-model="complianceForm.merchantStatus"
            size="default"
            class="!w-full"
          >
            <el-option
              v-for="opt in MERCHANT_SELF_STATUS_OPTIONS"
              :key="opt"
              :label="merchantSelfStatusLabel(opt)"
              :value="opt"
            />
          </el-select>
          <div v-else class="summary-card-value">
            <ArtStatusTag :status="statusTone" :text="statusLabel" />
          </div>
        </div>

        <!-- Risk Level -->
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.riskLevel') }}</div>
          <el-select
            v-if="complianceEditing"
            v-model="complianceForm.riskLevel"
            size="default"
            class="!w-full"
          >
            <el-option
              v-for="opt in RISK_LEVEL_OPTIONS"
              :key="opt.value"
              :label="t(opt.labelKey)"
              :value="opt.value"
            />
          </el-select>
          <div v-else class="summary-card-value">
            <ArtStatusTag
              :status="riskLevelTone(complianceForm.riskLevel)"
              :text="riskLevelLabel(complianceForm.riskLevel)"
            />
          </div>
        </div>

        <!-- CRS/FATCA Status -->
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.crsFatcaStatus') }}</div>
          <el-select
            v-if="complianceEditing"
            v-model="complianceForm.crsFatcaStatus"
            size="default"
            class="!w-full"
          >
            <el-option
              v-for="opt in CRS_FATCA_OPTIONS"
              :key="opt.value"
              :label="t(opt.labelKey)"
              :value="opt.value"
            />
          </el-select>
          <div v-else class="summary-card-value text-g-800">
            {{ crsFatcaLabel(complianceForm.crsFatcaStatus) }}
          </div>
        </div>

        <!-- Source of Wealth -->
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.sourceOfWealth') }}</div>
          <el-select
            v-if="complianceEditing"
            v-model="complianceForm.sourceOfWealth"
            size="default"
            class="!w-full"
          >
            <el-option
              v-for="opt in VERIFY_STATUS_OPTIONS"
              :key="opt.value"
              :label="t(opt.labelKey)"
              :value="opt.value"
            />
          </el-select>
          <div
            v-else
            class="summary-card-value"
            :class="verifyStatusClass(complianceForm.sourceOfWealth)"
          >
            {{ verifyStatusDisplay(complianceForm.sourceOfWealth) }}
          </div>
        </div>

        <!-- Source of Funds -->
        <div class="summary-card">
          <div class="summary-card-title">{{ $t('merchantDetail.sourceOfFundsStatus') }}</div>
          <el-select
            v-if="complianceEditing"
            v-model="complianceForm.sourceOfFunds"
            size="default"
            class="!w-full"
          >
            <el-option
              v-for="opt in VERIFY_STATUS_OPTIONS"
              :key="opt.value"
              :label="t(opt.labelKey)"
              :value="opt.value"
            />
          </el-select>
          <div
            v-else
            class="summary-card-value"
            :class="verifyStatusClass(complianceForm.sourceOfFunds)"
          >
            {{ verifyStatusDisplay(complianceForm.sourceOfFunds) }}
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <el-button v-if="complianceEditing" @click="cancelComplianceEdit">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="complianceSaving"
          @click="complianceEditing ? saveCompliance() : startComplianceEdit()"
        >
          {{ complianceEditing ? $t('common.save') : $t('common.edit') }}
        </el-button>
      </div>
    </el-tab-pane>

    <!-- Tab 2: Pre-screening -->
    <el-tab-pane :label="$t('merchantDetail.tabPrescreening')" name="prescreening">
      <PrescreeningPanel
        :questionnaire="detail.questionnaire"
        :editable="true"
        @edit-bd="openBdEditor"
      />
    </el-tab-pane>

    <!-- Tab 3: Identity Verification & Screening -->
    <el-tab-pane :label="$t('merchantDetail.tabIdentity')" name="identity">
      <IdentityVerificationPanel
        :identity="detail.identityVerification"
        :beneficiaries="detail.beneficiaries"
        :merchant-name="detail.merchantName"
      />

      <!-- Re-screen / Re-verify 操作（接口待支持，先占位） -->
      <div class="flex justify-end gap-2 mt-6">
        <el-button @click="handleRescreen">{{ $t('merchantDetail.rescreen') }}</el-button>
        <el-button type="primary" @click="handleReverifyRescreen">
          {{ $t('merchantDetail.reverifyRescreen') }}
        </el-button>
      </div>
    </el-tab-pane>

    <!-- Tab 4: Agreements -->
    <el-tab-pane :label="$t('merchantDetail.tabAgreements')" name="agreements">
      <div class="text-xs text-g-600 mb-3">{{ $t('merchantDetail.agreementsHint') }}</div>
      <AgreementsPanel :ecode="detail.ecode" :editable="true" />
    </el-tab-pane>

    <!-- Tab 5: Team Members -->
    <el-tab-pane :label="$t('merchantDetail.tabTeam')" name="team">
      <div class="flex flex-col gap-3">
        <div
          v-for="u in merchantUsers"
          :key="u.userId"
          class="flex items-center gap-3 p-3 bg-g-50 rounded-lg"
        >
          <div
            class="w-9 h-9 rounded-full bg-[var(--el-color-primary)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
          >
            {{ initialsOf(u.username) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-g-900 truncate">{{ u.username }}</span>
              <span
                class="text-label px-2 py-0.5 rounded font-medium flex-shrink-0"
                :class="
                  u.state === 'ACTIVE'
                    ? 'bg-tone-done-bg text-tone-done-text'
                    : 'bg-g-100 text-g-500'
                "
              >
                {{ userStateLabel(u.state) }}
              </span>
            </div>
            <div class="text-xs text-g-600 truncate mt-0.5">
              {{ u.email
              }}<template v-if="u.loginTime">
                · {{ $t('merchantDetail.lastLogin') }}: {{ formatDateTime(u.loginTime) }}</template
              >
            </div>
          </div>
          <span
            class="text-label px-2 py-0.5 bg-[var(--el-color-primary-light-9)] text-[var(--theme-text)] rounded font-medium flex-shrink-0"
          >
            {{ userRoleLabel(u.role) }}
          </span>
        </div>
        <div v-if="merchantUsers.length === 0" class="py-6 text-center text-g-400 text-sm">
          {{ $t('merchantDetail.noTeamMembers') }}
        </div>
      </div>
    </el-tab-pane>
  </el-tabs>

  <!-- BD 推荐人编辑弹窗 -->
  <BdReferralEditor
    ref="bdEditorRef"
    :ecode="detail.ecode"
    :questionnaire="detail.questionnaire"
    :on-success="reload"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import {
    fetchMerchantUsers,
    updateComplianceStatus,
    type AdminMerchantKybDetailView,
    type AdminMerchantUserVO
  } from '@/api/merchant'
  import { MerchantSelfStatus } from '@/enums/merchantEnum'
  import {
    MERCHANT_STATUS_LABEL_KEYS,
    MerchantStatus,
    merchantStatusOf
  } from '@/utils/merchantStatus'
  import PrescreeningPanel from './PrescreeningPanel.vue'
  import IdentityVerificationPanel from './IdentityVerificationPanel.vue'
  import AgreementsPanel from './AgreementsPanel.vue'
  import BdReferralEditor from './BdReferralEditor.vue'

  defineOptions({ name: 'MerchantOverviewView' })

  const props = defineProps<{
    detail: AdminMerchantKybDetailView
    /** 数据变更后重新拉取详情（Compliance 保存） */
    reload: () => Promise<void>
  }>()

  const { t } = useI18n()

  const activeTab = ref('compliance')

  // ─── 商户状态 ───
  const merchantStatus = computed<MerchantStatus | null>(() =>
    merchantStatusOf({
      merchantStatus: props.detail.merchantStatus,
      latestKybStatus: props.detail.kybStatus,
      apiStatus: props.detail.enterpriseStatus,
      ecode: props.detail.ecode
    })
  )

  /** 与页头一致：只有 ACTIVE 是 success，其余 warning */
  const statusTone = computed<'success' | 'warning' | null>(() => {
    if (!merchantStatus.value) return null
    return merchantStatus.value === MerchantStatus.Active ? 'success' : 'warning'
  })

  const statusLabel = computed(() => {
    if (merchantStatus.value) return t(MERCHANT_STATUS_LABEL_KEYS[merchantStatus.value])
    return props.detail.merchantStatus || '-'
  })

  // ─── Team Members ───
  const merchantUsers = ref<AdminMerchantUserVO[]>([])

  async function loadMerchantUsers() {
    const ecode = props.detail.ecode
    if (!ecode) return
    try {
      const res = await fetchMerchantUsers(ecode, { pageIndex: 1, pageSize: 100 })
      merchantUsers.value = res.records || []
    } catch {
      merchantUsers.value = []
    }
  }

  function userRoleLabel(role: string): string {
    const map: Record<string, string> = {
      MERCHANT_OWNER: t('merchantDetail.roleOwner'),
      MERCHANT_ADMIN: t('merchantDetail.roleAdmin'),
      MERCHANT_STAFF: t('merchantDetail.roleStaff'),
      MERCHANT_FUND_OPERATOR: t('merchantDetail.roleFundOperator'),
      MERCHANT_ANYCALL_OPERATOR: t('merchantDetail.roleAnycallOperator')
    }
    return map[role] || role || '-'
  }

  function userStateLabel(state: string): string {
    const map: Record<string, string> = {
      ACTIVE: t('merchantDetail.userActive'),
      INACTIVE: t('merchantDetail.userInactive'),
      SUSPENDING: t('merchantDetail.userSuspending')
    }
    return map[state] || state || '-'
  }

  // ─── Compliance Status 编辑 ───
  const complianceEditing = ref(false)
  const complianceSaving = ref(false)
  const complianceForm = reactive({
    merchantStatus: '',
    riskLevel: '',
    crsFatcaStatus: '',
    sourceOfWealth: '',
    sourceOfFunds: ''
  })

  const MERCHANT_SELF_STATUS_OPTIONS = [
    MerchantSelfStatus.Pending,
    MerchantSelfStatus.Active,
    MerchantSelfStatus.Frozen,
    MerchantSelfStatus.Cancelled
  ]

  const RISK_LEVEL_OPTIONS = [
    { value: 'LOW', labelKey: 'merchantDetail.riskLevelLow' },
    { value: 'MEDIUM', labelKey: 'merchantDetail.riskLevelMedium' },
    { value: 'HIGH', labelKey: 'merchantDetail.riskLevelHigh' }
  ]

  const CRS_FATCA_OPTIONS = [
    { value: 'DEPOSITORY_INSTITUTION', labelKey: 'merchantDetail.crsFatcaDepository' },
    { value: 'CUSTODIAL_INSTITUTION', labelKey: 'merchantDetail.crsFatcaCustodial' },
    { value: 'INVESTMENT_ENTITY', labelKey: 'merchantDetail.crsFatcaInvestment' },
    { value: 'ACTIVE_NFE', labelKey: 'merchantDetail.crsFatcaActiveNfe' },
    { value: 'PASSIVE_NFE', labelKey: 'merchantDetail.crsFatcaPassiveNfe' }
  ]

  const VERIFY_STATUS_OPTIONS = [
    { value: 'VERIFIED', labelKey: 'merchantDetail.verified' },
    { value: 'PENDING', labelKey: 'merchantDetail.pendingStatus' },
    { value: 'NOT_VERIFIED', labelKey: 'merchantDetail.notVerified' }
  ]

  function crsFatcaLabel(value: string): string {
    const hit = CRS_FATCA_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || t('merchantDetail.answerNone')
  }

  function verifyStatusLabel(value: string): string {
    const hit = VERIFY_STATUS_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || '-'
  }

  function verifyStatusClass(value: string): string {
    if (value === 'VERIFIED') return 'text-tone-done-text'
    if (value === 'PENDING') return 'text-tone-progress-text'
    return 'text-g-500'
  }

  function verifyStatusDisplay(value: string): string {
    const label = verifyStatusLabel(value)
    return value === 'VERIFIED' ? `✓ ${label}` : label
  }

  function riskLevelLabel(value: string): string {
    const hit = RISK_LEVEL_OPTIONS.find((o) => o.value === value)
    return hit ? t(hit.labelKey) : value || '-'
  }

  function riskLevelTone(value: string): 'success' | 'warning' | 'danger' | null {
    if (value === 'LOW') return 'success'
    if (value === 'MEDIUM') return 'warning'
    if (value === 'HIGH') return 'danger'
    return null
  }

  function initComplianceForm() {
    const cs = props.detail.complianceStatus
    if (cs) {
      complianceForm.merchantStatus = cs.onboardingStatus || props.detail.merchantStatus || 'ACTIVE'
      complianceForm.riskLevel = cs.riskLevel || 'LOW'
      complianceForm.crsFatcaStatus = cs.crsFatcaStatus || ''
      complianceForm.sourceOfWealth = cs.sourceOfWealthStatus || ''
      complianceForm.sourceOfFunds = cs.sourceOfFundsStatus || ''
    } else {
      complianceForm.merchantStatus = props.detail.merchantStatus || 'ACTIVE'
      complianceForm.riskLevel = 'LOW'
      complianceForm.crsFatcaStatus = ''
      complianceForm.sourceOfWealth = ''
      complianceForm.sourceOfFunds = ''
    }
  }

  function startComplianceEdit() {
    complianceForm.merchantStatus = props.detail.merchantStatus?.toUpperCase() || 'ACTIVE'
    complianceForm.riskLevel = complianceForm.riskLevel || 'LOW'
    complianceForm.crsFatcaStatus = complianceForm.crsFatcaStatus || 'CUSTODIAL_INSTITUTION'
    complianceForm.sourceOfWealth = complianceForm.sourceOfWealth || 'VERIFIED'
    complianceForm.sourceOfFunds = complianceForm.sourceOfFunds || 'VERIFIED'
    complianceEditing.value = true
  }

  function cancelComplianceEdit() {
    complianceEditing.value = false
    complianceForm.merchantStatus = props.detail.merchantStatus?.toUpperCase() || 'ACTIVE'
  }

  async function saveCompliance() {
    complianceSaving.value = true
    try {
      await updateComplianceStatus(props.detail.ecode, {
        onboardingStatus: complianceForm.merchantStatus || null,
        riskLevel: complianceForm.riskLevel || null,
        crsFatcaStatus: complianceForm.crsFatcaStatus || null,
        sourceOfWealthStatus: complianceForm.sourceOfWealth || null,
        sourceOfFundsStatus: complianceForm.sourceOfFunds || null
      })

      complianceEditing.value = false
      ElMessage.success(t('merchantDetail.editSuccess'))

      // props 只读：重新拉取详情，由父页面把最新数据传下来
      await props.reload()
      // 若接口未随详情返回新值，用保存响应兜底回填表单
      if (!props.detail.complianceStatus) initComplianceForm()
    } catch {
      ElMessage.error(t('merchantDetail.editFailed'))
    } finally {
      complianceSaving.value = false
    }
  }

  // ─── Identity 占位操作（接口待支持）───
  function handleRescreen() {
    ElMessage.warning(t('merchantDetail.rescreenUnavailable'))
  }

  function handleReverifyRescreen() {
    ElMessage.warning(t('merchantDetail.reverifyRescreenUnavailable'))
  }

  // ─── BD Referral 编辑 ───
  const bdEditorRef = ref<InstanceType<typeof BdReferralEditor> | null>(null)

  function openBdEditor() {
    bdEditorRef.value?.open()
  }

  function merchantSelfStatusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending',
      ACTIVE: 'Active',
      FROZEN: 'Frozen',
      CANCELLED: 'Cancelled'
    }
    return map[s] || s || '-'
  }

  function initialsOf(name: string): string {
    return (name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function formatDateTime(v?: string | null): string {
    if (!v) return ''
    return v.replace('T', ' ').slice(0, 19)
  }

  onMounted(() => {
    initComplianceForm()
    void loadMerchantUsers()
  })

  // 详情被重新拉取（例如保存后 reload）时同步表单
  watch(
    () => props.detail.complianceStatus,
    () => {
      if (!complianceEditing.value) initComplianceForm()
    }
  )
</script>

<style scoped>
  .screening-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .summary-card {
    padding: 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
  }

  .summary-card-title {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .summary-card-value {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
