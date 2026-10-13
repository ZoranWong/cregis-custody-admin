<template>
  <div class="page-content">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-g-900">CryptoVault Ltd</h1>
      <ArtBackButton history />
    </div>

    <!-- VASP Due Diligence Progress -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">VASP Due Diligence Progress</h2>
      </div>
      <div class="p-4">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-24 text-sm text-g-500">Document Review</div>
            <el-progress :percentage="100" :stroke-width="8" class="flex-1" />
            <el-tag type="success" size="small">Complete</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-24 text-sm text-g-500">KYB Verification</div>
            <el-progress :percentage="100" :stroke-width="8" class="flex-1" />
            <el-tag type="success" size="small">Complete</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-24 text-sm text-g-500">Onboarding Call</div>
            <el-progress :percentage="100" :stroke-width="8" class="flex-1" />
            <el-tag type="success" size="small">Complete</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-24 text-sm text-g-500">Technical Integration</div>
            <el-progress :percentage="60" :stroke-width="8" status="warning" class="flex-1" />
            <el-tag type="warning" size="small">In Progress</el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Context -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Ticket Context</h2>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-g-500">Ticket ID:</span>
            <span class="ml-2 text-g-900 font-mono">{{ ticketId }}</span>
          </div>
          <div>
            <span class="text-g-500">Type:</span>
            <span class="ml-2 text-g-900">Onboarding</span>
          </div>
          <div>
            <span class="text-g-500">Priority:</span>
            <el-tag type="warning" size="small" class="ml-2">P1 - Important</el-tag>
          </div>
          <div>
            <span class="text-g-500">Status:</span>
            <el-tag type="warning" size="small" class="ml-2">Under Review</el-tag>
          </div>
          <div>
            <span class="text-g-500">Created:</span>
            <span class="ml-2 text-g-900">2026-08-20 09:00:00</span>
          </div>
          <div>
            <span class="text-g-500">Assignee:</span>
            <span class="ml-2 text-g-900">Lisa Kumar</span>
          </div>
        </div>
        <div class="mt-4 text-sm text-g-700">
          <div class="text-g-500 mb-1">Description:</div>
          <p
            >CryptoVault Ltd is a digital asset custody provider based in Dubai. They require
            onboarding to our platform for their institutional clients. Technical integration is in
            progress, waiting for additional compliance documentation.</p
          >
        </div>
      </div>
    </div>

    <!-- Communication Records -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Communication Records</h2>
      </div>
      <div class="p-4">
        <div class="space-y-4">
          <div class="border-l-4 border-primary pl-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-g-900">Lisa Kumar</span>
              <span class="text-xs text-g-500">2026-08-25 10:30:00</span>
            </div>
            <div class="text-sm text-g-700">
              Requested additional compliance documentation from CryptoVault. Waiting for response.
            </div>
          </div>
          <div class="border-l-4 border-success pl-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-g-900">CryptoVault Team</span>
              <span class="text-xs text-g-500">2026-08-24 15:20:00</span>
            </div>
            <div class="text-sm text-g-700">
              Submitted initial KYB package and technical integration plan.
            </div>
          </div>
          <div class="border-l-4 border-primary pl-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-g-900">Lisa Kumar</span>
              <span class="text-xs text-g-500">2026-08-20 09:30:00</span>
            </div>
            <div class="text-sm text-g-700">
              Initial contact established. CryptoVault is interested in our custody services.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Follow-up Actions -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Follow-up Actions</h2>
      </div>
      <div class="p-4">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded border-2 border-warning mt-0.5"></div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Review additional compliance documentation</div>
              <div class="text-xs text-g-500">Due: 2026-08-26 · Assigned to: Lisa Kumar</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded border-2 border-success mt-0.5 bg-success"></div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Complete technical integration review</div>
              <div class="text-xs text-g-500">Completed: 2026-08-24</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded border-2 border-success mt-0.5 bg-success"></div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Schedule onboarding call</div>
              <div class="text-xs text-g-500">Completed: 2026-08-22</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'ticket-detail' })

  const route = useRoute()
  const ticketId = route.params.ticketId as string
</script>
