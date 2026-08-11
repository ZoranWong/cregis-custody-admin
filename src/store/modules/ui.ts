// v2 store — UI 状态管理（参考 v1 src/stores/ui.ts）
import { ref } from "vue";
import { defineStore } from "pinia";

export interface ToastState {
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export const useUiStore = defineStore("ui", () => {
  const toast = ref<ToastState | null>(null);

  function showToast(type: ToastState["type"], title: string, message: string): void {
    toast.value = { type, title, message };
    window.setTimeout(() => {
      if (toast.value?.title === title && toast.value?.message === message) {
        toast.value = null;
      }
    }, 4200);
  }

  function clearToast(): void { toast.value = null; }

  return { toast, showToast, clearToast };
});