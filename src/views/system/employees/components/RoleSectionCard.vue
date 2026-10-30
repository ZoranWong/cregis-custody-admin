<template>
  <div class="art-card mb-4 overflow-hidden">
    <div class="p-4 border-b border-[var(--default-border)] flex items-center justify-between">
      <h3 class="text-sm font-semibold text-g-900">{{ titleDisplay }}</h3>
      <el-button v-if="!isEditing" size="small" text @click="$emit('start-edit')">
        {{ $t('system.edit') }}
      </el-button>
    </div>
    <div class="p-4">
      <!-- Permission tags (view mode only, once at top) -->
      <div v-if="!isEditing && perms && perms.length" class="mb-3 flex flex-wrap gap-2">
        <el-tag v-for="perm in perms" :key="perm" size="small">{{ perm }}</el-tag>
      </div>

      <!-- Members -->
      <div class="flex flex-wrap gap-3">
        <template v-for="member in members" :key="member.id">
          <!-- Removed member (normal styling, strikethrough + restore) -->
          <div v-if="isEditing && member.removed" class="member-chip">
            <div
              class="w-8 h-8 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--theme-text)] flex items-center justify-center text-xs font-semibold flex-shrink-0"
            >
              {{ member.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-g-900 truncate line-through">{{ member.name }}</div>
              <div class="text-xs text-g-500 truncate line-through">{{ member.email }}</div>
            </div>
            <button class="restore-icon-btn" title="Restore" @click="$emit('add', member.userId)">
              <el-icon><RefreshRight /></el-icon>
            </button>
          </div>
          <!-- Normal member -->
          <div v-else class="member-chip">
            <div
              class="w-8 h-8 rounded-full bg-[var(--el-color-primary-light-7)] text-[var(--theme-text)] flex items-center justify-center text-xs font-semibold flex-shrink-0"
            >
              {{ member.initials }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm text-g-900 truncate">{{ member.name }}</span>
                <span class="status-badge" :class="memberStatusClass(member.status)">
                  {{ member.status }}
                </span>
              </div>
              <div class="text-xs text-g-500 truncate">{{ member.email }}</div>
            </div>
            <!-- Edit mode: remove button -->
            <button
              v-if="isEditing"
              class="remove-icon-btn"
              title="Remove"
              @click="$emit('remove', member.userId)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </template>
        <div v-if="members.length === 0 && !isEditing" class="py-6 text-center text-g-400 text-sm">
          {{ $t('system.noMembers') }}
        </div>
      </div>

      <!-- Add member selector (edit mode) -->
      <div v-if="isEditing" class="mt-3">
        <el-select
          v-model="selectedAddId"
          :placeholder="$t('system.addMember')"
          clearable
          class="!w-56"
          @change="handleAdd"
        >
          <el-option v-for="p in available" :key="p.id" :label="p.name" :value="Number(p.id)">
            <span>{{ p.name }}</span>
            <span class="text-xs text-g-400 ml-2">{{ p.email }}</span>
          </el-option>
        </el-select>
      </div>

      <!-- Edit actions bar -->
      <div
        v-if="isEditing"
        class="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--default-border)]"
      >
        <el-button size="small" @click="$emit('cancel-edit')">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button size="small" type="primary" @click="$emit('save')">
          {{ $t('system.save') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Delete, RefreshRight } from '@element-plus/icons-vue'
  import { ref } from 'vue'

  interface RoleMember {
    id: string
    userId: number
    initials: string
    name: string
    email: string
    status: 'Active' | 'Pending' | 'Suspended'
    removed?: boolean
  }

  interface AvailablePerson {
    id: string
    initials: string
    name: string
    email: string
  }

  defineProps<{
    title?: string
    titleDisplay: string
    roleCode: string
    isEditing: boolean
    members: RoleMember[]
    available: AvailablePerson[]
    perms?: string[]
  }>()

  const emit = defineEmits<{
    'start-edit': []
    'cancel-edit': []
    save: []
    remove: [userId: number]
    add: [userId: number]
  }>()

  const selectedAddId = ref<number | null>(null)

  function handleAdd(v: number | null) {
    if (v) {
      emit('add', v)
      selectedAddId.value = null
    }
  }

  function memberStatusClass(status: string): string {
    if (status === 'Active') return 'active'
    if (status === 'Pending') return 'pending'
    return 'suspended'
  }
</script>

<style scoped>
  /* Member chip card */
  .member-chip {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 220px;
    max-width: 320px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  /* Status badge */
  .status-badge {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    border-radius: 20px;
  }

  .status-badge.active {
    color: var(--el-color-success-dark-2);
    background: var(--el-color-success-light-9);
  }

  .status-badge.pending {
    color: var(--el-color-warning-dark-2);
    background: var(--el-color-warning-light-9);
  }

  .status-badge.suspended {
    color: var(--el-color-danger-dark-2);
    background: var(--el-color-danger-light-9);
  }

  /* Remove button */
  .remove-icon-btn {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--el-color-danger);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .remove-icon-btn:hover {
    background: var(--el-color-danger-light-9);
  }

  /* Restore button */
  .restore-icon-btn {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--el-color-success);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .restore-icon-btn:hover {
    background: var(--el-color-success-light-9);
  }
</style>
