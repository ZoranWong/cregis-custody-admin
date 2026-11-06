<!-- BD 推荐人编辑弹窗：用于已入驻商户修改问卷 BD 推荐人 -->
<template>
  <el-dialog
    v-model="visible"
    :title="$t('merchantDetail.editBdReferral')"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="bd-referral-form">
      <div class="form-item">
        <label class="form-label">{{ $t('merchantDetail.qBdReferral') }}</label>
        <el-switch
          v-model="form.bdReferral"
          :active-text="$t('common.yes')"
          :inactive-text="$t('common.no')"
        />
      </div>

      <div v-if="form.bdReferral" class="form-item">
        <label class="form-label">{{ $t('merchantDetail.bdUser') }}</label>
        <el-select
          v-model="form.bdUserId"
          filterable
          :loading="loading"
          :placeholder="$t('merchantDetail.selectBdUser')"
          class="!w-full"
          clearable
        >
          <el-option
            v-for="u in bdUsers"
            :key="u.userId"
            :label="`${u.displayName || u.username} (${u.email})`"
            :value="u.userId"
          />
        </el-select>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import {
    updateQuestionnaireBdReferral,
    type AdminMerchantQuestionnaireBdRequest,
    type KybQuestionnaire
  } from '@/api/merchant'
  import { fetchRoleUsers } from '@/api/system-manage'
  import type { RoleMemberView } from '@/features/system-admin/types'

  defineOptions({ name: 'BdReferralEditor' })

  const BD_ROLE_CODE = 'BUSINESS_DEVELOPER'

  const props = defineProps<{
    ecode: string
    /** 当前问卷数据，用于弹窗展示初始值 */
    questionnaire?: KybQuestionnaire | null
    /** 保存成功后回调，父组件用于刷新详情数据 */
    onSuccess?: () => void
  }>()

  const { t } = useI18n()

  const visible = ref(false)
  const saving = ref(false)
  const loading = ref(false)
  const bdUsers = ref<RoleMemberView[]>([])

  const form = ref<{
    bdReferral: boolean
    bdUserId: number | undefined
  }>({
    bdReferral: props.questionnaire?.bdReferral ?? false,
    bdUserId: props.questionnaire?.bdUserId ?? undefined
  })

  function open() {
    form.value = {
      bdReferral: props.questionnaire?.bdReferral ?? false,
      bdUserId: props.questionnaire?.bdUserId ?? undefined
    }
    visible.value = true
    void loadBdUsers()
  }

  function handleClose() {
    visible.value = false
  }

  async function loadBdUsers() {
    if (bdUsers.value.length > 0) return
    loading.value = true
    try {
      bdUsers.value = await fetchRoleUsers(BD_ROLE_CODE)
    } catch {
      bdUsers.value = []
    } finally {
      loading.value = false
    }
  }

  async function handleSave() {
    if (form.value.bdReferral && !form.value.bdUserId) {
      ElMessage.warning(t('merchantDetail.selectBdUserRequired'))
      return
    }

    const payload: AdminMerchantQuestionnaireBdRequest = {
      bdReferral: form.value.bdReferral,
      bdUserId: form.value.bdReferral ? form.value.bdUserId : undefined
    }

    saving.value = true
    try {
      await updateQuestionnaireBdReferral(props.ecode, payload)
      ElMessage.success(t('merchantDetail.bdReferralSaveSuccess'))
      visible.value = false
      props.onSuccess?.()
    } catch {
      ElMessage.error(t('merchantDetail.bdReferralSaveFailed'))
    } finally {
      saving.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped>
  .bd-referral-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
