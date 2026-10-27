<!-- Mock / 后端未就绪 提示条（与 rules detail 的提示样式一致） -->
<template>
  <!--
    全站「mock 数据 / 后端未就绪」提示的统一实现。

    样式与 compliance/rules/detail 中的自定义规则提示保持一致：
    琥珀底 + 琥珀描边 + alert 图标 + 标题 + 说明。
    文案通过 i18n 传入，组件内不硬编码。
  -->
  <div class="mock-notice" role="note">
    <ArtSvgIcon :icon="icon" class="text-tone-progress-text text-icon-md mt-0.5 flex-shrink-0" />
    <div class="min-w-0">
      <div v-if="title" class="text-body font-semibold text-g-900">{{ title }}</div>
      <div class="text-body text-g-700 leading-relaxed" :class="{ 'mt-0.5': title }">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtMockNotice' })

  withDefaults(
    defineProps<{
      /** 标题（可选） */
      title?: string
      /** 正文描述 */
      description: string
      /** 图标，默认 alert */
      icon?: string
    }>(),
    { title: undefined, icon: 'ri:alert-line' }
  )
</script>

<style scoped>
  .mock-notice {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--tone-progress-bg);
    border: 1px solid var(--tone-progress-border);
    border-radius: 8px;
  }
</style>
