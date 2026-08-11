import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  fetchMerchantFilterOptions,
  fetchMerchantListSummary,
  fetchMerchants,
  type MerchantQuery
} from "@/api/merchant";
import type {
  MerchantFilterOptionsView,
  MerchantListItemView,
  MerchantListSummaryView,
  PageResult
} from "@/types/models";
import { useUiStore } from "@/store/modules/ui";

const DEFAULT_FILTERS: MerchantQuery = {
  pageNum: 1,
  pageSize: 10,
  view: "ALL",
  status: "",
  merchantType: "",
  watchBucket: "",
  keyword: ""
};

function getString(query: Record<string, unknown>, key: string, fallback = ""): string {
  const value = query[key];
  return typeof value === "string" ? value : fallback;
}

function getNumber(query: Record<string, unknown>, key: string, fallback: number): number {
  const raw = query[key];
  const value = typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

export function useMerchantList() {
  const route = useRoute();
  const router = useRouter();
  const uiStore = useUiStore();

  const loading = ref(false);
  const advancedOpen = ref(false);
  const summary = ref<MerchantListSummaryView | null>(null);
  const filterOptions = ref<MerchantFilterOptionsView | null>(null);
  const page = ref<PageResult<MerchantListItemView> | null>(null);

  const filters = computed<MerchantQuery>(() => ({
    pageNum: getNumber(route.query as Record<string, unknown>, "pageNum", DEFAULT_FILTERS.pageNum),
    pageSize: getNumber(route.query as Record<string, unknown>, "pageSize", DEFAULT_FILTERS.pageSize),
    view: getString(route.query as Record<string, unknown>, "view", DEFAULT_FILTERS.view),
    status: getString(route.query as Record<string, unknown>, "status"),
    merchantType: getString(route.query as Record<string, unknown>, "merchantType"),
    watchBucket: getString(route.query as Record<string, unknown>, "watchBucket"),
    keyword: getString(route.query as Record<string, unknown>, "keyword")
  }));

  async function load(): Promise<void> {
    loading.value = true;
    try {
      const [nextSummary, nextFilterOptions, nextPage] = await Promise.all([
        fetchMerchantListSummary(),
        fetchMerchantFilterOptions(),
        fetchMerchants(filters.value)
      ]);
      summary.value = nextSummary;
      filterOptions.value = nextFilterOptions;
      page.value = nextPage;
    } catch (caught) {
      uiStore.showToast("error", "Unable to load merchants", caught instanceof Error ? caught.message : "Unable to load the merchant module.");
    } finally {
      loading.value = false;
    }
  }

  async function updateQuery(patch: Record<string, string | number | undefined>): Promise<void> {
    const query = {
      ...route.query,
      ...patch
    };
    Object.keys(query).forEach((key) => {
      if (query[key] === "" || query[key] == null) {
        delete query[key];
      }
    });
    await router.replace({ query });
  }

  async function applyFilters(patch: Record<string, string | number | undefined>): Promise<void> {
    await updateQuery(patch);
  }

  async function setView(view: string): Promise<void> {
    await updateQuery({
      pageNum: 1,
      view
    });
  }

  async function submitFilters(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    await updateQuery({
      pageNum: 1,
      status: String(data.get("status") || ""),
      merchantType: String(data.get("merchantType") || ""),
      watchBucket: String(data.get("watchBucket") || ""),
      keyword: String(data.get("keyword") || "").trim()
    });
  }

  async function goToPage(pageNum: number): Promise<void> {
    await updateQuery({ pageNum });
  }

  async function setPageSize(pageSize: number): Promise<void> {
    await updateQuery({
      pageNum: 1,
      pageSize
    });
  }

  async function resetFilters(): Promise<void> {
    await updateQuery({
      pageNum: DEFAULT_FILTERS.pageNum,
      pageSize: DEFAULT_FILTERS.pageSize,
      view: DEFAULT_FILTERS.view,
      status: "",
      merchantType: "",
      watchBucket: "",
      keyword: ""
    });
  }

  function toDetailRoute(merchantId: string | number) {
    return {
      name: "merchant-detail",
      params: { merchantId },
      query: {
        returnTo: route.fullPath
      }
    };
  }

  function toggleAdvanced(): void {
    advancedOpen.value = !advancedOpen.value;
  }

  watch(
    () => route.fullPath,
    () => {
      void load();
    }
  );

  onMounted(() => {
    void load();
  });

  return {
    loading,
    summary,
    filterOptions,
    page,
    filters,
    advancedOpen,
    setView,
    submitFilters,
    goToPage,
    setPageSize,
    resetFilters,
    toggleAdvanced,
    toDetailRoute,
    applyFilters,
    load
  };
}
