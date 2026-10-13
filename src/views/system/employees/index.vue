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
            <el-button size="small" type="primary" plain @click="showTransferDialog = true">
              {{ $t('system.transferOwnership') }}
            </el-button>
          </div>
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
          <div v-for="member in regularMembers" :key="member.id" class="member-row">
            <div
              class="w-8 h-8 rounded-full bg-g-100 text-g-600 flex items-center justify-center text-xs font-semibold flex-shrink-0"
            >
              {{ member.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-body-lg font-semibold text-g-900">{{ member.name }}</span>
                <span class="status-badge" :class="member.status.toLowerCase()">
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
        </div>
      </div>
    </template>

    <!-- ═══════ Roles Tab ═══════ -->
    <template v-if="currentTab === 'roles'">
      <!-- System Administrators -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.systemAdmins') }}</h3>
          <el-button
            size="small"
            text
            @click="editSection = editSection === 'admins' ? null : 'admins'"
          >
            {{ editSection === 'admins' ? $t('system.save') : $t('system.edit') }}
          </el-button>
        </div>
        <div class="p-4">
          <div class="flex flex-wrap gap-3">
            <div
              v-for="person in adminPeople"
              :key="person.id"
              class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2"
            >
              <div
                class="w-8 h-8 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--theme-text)] flex items-center justify-center text-xs font-semibold"
              >
                {{ person.initials }}
              </div>
              <span class="text-sm text-g-900">{{ person.name }}</span>
              <el-button
                v-if="editSection === 'admins'"
                :icon="'ri:close-line'"
                circle
                size="small"
                @click="removeFromSection('admins', person.id)"
              />
            </div>
          </div>
          <div v-if="editSection === 'admins'" class="mt-3 flex flex-wrap gap-2">
            <el-select
              v-model="newAdminId"
              :placeholder="$t('system.addMember')"
              clearable
              class="!w-56"
              @change="
                (v: string) => {
                  if (v) {
                    adminIds.push(v)
                    newAdminId = ''
                  }
                }
              "
            >
              <el-option
                v-for="p in availablePeople('admins')"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Compliance Officers -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.complianceOfficers') }}</h3>
          <el-button
            size="small"
            text
            @click="editSection = editSection === 'officers' ? null : 'officers'"
          >
            {{ editSection === 'officers' ? $t('system.save') : $t('system.edit') }}
          </el-button>
        </div>
        <div class="p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <el-tag size="small">{{ $t('system.permSetRules') }}</el-tag>
            <el-tag size="small">{{ $t('system.permMonitor') }}</el-tag>
            <el-tag size="small">{{ $t('system.permLabelFPFN') }}</el-tag>
          </div>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="person in officerPeople"
              :key="person.id"
              class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2"
            >
              <div
                class="w-8 h-8 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--theme-text)] flex items-center justify-center text-xs font-semibold"
              >
                {{ person.initials }}
              </div>
              <span class="text-sm text-g-900">{{ person.name }}</span>
              <el-button
                v-if="editSection === 'officers'"
                :icon="'ri:close-line'"
                circle
                size="small"
                @click="removeFromSection('officers', person.id)"
              />
            </div>
          </div>
          <div v-if="editSection === 'officers'" class="mt-3 flex flex-wrap gap-2">
            <el-select
              v-model="newOfficerId"
              :placeholder="$t('system.addMember')"
              clearable
              class="!w-56"
              @change="
                (v: string) => {
                  if (v) {
                    officerIds.push(v)
                    newOfficerId = ''
                  }
                }
              "
            >
              <el-option
                v-for="p in availablePeople('officers')"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Transaction Compliance Review Flow -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.txReviewFlow') }}</h3>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div v-for="flow in flows" :key="flow.id" class="tier-card" :class="flow.sevClass">
              <div class="tier-card-header">
                <div class="flex items-center gap-1.5">
                  <span class="sev-dot" :class="flow.sevClass" />
                  <span class="text-body-lg font-semibold text-g-900">{{ flow.label }}</span>
                </div>
                <span class="step-badge" :class="flow.sevClass">
                  {{ flow.steps.length }}-Step
                </span>
              </div>
              <div class="tier-card-body">
                <div class="flow-config mb-3">
                  <div>
                    <div class="text-caption text-g-400 uppercase tracking-wider">{{
                      $t('system.timeout')
                    }}</div>
                    <div class="text-body-lg font-semibold text-g-800">{{ flow.timeoutLabel }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-g-400 uppercase tracking-wider">{{
                      $t('system.value')
                    }}</div>
                    <div class="text-body-lg font-semibold text-g-800">{{ flow.timeoutValue }}</div>
                  </div>
                </div>
                <div class="flow-chain">
                  <div v-for="(step, idx) in flow.steps" :key="idx" class="flow-step">
                    <div class="flow-step-indicator">
                      <span class="flow-step-num" :class="flow.stepClass">{{ idx + 1 }}</span>
                      <div
                        v-if="idx < flow.steps.length - 1"
                        class="flow-connector"
                        :class="flow.sevClass"
                      />
                      <div
                        v-else
                        class="flow-connector"
                        :class="flow.sevClass"
                        style="min-height: 14px"
                      />
                    </div>
                    <div class="flow-step-content">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-[18px] h-[18px] rounded-full bg-g-200 text-g-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        >
                          {{ getPerson(step.personId)?.initials }}
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs font-semibold text-g-900">
                            {{ getPerson(step.personId)?.name }}
                          </span>
                          <span class="text-caption text-g-500">
                            {{ getPerson(step.personId)?.email }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Resolved terminator -->
                  <div class="flow-step">
                    <div class="flow-step-indicator">
                      <span class="flow-step-num resolved">✓</span>
                    </div>
                    <div class="flow-step-content resolved">
                      <span class="text-xs font-semibold text-success">{{
                        $t('system.resolved')
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Travel Rule Manual Resolution Team -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.travelRuleTeam') }}</h3>
          <el-button
            size="small"
            text
            @click="editSection = editSection === 'travelRule' ? null : 'travelRule'"
          >
            {{ editSection === 'travelRule' ? $t('system.save') : $t('system.edit') }}
          </el-button>
        </div>
        <div class="p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <el-tag size="small">{{ $t('system.permResolve') }}</el-tag>
            <el-tag size="small">{{ $t('system.permReject') }}</el-tag>
          </div>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="person in travelRulePeople"
              :key="person.id"
              class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2"
            >
              <div
                class="w-8 h-8 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--theme-text)] flex items-center justify-center text-xs font-semibold"
              >
                {{ person.initials }}
              </div>
              <span class="text-sm text-g-900">{{ person.name }}</span>
              <el-button
                v-if="editSection === 'travelRule'"
                :icon="'ri:close-line'"
                circle
                size="small"
                @click="removeFromSection('travelRule', person.id)"
              />
            </div>
          </div>
          <div v-if="editSection === 'travelRule'" class="mt-3 flex flex-wrap gap-2">
            <el-select
              v-model="newTravelRuleId"
              :placeholder="$t('system.addMember')"
              clearable
              class="!w-56"
              @change="
                (v: string) => {
                  if (v) {
                    travelRuleIds.push(v)
                    newTravelRuleId = ''
                  }
                }
              "
            >
              <el-option
                v-for="p in availablePeople('travelRule')"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              />
            </el-select>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ Invite Member Dialog ═══ -->
    <el-dialog v-model="inviteDialogOpen" :title="$t('system.inviteMember')" width="500px">
      <el-form label-width="80px">
        <el-form-item :label="$t('system.name')">
          <el-input v-model="inviteForm.name" placeholder="Enter full name" />
        </el-form-item>
        <el-form-item :label="$t('system.email')">
          <el-input v-model="inviteForm.email" type="email" placeholder="Enter work email" />
        </el-form-item>
        <el-form-item :label="$t('system.role')">
          <el-select v-model="inviteForm.role" class="w-full">
            <el-option label="System Administrator" value="SYSTEM_ADMIN" />
            <el-option label="Compliance Officer" value="COMPLIANCE" />
            <el-option label="Operations" value="OPERATIONS" />
            <el-option label="Risk Reviewer" value="RISK" />
          </el-select>
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

    <!-- Governance Notice -->
    <div class="governance-notice">
      <strong>{{ $t('system.governanceTitle') }}:</strong>
      {{ $t('system.governanceNotice') }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useTeamManagement } from '@/features/system-admin/useTeamManagement'

  defineOptions({ name: 'TeamManagement' })

  // ─── Members Tab (real API) ───
  const {
    owner,
    regularMembers,
    inviteDialogOpen,
    showTransferDialog,
    transferTo,
    inviteForm,
    suspendMember,
    recoverMember,
    inviteMember,
    transferOwnership,
    openInviteDialog
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

  // ─── Roles Tab (mock data for now) ───
  const currentTab = ref<'members' | 'roles'>('members')
  const editSection = ref<null | 'admins' | 'officers' | 'travelRule'>(null)
  const newAdminId = ref('')
  const newOfficerId = ref('')
  const newTravelRuleId = ref('')

  // ─── All available people ───
  interface Person {
    id: string
    initials: string
    name: string
    email: string
    role?: string
  }

  const allPeople: Person[] = [
    { id: 'sc', initials: 'SC', name: 'Sarah Chen', email: 'sarah.chen@cregis.com', role: 'Lead' },
    {
      id: 'mr',
      initials: 'MR',
      name: 'Michael Reed',
      email: 'michael.reed@cregis.com',
      role: 'Officer'
    },
    {
      id: 'jz',
      initials: 'JZ',
      name: 'Jing Zhang',
      email: 'jing.zhang@cregis.com',
      role: 'Officer'
    },
    {
      id: 'ap',
      initials: 'AP',
      name: 'Aisha Patel',
      email: 'aisha.patel@cregis.com',
      role: 'Analyst'
    },
    {
      id: 'dk',
      initials: 'DK',
      name: 'David Kim',
      email: 'david.kim@cregis.com',
      role: 'Operator'
    },
    { id: 'lt', initials: 'LT', name: 'Li Tan', email: 'li.tan@cregis.com', role: 'Operator' },
    {
      id: 'rm',
      initials: 'RM',
      name: 'Rohit Mehta',
      email: 'rohit.mehta@cregis.com',
      role: 'Operator'
    },
    {
      id: 'eh',
      initials: 'EH',
      name: 'Emma Huang',
      email: 'emma.huang@cregis.com',
      role: 'Operator'
    },
    {
      id: 'jw',
      initials: 'JW',
      name: 'James Wilson',
      email: 'james.wilson@cregis.com',
      role: 'Operator'
    },
    { id: 'nl', initials: 'NL', name: 'Nadia Lo', email: 'nadia.lo@cregis.com', role: 'Operator' }
  ]

  // ─── Role groups ───
  const adminIds = ref(['tw', 'lk'])
  const officerIds = ref(['sc', 'mr', 'jz', 'ap'])
  const travelRuleIds = ref(['mr', 'sc', 'nl'])

  const adminPeople = computed(() => allPeople.filter((p) => adminIds.value.includes(p.id)))
  const officerPeople = computed(() => allPeople.filter((p) => officerIds.value.includes(p.id)))
  const travelRulePeople = computed(() =>
    allPeople.filter((p) => travelRuleIds.value.includes(p.id))
  )

  function availablePeople(section: string): Person[] {
    const ids =
      section === 'admins'
        ? adminIds.value
        : section === 'officers'
          ? officerIds.value
          : travelRuleIds.value
    return allPeople.filter((p) => !ids.includes(p.id))
  }

  function removeFromSection(section: string, personId: string) {
    if (section === 'admins') {
      adminIds.value = adminIds.value.filter((id) => id !== personId)
    } else if (section === 'officers') {
      officerIds.value = officerIds.value.filter((id) => id !== personId)
    } else if (section === 'travelRule') {
      travelRuleIds.value = travelRuleIds.value.filter((id) => id !== personId)
    }
  }

  function getPerson(id: string): Person | undefined {
    return allPeople.find((p) => p.id === id)
  }

  // ─── Approval Flows ───
  interface FlowStep {
    personId: string
  }
  interface Flow {
    id: string
    label: string
    sevClass: string
    stepClass: string
    timeoutLabel: string
    timeoutValue: string
    steps: FlowStep[]
  }

  const flows: Flow[] = [
    {
      id: 'routine',
      label: 'Routine',
      sevClass: 'routine',
      stepClass: 's1',
      timeoutLabel: 'Auto-Resolve',
      timeoutValue: '4h',
      steps: [{ personId: 'dk' }]
    },
    {
      id: 'medium',
      label: 'Medium',
      sevClass: 'medium',
      stepClass: 's2',
      timeoutLabel: 'Escalation',
      timeoutValue: '2h',
      steps: [{ personId: 'eh' }, { personId: 'jw' }]
    },
    {
      id: 'critical',
      label: 'Critical',
      sevClass: 'critical',
      stepClass: 's3',
      timeoutLabel: 'Escalation',
      timeoutValue: '30m',
      steps: [{ personId: 'dk' }, { personId: 'jz' }, { personId: 'sc' }]
    }
  ]
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

  /* Status badge */
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-radius: 4px;
  }

  .status-badge.active {
    color: var(--el-color-success);
    background: var(--el-color-success-light-8);
  }

  .status-badge.pending {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-8);
  }

  .status-badge.inactive {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
  }

  .status-badge.suspended {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-8);
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
