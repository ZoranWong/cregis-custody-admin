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
          class="py-8 text-center text-tone-muted-text text-sm"
          >--</div
        >
        <template v-else>
          <!-- 摘要 -->
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">State</span>
              <span class="text-sm font-semibold" :style="{ color: stateColor }">{{
                stateLabel
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">Threshold</span>
              <span class="text-sm text-g-800 font-medium">{{
                data.threshold != null
                  ? `${data.threshold} / ${data.total ?? data.threshold}`
                  : '--'
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">Task ID</span>
              <span class="text-xs text-g-800 font-medium font-mono break-all">{{
                data.taskId || '--'
              }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">Initiator</span>
              <span class="text-sm text-g-800 font-medium">{{ data.initiator || '--' }}</span>
            </div>
          </div>

          <!-- Approvers -->
          <div v-if="data.approvers?.length" class="flex flex-col gap-2">
            <div
              v-for="approver in data.approvers"
              :key="approver.attendeeId"
              class="flex items-start gap-2 px-2.5 py-2 bg-g-50 border border-[var(--default-border)] rounded-lg"
            >
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-label font-semibold flex-shrink-0"
                :class="
                  approver.status === 1
                    ? 'bg-success-100 text-tone-done-text'
                    : 'bg-g-100 text-g-700'
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
                    class="text-label font-medium"
                    :class="approver.status === 1 ? 'text-tone-done-text' : 'text-g-700'"
                    >{{ approver.status === 1 ? 'Approved' : 'Pending' }}</span
                  >
                </div>
                <div class="text-label text-g-700 mt-0.5">{{ approver.updatedAt || '--' }}</div>
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
      SIGN_SUCCEED: 'var(--tone-done-text)',
      FAILED: 'var(--tone-error-text)',
      SIGN_REJECTED: 'var(--tone-error-text)',
      EXPIRED: 'var(--el-text-color-placeholder)',
      AUDITING: 'var(--theme-text)',
      SIGNING: 'var(--tone-progress-text)',
      WAITING: 'var(--tone-progress-text)'
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
  /*
   * ⚠️ 以下 .timeline-* 样式目前是【死代码】——
   * 本组件模板已改为「审批人列表」结构，不再渲染 .timeline-chain / .timeline-node。
   * 保留仅为将来可能恢复时间线视图；确认不再需要可整段删除。
   */
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  /*
   * 连接线改为「节点间线段」而非容器级贯穿线。
   *
   * 原先用 .timeline-chain::before 从 top 拉到 bottom，会一直延伸到容器底部 ——
   * 最后一个圆点下方仍拖出一条线（视觉上像还有后续节点）。
   *
   * 现在每个节点只负责「自己圆点 → 下一个圆点」这一段，:last-child 不画。
   * 几何：圆点相对节点 left:-20 / width:12 → 圆心 x = -14px，
   *       2px 线取 left:-15px 即与圆心对齐；纵向从圆点底边(16px)到下一圆点顶边(-4px)。
   */
  .timeline-node:not(:last-child)::before {
    position: absolute;
    top: 16px;
    bottom: -4px;
    left: -15px;
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
    border: 2px solid var(--el-bg-color);
    border-radius: 50%;
  }

  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }
</style>
