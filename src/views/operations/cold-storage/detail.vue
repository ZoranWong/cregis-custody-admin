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
    </template>

    <template v-else>
      <div class="art-card p-10 text-center text-g-500">{{ $t('coldStorage.notFound') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { formatCoinBalance, formatRelativeTime, formatTime } from '@/utils/format'
  import { fetchColdStorageTransfer } from '@/features/ops/coldStorage/mock'
  import type {
    ColdStorageTransferStatus,
    ColdStorageTransferView
  } from '@/features/ops/coldStorage/types'

  defineOptions({ name: 'ColdStorageTransferDetail' })

  const route = useRoute()
  const router = useRouter()

  const loading = ref(true)
  const loadError = ref('')
  const transfer = ref<ColdStorageTransferView | null>(null)

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
</style>
