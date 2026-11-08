<!-- Travel Rule VASP Identity — 对手方 VASP 身份声明与 IVMS101 状态 -->
<template>
  <div class="art-card mb-4">
    <div class="p-4 border-b border-[var(--default-border)]">
      <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.vaspIdentity') }}</span>
    </div>
    <div class="p-4">
      <div class="vasp-identity-box">
        <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspDisplayName }}</div>
        <div class="grid grid-cols-2 gap-3">
          <div v-if="vaspJurisdiction" class="flex flex-col gap-0.5">
            <span class="field-label">{{ $t('txLens.detail.vaspJurisdiction') }}</span>
            <span class="text-sm text-g-800 font-medium">{{ vaspJurisdiction }}</span>
          </div>
          <div v-if="vaspRegulatory" class="flex flex-col gap-0.5">
            <span class="field-label">{{ $t('txLens.detail.vaspRegulatory') }}</span>
            <span class="text-sm text-g-800 font-medium">{{ vaspRegulatory }}</span>
          </div>
          <div v-if="vaspTrCapable" class="flex flex-col gap-0.5">
            <span class="field-label">{{ $t('txLens.detail.trCapableLabel') }}</span>
            <span class="text-sm text-g-800 font-medium">{{ vaspTrCapable }}</span>
          </div>
          <div v-if="vaspDid" class="flex flex-col gap-0.5">
            <span class="field-label">{{ $t('txLens.detail.vaspDid') }}</span>
            <span class="text-xs text-g-800 font-medium font-mono break-all">{{ vaspDid }}</span>
          </div>
        </div>
      </div>
      <!-- IVMS101 PII 交换状态 -->
      <div
        v-if="hasIvms101Data"
        class="flex items-center justify-between px-3 py-2.5 bg-g-100 border border-[var(--default-border)] rounded-md"
      >
        <span class="text-xs font-semibold text-g-600">{{
          $t('txLens.detail.ivms101PiiExchange')
        }}</span>
        <span class="text-xs font-semibold" :class="ivms101StatusClass">{{
          ivms101StatusText
        }}</span>
      </div>

      <!-- VASP 核对不一致提示 -->
      <div v-if="showVaspMismatchActions" class="vasp-mismatch-notice mt-3">
        <ArtSvgIcon icon="ri:alert-line" class="text-icon-md mt-0.5 flex-shrink-0" />
        <div class="min-w-0">
          <div class="text-sm font-semibold">{{
            $t('txLens.detail.vaspMismatchContactTitle')
          }}</div>
          <div class="text-xs mt-0.5 leading-relaxed">
            {{ $t('txLens.detail.vaspMismatchContactBody') }}
          </div>
          <div class="text-xs mt-1 font-medium">{{ vaspMismatchHint }}</div>
        </div>
      </div>

      <!-- 强制通过按钮（仅 VASP MISMATCH + 可手动处理时） -->
      <div v-if="showVaspConfirmButton" class="flex gap-3 mb-4 mt-3 flex-wrap">
        <el-button type="primary" size="small" :loading="vaspActing" @click="handleVaspConfirm">{{
          $t('txLens.detail.resolve')
        }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import type { VaspDeclarationView } from '@/features/compliance/types'
  import { confirmVaspMismatch } from '@/api/compliance'
  import { useCountryStore } from '@/store/modules/country'
  import { useUserStore } from '@/store/modules/user'

  const props = defineProps<{
    vaspDeclaration: VaspDeclarationView
    ivms101Valid?: boolean | null
    ivms101Status?: string | null
    orderId?: string
    /** 是否处于可手动处理的状态（CREATED / PII_APPENDED / UNMATCHED） */
    needsManualProcess?: boolean
  }>()

  const emit = defineEmits<{
    reviewed: []
  }>()

  const { t, locale } = useI18n()
  const countryStore = useCountryStore()
  const userStore = useUserStore()

  // ─── VASP 展示字段 ───
  const vaspDisplayName = computed(
    () => props.vaspDeclaration.discoveredName || props.vaspDeclaration.declaredName || '--'
  )

  const vaspDid = computed(() => props.vaspDeclaration.declaredDid || null)

  const vaspJurisdiction = computed(() => {
    const did = vaspDid.value
    if (!did?.startsWith('did:web:')) return null
    const host = did.slice('did:web:'.length).split(':')[0]
    const tld = host.split('.').filter(Boolean).pop()?.toUpperCase()
    return tld ? countryStore.countryName(tld) : null
  })

  // 接口未下发监管状态 / TR 能力
  const vaspRegulatory = computed(() => null as string | null)
  const vaspTrCapable = computed(() => null as string | null)

  // ─── IVMS101 状态 ───
  const hasIvms101Data = computed(
    () => typeof props.ivms101Valid === 'boolean' || !!props.ivms101Status
  )

  const ivms101StatusText = computed(() => {
    if (typeof props.ivms101Valid === 'boolean') {
      return props.ivms101Valid
        ? `${t('txLens.detail.ivmsValid')} ✓`
        : `${t('txLens.detail.ivmsInvalid')} ✕`
    }
    if (props.ivms101Status) return props.ivms101Status
    return '--'
  })

  const ivms101StatusClass = computed(() => {
    if (props.ivms101Valid === true) return 'text-[var(--el-color-success)]'
    if (props.ivms101Valid === false) return 'text-[var(--el-color-danger)]'
    return 'text-g-600'
  })

  // ─── VASP MISMATCH ───
  const vaspReviewStatus = computed(() => (props.vaspDeclaration.reviewStatus || '').toUpperCase())
  /** 不一致提示总是显示（只要 reviewStatus === MISMATCH） */
  const showVaspMismatchActions = computed(() => vaspReviewStatus.value === 'MISMATCH')
  /** 强制通过按钮额外需要处于可手动处理状态 */
  const showVaspConfirmButton = computed(
    () => showVaspMismatchActions.value && props.needsManualProcess
  )

  const vaspMismatchHint = computed(() => {
    const reason = props.vaspDeclaration.reason
    if (reason === 'no-vasp-pending') return t('txLens.detail.vaspMismatchNoVasp')
    if (reason === 'name-mismatch') return t('txLens.detail.vaspMismatchName')
    if (reason === 'did-mismatch') return t('txLens.detail.vaspMismatchDid')
    return t('txLens.detail.vaspMismatchGeneric')
  })

  // ─── VASP 强制通过 ───
  const vaspActing = ref(false)

  /** 操作人标识：接口以 query 传入，后端用于审计留痕 */
  const operator = computed(() => String(userStore.info?.userName || '') || undefined)

  async function handleVaspConfirm(): Promise<void> {
    if (!props.orderId) return
    try {
      await ElMessageBox.confirm(
        t('txLens.detail.vaspForceApproveConfirm'),
        t('txLens.detail.vaspForceApprove'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return
    }
    vaspActing.value = true
    try {
      await confirmVaspMismatch(props.orderId, operator.value)
      ElMessage.success(t('txLens.detail.vaspForceApproveDone'))
      emit('reviewed')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : t('txLens.detail.actionFailed'))
    } finally {
      vaspActing.value = false
    }
  }

  onMounted(() => {
    countryStore.ensureLoaded(locale.value)
  })
</script>

<style scoped>
  .vasp-identity-box {
    padding: 14px 18px;
    margin-bottom: 12px;
    background: var(--art-gray-100);
    border: 1px solid var(--default-border);
    border-radius: 8px;
  }

  .field-label {
    font-size: var(--font-size-label);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .vasp-mismatch-notice {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 12px;
    color: var(--tone-progress-text);
    background: var(--tone-progress-bg);
    border: 1px solid var(--tone-progress-border);
    border-radius: 8px;
  }
</style>
