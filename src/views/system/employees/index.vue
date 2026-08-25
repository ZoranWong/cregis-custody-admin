<!-- Cregis Employee Management -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('system.employeeManagement') }}</h2>
      <div class="flex gap-2">
        <ElButton @click="() => load()">{{ $t('console.refresh') }}</ElButton>
        <ElButton type="primary" @click="openCreateModal">
          <ArtSvgIcon icon="ri:user-add-line" class="mr-1" />{{ $t('system.inviteMember') }}
        </ElButton>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="mb-5">
      <el-radio-group v-model="currentTab" size="small">
        <el-radio-button value="members">{{ $t('system.members') }}</el-radio-button>
        <el-radio-button value="roles">{{ $t('system.roles') }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Members Tab -->
    <template v-if="currentTab === 'members'">
      <!-- Owner Section -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h3 class="text-sm font-semibold text-g-900">{{ $t('system.owner') }}</h3>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold"
              >
                TW
              </div>
              <div>
                <div class="text-sm font-medium text-g-900">Tom Wang</div>
                <div class="text-xs text-g-500">tom.wang@cregis.com</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <el-tag type="primary" size="small">Owner</el-tag>
              <el-button size="small" text>{{ $t('system.transferOwnership') }}</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="art-card art-table-card overflow-hidden mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <div class="flex flex-wrap items-center gap-3">
            <el-select
              v-model="filters.status"
              :placeholder="$t('audit.status')"
              clearable
              class="!w-40"
              @change="onStatusChange"
            >
              <el-option value="all" :label="$t('system.statusAll')" />
              <el-option value="pending_activation" :label="$t('system.statusPending')" />
              <el-option value="active" :label="$t('system.statusActive')" />
              <el-option value="disabled" :label="$t('system.statusDisabled')" />
              <el-option value="expired" :label="$t('system.statusExpired')" />
            </el-select>
            <el-input
              v-model="filters.searchQuery"
              :placeholder="$t('system.searchEmployee')"
              clearable
              class="!w-64"
            >
              <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
            </el-input>
          </div>
        </div>

        <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
        <el-table v-else :data="rows" stripe size="small">
          <template #empty
            ><div class="p-10 text-center text-g-500">{{ $t('system.noEmployees') }}</div></template
          >
          <el-table-column prop="displayName" :label="$t('system.name')" min-width="140" />
          <el-table-column prop="email" :label="$t('system.email')" min-width="180" />
          <el-table-column :label="$t('system.activation')" width="120">
            <template #default="{ row }">
              <el-tag :type="activationTag(row.activationStatus)" size="small">{{
                activationLabel(row.activationStatus)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('system.accountStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.accountStatus === 'enabled' ? 'success' : 'danger'" size="small">{{
                row.accountStatus === 'enabled' ? $t('system.enabled') : $t('system.disabled')
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('system.role')" width="140">
            <template #default="{ row }">{{ roleLabel(row.roleCode || row.initialRole) }}</template>
          </el-table-column>
          <el-table-column :label="$t('system.lastSignIn')" width="180">
            <template #default="{ row }">{{ row.lastSignIn || 'Never' }}</template>
          </el-table-column>
          <el-table-column :label="$t('audit.actions')" :min-width="actionColWidth" fixed="right">
            <template #default="{ row }">
              <div class="flex gap-1 flex-nowrap">
                <ElButton
                  v-for="action in onVisibleActions(row)"
                  :key="action"
                  size="small"
                  :disabled="onIsActionPending(row, action)"
                  @click="onTriggerAction(row, action)"
                >
                  {{ actionTitle(action) }}
                </ElButton>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div
          v-if="pagination.totalCount > 0"
          class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]"
        >
          <span class="text-xs text-g-500"
            >Page {{ currentPage }} / {{ totalPages || 1 }} ·
            {{ pagination.totalCount }} employees</span
          >
          <el-pagination
            v-model:current-page="filters.pageNum"
            :total="pagination.totalCount"
            :page-sizes="[10, 20, 50]"
            background
            layout="prev,pager,next,sizes"
            @current-change="
              (v: number) => {
                filters.pageNum = v
              }
            "
            @size-change="
              (v: number) => {
                filters.pageSize = v
              }
            "
          />
        </div>
      </div>
    </template>

    <!-- Roles Tab -->
    <template v-if="currentTab === 'roles'">
      <!-- System Administrators -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">System Administrators</h3>
          <el-button size="small" text>Edit</el-button>
        </div>
        <div class="p-4">
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >TW</div
              >
              <span class="text-sm text-g-900">Tom Wang</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >LK</div
              >
              <span class="text-sm text-g-900">Lisa Kumar</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Compliance Officers -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h3 class="text-sm font-semibold text-g-900">Compliance Officers</h3>
        </div>
        <div class="p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <el-tag size="small">Set Rules</el-tag>
            <el-tag size="small">Monitor</el-tag>
            <el-tag size="small">Label FP/FN</el-tag>
          </div>
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >SC</div
              >
              <span class="text-sm text-g-900">Sarah Chen</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >MR</div
              >
              <span class="text-sm text-g-900">Michael Reed</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >JZ</div
              >
              <span class="text-sm text-g-900">Jing Zhang</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >AP</div
              >
              <span class="text-sm text-g-900">Aisha Patel</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Compliance Review Flow -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
          <h3 class="text-sm font-semibold text-g-900">Transaction Compliance Review Flow</h3>
          <el-button size="small" text>Edit Flow</el-button>
        </div>
        <div class="p-4 space-y-6">
          <!-- Routine -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <el-tag type="info" size="small">Routine</el-tag>
              <span class="text-xs text-g-500">Timeout: Auto-Resolve 4h</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >DK</div
                >
                <span class="text-sm text-g-900">David Kim</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="bg-success-50 rounded-lg px-3 py-2">
                <span class="text-sm text-success">Resolved</span>
              </div>
            </div>
          </div>
          <!-- Medium -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <el-tag type="warning" size="small">Medium</el-tag>
              <span class="text-xs text-g-500">Timeout: Escalation 2h</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >EH</div
                >
                <span class="text-sm text-g-900">Emma Huang</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >JW</div
                >
                <span class="text-sm text-g-900">James Wilson</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="bg-success-50 rounded-lg px-3 py-2">
                <span class="text-sm text-success">Resolved</span>
              </div>
            </div>
          </div>
          <!-- Critical -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <el-tag type="danger" size="small">Critical</el-tag>
              <span class="text-xs text-g-500">Timeout: Escalation 30m</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >DK</div
                >
                <span class="text-sm text-g-900">David Kim</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >JZ</div
                >
                <span class="text-sm text-g-900">Jing Zhang</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs"
                  >SC</div
                >
                <span class="text-sm text-g-900">Sarah Chen</span>
              </div>
              <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400" />
              <div class="bg-success-50 rounded-lg px-3 py-2">
                <span class="text-sm text-success">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Travel Rule Manual Resolution Team -->
      <div class="art-card mb-5">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h3 class="text-sm font-semibold text-g-900">Travel Rule Manual Resolution Team</h3>
        </div>
        <div class="p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <el-tag size="small">Resolve</el-tag>
            <el-tag size="small">Reject</el-tag>
          </div>
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >MR</div
              >
              <span class="text-sm text-g-900">Michael Reed</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >SC</div
              >
              <span class="text-sm text-g-900">Sarah Chen</span>
            </div>
            <div class="flex items-center gap-2 bg-g-50 rounded-lg px-3 py-2">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary text-xs font-semibold"
                >NL</div
              >
              <span class="text-sm text-g-900">Nadia Lo</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Governance Notice -->
    <div class="governance-notice mb-5">
      <strong>Governance Notice:</strong>
      High-risk changes (password reset, role or domain changes) may trigger re-authentication on
      the user's next sensitive action.
    </div>

    <!-- Create Modal -->
    <el-dialog v-model="createModalOpen" :title="$t('system.createUser')" width="600px">
      <div class="space-y-4">
        <div>
          <label class="text-xs text-g-500"
            >{{ $t('system.name') }} <span class="text-red-500">*</span></label
          >
          <el-input v-model="createForm.displayName" class="mt-1" placeholder="Enter full name" />
        </div>
        <div>
          <label class="text-xs text-g-500"
            >{{ $t('system.email') }} <span class="text-red-500">*</span></label
          >
          <el-input
            v-model="createForm.email"
            type="email"
            class="mt-1"
            placeholder="Enter work email"
          />
        </div>
        <div>
          <label class="text-xs text-g-500"
            >{{ $t('system.role') }} <span class="text-red-500">*</span></label
          >
          <el-select v-model="createForm.initialRoleCode" class="!w-full mt-1">
            <el-option
              v-for="role in roleOptions"
              :key="role.code"
              :value="role.code"
              :label="role.label"
            />
          </el-select>
        </div>
      </div>
      <template #footer>
        <ElButton @click="closeCreateModal">{{ $t('table.form.reset') }}</ElButton>
        <ElButton type="primary" :disabled="creating" @click="submitCreate">{{
          creating ? 'Creating...' : $t('table.form.submit')
        }}</ElButton>
      </template>
    </el-dialog>

    <!-- Access Review Drawer -->
    <el-drawer v-model="accessDrawerOpen" title="Review Access" direction="rtl" size="400px">
      <template v-if="selectedAccess">
        <div class="mb-4">
          <div class="text-sm font-semibold">{{ selectedAccess.displayName }}</div>
          <div class="text-xs text-g-500">{{ selectedAccess.email }}</div>
        </div>
        <div class="mb-4">
          <label class="text-xs text-g-500 uppercase font-semibold">Role Assignment</label>
          <el-select v-model="selectedAccess.roleCode" class="!w-full mt-1">
            <el-option
              v-for="role in roleOptions"
              :key="role.code"
              :value="role.code"
              :label="role.label"
            />
          </el-select>
        </div>
        <div class="mb-4">
          <label class="text-xs text-g-500 uppercase font-semibold">Authorized Page Domains</label>
          <div class="mt-1 space-y-1">
            <label
              v-for="domain in domainOptions"
              :key="domain.id"
              class="flex items-center gap-2 p-2 rounded bg-g-50 text-xs"
            >
              <input
                :checked="selectedAccess.authorizedDomainIds.includes(domain.id)"
                type="checkbox"
                class="w-4 h-4"
                @change="
                  updateSelectedDomains(domain.id, ($event.target as HTMLInputElement).checked)
                "
              />
              <span>{{ domain.label }}</span>
            </label>
          </div>
        </div>
        <div class="flex gap-2">
          <ElButton
            type="primary"
            size="small"
            :disabled="accessSaving"
            @click="saveAccessBinding"
            >{{ accessSaving ? 'Saving...' : 'Save Changes' }}</ElButton
          >
          <ElButton size="small" @click="closeAccessDrawer">Cancel</ElButton>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useEmployeeManagement } from '@/features/system-admin/useEmployeeManagement'
  import type { EmployeeRowView } from '@/features/system-admin/types'

  defineOptions({ name: 'EmployeeManagement' })

  const currentTab = ref<'members' | 'roles'>('members')

  const { t, locale } = useI18n()

  const actionColWidth = computed(() => (locale.value === 'zh' ? 220 : 280))

  const {
    loading,
    rows,
    pagination,
    filters,
    createModalOpen,
    accessDrawerOpen,
    createForm,
    selectedAccess,
    creating,
    accessSaving,
    roleOptions,
    domainOptions,
    load,
    openCreateModal,
    closeCreateModal,
    submitCreate,
    triggerRowAction,
    closeAccessDrawer,
    saveAccessBinding,
    updateSelectedDomains,
    isActionPending
  } = useEmployeeManagement()

  const ROLE_LABELS: Record<string, string> = {
    SYSTEM_STAFF: 'System Staff',
    ADMIN: 'Administrator',
    SYSTEM_ADMIN: 'System Administrator',
    OPERATIONS: 'Operations',
    RISK: 'Risk',
    COMPLIANCE: 'Compliance'
  }

  const currentPage = computed(() => pagination.value.page || 1)
  const totalPages = computed(() => pagination.value.totalPages || 1)

  function onTriggerAction(row: unknown, action: string) {
    triggerRowAction(row as EmployeeRowView, action)
  }

  function onVisibleActions(row: unknown): string[] {
    return visibleActions(row as EmployeeRowView)
  }

  function onIsActionPending(row: unknown, action: string): boolean {
    return isActionPending(row as EmployeeRowView, action)
  }

  function onStatusChange() {
    filters.pageNum = 1
  }

  function roleLabel(role: string | null): string {
    if (!role) return 'Pending'
    const normalized = role.toUpperCase()
    return ROLE_LABELS[normalized] || role
  }

  function visibleActions(row: EmployeeRowView): string[] {
    if (
      row.activationStatus === 'pending_activation' ||
      row.activationStatus === 'expired_activation'
    ) {
      return ['reissue_activation_link']
    }
    return [
      'reset_password',
      row.accountStatus === 'disabled' ? 'enable' : 'disable',
      'review_access'
    ]
  }

  function actionTitle(action: string): string {
    switch (action) {
      case 'reissue_activation_link':
        return t('system.reissueActivation')
      case 'reset_password':
        return t('system.resetPassword')
      case 'enable':
        return t('system.enable')
      case 'disable':
        return t('system.disable')
      case 'review_access':
        return t('system.reviewAccess')
      default:
        return action
    }
  }

  function activationTag(s: string) {
    if (s === 'activated') return 'success'
    if (s === 'pending_activation') return 'warning'
    return 'danger'
  }
  function activationLabel(s: string) {
    if (s === 'activated') return 'Active'
    if (s === 'pending_activation') return 'Pending'
    return 'Expired'
  }
</script>

<style scoped>
  .governance-notice {
    max-width: 640px;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--warning-700, #b45309);
    background: var(--warning-50, #fffbeb);
    border: 1px solid rgb(245 158 11 / 20%);
    border-radius: 8px;
  }
</style>
