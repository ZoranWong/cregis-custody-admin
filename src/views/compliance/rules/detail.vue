<template>
  <div class="page-content">
    <div class="mb-5">
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />Back
      </el-button>
    </div>

    <h1 class="text-xl font-semibold text-g-900 mb-5">Rule Detail</h1>

    <!-- Rule Configuration -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-g-900">Sanctions Hit Block</h2>
          <div class="flex items-center gap-2">
            <el-tag type="danger" size="small" effect="light">Critical</el-tag>
            <el-tag type="success" size="small" effect="light">Active</el-tag>
          </div>
        </div>
      </div>
      <div class="p-4">
        <div class="text-sm text-g-700 mb-4">
          <p class="mb-3">Block transactions where any party matches sanctions lists.</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-g-500">Direction:</span>
              <span class="ml-2 text-g-900">Outgoing</span>
            </div>
            <div>
              <span class="text-g-500">Stage:</span>
              <span class="ml-2 text-g-900">Due Diligence</span>
            </div>
            <div>
              <span class="text-g-500">Decision:</span>
              <span class="ml-2 text-g-900">Auto Reject</span>
            </div>
            <div>
              <span class="text-g-500">Scope:</span>
              <span class="ml-2 text-g-900">Global</span>
            </div>
          </div>
        </div>
        <div class="border-t border-[var(--default-border)] pt-4">
          <h3 class="text-sm font-medium text-g-700 mb-2">Risk Factors</h3>
          <div class="flex flex-wrap gap-2">
            <el-tag size="small" effect="plain">Sanctions Screening</el-tag>
            <el-tag size="small" effect="plain">Adverse Media</el-tag>
            <el-tag size="small" effect="plain">Jurisdiction Risk</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Trigger History -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Trigger History</h2>
      </div>
      <div class="p-4">
        <el-table :data="triggerHistory" stripe size="small">
          <el-table-column prop="date" label="Date" width="160" />
          <el-table-column prop="orderId" label="Order ID" min-width="180" />
          <el-table-column prop="amount" label="Amount" width="120" />
          <el-table-column prop="status" label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Blocked' ? 'danger' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewer" label="Reviewer" width="120" />
        </el-table>
      </div>
    </div>

    <!-- Approval Flow -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Rule Approval Flow</h2>
      </div>
      <div class="p-4">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Rule Created</div>
              <div class="text-xs text-g-500">Michael Reed · 2026-01-15 09:00:00</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Compliance Review - Approved</div>
              <div class="text-xs text-g-500">Sarah Chen · 2026-01-15 14:30:00</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Final Approval - Activated</div>
              <div class="text-xs text-g-500">Tom Wang · 2026-01-16 10:00:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ComplianceRuleDetail' })

  const router = useRouter()

  const triggerHistory = [
    {
      date: '2026-08-24 16:45',
      orderId: 'ORDER-2026-08-24-042',
      amount: '5,000 USDT',
      status: 'Blocked',
      reviewer: 'Auto'
    },
    {
      date: '2026-08-23 11:20',
      orderId: 'ORDER-2026-08-23-018',
      amount: '2,800 USDT',
      status: 'Blocked',
      reviewer: 'Auto'
    },
    {
      date: '2026-08-20 09:15',
      orderId: 'ORDER-2026-08-20-005',
      amount: '1,500 USDT',
      status: 'Review',
      reviewer: 'Sarah Chen'
    }
  ]
</script>
