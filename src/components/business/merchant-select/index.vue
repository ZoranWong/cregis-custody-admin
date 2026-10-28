<!-- 商户下拉选择器（支持远程搜索） -->
<template>
  <el-select
    :model-value="displayValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :filterable="true"
    :remote="true"
    :remote-method="handleRemoteSearch"
    :class="className"
    @update:model-value="onSelectChange"
    @visible-change="onVisibleChange"
    @clear="emit('update:modelValue', '')"
  >
    <!--
      从详情返回时 options 还未加载，el-select 会直接把 modelValue（ecode）当 label
      显示。这里追加一个占位 option 保证立即显示企业名称；全量加载后自动被正式数据覆盖。
    -->
    <el-option
      v-if="showSelectedLabel"
      :key="'sel-' + modelValue"
      :label="selectedLabel"
      :value="modelValue"
    />
    <el-option v-for="m in options" :key="m.ecode" :label="m.name" :value="m.ecode" />
    <template v-if="loading && options.length === 0" #empty>
      <div class="text-g-400 text-sm py-2">Loading...</div>
    </template>
  </el-select>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { fetchMerchantList } from '@/api/merchant'

  const props = withDefaults(
    defineProps<{
      /** 选中值（ecode），空串表示未选中 */
      modelValue?: string
      /**
       * 选中商户的名称。从详情返回、options 还未加载时由它提供 label，
       * 避免 el-select 直接把 modelValue（ecode）当文字显示。
       */
      selectedLabel?: string
      placeholder?: string
      clearable?: boolean
      disabled?: boolean
      className?: string
      /** 首次挂载时自动加载的条目数 */
      pageSize?: number
    }>(),
    {
      modelValue: '',
      selectedLabel: '',
      placeholder: 'Select merchant...',
      clearable: true,
      disabled: false,
      className: '!w-48',
      pageSize: 200
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    select: [ecode: string, name: string]
  }>()

  interface MerchantOption {
    ecode: string
    name: string
  }

  const options = ref<MerchantOption[]>([])
  const loading = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let hasLoaded = false

  /**
   * 选项变化：同时回传 ecode 和名称，调用方可把名称存入全局状态，
   * 以便从详情返回、options 还未加载时下拉框仍能显示企业名称。
   */
  function onSelectChange(ecode: string): void {
    emit('update:modelValue', ecode)
    const hit = options.value.find((o) => o.ecode === ecode)
    emit('select', ecode, hit?.name || ecode)
  }

  /**
   * 有选中值但选项未加载时的回退 label。
   *
   * el-select 在没有匹配选项时直接把 modelValue（ecode）当文字显示 —— 从详情页
   * 返回时会闪出 ecode，这不可接受。调用方把企业名称通过 `selectedLabel` 传进来，
   * 这里造一个同名占位 option；名称缺失时宁可不显示选中态（只显示 placeholder），
   * 也不回退成 ecode。
   */
  const showSelectedLabel = computed(
    () =>
      !!props.modelValue &&
      !!props.selectedLabel &&
      !options.value.some((o) => o.ecode === props.modelValue)
  )

  /**
   * 传给 el-select 的显示值。名称未知时先清空选中态（显示 placeholder），
   * 等 options 加载完再回填，绝不把 ecode 当作名称展示。
   */
  const displayValue = computed(() => {
    if (!props.modelValue) return ''
    if (options.value.some((o) => o.ecode === props.modelValue)) return props.modelValue
    return showSelectedLabel.value ? props.modelValue : ''
  })

  /** 从接口加载商户列表（带搜索关键词） */
  async function load(keyword?: string): Promise<void> {
    loading.value = true
    try {
      const res = await fetchMerchantList({
        pageNum: 1,
        pageSize: props.pageSize,
        merchantName: keyword?.trim() || undefined,
        sort: 'merchantName_asc'
      })
      const map = new Map<string, string>()
      for (const m of res.records ?? []) {
        if (m.code) map.set(m.code, m.merchantName || m.code)
      }
      options.value = [...map.entries()].map(([ecode, name]) => ({ ecode, name }))
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  /** 远程搜索：输入关键词后从后端搜索，300ms 防抖 */
  function handleRemoteSearch(query: string): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => load(query), 300)
  }

  /** 下拉展开时，若从未加载过则先加载全量 */
  function onVisibleChange(visible: boolean): void {
    if (visible && !hasLoaded) {
      hasLoaded = true
      void load()
    }
  }

  /** 当 modelValue 从外部清空时，恢复全量列表 */
  watch(
    () => props.modelValue,
    (val) => {
      if (!val && hasLoaded) {
        hasLoaded = false
        void load()
      }
    }
  )

  onMounted(() => {
    // 首次挂载时加载全量，避免首次展开时空白
    hasLoaded = true
    void load()
  })
</script>
