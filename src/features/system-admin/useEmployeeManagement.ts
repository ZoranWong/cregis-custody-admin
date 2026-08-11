import { computed, onMounted, reactive, ref, watch } from "vue";
import { fetchEmployees, createEmployee, enableEmployee, disableEmployee, resetEmployeePassword, reissueEmployeeActivation } from "@/api/system-manage";
import type { EmployeeRowView, EmployeePageQuery, EmployeeCreateInput, EmployeeStatus } from "@/features/system-admin/types";

export function useEmployeeManagement() {
  const loading = ref(false);
  const creating = ref(false);
  const page = ref<{ records: EmployeeRowView[]; pagination: { page: number; pageSize: number; totalPages: number; totalCount: number } } | null>(null);
  const rows = computed(() => page.value?.records || []);
  const pagination = computed(() => page.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 });
  const filters = reactive<EmployeePageQuery>({ pageNum: 1, pageSize: 20, status: 'all' as EmployeeStatus, searchQuery: '' });
  const createModalOpen = ref(false);
  const createForm = reactive<EmployeeCreateInput>({ displayName: '', email: '', initialRoleCode: 'SYSTEM_ADMIN', authorizedDomainIds: ['system_administration'], defaultEntryId: 'system_administration' });

  async function load(force = false): Promise<void> {
    if (loading.value && !force) return;
    loading.value = true;
    try { page.value = await fetchEmployees(filters); }
    catch { /* toast handled elsewhere */ }
    finally { loading.value = false; }
  }

  function openCreateModal(): void { createModalOpen.value = true; }
  function closeCreateModal(): void { createModalOpen.value = false; resetCreateForm(); }

  async function submitCreate(): Promise<void> {
    creating.value = true;
    try {
      await createEmployee({ ...createForm });
      closeCreateModal();
      await load(true);
    } catch { /* toast handled elsewhere */ }
    finally { creating.value = false; }
  }

  async function triggerRowAction(row: EmployeeRowView, action: string): Promise<void> {
    try {
      switch (action) {
        case 'reissue_activation_link': await reissueEmployeeActivation(row.accountId); break;
        case 'disable': await disableEmployee(row.accountId); break;
        case 'enable': await enableEmployee(row.accountId); break;
        case 'reset_password': await resetEmployeePassword(row.accountId, buildTemporaryPassword(row.displayName)); break;
      }
      await load(true);
    } catch { /* toast handled elsewhere */ }
  }

  function resetCreateForm(): void {
    createForm.displayName = '';
    createForm.email = '';
    createForm.initialRoleCode = 'SYSTEM_ADMIN';
    createForm.authorizedDomainIds = ['system_administration'];
    createForm.defaultEntryId = 'system_administration';
  }

  watch(() => [filters.status, filters.searchQuery], () => { filters.pageNum = 1; });
  watch(() => [filters.status, filters.searchQuery, filters.pageNum, filters.pageSize], () => { void load(true); });
  onMounted(() => { void load(); });

  return { loading, rows, page, pagination, filters, createModalOpen, createForm, creating, openCreateModal, closeCreateModal, submitCreate, triggerRowAction, load };
}

function buildTemporaryPassword(displayName: string): string {
  const prefix = displayName.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'Temp';
  return `${prefix}Temp123`;
}