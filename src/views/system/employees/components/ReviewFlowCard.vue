<template>
  <div class="art-card mb-4 overflow-hidden">
    <div class="p-4 border-b border-[var(--default-border)]">
      <h3 class="text-sm font-semibold text-g-900">{{ $t('system.txReviewFlow') }}</h3>
    </div>
    <div class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="flow in displayFlows"
          :key="flow.severity"
          class="tier-card"
          :class="flow.sevClass"
        >
          <div class="tier-card-header">
            <div class="flex items-center gap-1.5">
              <span class="sev-dot" :class="flow.sevClass" />
              <span class="text-body-lg font-semibold text-g-900">{{ flow.label }}</span>
            </div>
            <span class="step-badge" :class="flow.sevClass"> {{ flow.steps.length }}-Step </span>
          </div>
          <div class="tier-card-body">
            <!-- Flow steps chain -->
            <div class="flow-chain">
              <template v-for="(step, idx) in flow.steps" :key="idx">
                <div class="flow-step">
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
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <!-- View mode: show person info -->
                      <template v-if="!isThisFlowEditing(flow.severity)">
                        <div
                          class="w-[18px] h-[18px] rounded-full bg-g-200 text-g-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                        >
                          {{ stepInitials(step) }}
                        </div>
                        <div class="flex flex-col gap-0.5 min-w-0">
                          <div class="flex items-center gap-1.5 min-w-0">
                            <span class="text-xs font-semibold text-g-900 truncate">
                              {{ stepName(step) }}
                            </span>
                            <span
                              class="status-badge"
                              :class="step.assigneeStatus === 'disabled' ? 'suspended' : 'active'"
                            >
                              {{ step.assigneeStatus === 'disabled' ? 'Suspended' : 'Active' }}
                            </span>
                          </div>
                          <span class="text-caption text-g-500 truncate">{{
                            stepEmail(step)
                          }}</span>
                        </div>
                      </template>

                      <!-- Edit mode: person picker -->
                      <template v-else>
                        <el-select
                          :model-value="step.assigneeUserId"
                          size="small"
                          class="flex-1 min-w-0"
                          @update:model-value="
                            (v: number) =>
                              $emit('update-assignee', {
                                severity: flow.severity,
                                stepIdx: idx,
                                userId: v
                              })
                          "
                        >
                          <el-option
                            v-for="m in flowMembers(flow.severity)"
                            :key="m.id"
                            :label="m.name"
                            :value="Number(m.id)"
                          >
                            <div class="flex items-center gap-2">
                              <span>{{ m.name }}</span>
                              <span class="text-xs text-g-400">{{ m.email }}</span>
                            </div>
                          </el-option>
                        </el-select>
                        <div class="flow-edit-btns flex-shrink-0">
                          <button
                            v-if="idx > 0"
                            class="flow-edit-btn"
                            title="Move up"
                            @click="
                              $emit('move-step', {
                                severity: flow.severity,
                                stepIdx: idx,
                                direction: -1
                              })
                            "
                            >↑</button
                          >
                          <button
                            v-if="idx < flow.steps.length - 1"
                            class="flow-edit-btn"
                            title="Move down"
                            @click="
                              $emit('move-step', {
                                severity: flow.severity,
                                stepIdx: idx,
                                direction: 1
                              })
                            "
                            >↓</button
                          >
                          <button
                            v-if="flow.steps.length > 1"
                            class="flow-edit-btn danger"
                            title="Remove"
                            @click="$emit('remove-step', flow.severity, idx)"
                            >×</button
                          >
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
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

            <!-- Add step button (edit mode) -->
            <div v-if="isThisFlowEditing(flow.severity)" class="mt-2">
              <button class="flow-add-step" @click="$emit('add-step', flow.severity)">
                <span class="add-circle">+</span> {{ $t('system.addStep') }}
              </button>
            </div>

            <!-- Edit / Save bar per card -->
            <div class="flow-card-actions">
              <template v-if="isThisFlowEditing(flow.severity)">
                <el-button size="small" @click="$emit('cancel-edit')">
                  {{ $t('common.cancel') }}
                </el-button>
                <el-button size="small" type="primary" @click="$emit('save')">
                  {{ $t('system.save') }}
                </el-button>
              </template>
              <template v-else>
                <el-button
                  size="small"
                  text
                  :disabled="isAnyFlowEditing"
                  @click="$emit('start-edit', flow.severity)"
                >
                  {{ $t('system.edit') }}
                </el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ReviewFlowView, ReviewFlowStep } from '@/features/system-admin/types'
  import type { TeamMember } from '@/features/system-admin/useTeamManagement'

  interface Props {
    flows: ReviewFlowView[]
    editingFlow: string | null
    flowBuffer: Record<string, { steps: ReviewFlowStep[] } | null>
    allMembers: TeamMember[]
  }

  const props = defineProps<Props>()

  defineEmits<{
    'start-edit': [severity: string]
    'cancel-edit': []
    save: []
    'update-assignee': [payload: { severity: string; stepIdx: number; userId: number }]
    'add-step': [severity: string]
    'remove-step': [severity: string, stepIdx: number]
    'move-step': [payload: { severity: string; stepIdx: number; direction: number }]
  }>()

  // Severity display mapping
  const severityMap: Record<string, { label: string; sevClass: string; stepClass: string }> = {
    ROUTINE: { label: 'Routine', sevClass: 'routine', stepClass: 's1' },
    MEDIUM: { label: 'Medium', sevClass: 'medium', stepClass: 's2' },
    CRITICAL: { label: 'Critical', sevClass: 'critical', stepClass: 's3' }
  }

  // Determine if THIS specific card is being edited
  function isThisFlowEditing(severity: string): boolean {
    return props.editingFlow === severity
  }

  // Is ANY flow being edited?
  const isAnyFlowEditing = computed(() => props.editingFlow !== null)

  interface DisplayFlow {
    severity: string
    label: string
    sevClass: string
    stepClass: string
    timeoutMinutes: number
    timeoutAction: string
    steps: ReviewFlowStep[]
  }

  const displayFlows = computed<DisplayFlow[]>(() => {
    return (props.flows.length > 0 ? props.flows : defaultFlows.value).map((flow) => {
      const meta = severityMap[flow.severity] || {
        label: flow.severity,
        sevClass: 'routine',
        stepClass: 's1'
      }
      const steps =
        props.editingFlow === flow.severity && props.flowBuffer[flow.severity]
          ? props.flowBuffer[flow.severity]!.steps
          : flow.steps
      return {
        severity: flow.severity,
        label: meta.label,
        sevClass: meta.sevClass,
        stepClass: meta.stepClass,
        timeoutMinutes: flow.timeoutMinutes,
        timeoutAction: flow.timeoutAction,
        steps
      }
    })
  })

  // Default flows when backend hasn't returned data yet
  const defaultFlows = computed<ReviewFlowView[]>(() => [
    {
      severity: 'ROUTINE',
      flowName: 'Routine',
      timeoutMinutes: 240,
      timeoutAction: 'AUTO_RESOLVE',
      status: 'active',
      description: '',
      steps: []
    },
    {
      severity: 'MEDIUM',
      flowName: 'Medium',
      timeoutMinutes: 120,
      timeoutAction: 'ESCALATE',
      status: 'active',
      description: '',
      steps: []
    },
    {
      severity: 'CRITICAL',
      flowName: 'Critical',
      timeoutMinutes: 30,
      timeoutAction: 'ESCALATE',
      status: 'active',
      description: '',
      steps: []
    }
  ])

  /** Find the team member for a step's assignee */
  function findMember(userId: number): TeamMember | undefined {
    return props.allMembers.find((m) => Number(m.id) === userId)
  }

  function stepInitials(step: ReviewFlowStep): string {
    const member = findMember(step.assigneeUserId)
    return member?.initials || step.assigneeName.slice(0, 2).toUpperCase()
  }

  function stepName(step: ReviewFlowStep): string {
    const member = findMember(step.assigneeUserId)
    return member?.name || step.assigneeName || 'Unknown'
  }

  function stepEmail(step: ReviewFlowStep): string {
    const member = findMember(step.assigneeUserId)
    return member?.email || step.assigneeEmail || ''
  }

  /** All members are eligible for flow steps */
  function flowMembers(_severity: string): TeamMember[] {
    return props.allMembers.filter((m) => m.status !== 'Suspended')
  }
</script>

<script lang="ts">
  import { computed } from 'vue'
</script>

<style scoped>
  /* Status badge (same as RoleSectionCard) */
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

  .status-badge.suspended {
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

  /* Edit buttons */
  .flow-edit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: #fff;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    transition: all 0.15s;
  }

  .flow-edit-btn:hover {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color);
    border-color: var(--el-border-color-dark);
  }

  .flow-edit-btn.danger:hover {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
    border-color: var(--el-color-danger-light-5);
  }

  /* Add step button */
  .flow-add-step {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 0 12px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: none;
    border: none;
  }

  .flow-add-step:hover {
    color: var(--el-text-color-primary);
  }

  .flow-add-step .add-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 13px;
    border: 2px dashed var(--el-border-color);
    border-radius: 50%;
  }

  /* Action bar */
  .flow-card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 10px;
    margin-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
</style>
