<!-- Travel Rule Empty Hint — 无数据时的提示卡片 -->
<template>
  <div class="art-card mb-4">
    <div class="p-4 flex items-center gap-2">
      <ArtSvgIcon :icon="hintIcon" class="text-tone-info-text text-icon-md" />
      <span class="text-sm text-g-700">{{ $t(hintText) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    direction?: string
  }>()

  /** 出金=未发送，入金=未收到 */
  const hintIcon = computed(() =>
    props.direction === 'outgoing' ? 'ri:mail-send-line' : 'ri:mail-unread-line'
  )
  const hintText = computed(() =>
    props.direction === 'outgoing'
      ? 'txLens.detail.noTravelRuleSent'
      : 'txLens.detail.noTravelRuleNotification'
  )
</script>
