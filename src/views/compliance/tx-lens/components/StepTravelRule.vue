<!-- Step: Travel Rule — Travel Rule 事件（纯编排组件） -->
<template>
  <div>
    <TravelRuleVaspIdentity
      v-if="safeData && showVaspIdentity"
      :vasp-declaration="safeData.vaspDeclaration!"
      :ivms101-valid="safeData.ivms101Valid"
      :ivms101-status="safeData.ivms101Status"
      :order-id="orderId"
      :needs-manual-process="needsManualProcess"
      @reviewed="$emit('reviewed')"
    />
    <TravelRulePiiDetails v-if="safeData && showPiiDetails" :ivms101-pii="safeData.ivms101Pii!" />
    <TravelRuleOperations
      v-if="safeData && showOperations"
      :data="safeData"
      :direction="direction"
      :order-id="orderId"
      :stage-state="stageState"
      @reviewed="$emit('reviewed')"
    />
    <TravelRuleEmptyHint v-if="!safeData || showEmptyHint" :direction="direction" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { TravelRuleTabView } from '@/features/compliance/types'
  import TravelRuleVaspIdentity from './TravelRuleVaspIdentity.vue'
  import TravelRulePiiDetails from './TravelRulePiiDetails.vue'
  import TravelRuleOperations from './TravelRuleOperations.vue'
  import TravelRuleEmptyHint from './TravelRuleEmptyHint.vue'

  const props = defineProps<{
    data: TravelRuleTabView | null
    direction?: string
    orderId?: string
    stageState?: string | null
  }>()

  defineEmits<{
    reviewed: []
  }>()

  // 安全取值，避免 null 传递给子组件
  const safeData = computed(() => props.data ?? null)

  // 父组件仅保留"是否渲染子组件"的判断，不包含业务逻辑

  /**
   * 需要手动处理：以 overview 接口的 travelRule 字段为准，
   * 值为 'mismatch' 时表示 VASP 不匹配需人工审核。
   */
  const needsManualProcess = computed(() => {
    return props.stageState?.toLowerCase() === 'mismatch'
  })

  /** VASP Identity：对手方 VASP 身份声明有内容 */
  const showVaspIdentity = computed(() => {
    const d = props.data?.vaspDeclaration
    return !!d && !!(d.declaredName || d.declaredDid || d.discoveredName || d.discoveredDid)
  })

  /** PII Details：IVMS101 有 PII 数据 */
  const showPiiDetails = computed(
    () => !!props.data?.ivms101Pii && Object.keys(props.data.ivms101Pii).length > 0
  )

  /**
   * Operations：出金方向（可能 Manual Resolution）或发到过 Notabene（Network Negotiation）。
   * overview.travelRule 有值时也显示（如 mismatch 需人工审核）。
   */
  const showOperations = computed(() => {
    if (!props.data) return false
    const outgoing = props.direction !== 'incoming'
    const hasNetwork = !!props.data.notabeneTxId
    const hasTravelRuleState = !!props.stageState && props.stageState !== 'na'
    return outgoing || hasNetwork || hasTravelRuleState
  })

  /** 空提示：所有子区块都不显示时才兜底出现 */
  const showEmptyHint = computed(
    () => !showVaspIdentity.value && !showPiiDetails.value && !showOperations.value
  )
</script>
