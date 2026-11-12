<!--
  问卷编辑表单：在预审阶段（PENDING_SCREENING）允许后台人员修改商户问卷答案。
  以 Dialog 形式打开，提交后调用回调通知父组件重载详情。

  设计参考：cregis-custody-manager/src/v2/pages/auth/components/PrescreeningForm.vue
  - 两类投资者共用模板，仅 Qualified 多两道资格题
  - 字段顺序：公司信息 → [合格投资者资格] → BD 推荐 → 授权人
  - 只有公司信息输入框与 BD 推荐/推荐人可编辑；资格题、授权人只读展示（Yes / No / —）
  - 底部的 Risk Disclosure / Privacy Policy 勾选项不再展示，但提交时原值透传
  - investorType 在编辑时不可切换（由入驻时决定）
-->
<template>
  <el-dialog
    :model-value="visible"
    :title="$t('merchantDetail.editQuestionnaire')"
    width="680px"
    :close-on-click-modal="false"
    align-center
    class="questionnaire-edit-dialog"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" label-position="top" class="questionnaire-edit-form">
      <!-- 投资者类型标识（只读） -->
      <div class="investor-type-badge" :class="investorClass">
        <ArtSvgIcon :icon="investorIcon" class="mr-1.5" />
        {{ investorTypeLabel }}
      </div>

      <!-- ── Company ── -->
      <el-form-item
        :label="$t('merchantDetail.qFullCompanyName')"
        prop="legalName"
        :rules="[{ required: true, message: t('merchantDetail.fieldRequired'), trigger: 'blur' }]"
      >
        <el-input v-model="form.legalName" placeholder="Registered legal name" />
      </el-form-item>

      <el-form-item
        :label="$t('merchantDetail.qBusinessActivity')"
        prop="primaryActivity"
        :rules="[{ required: true, message: t('merchantDetail.fieldRequired'), trigger: 'blur' }]"
      >
        <el-input v-model="form.primaryActivity" placeholder="Primary business activity" />
      </el-form-item>

      <el-form-item
        :label="$t('merchantDetail.qCompanyLegalAddress')"
        prop="companyAddress"
        :rules="[{ required: true, message: t('merchantDetail.fieldRequired'), trigger: 'blur' }]"
      >
        <el-input
          v-model="form.companyAddress"
          type="textarea"
          :rows="2"
          placeholder="Building / Floor / Street / City / Country"
        />
      </el-form-item>

      <el-form-item :label="$t('merchantDetail.qCompanyWebsite')" prop="website">
        <el-input v-model="form.website" placeholder="https://www.example.com" />
      </el-form-item>

      <!-- ── Qualified criteria（仅 Qualified Investor）─── -->
      <template v-if="isQualifiedInvestor">
        <div class="form-section-title">
          {{ $t('merchantDetail.prescreeningQualification') }}
        </div>

        <div class="form-field-card">
          <div class="form-field-label">{{ qualifiedLabels.netAssets }}</div>
          <div class="readonly-answer">{{ yesNoText(form.netAssetsMet) }}</div>
          <div class="field-note">{{ qualifiedLabels.netAssetsNote }}</div>
        </div>

        <div class="form-field-card">
          <div class="form-field-label">{{ qualifiedLabels.directorsVaKnowledge }}</div>
          <div class="readonly-answer">{{ yesNoText(form.directorsVaKnowledge) }}</div>
        </div>
      </template>

      <!-- ── BD Referral ── -->
      <div class="form-field-card">
        <div class="form-field-label">{{ $t('merchantDetail.qBdReferralFull') }}</div>
        <div class="yes-no-radio">
          <label class="yes-no-label">
            <input
              type="radio"
              name="bd_referral"
              :checked="form.bdReferral === true"
              @change="onBdReferralChange(true)"
            />
            <span class="text-sm text-g-700">Yes</span>
          </label>
          <label class="yes-no-label">
            <input
              type="radio"
              name="bd_referral"
              :checked="form.bdReferral === false"
              @change="onBdReferralChange(false)"
            />
            <span class="text-sm text-g-700">No</span>
          </label>
        </div>
        <div class="field-note">{{ $t('merchantDetail.qBdReferralNote') }}</div>
      </div>

      <el-form-item
        v-if="form.bdReferral === true"
        :label="$t('merchantDetail.qBdReferrer')"
        prop="bdUserId"
        :rules="[
          { required: true, message: t('merchantDetail.selectBdReferral'), trigger: 'change' }
        ]"
      >
        <el-select
          v-model="form.bdUserId"
          filterable
          remote
          :remote-method="onUserSearch"
          :loading="userLoading"
          :placeholder="$t('merchantDetail.selectBdReferral')"
          class="w-full"
        >
          <el-option v-for="u in userOptions" :key="u.id" :label="u.label" :value="u.id" />
        </el-select>
      </el-form-item>

      <!-- ── Authorised Person ── -->
      <div class="form-field-card">
        <div class="form-field-label">{{ authorisedPersonLabel }}</div>
        <div class="readonly-answer">{{ yesNoText(form.authorisedPerson) }}</div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ $t('merchantDetail.saveQuestionnaire') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, type FormInstance } from 'element-plus'
  import {
    updateQuestionnaire,
    type AdminMerchantQuestionnaireUpdateRequest,
    type KybQuestionnaire
  } from '@/api/merchant'
  import { fetchRoleUsers, type RoleMemberView } from '@/api/system-manage'

  defineOptions({ name: 'QuestionnaireEditForm' })

  const props = defineProps<{
    visible: boolean
    ecode: string
    questionnaire: KybQuestionnaire | null
  }>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
    saved: [data: KybQuestionnaire]
  }>()

  const { t } = useI18n()

  const formRef = ref<FormInstance>()
  const submitting = ref(false)

  // ─── 表单数据（从问卷快照初始化）───
  const form = reactive<AdminMerchantQuestionnaireUpdateRequest>({
    investorType: 'INSTITUTIONAL_INVESTOR',
    legalName: '',
    primaryActivity: '',
    companyAddress: '',
    website: '',
    bdReferral: false,
    bdUserId: undefined,
    authorisedPerson: false,
    netAssetsMet: false,
    directorsVaKnowledge: false,
    riskDisclosureAccepted: false,
    privacyPolicyAccepted: false
  })

  /** investorType 编辑时不可切换（与原型一致：由入驻时决定） */
  const isQualifiedInvestor = computed(() => form.investorType === 'QUALIFIED_INVESTOR')

  const investorTypeLabel = computed(() =>
    isQualifiedInvestor.value
      ? t('merchantDetail.investorTypeQualified')
      : t('merchantDetail.investorTypeInstitutional')
  )

  const investorClass = computed(() =>
    isQualifiedInvestor.value ? 'badge-qualified' : 'badge-institutional'
  )

  const investorIcon = computed(() =>
    isQualifiedInvestor.value ? 'ri:shield-check-line' : 'ri:building-line'
  )

  /** Qualified 资格题的完整文案（与原型一致） */
  const qualifiedLabels = {
    netAssets:
      'Does the entity maintain net assets (comprising fiat currency, financial instruments, Virtual Assets and/or equity in tangible real estate assets, or any combination thereof) of at least AED 3,500,000 in equivalent value?',
    netAssetsNote:
      'Note: In the calculation of net assets, only 50% of the market value of Virtual Assets belonging to the legal entity may be included.',
    directorsVaKnowledge:
      'Do the directors possess relevant knowledge in respect of Virtual Assets for the nature of the VA Activities to be provided to the legal entity?'
  }

  /** Authorised Person 文案：带公司名 */
  const authorisedPersonLabel = computed(() => {
    const company = form.legalName?.trim() || 'the company'
    return `Are you an authorised person to represent ${company}?`
  })

  /** 只读答案展示：Yes / No / 未填写 */
  function yesNoText(value: boolean | undefined): string {
    if (value === true) return 'Yes'
    if (value === false) return 'No'
    return '—'
  }

  /** BD Referral 切换：选 No 时清空已选推荐人 */
  function onBdReferralChange(value: boolean) {
    form.bdReferral = value
    if (!value) {
      form.bdUserId = undefined
    }
  }

  // ─── 初始化：弹窗打开时用问卷数据填充表单，并加载 BD 人员列表 ───
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        void loadBdUsers()
      }
      if (val && props.questionnaire) {
        const q = props.questionnaire
        form.investorType = q.investorType || 'INSTITUTIONAL_INVESTOR'
        form.legalName = q.legalName || ''
        form.primaryActivity = q.primaryActivity || ''
        form.companyAddress = q.companyAddress || ''
        form.website = q.website || ''
        // 布尔值原样保留：false 是有效答案（No），不能退化成 undefined
        form.bdReferral = typeof q.bdReferral === 'boolean' ? q.bdReferral : undefined
        form.bdUserId = q.bdUserId ?? undefined
        form.authorisedPerson =
          typeof q.authorisedPerson === 'boolean' ? q.authorisedPerson : undefined
        form.netAssetsMet = typeof q.netAssetsMet === 'boolean' ? q.netAssetsMet : undefined
        form.directorsVaKnowledge =
          typeof q.directorsVaKnowledge === 'boolean' ? q.directorsVaKnowledge : undefined
        form.riskDisclosureAccepted = !!q.riskDisclosureAccepted
        form.privacyPolicyAccepted = !!q.privacyPolicyAccepted

        // 预填 BD 推荐人到选项（el-select 需要匹配 option 才能显示 label）
        if (q.bdReferral && q.bdUserId) {
          const bdName = q.bdName || ''
          const bdEmail = q.bdEmail || ''
          userOptions.value = [{ id: q.bdUserId, label: `${bdName} <${bdEmail}>` }]
        } else {
          userOptions.value = []
        }
      }
    }
  )

  // ─── BD 推荐人搜索（从 BUSINESS_DEVELOPER 角色拉取列表，本地过滤）───
  const userLoading = ref(false)
  const userOptions = ref<Array<{ id: number; label: string }>>([])
  const allBdUsers = ref<RoleMemberView[]>([])
  let bdLoaded = false

  /** 加载 BD 人员列表（仅首次打开时请求一次） */
  async function loadBdUsers() {
    if (bdLoaded || userLoading.value) return
    userLoading.value = true
    try {
      allBdUsers.value = await fetchRoleUsers('BUSINESS_DEVELOPER')
      bdLoaded = true
    } catch {
      allBdUsers.value = []
    } finally {
      userLoading.value = false
    }
    filterBdUsers('')
  }

  /** 本地过滤 BD 人员（按姓名/邮箱模糊匹配） */
  function filterBdUsers(query: string) {
    const q = (query || '').toLowerCase().trim()
    let filtered: Array<{ id: number; label: string }>
    if (!q) {
      filtered = allBdUsers.value.map((u) => ({
        id: u.userId,
        label: `${u.displayName} <${u.email}>`
      }))
    } else {
      filtered = allBdUsers.value
        .filter((u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .map((u) => ({
          id: u.userId,
          label: `${u.displayName} <${u.email}>`
        }))
    }
    // 确保已选中的 BD 推荐人始终在选项列表中（回显用）
    if (form.bdUserId && !filtered.find((u) => u.id === form.bdUserId)) {
      const name = props.questionnaire?.bdName || ''
      const email = props.questionnaire?.bdEmail || ''
      filtered.unshift({ id: form.bdUserId, label: `${name} <${email}>` })
    }
    userOptions.value = filtered
  }

  async function onUserSearch(query: string) {
    if (!bdLoaded) await loadBdUsers()
    filterBdUsers(query)
  }

  // ─── 提交 ───
  async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return

      submitting.value = true
      try {
        const payload: AdminMerchantQuestionnaireUpdateRequest = {
          investorType: form.investorType,
          legalName: form.legalName,
          primaryActivity: form.primaryActivity,
          companyAddress: form.companyAddress,
          website: form.website,
          bdReferral: form.bdReferral,
          bdUserId: form.bdReferral === true ? form.bdUserId : undefined,
          authorisedPerson: form.authorisedPerson,
          netAssetsMet: form.netAssetsMet,
          directorsVaKnowledge: form.directorsVaKnowledge,
          riskDisclosureAccepted: form.riskDisclosureAccepted,
          privacyPolicyAccepted: form.privacyPolicyAccepted
        }
        const result = await updateQuestionnaire(props.ecode, payload)
        ElMessage.success(t('merchantDetail.saveQuestionnaireSuccess'))
        emit('saved', result)
        emit('update:visible', false)
      } catch (err) {
        ElMessage.error(
          err instanceof Error ? err.message : t('merchantDetail.saveQuestionnaireFailed')
        )
      } finally {
        submitting.value = false
      }
    })
  }
