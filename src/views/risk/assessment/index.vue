<template>
  <div class="page-content">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-g-900">Transaction Risk Assessment</h1>
      <ArtBackButton history />
    </div>

    <!-- Transaction Basics -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Basics</h2>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span class="text-g-500">Transaction ID:</span>
            <span class="ml-2 text-g-900 font-mono">{{ transactionId }}</span>
          </div>
          <div>
            <span class="text-g-500">Amount:</span>
            <span class="ml-2 text-g-900">3,500 USDT-TEST (Sepolia)</span>
          </div>
          <div>
            <span class="text-g-500">Direction:</span>
            <el-tag type="warning" size="small" class="ml-2">Outgoing</el-tag>
          </div>
          <div>
            <span class="text-g-500">Time:</span>
            <span class="ml-2 text-g-900">2026-08-25 10:30:00</span>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex-1 bg-g-50 rounded-lg p-3">
            <div class="text-xs text-g-500 mb-1">Originator</div>
            <div class="text-sm text-g-900 font-medium">CryptoVault Ltd</div>
            <div class="text-xs text-g-500">Unit A · 0x4f2a8b...</div>
          </div>
          <ArtSvgIcon icon="ri:arrow-right-line" class="text-g-400 text-xl" />
          <div class="flex-1 bg-g-50 rounded-lg p-3">
            <div class="text-xs text-g-500 mb-1">Beneficiary</div>
            <div class="text-sm text-g-900 font-medium">The UCE DMCC</div>
            <div class="text-xs text-g-500">0x9c1b3d...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Travel Rule -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Travel Rule</h2>
      </div>
      <div class="p-4">
        <div class="bg-success-50 border border-success rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:check-line" class="text-success" />
            <span class="text-sm font-medium text-success">Counterparty VASP Identified</span>
          </div>
          <div class="text-xs text-g-600 mt-1"
            >Notabene · Jurisdiction: Switzerland · Status: Active</div
          >
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"><span class="text-g-500">IVMS101 PII Exchange:</span> Complete</div>
          <div class="mb-2"
            ><span class="text-g-500">Originator PII:</span> CryptoVault Ltd, Unit A, Dubai</div
          >
          <div><span class="text-g-500">Beneficiary PII:</span> The UCE DMCC, DMCC, Dubai</div>
        </div>
      </div>
    </div>

    <!-- Negotiation Trace -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Negotiation Trace</h2>
      </div>
      <div class="p-4">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Created</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:00</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Approved by Counterparty</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:15</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Settled</div>
              <div class="text-xs text-g-500">2026-08-25 10:30:45</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Settlement Match</div>
              <div class="text-xs text-g-500">2026-08-25 10:36:08</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Screening Results -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Screening Results</h2>
      </div>
      <div class="p-4">
        <h3 class="text-sm font-medium text-g-700 mb-2">Entity Screening</h3>
        <div class="bg-success-50 border border-success rounded-lg p-3 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:check-line" class="text-success" />
            <span class="text-sm text-success">No matches</span>
          </div>
          <div class="text-xs text-g-600 mt-1">Sanctions, PEP, Adverse Media</div>
        </div>
        <h3 class="text-sm font-medium text-g-700 mb-2">On-Chain Screening</h3>
        <div class="bg-success-50 border border-success rounded-lg p-3">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:check-line" class="text-success" />
            <span class="text-sm text-success">Clean</span>
          </div>
          <div class="text-xs text-g-600 mt-1">No mixer/darknet/ransomware exposure</div>
        </div>
      </div>
    </div>

    <!-- Customer Due Diligence -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Customer Due Diligence</h2>
      </div>
      <div class="p-4">
        <div class="bg-success-50 border border-success rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:check-line" class="text-success" />
            <span class="text-sm font-medium text-success">Onboarding Status: Active</span>
          </div>
        </div>
        <div class="text-sm text-g-700 mb-4">
          <div class="mb-2"
            ><span class="text-g-500">Legal Entity Type:</span> Financial Institution</div
          >
          <div class="mb-2"
            ><span class="text-g-500">CRS/FATCA Classification:</span> Participating Jurisdiction
            FI</div
          >
          <div><span class="text-g-500">KYB Verification:</span> Complete</div>
        </div>
        <h3 class="text-sm font-medium text-g-700 mb-2">Ultimate Beneficial Owners (3)</h3>
        <div class="space-y-2">
          <div class="bg-g-50 rounded-lg p-3 text-sm">
            <div class="flex items-center justify-between mb-1">
              <span class="text-g-900 font-medium">John Smith</span>
              <el-tag type="success" size="small">Verified</el-tag>
            </div>
            <div class="text-xs text-g-500">Ownership: 45% · Screening: Clean</div>
          </div>
          <div class="bg-g-50 rounded-lg p-3 text-sm">
            <div class="flex items-center justify-between mb-1">
              <span class="text-g-900 font-medium">Jane Doe</span>
              <el-tag type="success" size="small">Verified</el-tag>
            </div>
            <div class="text-xs text-g-500">Ownership: 30% · Screening: Clean</div>
          </div>
          <div class="bg-g-50 rounded-lg p-3 text-sm">
            <div class="flex items-center justify-between mb-1">
              <span class="text-g-900 font-medium">Mike Johnson</span>
              <el-tag type="success" size="small">Verified</el-tag>
            </div>
            <div class="text-xs text-g-500">Ownership: 25% · Screening: Clean</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Factor Catalog -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Risk Factor Catalog</h2>
      </div>
      <div class="p-4">
        <el-table :data="riskFactors" stripe size="small">
          <el-table-column prop="name" label="Name" min-width="180" />
          <el-table-column prop="domain" label="Domain" width="120" />
          <el-table-column prop="description" label="Description" min-width="240" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'RiskAssessment' })

  const route = useRoute()
  const router = useRouter()
  const transactionId = route.params.id as string

  const riskFactors = [
    {
      name: 'Customer Due Diligence',
      domain: 'BASICS',
      description: 'Onboarding status and KYB verification'
    },
    {
      name: 'Sanctions Screening',
      domain: 'SCREENING',
      description: 'Check against sanctions lists'
    },
    { name: 'Adverse Media', domain: 'SCREENING', description: 'Check for negative news coverage' },
    { name: 'Jurisdiction Risk', domain: 'BASICS', description: 'Evaluate country risk level' },
    {
      name: 'Transaction Pattern',
      domain: 'BASICS',
      description: 'Analyze transaction behavior patterns'
    },
    {
      name: 'Counterparty VASP',
      domain: 'TRAVEL RULE',
      description: 'Verify counterparty VASP identity'
    }
  ]
</script>
