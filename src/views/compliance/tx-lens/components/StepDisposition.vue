<!-- Step: Fund Disposition — 资金处置（仅入金） -->
<template>
  <div>
    <div class="art-card mb-4">
      <div class="p-4 border-b border-[var(--default-border)]">
        <span class="text-sm font-semibold text-g-900">{{
          $t('txLens.detail.incomingFundStatus')
        }}</span>
      </div>
      <div class="p-4">
        <!-- na：无资金处置 -->
        <div
          v-if="disposition === 'na' || !disposition"
          class="flex items-center gap-2 px-4 py-3 bg-[var(--el-color-info-light-9)] border border-[var(--el-color-info-light-5)] rounded-lg"
        >
          <ArtSvgIcon icon="ri:information-line" class="text-tone-info-text text-icon-md" />
          <span class="text-sm text-g-700">{{ $t('txLens.detail.noDispositionData') }}</span>
        </div>

        <template v-else>
          <!-- 状态概览：收到金额 / 冻结起始 / 当前状态 -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.detail.receivedAmount')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ amount || '--' }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.detail.heldSince')
              }}</span>
              <span class="text-sm text-g-800 font-medium">{{ heldSince || '--' }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-label font-semibold text-g-700 uppercase">{{
                $t('txLens.detail.currentStatus')
              }}</span>
              <span class="text-sm font-semibold" :style="{ color: statusColor }">{{
                statusLabel
              }}</span>
            </div>
          </div>

          <!-- 说明 + 没收地址 + 操作按钮 -->
          <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4">
            <div class="text-xs text-g-700 mb-3 leading-relaxed">{{
              $t('txLens.detail.fundHeldDescription')
            }}</div>
            <div
              v-if="forfeitureDestination"
              class="flex items-center justify-between gap-3 mb-3 px-3 py-2 bg-[var(--el-bg-color)] border border-[var(--default-border)] rounded-lg"
            >
              <span class="text-caption font-bold text-g-700 uppercase tracking-wider">{{
                $t('txLens.detail.forfeitureDestination')
              }}</span>
              <span class="text-xs text-g-700 font-mono break-all">{{
                forfeitureDestination
              }}</span>
            </div>
            <div class="flex gap-2.5 flex-wrap">
              <!-- 罚没/追回操作接口暂未提供，先禁用 -->
              <el-tooltip
                v-if="disposition === 'held'"
                :content="$t('common.underDevelopment')"
                placement="top"
              >
                <el-button type="danger" plain disabled>{{
                  $t('txLens.detail.forfeitToDesignated')
                }}</el-button>
              </el-tooltip>
              <el-tooltip
                v-if="disposition === 'forfeited'"
                :content="$t('common.underDevelopment')"
                placement="top"
              >
                <el-button disabled>{{ $t('txLens.detail.claimBackForfeited') }}</el-button>
              </el-tooltip>
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

  const props = defineProps<{
    disposition: string
    amount: string
    heldSince?: string
    forfeitureDestination?: string
  }>()
  const { t } = useI18n()

  const statusLabel = computed(() => {
    const map: Record<string, string> = {
      released: 'txLens.fdReleased',
      held: 'txLens.fdHeld',
      forfeited: 'txLens.fdForfeited'
    }
    return map[props.disposition] ? t(map[props.disposition]) : props.disposition || '--'
  })

  const statusColor = computed(() => {
    const map: Record<string, string> = {
      released: 'var(--tone-done-text)',
      held: 'var(--tone-progress-text)',
      forfeited: 'var(--tone-error-text)'
    }
    return map[props.disposition] || 'var(--el-text-color-primary)'
  })
</script>
