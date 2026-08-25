<template>
  <div class="page-content">
    <div class="mb-5">
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />Back
      </el-button>
    </div>

    <h1 class="text-xl font-semibold text-g-900 mb-5">Travel Rule Approval Request</h1>

    <!-- Share Link Generated -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Share Link Generated</h2>
      </div>
      <div class="p-4">
        <div class="bg-primary-50 border border-primary rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2 mb-2">
            <ArtSvgIcon icon="ri:link" class="text-primary" />
            <span class="text-sm font-medium text-primary">Secure Share Link Created</span>
          </div>
          <div class="text-xs text-g-600 mb-2">
            This link allows the counterparty VASP to review transaction details and provide
            approval.
          </div>
          <div class="flex items-center gap-2">
            <el-input v-model="shareLink" readonly class="flex-1" size="small" />
            <el-button size="small" @click="copyLink">
              <ArtSvgIcon icon="ri:file-copy-line" class="mr-1" />Copy
            </el-button>
          </div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"><span class="text-g-500">Transaction:</span> {{ orderId }}</div>
          <div class="mb-2"><span class="text-g-500">Amount:</span> 3,500 USDT</div>
          <div><span class="text-g-500">Counterparty VASP:</span> Notabene (Switzerland)</div>
        </div>
      </div>
    </div>

    <!-- Upload Proof Document -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Upload Proof Document</h2>
      </div>
      <div class="p-4">
        <el-upload
          :auto-upload="false"
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          drag
          multiple
        >
          <ArtSvgIcon icon="ri:upload-cloud-2-line" class="text-4xl text-g-400 mb-2" />
          <div class="text-sm text-g-700">Drop files here or click to upload</div>
          <div class="text-xs text-g-500 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</div>
        </el-upload>
        <div class="mt-4 text-sm text-g-500">
          Upload any supporting documents required for counterparty approval (e.g., compliance
          certificates, transaction confirmations).
        </div>
      </div>
    </div>

    <!-- Approval Status -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Approval Status</h2>
      </div>
      <div class="p-4">
        <div class="bg-warning-50 border border-warning rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:time-line" class="text-warning" />
            <span class="text-sm font-medium text-warning">Pending Counterparty Approval</span>
          </div>
          <div class="text-xs text-g-600 mt-1">
            Waiting for counterparty VASP to review and approve the transaction.
          </div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-500">Share Link Created:</span> 2026-08-25 10:30:00</div
          >
          <div class="mb-2"
            ><span class="text-g-500">Link Expires:</span> 2026-08-26 10:30:00 (24 hours)</div
          >
          <div
            ><span class="text-g-500">Status:</span>
            <el-tag type="warning" size="small">Awaiting Response</el-tag></div
          >
        </div>
      </div>
    </div>

    <!-- Approval Timeline -->
    <div class="art-card mb-5">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-base font-semibold text-g-900">Approval Timeline</h2>
      </div>
      <div class="p-4">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-success" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Originator Approved</div>
              <div class="text-xs text-g-500">CryptoVault Ltd · 2026-08-25 10:29:55</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:time-line" class="text-warning" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">Counterparty Review</div>
              <div class="text-xs text-g-500">Pending · Notabene</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-g-100 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-g-400"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-400">Final Settlement</div>
              <div class="text-xs text-g-400">Awaiting approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'TravelRuleShare' })

  const route = useRoute()
  const router = useRouter()
  const orderId = route.params.id as string

  const shareLink = ref(`https://share.cregis-custody.com/tr/${orderId}?token=abc123xyz`)
  const fileList = ref([])

  function copyLink() {
    navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('Link copied to clipboard')
  }

  function handleFileChange(file: any, uploadFileList: any[]) {
    fileList.value = uploadFileList
  }

  function handleFileRemove(file: any, uploadFileList: any[]) {
    fileList.value = uploadFileList
  }
</script>
