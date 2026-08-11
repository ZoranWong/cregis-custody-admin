import { computed, onMounted, reactive, ref } from "vue";
import { fetchRiskStrategyReviews } from "@/api/risk";
import type { RiskStrategyReviewListRequest } from "@/features/risk/strategyGovernanceTypes";

export function useRiskStrategyReview(initial: RiskStrategyReviewListRequest = {}) {
  const reviewLoading = ref(false);
  const reviewResponse = ref<any>(null);
  const reviewFilters = reactive<RiskStrategyReviewListRequest>({ page: 1, pageSize: 20, ...initial });

  const reviews = computed<any[]>(() => reviewResponse.value?.items ?? []);
  const reviewPagination = computed(() => reviewResponse.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });

  async function reviewLoad(): Promise<void> {
    reviewLoading.value = true;
    try { reviewResponse.value = await fetchRiskStrategyReviews(reviewFilters) as any; }
    catch { /* toast handled elsewhere */ }
    finally { reviewLoading.value = false; }
  }

  function updateReviewFilter(next: Partial<RiskStrategyReviewListRequest>): void {
    Object.assign(reviewFilters, next, { page: next.page ?? 1 });
    void reviewLoad();
  }

  onMounted(() => { void reviewLoad(); });

  return { reviewLoading, reviewFilters, reviews, reviewPagination, reviewLoad: reviewLoad, updateReviewFilter };
}