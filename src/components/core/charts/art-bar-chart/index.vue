<!-- 柱状图 -->
<template>
  <div ref="chartRef" :style="{ height: props.height }" v-loading="props.loading"> </div>
</template>

<script setup lang="ts">
  import { useChartOps, useChartComponent } from '@/hooks/core/useChart'
  import { getCssVar } from '@/utils/ui'
  import { graphic, type EChartsOption } from '@/plugins/echarts'
  import type { BarChartProps, BarDataItem } from '@/types/component/chart'

  defineOptions({ name: 'ArtBarChart' })

  const props = withDefaults(defineProps<BarChartProps>(), {
    // 基础配置
    height: useChartOps().chartHeight,
    loading: false,
    isEmpty: false,
    colors: () => useChartOps().colors,
    borderRadius: 4,

    // 数据配置
    data: () => [0, 0, 0, 0, 0, 0, 0],
    xAxisData: () => [],
    barWidth: '40%',
    stack: false,

    // 轴线显示配置
    showAxisLabel: true,
    showAxisLine: true,
    showSplitLine: true,

    // 交互配置
    showTooltip: true,
    showLegend: false,
    tooltipFormatter: undefined,
    barGap: undefined,
    barCategoryGap: undefined,
    legendPosition: 'bottom'
  })

  // 判断是否为多数据
  const isMultipleData = computed(() => {
    return (
      Array.isArray(props.data) &&
      props.data.length > 0 &&
      typeof props.data[0] === 'object' &&
      'name' in props.data[0]
    )
  })

  // 获取颜色配置
  const getColor = (customColor?: string, index?: number) => {
    if (customColor) return customColor

    if (index !== undefined) {
      return props.colors![index % props.colors!.length]
    }

    // 默认渐变色
    return new graphic.LinearGradient(0, 0, 0, 1, [
      {
        offset: 0,
        color: getCssVar('--el-color-primary-light-4')
      },
      {
        offset: 1,
        color: getCssVar('--el-color-primary')
      }
    ])
  }

  // 创建渐变色
  const createGradientColor = (color: string) => {
    return new graphic.LinearGradient(0, 0, 0, 1, [
      {
        offset: 0,
        color: color
      },
      {
        offset: 1,
        color: color
      }
    ])
  }

  // 获取基础样式配置
  const getBaseItemStyle = (
    color: string | InstanceType<typeof graphic.LinearGradient> | undefined,
    borderRadius: number | number[] = props.borderRadius
  ) => ({
    borderRadius,
    color: typeof color === 'string' ? createGradientColor(color) : color
  })

  // 创建系列配置
  const createSeriesItem = (config: {
    name?: string
    data: number[]
    colors?: string[]
    color?: string | InstanceType<typeof graphic.LinearGradient>
    barWidth?: string | number
    stack?: string
    /** 系列级圆角 */
    borderRadius?: number | number[]
    /**
     * 逐索引圆角（堆叠柱用）：与 data 等长。
     * 参考 ECharts 官方 "Stacked Bar with borderRadius"：
     * 只有每个 x 位置上的【最顶层非零柱】才加顶部圆角，中间段保持直角。
     */
    borderRadiusPerIndex?: Array<number | number[]>
  }) => {
    const animationConfig = getAnimationConfig()
    const hasPerIndex = !!config.borderRadiusPerIndex

    // 颜色与逐索引圆角都需要写进 itemStyle：缺失时不要传 {color: undefined}，
    // ECharts 动画插值会读到 undefined 而报错
    const data =
      config.colors || hasPerIndex
        ? config.data.map((value, i) => {
            const color = config.colors?.[i]
            const radius = config.borderRadiusPerIndex?.[i]
            const needsStyle = (color && color.trim()) || radius !== undefined
            if (!needsStyle) return value
            return {
              value,
              itemStyle: {
                ...(color && color.trim() ? getBaseItemStyle(color) : {}),
                ...(radius !== undefined ? { borderRadius: radius } : {})
              }
            }
          })
        : config.data

    return {
      name: config.name,
      data,
      type: 'bar' as const,
      stack: config.stack,
      itemStyle: getBaseItemStyle(config.color, config.borderRadius),
      barWidth: config.barWidth || props.barWidth,
      ...animationConfig
    }
  }

  // 使用新的图表组件抽象
  const {
    chartRef,
    getAxisLineStyle,
    getAxisLabelStyle,
    getAxisTickStyle,
    getSplitLineStyle,
    getAnimationConfig,
    getTooltipStyle,
    getLegendStyle,
    getGridWithLegend
  } = useChartComponent({
    props,
    checkEmpty: () => {
      // 检查单数据情况
      if (Array.isArray(props.data) && typeof props.data[0] === 'number') {
        const singleData = props.data as number[]
        return !singleData.length || singleData.every((val) => val === 0)
      }

      // 检查多数据情况
      if (Array.isArray(props.data) && typeof props.data[0] === 'object') {
        const multiData = props.data as BarDataItem[]
        return (
          !multiData.length ||
          multiData.every((item) => !item.data?.length || item.data.every((val) => val === 0))
        )
      }

      return true
    },
    watchSources: [() => props.data, () => props.xAxisData, () => props.colors],
    generateOptions: (): EChartsOption => {
      const options: EChartsOption = {
        grid: getGridWithLegend(props.showLegend && isMultipleData.value, props.legendPosition, {
          top: 15,
          right: 0,
          left: 0
        }),
        tooltip: props.showTooltip
          ? getTooltipStyle(
              'axis',
              props.tooltipFormatter ? { formatter: props.tooltipFormatter } : {}
            )
          : undefined,
        xAxis: {
          type: 'category',
          data: props.xAxisData,
          axisTick: getAxisTickStyle(),
          axisLine: getAxisLineStyle(props.showAxisLine),
          axisLabel: getAxisLabelStyle(props.showAxisLabel)
        },
        yAxis: {
          type: 'value',
          axisLabel: getAxisLabelStyle(props.showAxisLabel),
          axisLine: getAxisLineStyle(props.showAxisLine),
          splitLine: getSplitLineStyle(props.showSplitLine)
        }
      }

      // 添加图例配置
      if (props.showLegend && isMultipleData.value) {
        options.legend = getLegendStyle(props.legendPosition)
      }

      // 生成系列数据
      if (isMultipleData.value) {
        const multiData = props.data as BarDataItem[]
        /**
         * 堆叠柱圆角（对齐 ECharts 官方示例 bar-stack-borderRadius）：
         * 对每个 x 位置找出该堆叠组「最顶 / 最底」的非零系列，只在最外层加圆角，
         * 段与段之间保持直角，避免连接处出现圆角缝隙。
         *
         * 方向按数值正负决定（正负柱状图）：
         *   正值向上堆叠 → 最顶段圆角在上方 [tl, tr, 0, 0]
         *   负值向下堆叠 → 最底段圆角在下方 [0, 0, br, bl]
         * 同号堆叠时每组只圆外侧一端；正负混合时两端各自圆角。
         */
        // 圆角沿用本组件默认值（4px），与 ArtHBarChart 等其它图表保持一致；
        // 柱宽通常 16-20px，4px 圆角在视觉上是「微圆角」，再大就会接近胶囊形。
        const baseRadius = props.borderRadius
        const topRadius = typeof baseRadius === 'number' ? baseRadius : (baseRadius?.[0] ?? 4)
        const isEmptyValue = (v: unknown) => v === '-' || v == null || Number(v) === 0

        options.series = multiData.map((item, index) => {
          // 优先用数据项自带的色，其次按 colors 数组顺序取
          const computedColor = item.color ?? getColor(props.colors[index], index)

          let borderRadiusPerIndex: Array<number | number[]> | undefined
          if (props.stack) {
            borderRadiusPerIndex = item.data.map((_, j) => {
              // 同一 stack 组内的系列才彼此堆叠，不同组（入金/出金）互不影响
              const groupIndexes = multiData
                .map((series, i) => ({ series, i }))
                .filter(({ series }) => (series.stack ?? 'total') === (item.stack ?? 'total'))
                .filter(({ series }) => !isEmptyValue(series.data?.[j]))
                .map(({ i }) => i)
              const topIndex = groupIndexes.length ? groupIndexes[groupIndexes.length - 1] : -1
              const bottomIndex = groupIndexes.length ? groupIndexes[0] : -1
              const value = Number(item.data[j])
              // 先按正负判断方向，再判断是否处于外侧：
              // 单段组（入金只有一段 / 出金只有一段）top 与 bottom 是同一个索引，不能先判 top
              if (value > 0 && topIndex === index) return [topRadius, topRadius, 0, 0]
              if (value < 0 && bottomIndex === index) return [0, 0, topRadius, topRadius]
              return 0
            })
          }

          const series = createSeriesItem({
            name: item.name,
            data: item.data,
            colors: item.colors,
            color: computedColor,
            barWidth: item.barWidth,
            stack: props.stack ? item.stack || 'total' : undefined,
            // 堆叠时圆角改由逐索引导出，系列级保持直角
            borderRadius: props.stack ? 0 : baseRadius,
            borderRadiusPerIndex
          })
          // 堆叠柱紧贴、不同 stack 组之间留间距
          if (props.barGap) (series as Record<string, unknown>).barGap = props.barGap
          if (props.barCategoryGap)
            (series as Record<string, unknown>).barCategoryGap = props.barCategoryGap
          return series
        })
      } else {
        // 单数据情况
        const singleData = props.data as number[]
        const computedColor = getColor()

        options.series = [
          createSeriesItem({
            data: singleData,
            color: computedColor
          })
        ]
      }

      return options
    }
  })
</script>
