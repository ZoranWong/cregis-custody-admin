import { computed, onMounted, ref } from 'vue'
import {
  fetchEmployees,
  createEmployee,
  enableEmployee,
  disableEmployee
} from '@/api/system-manage'
import type { EmployeePageQuery, EmployeeRowView } from './types'

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
// Owner is identified by role_code = 'OWNER' or the first SYSTEM_ADMIN
// TODO: Backend should provide a dedicated GET /system/owner API

function detectOwner(members: EmployeeRowView[]): EmployeeRowView | undefined {
  // First try to find by role_code = 'OWNER'
  const byRole = members.find((m) => m.roleCode?.toUpperCase() === 'OWNER')
  if (byRole) return byRole
  // Fallback: first SYSTEM_ADMIN
  return members.find((m) => m.roleCode?.toUpperCase() === 'SYSTEM_ADMIN')
}

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
  const inviteForm = ref({ name: '', email: '', role: '' })

  const owner = computed(() => allMembers.value.find((m) => m.owner))
  const regularMembers = computed(() => allMembers.value.filter((m) => !m.owner))

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

      const ownerRow = detectOwner(rows)
      allMembers.value = rows.map((row) => toTeamMember(row, ownerRow?.accountId === row.accountId))
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

  async function inviteMember(data: { name: string; email: string; role: string }): Promise<void> {
    try {
      await createEmployee({
        displayName: data.name,
        email: data.email,
        initialRoleCode: data.role || 'SYSTEM_STAFF',
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
    // TODO: Backend needs to provide POST /system/owner/transfer API
    // For now, this is a placeholder
    console.warn('Transfer ownership API not yet implemented')

    // Local state update (will be lost on refresh without backend support)
    const oldOwner = allMembers.value.find((m) => m.owner)
    if (oldOwner) oldOwner.owner = undefined
    const newOwner = allMembers.value.find((m) => m.id === newOwnerId)
    if (newOwner) newOwner.owner = true
  }

  function openInviteDialog(): void {
    inviteForm.value = { name: '', email: '', role: '' }
    inviteDialogOpen.value = true
  }

  onMounted(() => {
    void loadMembers()
  })

  return {
    loading,
    allMembers,
    owner,
    regularMembers,
    inviteDialogOpen,
    showTransferDialog,
    transferTo,
    inviteForm,
    loadMembers,
    suspendMember,
    recoverMember,
    inviteMember,
    transferOwnership,
    openInviteDialog
  }
}
