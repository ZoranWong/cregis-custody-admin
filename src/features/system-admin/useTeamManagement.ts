import { computed, onMounted, ref } from 'vue'
import {
  fetchEmployees,
  createEmployee,
  enableEmployee,
  disableEmployee,
  fetchRoleOverview,
  batchUpdateRoleUsers,
  updateReviewersForLevel
} from '@/api/system-manage'
import type { EmployeePageQuery, EmployeeRowView, ReviewFlowView, RoleOverviewView } from './types'
import { useUserStore } from '@/store/modules/user'

// ─── Types ───

export interface TeamMember {
  id: string
  initials: string
  name: string
  email: string
  status: 'Active' | 'Pending' | 'Suspended'
  owner?: boolean
  roleCode?: string
}

// ─── Owner detection ───
// Owner 从 roleOverviews 的 SYSTEM_OWNER 角色获取
// TODO: Backend should provide a dedicated GET /system/owner API

function mapStatus(row: EmployeeRowView): 'Active' | 'Pending' | 'Suspended' {
  if (row.accountStatus === 'disabled') return 'Suspended'
  if (row.activationStatus === 'pending' || row.activationStatus === 'expired') return 'Pending'
  return 'Active'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function toTeamMember(row: EmployeeRowView, isOwner: boolean): TeamMember {
  return {
    id: row.accountId,
    initials: getInitials(row.displayName),
    name: row.displayName,
    email: row.email,
    status: mapStatus(row),
    owner: isOwner || undefined,
    roleCode: row.roleCode
  }
}

// ─── Composable ───

export function useTeamManagement() {
  const loading = ref(false)
  const allMembers = ref<TeamMember[]>([])
  const inviteDialogOpen = ref(false)
  const showTransferDialog = ref(false)
  const transferTo = ref('')
  /** 邀请成员：角色固定为 admin，不再让运营选择 */
  const inviteForm = ref({ name: '', email: '' })

  // ─── Roles Tab state ───
  const rolesLoading = ref(false)
  const roleOverviews = ref<RoleOverviewView[]>([])
  const reviewFlows = ref<ReviewFlowView[]>([])
  /** 当前正在编辑的角色 section key */
  const editingSection = ref<string | null>(null)
  /** 编辑中的角色成员缓冲（roleCode → userId[]） */
  const sectionBuffer = ref<Record<string, number[]>>({})
  /** 当前正在编辑的复核流 severity */
  const editingFlow = ref<string | null>(null)
  /** 编辑中的复核流缓冲 */
  const flowBuffer = ref<Record<string, ReviewFlowView | null>>({})

  const owner = computed(() => {
    const ownerRole = roleOverviews.value.find((r) => r.roleCode === 'SYSTEM_OWNER')
    const u = ownerRole?.users?.[0]
    if (!u) return null
    return {
      id: String(u.userId),
      initials: u.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      name: u.displayName,
      email: u.email,
      status: u.accountStatus === 'disabled' ? 'Suspended' : 'Active'
    }
  })
  const regularMembers = computed(() => {
    const ownerUserId = owner.value ? Number(owner.value.id) : null
    return allMembers.value.filter((m) => Number(m.id) !== ownerUserId)
  })

  /** 当前登录用户是否为 Owner */
  const isCurrentUserOwner = computed(() => {
    const currentUserId = useUserStore().getUserInfo?.userId
    return !!currentUserId && owner.value && Number(owner.value.id) === currentUserId
  })

  /** Map from userId to TeamMember for quick lookup */
  const memberMap = computed(() => {
    const map = new Map<string, TeamMember>()
    allMembers.value.forEach((m) => map.set(m.id, m))
    return map
  })

  // ─── Members ───

  async function loadMembers(): Promise<void> {
    loading.value = true
    try {
      const query: EmployeePageQuery = {
        pageNum: 1,
        pageSize: 200, // Fetch all for team management
        status: 'all'
      }
      const result = await fetchEmployees(query)
      const rows = result.records

      allMembers.value = rows.map((row) => toTeamMember(row, false))
    } catch (error) {
      console.error('Failed to load members:', error)
      // Fallback to empty on error
      allMembers.value = []
    } finally {
      loading.value = false
    }
  }

  async function suspendMember(userId: string): Promise<void> {
    try {
      await disableEmployee(userId)
      // Update local state
      const member = allMembers.value.find((m) => m.id === userId)
      if (member) member.status = 'Suspended'
    } catch (error) {
      console.error('Failed to suspend member:', error)
      throw error
    }
  }

  async function recoverMember(userId: string): Promise<void> {
    try {
      await enableEmployee(userId)
      // Update local state
      const member = allMembers.value.find((m) => m.id === userId)
      if (member) member.status = 'Active'
    } catch (error) {
      console.error('Failed to recover member:', error)
      throw error
    }
  }

  async function inviteMember(data: { name: string; email: string }): Promise<void> {
    try {
      await createEmployee({
        displayName: data.name,
        email: data.email,
        // 邀请统一按 admin 角色创建（产品要求，不再提供角色选择）
        initialRoleCode: 'admin',
        authorizedDomainIds: ['operations'],
        defaultEntryId: 'operations'
      })
      // Reload to get the new member
      await loadMembers()
    } catch (error) {
      console.error('Failed to invite member:', error)
      throw error
    }
  }

  async function transferOwnership(newOwnerId: string): Promise<void> {
    const ownerRole = roleOverviews.value.find((r) => r.roleCode === 'SYSTEM_OWNER')
    const oldOwnerId = ownerRole?.users?.[0]?.userId
    const addUserIds = [Number(newOwnerId)]
    const removeUserIds = oldOwnerId ? [oldOwnerId] : []

    await batchUpdateRoleUsers('SYSTEM_OWNER', { addUserIds, removeUserIds })
    await loadRolesData()
  }

  function openInviteDialog(): void {
    inviteForm.value = { name: '', email: '' }
    inviteDialogOpen.value = true
  }

  // ─── Roles Tab API ───

  async function loadRolesData(): Promise<void> {
    rolesLoading.value = true
    try {
      const roles = await fetchRoleOverview()
      roleOverviews.value = roles

      // 从 COMPLIANCE_REVIEWER.levels 派生 reviewFlows
      const reviewerRole = roles.find((r) => r.roleCode === 'COMPLIANCE_REVIEWER')
      const severities: Array<'ROUTINE' | 'MEDIUM' | 'CRITICAL'> = ['ROUTINE', 'MEDIUM', 'CRITICAL']
      reviewFlows.value = reviewerRole?.levels
        ? severities.map((sev) => {
            const approvers = reviewerRole.levels![sev] || []
            return {
              severity: sev,
              flowName: sev.charAt(0) + sev.slice(1).toLowerCase(),
              timeoutMinutes: sev === 'ROUTINE' ? 240 : sev === 'MEDIUM' ? 120 : 30,
              timeoutAction: sev === 'ROUTINE' ? 'AUTO_RESOLVE' : 'ESCALATE',
              status: 'active',
              steps: approvers.map((a, idx) => ({
                stepNo: a.sortNo || idx + 1,
                roleCode: 'COMPLIANCE_REVIEW',
                assigneeUserId: a.userId,
                assigneeName: a.name,
                assigneeEmail: a.email,
                assigneeStatus: a.accountStatus
              }))
            }
          })
        : severities.map((sev) => ({
            severity: sev,
            flowName: sev.charAt(0) + sev.slice(1).toLowerCase(),
            timeoutMinutes: sev === 'ROUTINE' ? 240 : sev === 'MEDIUM' ? 120 : 30,
            timeoutAction: sev === 'ROUTINE' ? 'AUTO_RESOLVE' : 'ESCALATE',
            status: 'active',
            steps: []
          }))
    } catch (error) {
      console.error('Failed to load roles data:', error)
      roleOverviews.value = []
      reviewFlows.value = []
    } finally {
      rolesLoading.value = false
    }
  }

  /** 获取指定角色的成员 userId 列表 */
  function getRoleMemberIds(roleCode: string): number[] {
    const overview = roleOverviews.value.find((r) => r.roleCode === roleCode)
    if (!overview) return []
    return overview.users.map((u) => u.userId)
  }

  /** 获取可加入某角色的人员（所有员工中未加入该角色的） */
  function getAvailableForRole(roleCode: string): TeamMember[] {
    // When editing, use buffer so the available list updates in real-time
    const memberIds =
      editingSection.value === roleCode && sectionBuffer.value[roleCode]
        ? new Set(sectionBuffer.value[roleCode])
        : new Set(getRoleMemberIds(roleCode))
    return allMembers.value.filter((m) => !memberIds.has(Number(m.id)))
  }

  /** 开始编辑角色成员 */
  function startSectionEdit(roleCode: string): void {
    editingSection.value = roleCode
    sectionBuffer.value[roleCode] = getRoleMemberIds(roleCode)
  }

  /** 取消编辑 */
  function cancelSectionEdit(): void {
    editingSection.value = null
    sectionBuffer.value = {}
  }

  /** 保存角色成员变更 */
  async function saveSectionEdit(): Promise<void> {
    const roleCode = editingSection.value
    if (!roleCode) return
    const original = getRoleMemberIds(roleCode)
    const buffered = sectionBuffer.value[roleCode] || []
    const originalSet = new Set(original)
    const bufferedSet = new Set(buffered)

    const addUserIds = buffered.filter((id) => !originalSet.has(id))
    const removeUserIds = original.filter((id) => !bufferedSet.has(id))

    if (addUserIds.length > 0 || removeUserIds.length > 0) {
      await batchUpdateRoleUsers(roleCode, { addUserIds, removeUserIds })
    }
    editingSection.value = null
    sectionBuffer.value = {}
    // Reload to get fresh data
    await loadRolesData()
  }

  /** 从编辑缓冲中移除成员 */
  function removeFromSection(userId: number): void {
    const key = editingSection.value
    if (key && sectionBuffer.value[key]) {
      sectionBuffer.value[key] = sectionBuffer.value[key].filter((id) => id !== userId)
    }
  }

  /** 向编辑缓冲中添加成员 */
  function addToSection(userId: number): void {
    const key = editingSection.value
    if (!key) return
    const current = sectionBuffer.value[key]
    if (!current) return
    // Guard against duplicates
    if (current.includes(userId)) return
    // Replace array for Vue reactivity (push on nested array may not trigger update)
    sectionBuffer.value[key] = [...current, userId]
  }

  // ─── Review Flow editing ───

  /** 开始编辑复核流 */
  function startFlowEdit(severity: string): void {
    const flow = reviewFlows.value.find((f) => f.severity === severity)
    if (flow) {
      editingFlow.value = severity
      flowBuffer.value[severity] = { ...flow, steps: [...flow.steps.map((s) => ({ ...s }))] }
    }
  }

  /** 取消编辑复核流 */
  function cancelFlowEdit(): void {
    editingFlow.value = null
    flowBuffer.value = {}
  }

  /** 保存复核流 */
  async function saveFlowEdit(): Promise<void> {
    const severity = editingFlow.value
    if (!severity) return
    const buffered = flowBuffer.value[severity]
    if (!buffered) return

    // 保存指派人（PUT /system/review-flow/{severity}/reviewers）
    const userIds = buffered.steps.map((s) => s.assigneeUserId)
    await updateReviewersForLevel(severity, { userIds })

    editingFlow.value = null
    flowBuffer.value = {}
    await loadRolesData()
  }

  /** 替换复核流某步骤的指派人 */
  function updateFlowStepAssignee(severity: string, stepIdx: number, userId: number): void {
    const buffered = flowBuffer.value[severity]
    if (buffered && buffered.steps[stepIdx]) {
      buffered.steps[stepIdx].assigneeUserId = userId
    }
  }

  /** 添加复核流步骤 */
  function addFlowStep(severity: string): void {
    const flow = reviewFlows.value.find((f) => f.severity === severity)
    const buffered = flowBuffer.value[severity]
    if (!flow || !buffered) return
    // Find a person not already in this flow
    const usedIds = new Set(buffered.steps.map((s) => s.assigneeUserId))
    const available = allMembers.value.find((m) => !usedIds.has(Number(m.id)))
    if (available) {
      buffered.steps.push({
        stepNo: buffered.steps.length + 1,
        roleCode: 'COMPLIANCE_REVIEW',
        assigneeUserId: Number(available.id),
        assigneeName: available.name,
        assigneeEmail: available.email,
        assigneeStatus: available.status === 'Suspended' ? 'disabled' : 'enabled'
      })
    }
  }

  /** 删除复核流步骤 */
  function removeFlowStep(severity: string, stepIdx: number): void {
    const buffered = flowBuffer.value[severity]
    if (!buffered || buffered.steps.length <= 1) return
    buffered.steps.splice(stepIdx, 1)
    // Re-number steps
    buffered.steps.forEach((s, i) => {
      s.stepNo = i + 1
    })
  }

  /** 上移/下移复核流步骤 */
  function moveFlowStep(severity: string, stepIdx: number, direction: number): void {
    const buffered = flowBuffer.value[severity]
    if (!buffered) return
    const newIdx = stepIdx + direction
    if (newIdx < 0 || newIdx >= buffered.steps.length) return
    const tmp = buffered.steps[stepIdx]
    buffered.steps[stepIdx] = buffered.steps[newIdx]
    buffered.steps[newIdx] = tmp
    // Re-number
    buffered.steps.forEach((s, i) => {
      s.stepNo = i + 1
    })
  }

  onMounted(() => {
    void loadMembers()
    void loadRolesData()
  })

  return {
    loading,
    rolesLoading,
    allMembers,
    owner,
    isCurrentUserOwner,
    regularMembers,
    inviteDialogOpen,
    showTransferDialog,
    transferTo,
    inviteForm,
    roleOverviews,
    reviewFlows,
    editingSection,
    sectionBuffer,
    editingFlow,
    flowBuffer,
    memberMap,
    loadMembers,
    suspendMember,
    recoverMember,
    inviteMember,
    transferOwnership,
    openInviteDialog,
    loadRolesData,
    getRoleMemberIds,
    getAvailableForRole,
    startSectionEdit,
    cancelSectionEdit,
    saveSectionEdit,
    removeFromSection,
    addToSection,
    startFlowEdit,
    cancelFlowEdit,
    saveFlowEdit,
    updateFlowStepAssignee,
    addFlowStep,
    removeFlowStep,
    moveFlowStep
  }
}
