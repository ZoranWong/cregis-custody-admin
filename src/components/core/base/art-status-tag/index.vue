<!-- 语义状态标签 -->
<template>
  <!--
    统一的语义状态标签。

    背景：全站曾有 27 个各自实现的 xxxTagType() 函数，返回值都收敛在
    success / warning / danger / info 四值 —— 语义层本来是一致的，
    分散的只是「语义 → 颜色」这一步。本组件把这一步固定下来。

    ⚠️ 必须传 :type（而不是自绘 class）：
    el-ui.scss 给「无 type 的 el-tag」定了中性灰规则并带 !important，
    不传 type 会被压成灰色（方向 tag 踩过一次这个坑）。

    与 <ArtDirectionTag> 的关系：方向是「方位」语义（入金/出金），
    与这里是正交的两个维度 —— 「入金但被拒」需要同时表达方向与结果，
    因此两者不共用配色，但共用同一套 tag 几何与描边强度。
  -->
  <el-tag v-if="status" size="small" :type="EP_TYPE[status]" :effect="effect">
    <slot>{{ text }}</slot>
  </el-tag>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtStatusTag' })

  /**
   * 4 种语义，颜色由 el-ui.scss 的 .el-tag--{type} 统一绑到 --tone-* token
   * （亮/暗两套均已达标）：success 绿 · warning 琥珀 · danger 红 · info 蓝
   */
  export type StatusTone = 'success' | 'warning' | 'danger' | 'info'

  /*
   * 语义 → Element type 的显式映射。
   *
   * 目前两者**恰好同名**，但不能依赖这个巧合：EP 的 type 是组件实现细节
   * （将来可能新增 error/primary 等），而 StatusTone 是业务语义。
   * 显式映射表让两者解耦 —— 以后语义增减只需改这张表，
   * 若语义名与 EP type 分道扬镳，颜色绑定依然正确。
   */
  const EP_TYPE: Record<StatusTone, 'success' | 'warning' | 'danger' | 'info'> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info'
  }

  interface Props {
    /** 语义状态；传空则不渲染（便于直接绑定可选值） */
    status?: StatusTone | null
    /** 显示文案（也可用默认插槽） */
    text?: string
    /** 效果：light（浅底，默认）/ dark（实心）/ plain（描边） */
    effect?: 'light' | 'dark' | 'plain'
  }

  withDefaults(defineProps<Props>(), {
    status: null,
    text: '',
    effect: 'light'
  })
</script>
