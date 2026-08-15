<!-- v2 shared component — Merchant Search Input (从 v1 src/components/common/MerchantSearchInput.vue 移植) -->
<template>
  <div class="merchant-search" ref="rootRef">
    <input
      type="search"
      class="merchant-search__input"
      :class="inputClass"
      :placeholder="placeholder"
      :value="search"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <svg
      v-if="showChevron"
      class="merchant-search__chevron"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
    <div v-if="dropdownVisible" class="merchant-search__dropdown" :style="dropdownStyle">
      <div v-if="results.length === 0 && !loading" class="merchant-search__empty">
        {{ emptyText }}
      </div>
      <div
        v-for="merchant in results"
        :key="merchant.code"
        class="merchant-search__row"
        @mousedown.prevent="selectMerchant(merchant)"
      >
        <span class="merchant-search__name">{{ merchant.merchantName }}</span>
        <slot name="row-meta" :merchant="merchant" />
      </div>
      <div v-if="hasMore" class="merchant-search__more" @mousedown.prevent="loadMore">
        {{ loading ? 'Loading...' : 'Load more...' }}
      </div>
      <div v-if="loading && results.length === 0" class="merchant-search__empty">Searching...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { fetchMerchantList, type MerchantListItemView } from '@/api/merchantSearch'

  const props = withDefaults(
    defineProps<{
      modelValue?: MerchantListItemView | null
      search?: string
      placeholder?: string
      inputClass?: string
      dropdownStyle?: Record<string, string>
      pageSize?: number
      debounceMs?: number
      showChevron?: boolean
      emptyText?: string
      closeOnClickOutside?: boolean
    }>(),
    {
      modelValue: null,
      search: '',
      placeholder: 'Search merchant...',
      inputClass: '',
      dropdownStyle: () => ({}),
      pageSize: 20,
      debounceMs: 200,
      showChevron: false,
      emptyText: 'No merchants found',
      closeOnClickOutside: true
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [merchant: MerchantListItemView | null]
    'update:search': [value: string]
    select: [merchant: MerchantListItemView]
  }>()

  const rootRef = ref<HTMLElement | null>(null)
  const dropdownVisible = ref(false)
  const results = ref<MerchantListItemView[]>([])
  const loading = ref(false)
  const page = ref(1)
  const hasMore = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function searchMerchants(query: string, nextPage: number): Promise<void> {
    loading.value = true
    try {
      const result = await fetchMerchantList({
        merchantName: query || undefined,
        pageIndex: nextPage,
        pageSize: props.pageSize
      })
      const records = result.records ?? []
      if (nextPage === 1) {
        results.value = records
      } else {
        results.value = [...results.value, ...records]
      }
      page.value = nextPage
      hasMore.value = nextPage * props.pageSize < (result.total ?? 0)
    } catch {
      if (nextPage === 1) results.value = []
    } finally {
      loading.value = false
    }
  }

  function onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    emit('update:search', value)
    dropdownVisible.value = true
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => searchMerchants(value, 1), props.debounceMs)
  }

  function onFocus(): void {
    dropdownVisible.value = true
    if (results.value.length === 0) {
      void searchMerchants(props.search, 1)
    }
  }

  function onBlur(): void {
    setTimeout(() => {
      dropdownVisible.value = false
    }, 150)
  }

  function selectMerchant(merchant: MerchantListItemView): void {
    emit('update:modelValue', merchant)
    emit('update:search', merchant.merchantName)
    emit('select', merchant)
    dropdownVisible.value = false
  }

  function loadMore(): void {
    void searchMerchants(props.search, page.value + 1)
  }

  function onDocumentClick(event: MouseEvent): void {
    if (!props.closeOnClickOutside) return
    const target = event.target as HTMLElement
    if (rootRef.value && !rootRef.value.contains(target)) {
      dropdownVisible.value = false
    }
  }

  watch(
    () => props.search,
    (value) => {
      if (!value && results.value.length > 0) {
        results.value = []
      }
    }
  )

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
    if (debounceTimer) clearTimeout(debounceTimer)
  })
</script>

<style scoped>
  .merchant-search {
    position: relative;
    display: inline-flex;
  }
  .merchant-search__input {
    width: 100%;
    padding: 7px 36px 7px 12px;
    border: 1px solid var(--ink-200);
    border-radius: 7px;
    font-size: 13px;
    font-family: inherit;
    color: var(--ink-700);
    background: #fff;
    min-height: 32px;
  }
  .merchant-search__input:focus {
    border-color: var(--accent-600);
    outline: none;
    box-shadow: 0 0 0 3px var(--accent-100);
  }
  .merchant-search__chevron {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--ink-400);
    pointer-events: none;
  }
  .merchant-search__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    width: max-content;
    max-width: 320px;
    max-height: 240px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--ink-200);
    border-radius: 8px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    z-index: 100;
  }
  .merchant-search__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--ink-50);
    transition: background 0.15s;
  }
  .merchant-search__row:hover {
    background: var(--accent-50);
  }
  .merchant-search__row:last-child {
    border-bottom: none;
  }
  .merchant-search__name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-950);
  }
  .merchant-search__empty {
    padding: 12px 14px;
    font-size: 12px;
    color: var(--ink-500);
    text-align: center;
    cursor: default;
  }
  .merchant-search__empty:hover {
    background: transparent;
  }
  .merchant-search__more {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 500;
    color: var(--accent-600);
    text-align: center;
    cursor: pointer;
    border-top: 1px solid var(--ink-50);
  }
  .merchant-search__more:hover {
    background: var(--accent-50);
  }
</style>
