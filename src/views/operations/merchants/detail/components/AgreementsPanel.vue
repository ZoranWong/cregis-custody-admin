<!-- 终审材料（Agreements）：按类别上传 / 查看企业合同等文档 -->
<template>
  <div v-loading="loading" class="flex flex-col">
    <div
      v-for="cat in CATEGORIES"
      :key="cat.key"
      class="flex items-start justify-between gap-4 py-3.5 border-b border-[var(--default-border)] last:border-b-0"
    >
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-g-900">{{ $t(cat.labelKey) }}</div>
        <div class="text-xs text-g-500 mt-0.5">{{ $t(cat.descKey) }}</div>

        <div
          v-for="doc in filesOf(cat)"
          :key="doc.id"
          class="flex items-center gap-2 mt-2 text-xs min-w-0"
        >
          <ArtSvgIcon icon="ri:file-text-line" class="text-g-400 flex-shrink-0" />
          <span class="text-g-800 truncate">{{ doc.title || doc.fileName || doc.fileUrl }}</span>
          <span v-if="doc.uploadedAt" class="text-g-400 flex-shrink-0">
            {{ formatDateTime(doc.uploadedAt) }}
          </span>
          <a
            :href="doc.fileUrl"
            target="_blank"
            rel="noopener"
            class="text-[var(--el-color-primary)] hover:underline flex-shrink-0"
          >
            {{ $t('merchantDetail.agreementDownload') }}
          </a>
        </div>

        <div v-if="filesOf(cat).length === 0" class="text-xs text-g-400 mt-2">
          {{ $t('merchantDetail.agreementsEmpty') }}
        </div>
      </div>

      <div v-if="editable" class="flex-shrink-0">
        <input
          :ref="(el) => setInputRef(cat.key, el)"
          type="file"
          class="hidden"
          multiple
          @change="onFilesSelected(cat, $event)"
        />
        <el-button size="small" :loading="uploadingKey === cat.key" @click="pickFile(cat.key)">
          <ArtSvgIcon icon="ri:upload-2-line" class="mr-1 text-icon-sm" />
          {{ $t('merchantDetail.agreementUpload') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { uploadFile } from '@/api/compliance'
  import {
    createMerchantDocument,
    fetchMerchantDocuments,
    type MerchantDocumentView
  } from '@/api/merchant'
  import { MerchantDocumentType } from '@/enums/merchantEnum'

  defineOptions({ name: 'MerchantAgreementsPanel' })

  const props = withDefaults(
    defineProps<{
      ecode: string
      /** 是否允许上传/补充材料 */
      editable?: boolean
    }>(),
    { editable: false }
  )

  const { t } = useI18n()

  /** 文档加载完成（父级据此展示「材料是否已上传」的状态提示） */
  const emit = defineEmits<{ loaded: [count: number] }>()

  /**
   * 材料分类与后端 docType 的对应关系（对齐原型 Agreement 分类）：
   *   Master Agreement ← CONTRACT / MOU
   *   LOI / MoU        ← LOI
   *   NDA              ← NDA
   *   Order / PO       ← ORDER / PO
   *   Annex & Addendum ← ANNEX
   *   Others           ← OTHER
   */
  const CATEGORIES: Array<{
    key: string
    labelKey: string
    descKey: string
    docTypes: MerchantDocumentType[]
  }> = [
    {
      key: 'master',
      labelKey: 'merchantDetail.agreementCatMaster',
      descKey: 'merchantDetail.agreementCatMasterDesc',
      docTypes: [MerchantDocumentType.Contract, MerchantDocumentType.Mou]
    },
    {
      key: 'loi',
      labelKey: 'merchantDetail.agreementCatLoi',
      descKey: 'merchantDetail.agreementCatLoiDesc',
      docTypes: [MerchantDocumentType.Loi]
    },
    {
      key: 'nda',
      labelKey: 'merchantDetail.agreementCatNda',
      descKey: 'merchantDetail.agreementCatNdaDesc',
      docTypes: [MerchantDocumentType.Nda]
    },
    {
      key: 'order',
      labelKey: 'merchantDetail.agreementCatOrder',
      descKey: 'merchantDetail.agreementCatOrderDesc',
      docTypes: [MerchantDocumentType.Order, MerchantDocumentType.Po]
    },
    {
      key: 'annex',
      labelKey: 'merchantDetail.agreementCatAnnex',
      descKey: 'merchantDetail.agreementCatAnnexDesc',
      docTypes: [MerchantDocumentType.Annex]
    },
    {
      key: 'other',
      labelKey: 'merchantDetail.agreementCatOther',
      descKey: 'merchantDetail.agreementCatOtherDesc',
      docTypes: [MerchantDocumentType.Other]
    }
  ]

  const loading = ref(false)
  const documents = ref<MerchantDocumentView[]>([])
  const uploadingKey = ref('')
  const inputRefs = new Map<string, HTMLInputElement>()

  function setInputRef(key: string, el: unknown) {
    if (el instanceof HTMLInputElement) inputRefs.set(key, el)
    else inputRefs.delete(key)
  }

  function pickFile(key: string) {
    inputRefs.get(key)?.click()
  }

  function filesOf(cat: (typeof CATEGORIES)[number]): MerchantDocumentView[] {
    return documents.value.filter((doc) =>
      cat.docTypes.includes(doc.docType as MerchantDocumentType)
    )
  }

  async function load() {
    if (!props.ecode) return
    loading.value = true
    try {
      const page = await fetchMerchantDocuments(props.ecode, { page: 1, size: 200 })
      documents.value = page.records || []
    } catch {
      documents.value = []
    } finally {
      loading.value = false
      emit('loaded', documents.value.length)
    }
  }

  /** 先走通用上传拿 fileUrl，再登记到企业文档；一次选多个文件时逐个上传 */
  async function onFilesSelected(cat: (typeof CATEGORIES)[number], event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    if (files.length === 0) return

    uploadingKey.value = cat.key
    let succeeded = 0
    try {
      for (const file of files) {
        const uploaded = await uploadFile(file, {
          bizType: 'merchant_document',
          bizId: props.ecode
        })
        await createMerchantDocument(props.ecode, {
          docType: cat.docTypes[0]!,
          title: file.name,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName || file.name
        })
        succeeded += 1
      }
      ElMessage.success(t('merchantDetail.agreementUploadSuccess', { count: succeeded }))
      await load()
    } catch {
      ElMessage.error(t('merchantDetail.agreementUploadFailed'))
      // 部分成功时也刷新，避免界面与后端不一致
      if (succeeded > 0) await load()
    } finally {
      uploadingKey.value = ''
    }
  }

  function formatDateTime(v?: string | null): string {
    if (!v) return ''
    return v.replace('T', ' ').slice(0, 16)
  }

  onMounted(() => {
    void load()
  })

  defineExpose({ reload: load })
</script>
