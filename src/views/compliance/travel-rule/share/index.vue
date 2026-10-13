<template>
  <div class="page-content">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-hero font-semibold text-g-900">{{
          $t('menus.compliance.travelRuleShare')
        }}</h1>
        <p class="text-sm text-g-700 mt-1">{{ $t('travelRule.shareSubtitle') }}</p>
      </div>
      <ArtBackButton history />
    </div>
    <!-- Share Link Generated -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{
          $t('travelRule.shareLinkGenerated')
        }}</h2>
      </div>
      <div class="p-4">
        <div class="bg-primary-50 border border-primary rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2 mb-2">
            <ArtSvgIcon icon="ri:link" class="text-icon-md text-tone-info-text" />
            <span class="text-sm font-medium text-tone-info-text">{{
              $t('travelRule.secureLinkCreated')
            }}</span>
          </div>
          <div class="text-xs text-g-700 mb-2">
            {{ $t('travelRule.linkPurpose') }}
          </div>
          <div class="flex items-center gap-2">
            <el-input v-model="shareLink" readonly class="flex-1" size="small" />
            <el-button size="small" @click="copyLink">
              <ArtSvgIcon icon="ri:file-copy-line" class="text-icon-sm mr-1" />{{
                $t('travelRule.copy')
              }}
            </el-button>
          </div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-700">{{ $t('travelRule.transactionLabel') }}:</span>
            {{ orderId }}</div
          >
          <div class="mb-2"
            ><span class="text-g-700">{{ $t('travelRule.amountLabel') }}:</span> 3,500 USDT</div
          >
          <div
            ><span class="text-g-700">{{ $t('travelRule.counterpartyVaspLabel') }}:</span> Notabene
            (Switzerland)</div
          >
        </div>
      </div>
    </div>

    <!-- Upload Proof Document -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{ $t('travelRule.uploadProof') }}</h2>
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
          <ArtSvgIcon
            icon="ri:upload-cloud-2-line"
            class="text-icon-xl text-tone-muted-text mb-2"
          />
          <div class="text-sm text-g-700">{{ $t('travelRule.dropHint') }}</div>
          <div class="text-xs text-g-700 mt-1">{{ $t('travelRule.dropFormats') }}</div>
        </el-upload>
        <div class="mt-4 text-sm text-g-700">
          {{ $t('travelRule.uploadPurpose') }}
        </div>
      </div>
    </div>

    <!-- Approval Status -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{ $t('travelRule.approvalStatus') }}</h2>
      </div>
      <div class="p-4">
        <div class="bg-warning-50 border border-warning rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <ArtSvgIcon icon="ri:time-line" class="text-icon-md text-tone-progress-text" />
            <span class="text-sm font-medium text-tone-progress-text">{{
              $t('travelRule.pendingCounterparty')
            }}</span>
          </div>
          <div class="text-xs text-g-700 mt-1">
            {{ $t('travelRule.pendingCounterpartyHint') }}
          </div>
        </div>
        <div class="text-sm text-g-700">
          <div class="mb-2"
            ><span class="text-g-700">{{ $t('travelRule.shareLinkCreatedLabel') }}:</span>
            2026-08-25 10:30:00</div
          >
          <div class="mb-2"
            ><span class="text-g-700">{{ $t('travelRule.linkExpiresLabel') }}:</span> 2026-08-26
            10:30:00 {{ $t('travelRule.hours24') }}</div
          >
          <div
            ><span class="text-g-700">{{ $t('travelRule.statusLabel') }}:</span>
            <el-tag :type="warning" size="small">{{
              $t('travelRule.awaitingResponse')
            }}</el-tag></div
          >
        </div>
      </div>
    </div>

    <!-- Approval Timeline -->
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <h2 class="text-title font-semibold text-g-900">{{ $t('travelRule.approvalTimeline') }}</h2>
      </div>
      <div class="p-4">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:check-line" class="text-icon-md text-tone-done-text" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">{{ $t('travelRule.originatorApproved') }}</div>
              <div class="text-xs text-g-700">CryptoVault Ltd · 2026-08-25 10:29:55</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
              <ArtSvgIcon icon="ri:time-line" class="text-icon-md text-tone-progress-text" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-g-900">{{ $t('travelRule.counterpartyReview') }}</div>
              <div class="text-xs text-g-700">Pending · Notabene</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-g-100 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-g-400"></div>
            </div>
            <div class="flex-1">
              <div class="text-sm text-tone-muted-text">{{ $t('travelRule.finalSettlement') }}</div>
              <div class="text-xs text-tone-muted-text">{{
                $t('travelRule.awaitingApproval')
              }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'TravelRuleShare' })

  const { t } = useI18n()
  const route = useRoute()
  const orderId = route.params.id as string

  const shareLink = ref(`https://share.cregis-custody.com/tr/${orderId}?token=abc123xyz`)
  const fileList = ref<any[]>([])

  function copyLink() {
    navigator.clipboard.writeText(shareLink.value)
    ElMessage.success(t('travelRule.linkCopied'))
  }

  function handleFileChange(file: any, uploadFileList: any[]) {
    fileList.value = uploadFileList
  }

  function handleFileRemove(file: any, uploadFileList: any[]) {
    fileList.value = uploadFileList
  }
</script>
