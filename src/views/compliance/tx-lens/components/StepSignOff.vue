<!-- Step: Sign-off — 签署审批 -->
<template>
  <div>
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.approvalFlow') }}</span>
      </div>
      <div class="p-4">
        <div class="timeline-chain">
          <div v-for="node in approvalFlowTimeline" :key="node.label" class="timeline-node">
            <div class="timeline-dot" :class="node.dotClass" />
            <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
            <div class="text-xs text-g-600 mt-0.5" :class="node.detailClass">{{ node.detail }}</div>
            <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
            <!-- Multi-sign approvals -->
            <div v-if="node.approvers" class="flex flex-col gap-2 mt-2">
              <div
                v-for="approver in node.approvers"
                :key="approver.name"
                class="flex items-start gap-2 px-2.5 py-2 bg-g-50 border border-[var(--default-border)] rounded-md"
              >
                <span
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                  :class="
                    approver.status === 'Approved'
                      ? 'bg-success-100 text-success'
                      : 'bg-g-100 text-g-500'
                  "
                >
                  {{ approver.initials }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-g-900">{{ approver.name }}</span>
                    <span
                      class="text-[11px] font-medium"
                      :class="approver.status === 'Approved' ? 'text-success' : 'text-g-500'"
                      >{{ approver.status }}</span
                    >
                  </div>
                  <div class="text-[11px] text-g-500 mt-0.5">{{ approver.email }}</div>
                  <div class="text-[11px] text-g-500 font-mono mt-0.5 break-all">{{
                    approver.address
                  }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ txData: any }>()

  const approvalFlowTimeline = [
    {
      label: 'Initiated',
      detail: 'John Doe',
      time: '2026-07-28 10:25:00 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: null
    },
    {
      label: 'Risk Policy Check',
      detail: 'Passed (Auto)',
      time: '2026-07-28 10:25:01 UTC',
      dotClass: 'completed',
      detailClass: 'text-success',
      approvers: null
    },
    {
      label: 'Approval',
      detail: 'Multi-sign: 2 of 3 approvals collected',
      time: '2026-07-28 10:27:30 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: [
        {
          initials: 'AM',
          name: 'Alex Morgan',
          status: 'Approved',
          email: 'alex.morgan@cregis.com',
          address: '0x71C...4aF2e9'
        },
        {
          initials: 'SL',
          name: 'Sam Lee',
          status: 'Approved',
          email: 'sam.lee@cregis.com',
          address: '0x9B3...d7E1c4'
        },
        {
          initials: 'JD',
          name: 'John Doe',
          status: 'Pending',
          email: 'john.doe@cregis.com',
          address: '0x4F8...c2B9a7'
        }
      ]
    },
    {
      label: 'Execution',
      detail: 'Transaction broadcasted to network',
      time: '2026-07-28 10:28:15 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: null
    }
  ]
</script>

<style scoped>
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }
  .timeline-chain::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
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
    left: -20px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
  }
  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }
</style>
