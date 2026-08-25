import type { PostAuthRoute } from '@/types/models'

export type WorkbenchEntryId = 'operations' | 'risk' | 'compliance' | 'system_administration'
export type WorkbenchSignalTone = 'neutral' | 'success' | 'warning'

export interface WorkbenchStatusSignal {
  tone: WorkbenchSignalTone
  label: string
  message: string
}

export interface WorkbenchAction {
  actionId: string
  label: string
  destinationOrIntent: string
}

export interface WorkbenchSecondaryRoute {
  entryId: WorkbenchEntryId
  title: string
  destinationOrIntent: string
}

export interface WorkbenchEntryViewModel {
  currentEntryId: WorkbenchEntryId
  entryTitle: string
  landingReasonOrActiveRole: string
  authorizedEntryIds: WorkbenchEntryId[]
  workspaceStatusLabel: string
  workspaceStatusTone: 'success' | 'warning'
  workspaceStatusDescription: string
  primaryAction: WorkbenchAction
  secondaryRoutes: WorkbenchSecondaryRoute[]
  systemAdminBootstrapActions?: WorkbenchAction[]
}

const ENTRY_TITLES: Record<WorkbenchEntryId, string> = {
  operations: 'Operations',
  risk: 'Risk',
  compliance: 'Compliance',
  system_administration: 'System Administration'
}

const DEFAULT_ALLOWED_ENTRIES: WorkbenchEntryId[] = ['operations', 'risk', 'compliance']
const ROLE_ENTRY_MAP: Record<string, WorkbenchEntryId[]> = {
  SYSTEM_OWNER: ['operations', 'risk', 'compliance', 'system_administration'],
  ADMIN: ['operations', 'risk', 'compliance', 'system_administration'],
  SYSTEM_ADMIN: ['system_administration'],
  OPERATIONS: ['operations'],
  SYSTEM_STAFF: [],
  RISK: ['risk'],
  COMPLIANCE: ['compliance']
}

const ENTRY_ORDER: WorkbenchEntryId[] = [
  'operations',
  'risk',
  'compliance',
  'system_administration'
]

export function normalizeWorkbenchEntryId(value?: string | null): WorkbenchEntryId {
  return isWorkbenchEntryId(value) ? value : 'operations'
}

export function resolveAuthorizedEntryIds(
  postAuthRoute?: PostAuthRoute | null
): WorkbenchEntryId[] {
  if (!postAuthRoute) {
    return DEFAULT_ALLOWED_ENTRIES
  }
  return sortEntryIds(postAuthRoute.authorizedEntryIds.filter(isWorkbenchEntryId))
}

export function resolveAuthorizedEntryIdsFromRoles(
  roles?: readonly string[] | null
): WorkbenchEntryId[] {
  if (!roles?.length) {
    return []
  }
  return sortEntryIds(
    Array.from(
      new Set(roles.flatMap((role) => ROLE_ENTRY_MAP[role] ?? []).filter(isWorkbenchEntryId))
    )
  )
}

export function buildWorkbenchPostAuthRouteFromRoles(
  roles?: readonly string[] | null
): PostAuthRoute {
  const authorizedEntryIds = resolveAuthorizedEntryIdsFromRoles(roles)
  return {
    routeTarget: authorizedEntryIds.length > 0 ? 'workbench_entry' : 'controlled_handoff',
    authorizedEntryIds,
    currentEntryId: authorizedEntryIds[0] ?? null,
    handoffReasonSummary:
      authorizedEntryIds.length > 0
        ? 'Authorized admin entry is ready.'
        : 'No authorized admin entry is currently available.'
  }
}

export function mergeWorkbenchPostAuthRoute(
  current: PostAuthRoute | null | undefined,
  roles?: readonly string[] | null
): PostAuthRoute {
  const routeFromRoles = buildWorkbenchPostAuthRouteFromRoles(roles)
  const mergedAuthorizedEntryIds = sortEntryIds(
    [...(current?.authorizedEntryIds ?? []), ...routeFromRoles.authorizedEntryIds].filter(
      isWorkbenchEntryId
    )
  )
  const currentEntryId = normalizeWorkbenchEntryId(current?.currentEntryId)
  const resolvedCurrentEntryId = mergedAuthorizedEntryIds.includes(currentEntryId)
    ? currentEntryId
    : (mergedAuthorizedEntryIds[0] ?? null)
  return {
    routeTarget: mergedAuthorizedEntryIds.length > 0 ? 'workbench_entry' : 'controlled_handoff',
    authorizedEntryIds: mergedAuthorizedEntryIds,
    currentEntryId: resolvedCurrentEntryId,
    handoffReasonSummary:
      mergedAuthorizedEntryIds.length > 0
        ? 'Authorized admin entry is ready.'
        : 'No authorized admin entry is currently available.'
  }
}

