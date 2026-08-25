import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchEmployees,
  createEmployee,
  enableEmployee,
  disableEmployee,
  resetEmployeePassword,
  reissueEmployeeActivation,
  applyAccessReview
} from '@/api/system-manage'
import type {
  EmployeeRowView,
  EmployeePageQuery,
  EmployeeCreateInput,
  EmployeeStatus,
  EmployeeAccessBindingView,
  AuthorizedDomainId,
  DomainOption,
  RoleOption
} from '@/features/system-admin/types'

export const EMPLOYEE_DOMAIN_OPTIONS: DomainOption[] = [
  { id: 'operations', label: 'Operations' },
  { id: 'risk', label: 'Risk' },
  { id: 'compliance', label: 'Compliance' },
<<<<<<< HEAD
  { id: 'audit', label: 'Audit' },
=======
>>>>>>> worktree-menu-restructure
  { id: 'system_administration', label: 'System Administration' }
]

export const EMPLOYEE_ROLE_OPTIONS: RoleOption[] = [
  { code: 'ADMIN', label: 'Administrator' },
  { code: 'SYSTEM_ADMIN', label: 'System Admin' },
  { code: 'OPERATIONS', label: 'Operations' },
  { code: 'RISK', label: 'Risk' },
<<<<<<< HEAD
  { code: 'COMPLIANCE', label: 'Compliance' },
  { code: 'AUDIT', label: 'Audit' }
=======
  { code: 'COMPLIANCE', label: 'Compliance' }
>>>>>>> worktree-menu-restructure
]

const DEFAULT_QUERY: EmployeePageQuery = {
  pageNum: 1,
  pageSize: 20,
  status: 'all' as EmployeeStatus,
  searchQuery: ''
}