</script>

<style scoped>
  .questionnaire-edit-form {
    max-height: 60vh;
    padding-right: 4px;
    overflow-y: auto;
  }

  /* 投资者类型标识徽章 */
  .investor-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    margin-bottom: 16px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
  }

  /* 表单字段卡片：统一间距与字体 */
  .form-field-card {
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .form-field-card:last-child {
    border-bottom: none;
  }

  .form-field-label {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-wrap: break-word;
  }

  .badge-institutional {
    color: var(--tone-info-text);
    background: var(--tone-info-bg);
    border: 1px solid var(--tone-info-border);
  }

  .badge-qualified {
    color: var(--tone-purple-text);
    background: var(--tone-purple-bg);
    border: 1px solid var(--tone-purple-border);
  }

  .form-section-title {
    padding-bottom: 6px;
    margin-top: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .field-note {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  /* Yes/No Radio */
  .yes-no-radio {
    display: flex;
    gap: 16px;
  }

  .yes-no-label {
    display: flex;
    gap: 6px;
    align-items: center;
    cursor: pointer;
  }

  .yes-no-label input[type='radio'] {
    width: 16px;
    height: 16px;
    accent-color: var(--el-color-primary);
  }

  /* 只读答案（合格投资者资格题、授权人） */
  .readonly-answer {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  /* 长标签文字换行，避免 Qualified 投资者资格题文字挤压重叠 */
  .questionnaire-edit-form :deep(.el-form-item__label) {
    font-weight: 500;
    line-height: 1.5;
    white-space: normal;
  }
</style>

<style>
  /* 非 scoped：约束弹框 body 高度，确保标题栏在视口内 */
  .questionnaire-edit-dialog .el-dialog__body {
    max-height: calc(100vh - 200px);
    padding: 16px 24px;
    overflow-y: auto;
  }
</style>
