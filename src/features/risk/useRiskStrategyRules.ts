import { computed, onMounted, reactive, ref } from "vue";
import { fetchRiskStrategyRules, fetchRiskStrategyRuleDetail } from "@/api/risk";
import type { RiskStrategyRuleListRequest, RiskStrategyRuleListItem, RiskStrategyRuleListResponse } from "@/features/risk/strategyTypes";

export function useRiskStrategyRules(initial: RiskStrategyRuleListRequest = {}) {
  const loading = ref(false);
  const errorMessage = ref("");
  const response = ref<RiskStrategyRuleListResponse | null>(null);
  const selectedRule = ref<any>(null);
  const filters = reactive<RiskStrategyRuleListRequest>({ page: 1, pageSize: 20, ...initial });

  const rules = computed<RiskStrategyRuleListItem[]>(() => response.value?.items ?? []);
  const pagination = computed(() => response.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });

  async function load(): Promise<void> {
    loading.value = true; errorMessage.value = "";
    try { response.value = await fetchRiskStrategyRules(filters) as any; }
    catch (e) { errorMessage.value = e instanceof Error ? e.message : "Rules unavailable."; }
    finally { loading.value = false; }
  }

  async function openRuleDrawer(ruleId: string): Promise<void> {
    try { selectedRule.value = await fetchRiskStrategyRuleDetail(ruleId); }
    catch { /* toast handled elsewhere */ }
  }

  function updateFilter(next: Partial<RiskStrategyRuleListRequest>): void {
    Object.assign(filters, next, { page: next.page ?? 1 });
    void load();
  }

  onMounted(() => { void load(); });

  return { filters, loading, errorMessage, rules, selectedRule, pagination, load, updateFilter, openRuleDrawer };
}