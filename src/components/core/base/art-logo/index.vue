<!-- 系统logo -->
<template>
  <div class="flex-cc">
    <img :style="logoStyle" src="/logo.svg" alt="logo" class="h-auto" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtLogo' })

  interface Props {
    /** logo 大小（高度，px） */
    size?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 24
  })

  // logo.svg 是 32:32 的图标，按正方形等比缩放
  const logoStyle = computed(() => ({
    height: `${props.size}px`,
    width: `${props.size}px`
  }))
</script>
