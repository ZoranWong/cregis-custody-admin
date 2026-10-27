<!-- Cold Storage Transfer Detail — 冷存储转账请求详情 -->
<template>
  <div class="page-content">
    <template v-if="loading">
      <div class="art-card p-5 mb-4"><el-skeleton :rows="3" animated /></div>
      <div class="art-card p-5"><el-skeleton :rows="8" animated /></div>
    </template>

    <template v-else-if="loadError">
      <div class="art-card p-10 text-center">
        <p class="text-tone-error-text mb-4">{{ loadError }}</p>
        <ElButton type="primary" @click="load">{{ $t('console.refresh') }}</ElButton>
      </div>
    </template>

    <template v-else-if="transfer">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs text-tone-muted-text mb-3">
        <button class="hover:text-g-700" @click="backToList">
          {{ $t('coldStorage.pageTitle') }}
        </button>
        <span class="opacity-50">›</span>
        <span class="text-g-700 font-medium font-mono">{{ transfer.requestId }}</span>
      </div>

      <!-- Request Header -->
      <div class="art-card p-5 mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-xl font-semibold text-g-900 font-mono">{{ transfer.requestId }}</h1>
          <ArtStatusTag
            :status="statusTone(transfer.status)"
            :text="$t(`coldStorage.status.${transfer.status}`)"
          />
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tone-muted-text mt-2">
          <span class="font-medium text-g-800">{{ transfer.merchantName }}</span>
          <span class="tabular-nums"
            >{{ formatCoinBalance(transfer.amount, transfer.decimals) }} {{ transfer.coinId }}</span
          >
          <span>{{
            $t('coldStorage.requestedAgo', { time: formatRelativeTime(transfer.requestedAt) })
          }}</span>
        </div>
      </div>

      <!-- Request Details -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h2 class="text-sm font-semibold text-g-900">{{ $t('coldStorage.requestDetails') }}</h2>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="detail-label">{{ $t('coldStorage.merchant') }}</div>
            <div class="detail-value">{{ transfer.merchantName }}</div>
          </div>
          <div>
            <div class="detail-label">{{ $t('coldStorage.amount') }}</div>
            <div class="detail-value tabular-nums"
              >{{ formatCoinBalance(transfer.amount, transfer.decimals) }}
              {{ transfer.coinId }}</div
            >
          </div>
          <div>
            <div class="detail-label">{{ $t('coldStorage.sourceWallet') }}</div>
            <div class="detail-value mono">{{ transfer.sourceAddress }}</div>
          </div>
          <div>
            <div class="detail-label">{{ $t('coldStorage.destinationAddress') }}</div>
            <div class="detail-value mono">{{ transfer.destinationAddress }}</div>
          </div>
          <div>
            <div class="detail-label">{{ $t('coldStorage.requestedAt') }}</div>
            <div class="detail-value">{{ formatTime(transfer.requestedAt) }}</div>
          </div>
          <div>
            <div class="detail-label">{{ $t('coldStorage.network') }}</div>
            <div class="detail-value">{{ transfer.network }}</div>
          </div>
        </div>
      </div>

      <!-- Instruction Approval Status -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h2 class="text-sm font-semibold text-g-900">{{ $t('coldStorage.approvalStatus') }}</h2>
        </div>
        <div class="p-5">
          <div class="rounded-lg border border-[var(--tone-done-border)] bg-tone-done-bg p-4">
            <div class="text-sm font-semibold text-tone-done-text mb-3">
              {{
                $t('coldStorage.thresholdHint', {
                  required: transfer.approvalThreshold.required,
                  total: transfer.approvalThreshold.total
                })
              }}
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="approver in transfer.approvers"
                :key="approver.id"
                class="flex items-center justify-between gap-3 rounded bg-[var(--default-box-color)] px-3 py-2"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="approver-avatar" :class="{ approved: approver.approved }">
                    {{ initials(approver.name) }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-g-900 truncate">{{ approver.name }}</div>
                    <div class="text-xs text-tone-muted-text truncate">
                      {{ approver.email }} · {{ $t('coldStorage.key') }}: {{ approver.keyRef }}
                    </div>
                  </div>
                </div>
                <span
                  class="text-xs font-semibold flex-shrink-0"
                  :class="approver.approved ? 'text-tone-done-text' : 'text-tone-muted-text'"
                >
                  {{
                    approver.approved ? $t('coldStorage.approved') : $t('coldStorage.notApproved')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Processing Workflow -->
      <div class="art-card mb-4 overflow-hidden">
        <div class="p-4 border-b border-[var(--default-border)]">
          <h2 class="text-sm font-semibold text-g-900">{{ $t('coldStorage.workflow') }}</h2>
        </div>
        <div class="p-5 flex flex-col gap-4">
          <!-- Step 1: Export -->
          <div class="workflow-step" :class="stepClass('export')">
            <div class="step-indicator">{{ stepIndex('export') }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-g-900">{{
                $t('coldStorage.stepExportTitle')
              }}</div>
              <div class="text-xs text-tone-muted-text mt-1 mb-3">
                {{ $t('coldStorage.stepExportDesc') }}
              </div>
              <div v-if="transfer.exportedFile" class="file-info">
                <ArtSvgIcon icon="ri:file-text-line" class="text-icon-sm" />
                <span class="font-mono">{{ transfer.exportedFile.name }}</span>
                <span class="text-tone-muted-text">{{
                  formatRelativeTime(transfer.exportedFile.exportedAt)
                }}</span>
                <button
                  class="text-xs font-medium text-[var(--el-color-primary)] hover:underline"
                  @click="redownloadInstruction"
                >
                  {{ $t('coldStorage.downloadAgain') }}
                </button>
              </div>
              <div v-else-if="canAct('export')" class="flex flex-wrap gap-2">
                <ElButton type="primary" :loading="acting" @click="handleExport">
                  {{ $t('coldStorage.exportInstruction') }}
                </ElButton>
                <ElButton type="danger" plain @click="openAbortDialog('export')">
                  {{ $t('coldStorage.abort') }}
                </ElButton>
              </div>
              <div v-if="abortNote?.step === 'export'" class="abort-note">
                <div class="font-semibold mb-1">{{ $t('coldStorage.aborted') }}</div>
                <div>{{ abortNote.reason }}</div>
              </div>
            </div>
          </div>

          <!-- Step 2: Import -->
          <div class="workflow-step" :class="stepClass('import')">
            <div class="step-indicator">{{ stepIndex('import') }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-g-900">{{
                $t('coldStorage.stepImportTitle')
              }}</div>
              <div class="text-xs text-tone-muted-text mt-1 mb-3">
                {{ $t('coldStorage.stepImportDesc') }}
              </div>
              <div v-if="transfer.importedFile" class="file-info">
                <ArtSvgIcon icon="ri:file-check-line" class="text-icon-sm" />
                <span class="font-mono">{{ transfer.importedFile.name }}</span>
                <span class="text-tone-muted-text">{{
                  formatRelativeTime(transfer.importedFile.importedAt)
                }}</span>
              </div>
              <div v-else-if="canAct('import')" class="flex flex-wrap items-center gap-2">
                <!-- 隐藏的原生 file input，由按钮触发，保证仍是系统文件选择器 -->
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="application/json,.json"
                  class="hidden"
                  @change="onSignedFileSelected"
                />
                <ElButton type="primary" :loading="acting" @click="pickSignedFile">
                  {{ $t('coldStorage.importSignedTx') }}
                </ElButton>
                <ElButton type="danger" plain @click="openAbortDialog('import')">
                  {{ $t('coldStorage.abort') }}
                </ElButton>
                <span class="text-xs text-tone-muted-text">{{ $t('coldStorage.importHint') }}</span>
              </div>
              <div v-else-if="transfer.status === 'pending'" class="text-xs text-tone-muted-text">
                {{ $t('coldStorage.waitingForExport') }}
              </div>
              <!-- 导入失败原因（格式错误 / 请求号不匹配 / 空交易） -->
              <div v-if="importError" class="abort-note mt-2">
                <div class="font-semibold mb-1">{{ $t('coldStorage.importFailed') }}</div>
                <div>{{ importError }}</div>
              </div>
              <div v-if="abortNote?.step === 'import'" class="abort-note">
                <div class="font-semibold mb-1">{{ $t('coldStorage.aborted') }}</div>
                <div>{{ abortNote.reason }}</div>
              </div>
            </div>
          </div>

          <!-- Step 3: Broadcast -->
          <div class="workflow-step" :class="stepClass('broadcast')">
            <div class="step-indicator">{{ stepIndex('broadcast') }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-g-900">{{
                $t('coldStorage.stepBroadcastTitle')
              }}</div>
              <div class="text-xs text-tone-muted-text mt-1">
                {{ $t('coldStorage.stepBroadcastDesc') }}
              </div>
              <div v-if="transfer.txHash" class="file-info mt-3" :title="transfer.txHash">
                <ArtSvgIcon icon="ri:link" class="text-icon-sm" />
                <span class="font-mono">{{ compactHex(transfer.txHash, 10, 8) }}</span>
                <span
                  class="text-xs font-semibold"
                  :class="
                    transfer.status === 'failed' ? 'text-tone-error-text' : 'text-tone-done-text'
                  "
                >
                  {{
                    transfer.status === 'failed'
                      ? $t('coldStorage.failed')
                      : $t('coldStorage.broadcastDone')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aborted banner（终态且原因为后台记录） -->
      <div
        v-if="transfer.status === 'aborted' && transfer.abortReason && !abortNote"
        class="art-card p-4 border-tone-error-border"
      >
        <div class="text-sm font-semibold text-tone-error-text mb-1">
          {{ $t('coldStorage.aborted') }}
        </div>
        <div class="text-sm text-g-700">{{ transfer.abortReason }}</div>
      </div>
    </template>

    <template v-else>
      <div class="art-card p-10 text-center text-g-500">{{ $t('coldStorage.notFound') }}</div>
    </template>

    <!-- Abort Dialog -->
    <el-dialog v-model="abortDialogVisible" :title="$t('coldStorage.abortTitle')" width="460px">
      <p class="text-sm text-g-600 mb-3">{{ $t('coldStorage.abortReasonHint') }}</p>
      <el-input
        v-model="abortReasonInput"
        type="textarea"
        :rows="4"
        :placeholder="$t('coldStorage.abortReasonPlaceholder')"
      />
      <template #footer>
        <ElButton @click="abortDialogVisible = false">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="danger" :disabled="!abortReasonInput.trim()" @click="confirmAbort">
          {{ $t('coldStorage.confirmAbort') }}
        </ElButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { formatCoinBalance, formatRelativeTime, formatTime, compactHex } from '@/utils/format'
  import {
    fetchColdStorageTransfer,
    buildInstructionFile,
    exportColdStorageInstruction,
    parseSignedTxFile,
    importColdStorageSignedTx,
    abortColdStorageTransfer,
    ColdStorageImportError
  } from '@/features/ops/coldStorage/mock'
  import type {
    ColdStorageTransferStatus,
    ColdStorageTransferView,
    ColdStorageWorkflowStep
  } from '@/features/ops/coldStorage/types'

  defineOptions({ name: 'ColdStorageTransferDetail' })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const loading = ref(true)
  const loadError = ref('')
  const acting = ref(false)
  const transfer = ref<ColdStorageTransferView | null>(null)

  // 本地会话内的操作记录（接口就绪后由后端返回，无需前端维护）
  const abortNote = ref<{ step: ColdStorageWorkflowStep; reason: string } | null>(null)
  const abortDialogVisible = ref(false)
  const abortReasonInput = ref('')
  const abortStep = ref<ColdStorageWorkflowStep>('export')

  /** 导入失败原因，展示在导入步骤内 */
  const importError = ref('')
  const fileInputRef = ref<HTMLInputElement | null>(null)

  const requestId = computed(() => String(route.params.requestId || ''))

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    try {
      const found = await fetchColdStorageTransfer(requestId.value)
      if (!found) {
        transfer.value = null
        return
      }
      transfer.value = found
      abortNote.value = null
    } catch (caught) {
      loadError.value = caught instanceof Error ? caught.message : 'Unable to load transfer.'
    } finally {
      loading.value = false
    }
  }

  function statusTone(
    status: ColdStorageTransferStatus
  ): 'success' | 'warning' | 'danger' | 'info' | null {
    if (status === 'confirmed') return 'success'
    if (status === 'pending') return 'warning'
    if (status === 'failed') return 'danger'
    if (status === 'signed' || status === 'broadcast') return 'info'
    return null
  }

  /** 当前可执行动作的步骤：由 currentStep 决定，终态或已中止时为 null */
  function canAct(step: ColdStorageWorkflowStep): boolean {
    const t = transfer.value
    if (!t || t.status === 'aborted' || abortNote.value) return false
    return t.currentStep === step
  }

  /**
   * 步骤视觉状态：
   *   completed — 该步骤产物已存在（或后续步骤已开始）
   *   active    — 当前待操作
   *   idle      — 尚未到达
   */
  function stepClass(step: ColdStorageWorkflowStep): string {
    const t = transfer.value
    if (!t) return 'idle'
    if (step === 'export') {
      if (t.status === 'aborted') return 'idle'
      if (t.exportedFile || t.currentStep === 'import' || t.currentStep === 'broadcast')
        return 'completed'
      return t.currentStep === 'export' ? 'active' : 'idle'
    }
    if (step === 'import') {
      if (t.importedFile) return 'completed'
      return t.currentStep === 'import' ? 'active' : 'idle'
    }
    // broadcast
    if (t.status === 'confirmed' || t.status === 'failed') return 'completed'
    return t.currentStep === 'broadcast' ? 'active' : 'idle'
  }

  function stepIndex(step: ColdStorageWorkflowStep): string {
    const cls = stepClass(step)
    if (cls === 'completed') return '✓'
    return step === 'export' ? '1' : step === 'import' ? '2' : '3'
  }

  function initials(name: string): string {
    return (name || '')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  function backToList(): void {
    router.push({ name: 'ColdStorageTransfers' })
  }

  /**
   * 工作流动作：调用数据层写接口（当前为本地实现），
   * 成功后用返回的最新记录刷新视图，保证列表与详情状态一致。
   */

  /** 把指令文件下载到本地（浏览器 download，不经后端） */
  function downloadInstruction(): void {
    const t = transfer.value
    if (!t) return
    const content = JSON.stringify(buildInstructionFile(t), null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${t.requestId}-instruction.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // 释放 blob URL，避免长期占用内存
    URL.revokeObjectURL(url)
  }

  async function handleExport(): Promise<void> {
    const t = transfer.value
    if (!t) return
    acting.value = true
    try {
      downloadInstruction()
      const updated = await exportColdStorageInstruction(
        t.requestId,
        `${t.requestId}-instruction.json`
      )
      if (updated) transfer.value = updated
    } finally {
      acting.value = false
    }
  }

  /** 已导出过时允许重新下载同一份指令（签名系统可能需要重试） */
  function redownloadInstruction(): void {
    downloadInstruction()
  }

  function pickSignedFile(): void {
    importError.value = ''
    fileInputRef.value?.click()
  }

  /** 读取用户选择的签名文件并校验，通过后推进到广播 */
  async function onSignedFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // 允许重复选择同一个文件（清空 value）
    input.value = ''
    const t = transfer.value
    if (!file || !t) return

    importError.value = ''
    acting.value = true
    try {
      const raw = await file.text()
      const signedTx = parseSignedTxFile(raw)
      const updated = await importColdStorageSignedTx(t.requestId, file.name, signedTx)
      if (updated) transfer.value = updated
    } catch (caught) {
      importError.value = describeImportError(caught)
    } finally {
      acting.value = false
    }
  }

  /** 把数据层的错误码翻译成用户可读的提示 */
  function describeImportError(caught: unknown): string {
    if (caught instanceof ColdStorageImportError) {
      const key = `coldStorage.importError.${caught.message}`
      const translated = t(key)
      if (translated !== key) return translated
      return caught.message
    }
    return caught instanceof Error ? caught.message : t('coldStorage.importError.UNKNOWN')
  }

  function openAbortDialog(step: ColdStorageWorkflowStep): void {
    abortStep.value = step
    abortReasonInput.value = ''
    abortDialogVisible.value = true
  }

  async function confirmAbort(): Promise<void> {
    const t = transfer.value
    const reason = abortReasonInput.value.trim()
    if (!t || !reason) return
    const updated = await abortColdStorageTransfer(t.requestId, reason)
    if (updated) transfer.value = updated
    abortNote.value = { step: abortStep.value, reason }
    abortDialogVisible.value = false
  }

  onMounted(() => {
    void load()
  })
</script>

<style scoped>
  .detail-label {
    margin-bottom: 2px;
    font-size: var(--font-size-label);
    font-weight: 600;
    color: var(--tone-muted-text);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .detail-value {
    font-size: var(--font-size-body-lg);
    font-weight: 500;
    color: var(--tone-strong-text);
  }

  .detail-value.mono {
    padding: 6px 10px;
    font-family: var(--font-family-mono, ui-monospace, monospace);
    font-size: var(--font-size-body);
    word-break: break-all;
    background: var(--tone-neutral-bg);
    border-radius: 4px;
  }

  .approver-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 10px;
    font-weight: 700;
    color: var(--tone-muted-text);
    background: var(--tone-neutral-bg);
    border-radius: 50%;
  }

  .approver-avatar.approved {
    color: var(--tone-done-text);
    background: var(--tone-done-bg);
  }

  .workflow-step {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: var(--tone-neutral-bg);
    border: 1px solid var(--default-border);
    border-radius: 8px;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .workflow-step.active {
    background: var(--tone-info-bg);
    border-color: var(--tone-info-border);
  }

  .workflow-step.completed {
    opacity: 0.7;
  }

  .step-indicator {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 700;
    color: var(--tone-muted-text);
    background: var(--default-border);
    border-radius: 50%;
  }

  .workflow-step.active .step-indicator {
    color: #fff;
    background: var(--el-color-primary);
  }

  .workflow-step.completed .step-indicator {
    color: #fff;
    background: var(--tone-done-mark);
  }

  .file-info {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    font-size: var(--font-size-body);
    color: var(--tone-secondary-text);
    background: var(--default-box-color);
    border: 1px solid var(--default-border);
    border-radius: 6px;
  }

  .abort-note {
    padding: 10px 12px;
    margin-top: 12px;
    font-size: var(--font-size-body);
    color: var(--tone-error-text);
    background: var(--tone-error-bg);
    border: 1px solid var(--tone-error-border);
    border-radius: 6px;
  }
</style>
