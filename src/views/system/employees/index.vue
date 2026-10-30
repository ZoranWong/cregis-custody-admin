<!-- Team Management — 团队管理 -->
<template>
  <div class="page-content">
    <!-- Page Header -->
    <div class="mb-4">
      <h1 class="text-xl font-semibold text-g-900">{{ $t('system.teamManagement') }}</h1>
      <p class="text-sm text-g-500 mt-1">{{ $t('system.teamSubtitle') }}</p>
    </div>

    <!-- Tab Bar -->
    <el-tabs v-model="currentTab" class="mb-5">
      <el-tab-pane :label="$t('system.members')" name="members" />
      <el-tab-pane :label="$t('system.roles')" name="roles" />
    </el-tabs>

    <!-- ═══════ Members Tab ═══════ -->
    <template v-if="currentTab === 'members'">
      <!-- Owner Section -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.owner') }}</h3>
        </div>
        <div class="p-4">
          <template v-if="loading">
            <el-skeleton :rows="1" animated />
          </template>
          <template v-else>
            <div class="owner-card">
              <div
                class="w-10 h-10 rounded-full bg-[var(--el-color-primary)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0"
              >
                {{ ownerInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-semibold text-g-900">{{ owner?.name }}</span>
                  <span class="owner-badge">{{ $t('system.ownerBadge') }}</span>
                </div>
                <div class="text-xs text-g-500">{{ owner?.email }}</div>
              </div>
              <el-button
                v-if="isCurrentUserOwner"
                size="small"
                type="primary"
                plain
                @click="showTransferDialog = true"
              >
                {{ $t('system.transferOwnership') }}
              </el-button>
            </div>
          </template>
        </div>
      </div>

      <!-- Members Section -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.ordinaryMembers') }}</h3>
          <el-button size="small" type="primary" @click="openInviteDialog">
            + {{ $t('system.inviteMember') }}
          </el-button>
        </div>
        <div class="p-4">
          <template v-if="loading">
            <el-skeleton :rows="5" animated />
          </template>
          <template v-else>
            <div v-for="member in regularMembers" :key="member.id" class="member-row">
              <div
                class="w-8 h-8 rounded-full bg-g-100 text-g-600 flex items-center justify-center text-xs font-semibold flex-shrink-0"
              >
                {{ member.initials }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-body-lg font-semibold text-g-900">{{ member.name }}</span>
                  <span class="status-pill" :class="member.status.toLowerCase()">
                    {{ member.status }}
                  </span>
                </div>
                <div class="text-label text-g-500">{{ member.email }}</div>
              </div>
              <el-button
                v-if="member.status !== 'Suspended'"
                size="small"
                type="danger"
                plain
                @click="handleSuspendMember(member.id)"
              >
                {{ $t('system.suspend') }}
              </el-button>
              <el-button
                v-else
                size="small"
                type="success"
                plain
                @click="handleRecoverMember(member.id)"
              >
                {{ $t('system.recover') }}
              </el-button>
            </div>
            <div v-if="regularMembers.length === 0" class="py-6 text-center text-g-400 text-sm">
              {{ $t('system.noEmployees') }}
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- ═══════ Roles Tab ═══════ -->
    <template v-if="currentTab === 'roles'">
      <template v-if="rolesLoading || loading">
        <div v-for="i in 4" :key="i" class="art-card mb-4 overflow-hidden">
          <div class="p-4 border-b border-[var(--default-border)]"
            ><el-skeleton :rows="1" animated
          /></div>
          <div class="p-4"><el-skeleton :rows="2" animated /></div>
        </div>
      </template>
      <template v-else>
        <!-- System Administrators -->
        <RoleSectionCard
          title="SYSTEM_ADMIN"
          :title-display="$t('system.systemAdmins')"
          :role-code="SYSTEM_ADMIN_ROLE"
          :is-editing="editingSection === SYSTEM_ADMIN_ROLE"
          :members="adminMembers"
          :available="adminAvailable"
          @start-edit="startSectionEdit(SYSTEM_ADMIN_ROLE)"
          @cancel-edit="cancelSectionEdit"
          @save="saveSectionEdit"
          @remove="removeFromSection"
          @add="addToSection"
        />

        <!-- Compliance Officers -->
        <RoleSectionCard
          :title-display="$t('system.complianceOfficers')"
          :role-code="COMPLIANCE_OFFICER_ROLE"
          :is-editing="editingSection === COMPLIANCE_OFFICER_ROLE"
          :members="officerMembers"
          :available="officerAvailable"
          :perms="[$t('system.permSetRules'), $t('system.permMonitor'), $t('system.permLabelFPFN')]"
          @start-edit="startSectionEdit(COMPLIANCE_OFFICER_ROLE)"
          @cancel-edit="cancelSectionEdit"
          @save="saveSectionEdit"
          @remove="removeFromSection"
          @add="addToSection"
        />

        <!-- Transaction Compliance Review Flow -->
        <ReviewFlowCard
          :flows="reviewFlows"
          :editing-flow="editingFlow"
          :flow-buffer="flowBuffer"
          :all-members="allMembers"
          @start-edit="startFlowEdit"
          @cancel-edit="cancelFlowEdit"
          @save="saveFlowEdit"
          @update-assignee="
            ({ severity, stepIdx, userId }) => updateFlowStepAssignee(severity, stepIdx, userId)
          "
          @add-step="addFlowStep"
          @remove-step="removeFlowStep"
          @move-step="
            ({ severity, stepIdx, direction }) => moveFlowStep(severity, stepIdx, direction)
          "
        />

        <!-- Travel Rule Manual Resolution Team -->
        <RoleSectionCard
          :title-display="$t('system.travelRuleTeam')"
          :role-code="TRAVEL_RULE_ROLE"
          :is-editing="editingSection === TRAVEL_RULE_ROLE"
          :members="travelRuleMembers"
          :available="travelRuleAvailable"
          :perms="[$t('system.permResolve'), $t('system.permReject')]"
          @start-edit="startSectionEdit(TRAVEL_RULE_ROLE)"
          @cancel-edit="cancelSectionEdit"
          @save="saveSectionEdit"
          @remove="removeFromSection"
          @add="addToSection"
        />
      </template>

      <!-- Governance Notice -->
      <div class="governance-notice">
        <strong>{{ $t('system.governanceTitle') }}:</strong>
        {{ $t('system.governanceNotice') }}
      </div>
    </template>
    <el-dialog v-model="inviteDialogOpen" :title="$t('system.inviteMember')" width="500px">
      <el-form label-width="80px">
        <el-form-item :label="$t('system.name')">
          <el-input v-model="inviteForm.name" placeholder="Enter full name" />
        </el-form-item>
        <el-form-item :label="$t('system.email')">
          <el-input v-model="inviteForm.email" type="email" placeholder="Enter work email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogOpen = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmitInvite">{{
          $t('system.sendInvite')
        }}</el-button>
      </template>
    </el-dialog>

    <!-- ═══ Transfer Ownership Dialog ═══ -->
    <el-dialog v-model="showTransferDialog" :title="$t('system.transferOwnership')" width="500px">
      <div class="space-y-4">
        <p class="text-sm text-g-600">{{ $t('system.transferNotice') }}</p>
        <el-select v-model="transferTo" :placeholder="$t('system.selectMember')" class="w-full">
          <el-option v-for="m in regularMembers" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showTransferDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirmTransfer">{{
          $t('system.confirm')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useTeamManagement } from '@/features/system-admin/useTeamManagement'
  import RoleSectionCard from './components/RoleSectionCard.vue'
  import ReviewFlowCard from './components/ReviewFlowCard.vue'

  defineOptions({ name: 'TeamManagement' })

  // Role code constants — match backend role codes
  const SYSTEM_ADMIN_ROLE = 'SYSTEM_ADMIN'
  const COMPLIANCE_OFFICER_ROLE = 'COMPLIANCE_OFFICER'
  const TRAVEL_RULE_ROLE = 'TRAVEL_RULE_RESOLVER'

  // ─── Members Tab (real API) ───
  const {
    owner,
    isCurrentUserOwner,
    regularMembers,
    inviteDialogOpen,
    showTransferDialog,
    transferTo,
    inviteForm,
    loading,
    rolesLoading,
    suspendMember,
    recoverMember,
    inviteMember,
    transferOwnership,
    openInviteDialog,
    // Roles Tab
    allMembers,
    roleOverviews,
    reviewFlows,
    editingSection,
    sectionBuffer,
    editingFlow,
    flowBuffer,
    loadRolesData,
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
  } = useTeamManagement()

  const ownerInitials = computed(() => owner.value?.initials || '')

  async function handleSubmitInvite() {
    if (!inviteForm.value.name || !inviteForm.value.email) {
      ElMessage.warning('Please fill in all required fields')
      return
    }
    try {
      await inviteMember(inviteForm.value)
      inviteDialogOpen.value = false
      ElMessage.success('Invitation sent')
    } catch {
      ElMessage.error('Failed to send invitation')
    }
  }

  async function handleConfirmTransfer() {
    if (!transferTo.value) {
      ElMessage.warning('Please select a member')
      return
    }
    try {
      await transferOwnership(transferTo.value)
      showTransferDialog.value = false
      ElMessage.success('Ownership transferred')
    } catch {
      ElMessage.error('Failed to transfer ownership')
    }
  }

  async function handleSuspendMember(id: string) {
    try {
      await suspendMember(id)
      ElMessage.success('Member suspended')
    } catch {
      ElMessage.error('Failed to suspend member')
    }
  }

  async function handleRecoverMember(id: string) {
    try {
      await recoverMember(id)
      ElMessage.success('Member recovered')
    } catch {
      ElMessage.error('Failed to recover member')
    }
  }

  // ─── Roles Tab (real API) ───
  const currentTab = ref<'members' | 'roles'>('members')

  // Load roles data when switching to roles tab
  watch(currentTab, (tab) => {
    if (tab === 'roles') void loadRolesData()
  })

  type MemberStatus = 'Active' | 'Pending' | 'Suspended'
  interface RoleMemberRow {
    id: string
    userId: number
    initials: string
    name: string
    email: string
    status: MemberStatus
    removed?: boolean
  }

  /** 把 userId 映射成展示行（先查 allMembers，再回退 overview） */
  function buildMemberRow(
    userId: number,
    overviewMap: Map<number, { name: string; email: string; status: MemberStatus }>
  ): RoleMemberRow | null {
    const member = allMembers.value.find((m) => Number(m.id) === userId)
    if (member) {
      return {
        id: member.id,
        userId,
        initials: member.initials,
        name: member.name,
        email: member.email,
        status: member.status
      }
    }
    const info = overviewMap.get(userId)
    if (!info) return null
    const initials = info.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    return {
      id: String(userId),
      userId,
      initials,
      name: info.name,
      email: info.email,
      status: info.status
    }
  }

  /** Build member view from role overview + allMembers */
  function buildRoleMembers(roleCode: string): RoleMemberRow[] {
    const overview = roleOverviews.value.find((r) => r.roleCode === roleCode)
    const overviewMap = new Map<number, { name: string; email: string; status: MemberStatus }>()
    if (overview) {
      overview.users.forEach((u) => {
        overviewMap.set(u.userId, {
          name: u.displayName,
          email: u.email,
          status: u.accountStatus === 'disabled' ? 'Suspended' : 'Active'
        })
      })
    }

    const result: RoleMemberRow[] = []
    for (const userId of getRoleMemberIds(roleCode)) {
      const row = buildMemberRow(userId, overviewMap)
      if (row) result.push(row)
    }
    // 编辑中被移除的成员：保留在列表里，标记为 removed（可恢复）
    for (const userId of getRemovedIds(roleCode)) {
      const row = buildMemberRow(userId, overviewMap)
      if (row) result.push({ ...row, removed: true })
    }
    return result
  }

  /** 编辑中被移除、但仍需以删除态展示的 userId
   *  注意：原本靠 getRoleMemberIds 取「原始 vs buffer」差集，
   *  但切换 section 后原始数据仍在 roleOverviews 中，可直接比对。 */
  function getRemovedIds(roleCode: string): number[] {
    if (editingSection.value !== roleCode || !sectionBuffer.value[roleCode]) return []
    const pending = new Set(sectionBuffer.value[roleCode])
    const overview = roleOverviews.value.find((r) => r.roleCode === roleCode)
    const original = overview?.users.map((u) => u.userId) ?? []
    return original.filter((id) => !pending.has(id))
  }

  /** Get role member IDs from buffer (if editing) or overview */
  function getRoleMemberIds(roleCode: string): number[] {
    if (editingSection.value === roleCode && sectionBuffer.value[roleCode]) {
      return sectionBuffer.value[roleCode]
    }
    const overview = roleOverviews.value.find((r) => r.roleCode === roleCode)
    return overview?.users.map((u) => u.userId) ?? []
  }

  // Computed members for each role section
  const adminMembers = computed(() => buildRoleMembers(SYSTEM_ADMIN_ROLE))
  const adminAvailable = computed(() => getAvailableForRole(SYSTEM_ADMIN_ROLE))
  const officerMembers = computed(() => buildRoleMembers(COMPLIANCE_OFFICER_ROLE))
  const officerAvailable = computed(() => getAvailableForRole(COMPLIANCE_OFFICER_ROLE))
  const travelRuleMembers = computed(() => buildRoleMembers(TRAVEL_RULE_ROLE))
  const travelRuleAvailable = computed(() => getAvailableForRole(TRAVEL_RULE_ROLE))
</script>

<style scoped>
  /* Owner card */
  .owner-card {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-color-primary-light-8) 100%
    );
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: 12px;
  }

  .owner-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    background: var(--el-color-primary);
    border-radius: 4px;
  }

  /* Member row */
  .member-row {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .member-row:last-child {
    border-bottom: none;
  }

  /* Status pill (prototype matching) */
  .status-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    border-radius: 20px;
  }

  .status-pill.active {
    color: var(--el-color-success-dark-2);
    background: var(--el-color-success-light-9);
  }

  .status-pill.pending {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-9);
  }

  .status-pill.suspended {
    color: var(--el-color-danger-dark-2);
    background: var(--el-color-danger-light-9);
  }

  /* Tier cards */
  .tier-card {
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
  }

  .tier-card.routine {
    border-left: 3px solid var(--el-color-primary);
  }

  .tier-card.medium {
    border-left: 3px solid var(--el-color-warning);
  }

  .tier-card.critical {
    border-left: 3px solid var(--el-color-danger);
  }

  .tier-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .tier-card-body {
    padding: 14px 16px;
  }

  /* Severity dot */
  .sev-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .sev-dot.routine {
    background: var(--el-color-primary);
  }

  .sev-dot.medium {
    background: var(--el-color-warning);
  }

  .sev-dot.critical {
    background: var(--el-color-danger);
  }

  /* Step badge */
  .step-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 4px;
  }

  .step-badge.routine {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
  }

  .step-badge.medium {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-8);
  }

  .step-badge.critical {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-8);
  }

  /* Flow config */
  .flow-config {
    display: flex;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  /* Flow chain */
  .flow-chain {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .flow-step {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }

  .flow-step-indicator {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: center;
  }

  .flow-step-num {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    border-radius: 50%;
  }

  .flow-step-num.s1 {
    background: var(--el-color-primary);
  }

  .flow-step-num.s2 {
    background: var(--el-color-warning);
  }

  .flow-step-num.s3 {
    background: var(--el-color-danger);
  }

  .flow-step-num.resolved {
    background: var(--el-color-success);
  }

  .flow-connector {
    flex: 1;
    width: 2px;
    min-height: 14px;
    margin: 2px 0;
  }

  .flow-connector.routine {
    background: var(--el-color-primary-light-5);
  }

  .flow-connector.medium {
    background: var(--el-color-warning-light-5);
  }

  .flow-connector.critical {
    background: var(--el-color-danger-light-5);
  }

  .flow-step-content {
    display: flex;
    flex: 1;
    align-items: center;
    padding-bottom: 12px;
  }

  .flow-step-content.resolved {
    padding-bottom: 0;
  }

  /* Governance notice */
  .governance-notice {
    max-width: 640px;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-5);
    border-radius: 8px;
  }
</style>
