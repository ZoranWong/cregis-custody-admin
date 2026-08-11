import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchMerchantDetail } from "@/api/merchant";
import type { MerchantDetailView } from "@/types/models";
import { useUiStore } from "@/store/modules/ui";

export function useMerchantDetail() {
  const route = useRoute();
  const router = useRouter();
  const uiStore = useUiStore();
  const loading = ref(false);
  const detail = ref<MerchantDetailView | null>(null);

  const merchantId = computed(() => String(route.params.merchantId || ""));
  const returnTo = computed(() => (typeof route.query.returnTo === "string" ? route.query.returnTo : ""));

  async function load(): Promise<void> {
    if (!merchantId.value) {
      return;
    }
    loading.value = true;
    try {
      detail.value = await fetchMerchantDetail(merchantId.value, returnTo.value);
    } catch (caught) {
      uiStore.showToast("error", "Unable to load merchant", caught instanceof Error ? caught.message : "Unable to load merchant detail.");
    } finally {
      loading.value = false;
    }
  }

  async function backToList(): Promise<void> {
    const target = detail.value?.backToListTarget || "/merchants";
    await router.push(target);
  }

  async function openOnboarding(): Promise<void> {
    const target = detail.value?.onboardingTarget || "/kyb";
    await router.push(target);
  }

  async function copyMerchantCode(): Promise<void> {
    const copyValue = detail.value?.copyValue || detail.value?.code || "";
    if (!copyValue) {
      uiStore.showToast("info", "Nothing to copy", "This merchant does not have a copyable code yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyValue);
      uiStore.showToast("success", "Merchant code copied", copyValue);
    } catch {
      uiStore.showToast("error", "Unable to copy", "Clipboard access is not available in the current browser context.");
    }
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
    detail,
    backToList,
    openOnboarding,
    copyMerchantCode,
    load
  };
}
