<template>
  <div class="page-content">
    <div class="mb-5">
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />Back
      </el-button>
    </div>

    <h1 class="text-xl font-semibold text-g-900 mb-5">Transaction Inspection</h1>

    <!-- Block Information -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Block Information</h2>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-g-500">Order ID:</span>
            <span class="ml-2 text-g-900 font-mono">{{ orderId }}</span>
          </div>
          <div>
            <span class="text-g-500">Amount:</span>
            <span class="ml-2 text-g-900">3,500 USDT</span>
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
      </div>
    </div>

    <!-- Transaction Details -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Transaction Details</h2>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium text-g-700 mb-2">Originator</h3>
            <div class="bg-g-50 rounded-lg p-3 text-sm">
              <div class="text-g-900 font-medium mb-1">CryptoVault Ltd</div>
              <div class="text-g-500 text-xs">Unit A · 0x4f2a8b...</div>
              <div class="text-g-500 text-xs mt-1">VASP: Notabene</div>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-g-700 mb-2">Beneficiary</h3>
            <div class="bg-g-50 rounded-lg p-3 text-sm">
              <div class="text-g-900 font-medium mb-1">The UCE DMCC</div>
              <div class="text-g-500 text-xs">0x9c1b3d...</div>
              <div class="text-g-500 text-xs mt-1">VASP: Coinbase Prime</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- On-Chain Timeline -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">On-Chain Timeline</h2>
      </div>
      <div class="p-4">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Broadcasted</div>
              <div class="text-xs text-g-500">2026-08-25 10:30:15</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Confirmed (12 confirmations)</div>
              <div class="text-xs text-g-500">2026-08-25 10:35:42</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Settled</div>
              <div class="text-xs text-g-500">2026-08-25 10:36:08</div>
            </div>
          </div>
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
            <span class="text-sm font-medium text-success">KYB Verified</span>
          </div>
          <div class="text-xs text-g-600 mt-1">Ultimate Beneficial Owners: 3 identified</div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-500">Legal Entity Type:</span> Financial Institution</div
          >
          <div class="mb-2"><span class="text-g-500">Jurisdiction:</span> UAE (Dubai)</div>
          <div
            ><span class="text-g-500">CRS/FATCA Classification:</span> Participating Jurisdiction
            FI</div
          >
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
            <span class="text-sm text-success">No matches found</span>
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

    <!-- Travel Rule -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Travel Rule</h2>
      </div>
      <div class="p-4">
        <div class="bg-success-50 border border-success rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:check-line" class="text-success" />
            <span class="text-sm font-medium text-success">IVMS101 PII Exchange Complete</span>
          </div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"><span class="text-g-500">Protocol:</span> TRISA</div>
          <div class="mb-2"><span class="text-g-500">Counterparty VASP:</span> Notabene</div>
          <div><span class="text-g-500">Status:</span> Completed at 2026-08-25 10:29:48</div>
        </div>
      </div>
    </div>

    <!-- Compliance Timeline -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Compliance Timeline</h2>
      </div>
      <div class="p-4">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Compliance Check - Clear</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:00</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Travel Rule - Complete</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:48</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-success mt-2"></div>
            <div>
              <div class="text-sm text-g-900">Sign-off - Approved</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:55</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fund Disposition -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Incoming Fund Status</h2>
      </div>
      <div class="p-4">
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-500">Status:</span>
            <el-tag type="success" size="small">Released</el-tag></div
          >
          <div class="mb-2"><span class="text-g-500">Released At:</span> 2026-08-25 10:36:15</div>
          <div><span class="text-g-500">Released To:</span> CryptoVault Ltd - Unit A</div>
        </div>
      </div>
    </div>

    <!-- VASP Identity -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">VASP Identity</h2>
      </div>
      <div class="p-4">
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-500">Originator VASP:</span> Notabene (Jurisdiction:
            Switzerland)</div
          >
          <div class="mb-2"
            ><span class="text-g-500">Beneficiary VASP:</span> Coinbase Prime (Jurisdiction:
            USA)</div
          >
          <div
            ><span class="text-g-500">VASP Registry Status:</span> Both registered and active</div
          >
        </div>
      </div>
    </div>

    <!-- IVMS101 PII Details -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">IVMS101 PII Details</h2>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 class="text-g-700 font-medium mb-2">Originator PII</h3>
            <div class="space-y-1 text-g-600">
              <div>Name: CryptoVault Ltd</div>
              <div>Account: 0x4f2a8b...</div>
              <div>Address: Unit A, Dubai</div>
              <div>Legal ID: CR-2024-12345</div>
            </div>
          </div>
          <div>
            <h3 class="text-g-700 font-medium mb-2">Beneficiary PII</h3>
            <div class="space-y-1 text-g-600">
              <div>Name: The UCE DMCC</div>
              <div>Account: 0x9c1b3d...</div>
              <div>Address: DMCC, Dubai</div>
              <div>Legal ID: CR-2023-98765</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approval Flow -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Approval Flow</h2>
      </div>
      <div class="p-4">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Auto-approved by Compliance Rules Engine</div>
              <div class="text-xs text-g-500">2026-08-25 10:29:00</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Final sign-off by Compliance Officer</div>
              <div class="text-xs text-g-500">Sarah Chen · 2026-08-25 10:29:55</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'TransactionLensDetail' })

  const route = useRoute()
  const router = useRouter()
  const orderId = route.params.id as string
</script>
