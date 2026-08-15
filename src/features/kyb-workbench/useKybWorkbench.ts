import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCaseFilterOptions, fetchCaseSummary, fetchCases, type CaseQuery } from '@/api/kyb'
import type {
  CaseFilterOptionsView,
  CaseQueueSummaryView,
  KybCaseListItemView,
  PageResult
} from '@/types/models'
import { readOnboardingSemanticError } from '@/features/onboarding'
import { useUiStore } from '@/store/modules/ui'

const DEFAULT_CASE_FILTERS: CaseQuery = {
  pageNum: 1,
  pageSize: 10,
  view: 'PENDING',
  currentStage: '',
  providerCode: '',
  priorityLevel: '',
  slaState: '',
  assignedRole: '',
  ownerKeyword: '',
  caseNo: '',
  merchantName: '',
  processingStatus: '',
  decisionStatus: ''
}

function getString(query: Record<string, unknown>, key: string, fallback = ''): string {
  const value = query[key]
  return typeof value === 'string' ? value : fallback
}

function getNumber(query: Record<string, unknown>, key: string, fallback: number): number {
  const raw = query[key]
  const value = typeof raw === 'string' ? Number(raw) : NaN
  return Number.isFinite(value) ? value : fallback
}

export function useKybWorkbench() {
  const route = useRoute()
  const router = useRouter()
  const uiStore = useUiStore()

  const loading = ref(false)
  const caseSummary = ref<CaseQueueSummaryView | null>(null)
  const caseFilterOptions = ref<CaseFilterOptionsView | null>(null)
  const casePage = ref<PageResult<KybCaseListItemView> | null>(null)

  const caseFilters = computed<CaseQuery>(() => ({
    pageNum: getNumber(
      route.query as Record<string, unknown>,
      'casePageNum',
      DEFAULT_CASE_FILTERS.pageNum
    ),
    pageSize: getNumber(
      route.query as Record<string, unknown>,
      'casePageSize',
      DEFAULT_CASE_FILTERS.pageSize
    ),
    view: getString(route.query as Record<string, unknown>, 'view', DEFAULT_CASE_FILTERS.view),
    currentStage: getString(route.query as Record<string, unknown>, 'caseStage'),
    providerCode: getString(route.query as Record<string, unknown>, 'providerCode'),
    priorityLevel: getString(route.query as Record<string, unknown>, 'casePriority'),
    slaState: getString(route.query as Record<string, unknown>, 'caseSla'),
    assignedRole: getString(route.query as Record<string, unknown>, 'caseRole'),
    ownerKeyword: getString(route.query as Record<string, unknown>, 'caseOwner'),
    caseNo: getString(route.query as Record<string, unknown>, 'caseNo'),
    merchantName: getString(route.query as Record<string, unknown>, 'merchantName'),
    processingStatus: getString(route.query as Record<string, unknown>, 'processingStatus'),
    decisionStatus: getString(route.query as Record<string, unknown>, 'decisionStatus')
  }))

  async function load(force = false): Promise<void> {
    loading.value = true
    try {
      if (force || !caseFilterOptions.value) {
        caseFilterOptions.value = await fetchCaseFilterOptions()
      }
      const [nextPage, nextSummary] = await Promise.all([
        fetchCases(caseFilters.value),
        fetchCaseSummary()
      ])
      casePage.value = nextPage
      caseSummary.value = nextSummary
    } catch (caught) {
      uiStore.showToast(
        'error',
        'Unable to load workbench',
        readOnboardingSemanticError(caught, 'Unable to load the KYB workbench.').message
      )
      if (!caseFilterOptions.value) {
        try {
          caseFilterOptions.value = await fetchCaseFilterOptions()
        } catch {
          // Keep the original fetch error as the primary signal.
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function updateQuery(patch: Record<string, string | number | undefined>): Promise<void> {
    const query = {
      ...route.query,
      ...patch
    }
    Object.keys(query).forEach((key) => {
      if (query[key] === '' || query[key] == null) {
        delete query[key]
      }
    })
    await router.replace({ query })
  }

  async function submitCaseFilters(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form)
    await updateQuery({
      casePageNum: 1,
      view: String(data.get('view') || ''),
      caseStage: String(data.get('currentStage') || ''),
      providerCode: String(data.get('providerCode') || ''),
      casePriority: String(data.get('priorityLevel') || ''),
      caseSla: String(data.get('slaState') || ''),
      caseRole: String(data.get('assignedRole') || ''),
      caseOwner: String(data.get('ownerKeyword') || '').trim(),
      caseNo: String(data.get('caseNo') || '').trim(),
      merchantName: String(data.get('merchantName') || '').trim(),
      processingStatus: String(data.get('processingStatus') || ''),
      decisionStatus: String(data.get('decisionStatus') || '')
    })
  }

  async function goToCasePage(pageNum: number): Promise<void> {
    await updateQuery({
      casePageNum: pageNum
    })
  }

  async function resetCaseFilters(): Promise<void> {
    await updateQuery({
      casePageNum: 1,
      casePageSize: DEFAULT_CASE_FILTERS.pageSize,
      view: DEFAULT_CASE_FILTERS.view,
      caseStage: '',
      providerCode: '',
      casePriority: '',
      caseSla: '',
      caseRole: '',
      caseOwner: '',
      caseNo: '',
      merchantName: '',
      processingStatus: '',
      decisionStatus: ''
    })
  }

  watch(
    () => route.fullPath,
    () => {
      void load(false)
    }
  )

  onMounted(() => {
    void load(true)
  })

  return {
    loading,
    caseFilters,
    caseSummary,
    caseFilterOptions,
    casePage,
    submitCaseFilters,
    goToCasePage,
    resetCaseFilters,
    load
  }
}