export function useEmployeeManagement() {
  const router = useRouter()

  const loading = ref(false)
  const creating = ref(false)
  const accessSaving = ref(false)
  const page = ref<{
    records: EmployeeRowView[]
    pagination: { page: number; pageSize: number; totalPages: number; totalCount: number }
  } | null>(null)
  const rows = computed(() => page.value?.records || [])
  const pagination = computed(
    () => page.value?.pagination ?? { page: 1, pageSize: 20, totalPages: 0, totalCount: 0 }
  )
  const filters = reactive<EmployeePageQuery>({ ...DEFAULT_QUERY })
  const createModalOpen = ref(false)
  const accessDrawerOpen = ref(false)
  const createForm = reactive<EmployeeCreateInput>({
    displayName: '',
    email: '',
    initialRoleCode: EMPLOYEE_ROLE_OPTIONS[0].code,
    authorizedDomainIds: ['system_administration'],
    defaultEntryId: 'system_administration'
  })
  const selectedAccess = ref<EmployeeAccessBindingView | null>(null)
  const submittingActionId = ref('')

  async function load(force = false): Promise<void> {
    if (loading.value && !force) return
    loading.value = true
    try {
      page.value = await fetchEmployees(filters)
    } catch {
      /* toast handled elsewhere */
    } finally {
      loading.value = false
    }
  }

  function openCreateModal(): void {
    createModalOpen.value = true
  }
  function closeCreateModal(): void {
    createModalOpen.value = false
    resetCreateForm()
  }

  async function submitCreate(): Promise<void> {
    creating.value = true
    try {
      await createEmployee({ ...createForm })
      closeCreateModal()
      await load(true)
    } catch {
      /* toast handled elsewhere */
    } finally {
      creating.value = false
    }
  }

  function openAccessDrawer(row: EmployeeRowView): void {
    selectedAccess.value = {
      accountId: row.accountId,
      displayName: row.displayName,
      email: row.email,
      roleCode: row.roleCode,
      authorizedDomainIds: [...row.authorizedDomainIds],
      defaultEntryId: row.defaultEntryId
    }
    accessDrawerOpen.value = true
  }

  function closeAccessDrawer(): void {
    accessDrawerOpen.value = false
    selectedAccess.value = null
  }

  async function saveAccessBinding(): Promise<void> {
    if (!selectedAccess.value) return
    accessSaving.value = true
    try {
      await applyAccessReview(selectedAccess.value)
      closeAccessDrawer()
      await load(true)
    } catch {
      /* toast handled elsewhere */
    } finally {
      accessSaving.value = false
    }
  }

  async function triggerRowAction(row: EmployeeRowView, action: string): Promise<void> {
    submittingActionId.value = `${row.accountId}:${action}`
    try {
      const id = String(row.accountId)
      switch (action) {
        case 'reissue_activation_link':
          await reissueEmployeeActivation(id)
          break
        case 'disable':
          await disableEmployee(id)
          break
        case 'enable':
          await enableEmployee(id)
          break
        case 'reset_password':
          await resetEmployeePassword(id, buildTemporaryPassword(row.displayName))
          break
        case 'review_access':
          openAccessDrawer(row)
          break
      }
      if (action !== 'review_access') {
        await load(true)
      }
    } catch {
      /* toast handled elsewhere */
    } finally {
      submittingActionId.value = ''
    }
  }

  function updateSelectedDomains(domainId: AuthorizedDomainId, checked: boolean): void {
    if (!selectedAccess.value) return
    const next = checked
      ? Array.from(new Set([...selectedAccess.value.authorizedDomainIds, domainId]))
      : selectedAccess.value.authorizedDomainIds.filter((v) => v !== domainId)
    selectedAccess.value.authorizedDomainIds = next
    if (!next.includes(selectedAccess.value.defaultEntryId || 'operations')) {
      selectedAccess.value.defaultEntryId = next[0] || null
    }
  }

  function updateCreateDomains(domainId: AuthorizedDomainId, checked: boolean): void {
    const next = checked
      ? Array.from(new Set([...createForm.authorizedDomainIds, domainId]))
      : createForm.authorizedDomainIds.filter((v) => v !== domainId)
    createForm.authorizedDomainIds = next.length > 0 ? next : ['system_administration']
    if (!createForm.authorizedDomainIds.includes(createForm.defaultEntryId)) {
      createForm.defaultEntryId = createForm.authorizedDomainIds[0]
    }
  }

  function isActionPending(row: EmployeeRowView, action: string): boolean {
    return submittingActionId.value === `${row.accountId}:${action}`
  }

  function goToWorkbench(): void {
    router.push({ name: 'home' })
  }

  function resetCreateForm(): void {
    createForm.displayName = ''
    createForm.email = ''
    createForm.initialRoleCode = EMPLOYEE_ROLE_OPTIONS[0].code
    createForm.authorizedDomainIds = ['system_administration']
    createForm.defaultEntryId = 'system_administration'
  }

  watch(
    () => [filters.status, filters.searchQuery],
    () => {
      filters.pageNum = 1
    }
  )
  watch(
    () => [filters.status, filters.searchQuery, filters.pageNum, filters.pageSize],
    () => {
      void load(true)
    }
  )
  onMounted(() => {
    void load()
  })

  return {
    loading,
    rows,
    page,
    pagination,
    filters,
    createModalOpen,
    accessDrawerOpen,
    createForm,
    selectedAccess,
    creating,
    accessSaving,
    roleOptions: EMPLOYEE_ROLE_OPTIONS,
    domainOptions: EMPLOYEE_DOMAIN_OPTIONS,
    openCreateModal,
    closeCreateModal,
    submitCreate,
    openAccessDrawer,
    closeAccessDrawer,
    saveAccessBinding,
    triggerRowAction,
    updateSelectedDomains,
    updateCreateDomains,
    isActionPending,
    goToWorkbench,
    load
  }
}

function buildTemporaryPassword(displayName: string): string {
  const prefix = displayName.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'Temp'
  return `${prefix}Temp123`
}