export function buildWorkbenchEntryViewModel(
  postAuthRoute?: PostAuthRoute | null
): WorkbenchEntryViewModel {
  const authorizedEntryIds = resolveAuthorizedEntryIds(postAuthRoute)
  const currentEntryId = authorizedEntryIds.includes(
    normalizeWorkbenchEntryId(postAuthRoute?.currentEntryId)
  )
    ? normalizeWorkbenchEntryId(postAuthRoute?.currentEntryId)
    : (authorizedEntryIds[0] ?? 'operations')

  return {
    currentEntryId,
    entryTitle: ENTRY_TITLES[currentEntryId],
    landingReasonOrActiveRole: buildLandingReason(currentEntryId),
    authorizedEntryIds,
    ...buildWorkspaceStatus(currentEntryId),
    primaryAction: buildPrimaryAction(currentEntryId),
    secondaryRoutes: buildSecondaryRoutes(currentEntryId, authorizedEntryIds),
    systemAdminBootstrapActions:
      currentEntryId === 'system_administration' ? buildSystemAdminActions() : undefined
  }
}

export function entryTitle(entryId: WorkbenchEntryId): string {
  return ENTRY_TITLES[entryId]
}

function buildLandingReason(entryId: WorkbenchEntryId): string {
  if (entryId === 'system_administration') {
    return 'Bootstrap role'
  }
  return `${ENTRY_TITLES[entryId]} role`
}

function buildWorkspaceStatus(
  entryId: WorkbenchEntryId
): Pick<
  WorkbenchEntryViewModel,
  'workspaceStatusLabel' | 'workspaceStatusTone' | 'workspaceStatusDescription'
> {
  if (entryId === 'system_administration') {
    return {
      workspaceStatusLabel: 'Bootstrap access ready',
      workspaceStatusTone: 'warning',
      workspaceStatusDescription:
        'Only first-batch employee access setup is available in this surface.'
    }
  }
  return {
    workspaceStatusLabel: 'All systems normal',
    workspaceStatusTone: 'success',
    workspaceStatusDescription: 'No pending alerts require your immediate attention.'
  }
}

function buildPrimaryAction(entryId: WorkbenchEntryId): WorkbenchAction {
  if (entryId === 'system_administration') {
    return {
      actionId: 'employee_access_bootstrap',
      label: 'Prepare employee access',
      destinationOrIntent: '/system/employees'
    }
  }
  return {
    actionId: `enter_${entryId}_workspace`,
    label: `Enter ${ENTRY_TITLES[entryId]} Workspace`,
    destinationOrIntent: `${entryId}.workspace_entry`
  }
}

function buildSecondaryRoutes(
  currentEntryId: WorkbenchEntryId,
  authorizedEntryIds: WorkbenchEntryId[]
): WorkbenchSecondaryRoute[] {
  return authorizedEntryIds
    .filter((entryId) => entryId !== currentEntryId)
    .slice(0, 2)
    .map((entryId) => ({
      entryId,
      title: ENTRY_TITLES[entryId],
      destinationOrIntent:
        entryId === 'system_administration' ? '/system/employees' : `${entryId}.workspace_entry`
    }))
}

function buildSystemAdminActions(): WorkbenchAction[] {
  return [
    {
      actionId: 'employee_access_bootstrap',
      label: 'Prepare employee access',
      destinationOrIntent: '/system/employees'
    },
    {
      actionId: 'initial_role_assignment',
      label: 'Review initial role assignment',
      destinationOrIntent: '/system/employees'
    }
  ]
}

function isWorkbenchEntryId(value?: string | null): value is WorkbenchEntryId {
  return typeof value === 'string' && ENTRY_ORDER.includes(value as WorkbenchEntryId)
}

function sortEntryIds(values: WorkbenchEntryId[]): WorkbenchEntryId[] {
  return Array.from(new Set(values)).sort((a, b) => ENTRY_ORDER.indexOf(a) - ENTRY_ORDER.indexOf(b))
}
