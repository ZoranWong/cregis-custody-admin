/**
 * 卡片布局偏好模块
 *
 * 管理列表页摘要卡片的排列密度（每行 4 / 8 张）。
 * 用户在任意页面切换后全局生效，跨会话保持。
 *
 * @module store/modules/cardLayout
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 卡片每行列数 */
export type CardDensity = 4 | 8

export const useCardLayoutStore = defineStore(
  'cardLayoutStore',
  () => {
    // 默认每行 8 张（紧凑单行）；4 列档为两行（摘要一行 + 审查结果一行）
    const density = ref<CardDensity>(8)

    const setDensity = (value: CardDensity) => (density.value = value)

    /** 在 4 / 8 之间切换 */
    const toggleDensity = () => (density.value = density.value === 4 ? 8 : 4)

    return {
      density,
      setDensity,
      toggleDensity
    }
  },
  {
    persist: {
      key: 'card-layout',
      storage: localStorage
    }
  }
)
