<!-- Step: Sign-off — 签署审批 -->
<template>
  <div>
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.approvalFlow') }}</span>
      </div>
      <div class="p-4">
        <div
          v-if="!data || (!data.state && !data.approvers?.length)"
          class="py-8 text-center text-g-400 text-sm"
          >--</div
        >
        <template v-else>
          <!-- 摘要 -->
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">State</span>
              <span class="text-sm font-bold" :style="{ color: stateColor }">{{ stateLabel }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">Threshold</span>
              <span class="text-sm text-g-800 font-medium">{{
                data.threshold != null
                  ? `${data.threshold} / ${data.total ?? data.threshold}`
                  : '--'
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">Task ID</span>
              <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                data.taskId || '--'
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">Initiator</span>
              <span class="text-sm text-g-800 font-medium">{{ data.initiator || '--' }}</span>
            </div>
          </div>

          <!-- Approvers -->
          <div v-if="data.approvers?.length" class="flex flex-col gap-2">
            <div
              v-for="approver in data.approvers"
              :key="approver.attendeeId"
              class="flex items-start gap-2 px-2.5 py-2 bg-g-50 border border-[var(--default-border)] rounded-md"
            >
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                :class="
                  approver.status === 1 ? 'bg-success-100 text-success' : 'bg-g-100 text-g-500'
                "
              >
                {{ initials(approver.statusLabel) }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-g-900">{{
                    approver.statusLabel || `#${approver.attendeeId}`
                  }}</span>
                  <span
                    class="text-[11px] font-medium"
                    :class="approver.status === 1 ? 'text-success' : 'text-g-500'"
                    >{{ approver.status === 1 ? 'Approved' : 'Pending' }}</span
                  >
                </div>
                <div class="text-[11px] text-g-500 mt-0.5">{{ approver.updatedAt || '--' }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { SignoffTabView } from '@/features/compliance/types'

  const props = defineProps<{ data: SignoffTabView | null }>()
  const { t } = useI18n()

  // state 枚举 → i18n 标签
  const stateLabel = computed(() => {
    const map: Record<string, string> = {
      AUDITING: 'txLens.soAuditing',
      SIGNING: 'txLens.soSigning',
      SIGN_SUCCEED: 'txLens.soSignSucceed',
      FAILED: 'txLens.soFailed',
      WAITING: 'txLens.soWaiting',
      SIGN_REJECTED: 'txLens.soSignRejected',
      EXPIRED: 'txLens.soExpired'
    }
    const s = props.data?.state || ''
    return map[s] ? t(map[s]) : s || '--'
  })

  // state 枚举 → 颜色
  const stateColor = computed(() => {
    const s = props.data?.state || ''
    const map: Record<string, string> = {
      SIGN_SUCCEED: 'var(--el-color-success)',
      FAILED: 'var(--el-color-danger)',
      SIGN_REJECTED: 'var(--el-color-danger)',
      EXPIRED: 'var(--el-text-color-placeholder)',
      AUDITING: 'var(--el-color-primary)',
      SIGNING: 'var(--el-color-warning)',
      WAITING: 'var(--el-color-warning)'
    }
    return map[s] || 'var(--el-text-color-primary)'
  })

  function initials(name: string): string {
    if (!name) return '?'
    const parts = name.split(/[\s@]+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
</script>

<style scoped>
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  .timeline-chain::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 7px;
    width: 2px;
    content: '';
    background: var(--el-border-color-light);
  }

  .timeline-node {
    position: relative;
    padding-bottom: 16px;
  }

  .timeline-node:last-child {
    padding-bottom: 0;
  }

  .timeline-dot {
    position: absolute;
    top: 4px;
    left: -20px;
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }
</style>
