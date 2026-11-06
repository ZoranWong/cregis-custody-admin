<!-- Travel Rule PII Details — IVMS101 PII 解析与展示 -->
<template>
  <div v-if="piiFields.length" class="art-card mb-4">
    <div class="p-4 border-b border-[var(--default-border)]">
      <span class="text-sm font-semibold text-g-900">{{
        $t('txLens.detail.ivms101PiiDetails')
      }}</span>
    </div>
    <div class="p-4">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="field in piiFields" :key="field.label" class="pii-field">
          <div class="pii-field-label">{{ field.label }}</div>
          <div class="pii-field-value">{{ field.value || '--' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { parseIvms101Party } from '@/features/compliance/ivms101'
  import { useCountryStore } from '@/store/modules/country'

  const props = defineProps<{
    ivms101Pii: Record<string, unknown>
  }>()

  const { t } = useI18n()
  const countryStore = useCountryStore()

  const originatorPii = computed(() => parseIvms101Party(props.ivms101Pii, 'originator'))
  const beneficiaryPii = computed(() => parseIvms101Party(props.ivms101Pii, 'beneficiary'))

  function piiRows(side: 'originator' | 'beneficiary'): Array<{ label: string; value: string }> {
    const p = side === 'originator' ? originatorPii.value : beneficiaryPii.value
    if (!p) return []
    const prefix = side === 'originator' ? t('travelRule.originator') : t('travelRule.beneficiary')
    const rows = [
      { label: `${prefix} · ${t('travelRule.piiName')}`, value: p.name },
      { label: `${prefix} · ${t('travelRule.piiAccountNumber')}`, value: p.accountNumber },
      {
        label: `${prefix} · ${t('travelRule.piiCountry')}`,
        value: countryStore.countryName(p.country)
      },
      { label: `${prefix} · ${t('travelRule.piiTownName')}`, value: p.townName },
      { label: `${prefix} · ${t('travelRule.piiAddressLine')}`, value: p.addressLine },
      { label: `${prefix} · ${t('travelRule.piiNationalId')}`, value: p.nationalIdentifier }
    ]
    return rows.filter((r) => r.value && r.value.trim() !== '')
  }

  const piiFields = computed(() => [...piiRows('originator'), ...piiRows('beneficiary')])
</script>

<style scoped>
  .pii-field {
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
  }

  .pii-field-label {
    margin-bottom: 2px;
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
  }

  .pii-field-value {
    font-size: var(--font-size-body);
    font-weight: 500;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
</style>
