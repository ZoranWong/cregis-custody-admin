<!-- 返回按钮 —— 全站统一 -->
<template>
  <!--
    全站统一的返回入口。

    统一前有 5 种写法混用：
      · el-button text + 图标（7 处，主流）
      · 默认按钮（gas/detail、merchants/detail）
      · 裸 ElButton + 手写 <svg>（fee/detail）
      · type="primary"（strong-auth，返回是次要动作却用主按钮）
      · 文案硬编码 Back（risk/assessment，未 i18n）

    本组件固定三件事，消除分歧：
      1. 样式 —— el-button text（次要动作弱化显示，不抢主按钮）
      2. 图标 —— 统一 ri:arrow-left-line，尺寸走 text-icon-md
      3. 文案 —— 默认 common.back；页面需要指向具体去处时传 text

    ⚠️ 图标尺寸必须显式声明：ArtSvgIcon 以 font-size 驱动渲染，
       不声明会继承 el-button 的字号，导致各页图标大小不一。
  -->
  <el-button text class="art-back-btn" @click="onClick">
    <ArtSvgIcon icon="ri:arrow-left-line" class="text-icon-md mr-1" />
    <slot>{{ text ?? $t('common.back') }}</slot>
  </el-button>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { goBack } from '@/utils/navigation/back'

  defineOptions({ name: 'ArtBackButton' })

  interface Props {
    /**
     * 文案。不传则用通用的「返回」。
     * 仅当返回目标不明确（如可跳多个来源页）时才传具体文案，如「返回规则列表」。
     */
    text?: string
    /**
     * 兼容旧用法：是否偏好历史返回。
     * 现在历史返回是默认行为，该参数仅为调用方兼容保留。
     */
    history?: boolean
    /** 明确的目标路由名：仅在浏览器历史不可用时兜底 */
    to?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    text: undefined,
    history: false,
    to: undefined
  })

  const router = useRouter()

  /*
   * 返回统一走浏览器历史（router.go(-1)）：列表页把 tab / 筛选 / 页码写进 URL，
   * 历史返回能原样恢复现场；push 到固定路由会丢掉这些状态。
   *
   * 无历史可退（直接打开详情链接 / 新标签页打开）时，router.back() 会跳出应用，
   * 此时才回落到 `to` 指定的上级页面；两者都没有就交给浏览器。
   */
  function onClick() {
    goBack(router, props.to)
  }
</script>
