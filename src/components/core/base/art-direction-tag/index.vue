<!-- 交易方向标签（入金 / 出金） -->
<template>
  <!--
    基于 <el-tag> 渲染，几何（圆角 4px / 高度 / 内边距 / 字号 / 边框）100% 继承
    Element，仅通过专用 class 覆盖配色。这样不会出现「一会儿圆角一会儿没有、
    这里有边框那里没有」的不一致 —— 全站 tag 共用同一套几何。

    ⚠️ 配色必须走 class 而非内联 :style：
    el-ui.scss 里为统一全站 tag 用了 !important，而样式表中的 !important
    优先级**高于内联样式** —— 内联设置的颜色会被打回默认（中性灰），
    导致入金/出金变成同一个颜色。class 与其它 tag 走同一条路径，不受此影响。
  -->
  <el-tag size="small" :class="isInbound ? 'art-dir-in' : 'art-dir-out'">
    <span class="inline-flex items-center gap-1">
      <!-- 方向箭头：色觉障碍用户无法仅凭颜色分辨方向，图标提供冗余信息通道 -->
      <ArtSvgIcon
        :icon="isInbound ? 'ri:arrow-down-line' : 'ri:arrow-up-line'"
        class="text-icon-xs"
      />
      {{ label }}
    </span>
  </el-tag>
</template>

<script setup lang="ts">
  import { computed, useSlots } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'ArtDirectionTag' })

  /**
   * 交易方向标签。
   *
   * 配色走 --tone-inbound/outbound（金融惯例：入金绿 / 出金蓝），
   * 与「处理结果」语义（tone-done/error）正交 —— 这样「入金但被拒」
   * 这类组合才能同时表达方向与结果，而不会互相抢占颜色。
   *
   * 亮/暗两套均已实测达标：入金 5.02:1 / 10.37:1，出金 6.70:1 / 7.11:1。
   */
  interface Props {
    /** 是否为入金（资金流入）。出金传 false */
    inbound: boolean
    /** 自定义文案；不传则按当前语言取「入金 / 出金」 */
    text?: string
  }

  const props = defineProps<Props>()
  const { t } = useI18n()
  const slots = useSlots()

  const isInbound = computed(() => props.inbound)
  const label = computed(
    () =>
      props.text ?? (slots.default ? '' : t(isInbound.value ? 'common.inbound' : 'common.outbound'))
  )
</script>
