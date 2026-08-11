<!-- Cregis Employee Management -->
<template>
  <div class="page-content">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h2 class="text-base font-semibold text-g-900">{{ $t('system.employeeManagement') }}</h2>
      <div class="flex gap-2">
        <ElButton @click="() => load()">{{ $t('console.refresh') }}</ElButton>
        <ElButton type="primary" @click="openCreateModal">{{ $t('system.createUser') }}</ElButton>
      </div>
    </div>

    <div class="art-card art-table-card overflow-hidden mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex flex-wrap items-center gap-3">
          <el-select v-model="filters.status" :placeholder="$t('audit.status')" clearable class="!w-40" @change="onStatusChange">
            <el-option value="all" :label="$t('system.statusAll')" />
            <el-option value="pending_activation" :label="$t('system.statusPending')" />
            <el-option value="active" :label="$t('system.statusActive')" />
            <el-option value="disabled" :label="$t('system.statusDisabled')" />
            <el-option value="expired" :label="$t('system.statusExpired')" />
          </el-select>
          <el-input v-model="filters.searchQuery" :placeholder="$t('system.searchEmployee')" clearable class="!w-64">
            <template #prefix><ArtSvgIcon icon="ri:search-line" class="text-g-400" /></template>
          </el-input>
        </div>
      </div>

      <template v-if="loading"><el-skeleton :rows="10" animated class="p-5" /></template>
      <el-table v-else :data="rows" stripe size="small">
        <template #empty><div class="p-10 text-center text-g-500">{{ $t('system.noEmployees') }}</div></template>
        <el-table-column prop="displayName" :label="$t('system.name')" min-width="140" />
        <el-table-column prop="email" :label="$t('system.email')" min-width="180" />
        <el-table-column :label="$t('system.activation')" width="120">
          <template #default="{ row }"><el-tag :type="activationTag(row.activationStatus)" size="small">{{ activationLabel(row.activationStatus) }}</el-tag></template>
        </el-table-column>
        <el-table-column :label="$t('system.accountStatus')" width="100">
          <template #default="{ row }"><el-tag :type="row.accountStatus === 'enabled' ? 'success' : 'danger'" size="small">{{ row.accountStatus === 'enabled' ? $t('system.enabled') : $t('system.disabled') }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="roleCode" :label="$t('system.role')" width="140" />
        <el-table-column prop="lastSignInAt" :label="$t('system.lastSignIn')" width="180" />
        <el-table-column :label="$t('audit.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-2">
              <ElButton size="small" @click="triggerRowAction(row, 'reissue_activation_link')">{{ $t('system.reissueActivation') }}</ElButton>
              <ElButton size="small" @click="triggerRowAction(row, 'reset_password')">{{ $t('system.resetPassword') }}</ElButton>
              <ElButton size="small" :type="row.accountStatus === 'enabled' ? 'danger' : 'success'" @click="triggerRowAction(row, row.accountStatus === 'enabled' ? 'disable' : 'enable')">{{ row.accountStatus === 'enabled' ? $t('system.disable') : $t('system.enable') }}</ElButton>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="pagination.totalCount > 0" class="flex justify-between items-center px-5 py-3 border-t border-[var(--default-border)]">
        <span class="text-xs text-g-500">Page {{ pagination.page }} / {{ pagination.totalPages || 1 }} · {{ pagination.totalCount }} employees</span>
        <el-pagination v-model:current-page="filters.pageNum" :total="pagination.totalCount" :page-sizes="[10,20,50]" background layout="prev,pager,next,sizes" @current-change="(v:number)=>{filters.pageNum=v}" @size-change="(v:number)=>{filters.pageSize=v}" />
      </div>
    </div>

    <!-- Create Modal -->
    <el-dialog v-model="createModalOpen" :title="$t('system.createUser')" width="600px">
      <div class="space-y-4">
        <div>
          <label class="text-xs text-g-500">{{ $t('system.name') }}</label>
          <el-input v-model="createForm.displayName" class="mt-1" />
        </div>
        <div>
          <label class="text-xs text-g-500">{{ $t('system.email') }}</label>
          <el-input v-model="createForm.email" type="email" class="mt-1" />
        </div>
        <div>
          <label class="text-xs text-g-500">{{ $t('system.role') }}</label>
          <el-select v-model="createForm.initialRoleCode" class="!w-full mt-1">
            <el-option value="SYSTEM_ADMIN" label="System Admin" />
            <el-option value="OPERATIONS" label="Operations" />
            <el-option value="RISK" label="Risk" />
            <el-option value="COMPLIANCE" label="Compliance" />
            <el-option value="AUDIT" label="Audit" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <ElButton @click="closeCreateModal">{{ $t('table.form.reset') }}</ElButton>
        <ElButton type="primary" :disabled="creating" @click="submitCreate">{{ $t('table.form.submit') }}</ElButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useEmployeeManagement } from '@/features/system-admin/useEmployeeManagement'

defineOptions({ name: 'EmployeeManagement' })
const { loading, rows, pagination, filters, createModalOpen, createForm, creating, load, openCreateModal, closeCreateModal, submitCreate, triggerRowAction } = useEmployeeManagement()

function onStatusChange() { filters.pageNum = 1 }
function activationTag(s: string) { if (s === 'completed') return 'success'; if (s === 'pending') return 'warning'; return 'danger' }
function activationLabel(s: string) { if (s === 'completed') return 'Active'; if (s === 'pending') return 'Pending'; return 'Expired' }
</script>