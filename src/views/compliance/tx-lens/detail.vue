<!-- Transaction Lens Detail — 交易检查详情 -->
<template>
  <div class="page-content">
    <!-- ═══ Page Header ═══ -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-g-900">{{ $t('txLens.detail.title') }}</h1>
        <p class="text-sm text-g-500 mt-1">{{ $t('txLens.detail.subtitle') }}</p>
      </div>
      <el-button text @click="router.back()">
        <ArtSvgIcon icon="ri:arrow-left-line" class="mr-1" />{{ $t('txLens.detail.backToLens') }}
      </el-button>
    </div>

    <!-- ═══ Transaction Header Card ═══ -->
    <div class="art-card mb-2 p-4">
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="text-xl font-bold text-g-900">{{ txData.amount }}</div>
          <div class="text-xs text-g-500 font-medium">≈ {{ txData.fiatAmount }}</div>
        </div>
        <div class="text-right">
          <div class="text-xs font-semibold text-g-700 font-mono">{{ txData.orderId }}</div>
          <div class="text-[10px] text-g-500 mt-1">{{ txData.time }}</div>
          <div class="flex gap-1 justify-end mt-1">
            <el-tag :type="statusType(txData.status)" size="small" effect="dark">{{
              txData.status
            }}</el-tag>
            <el-tag type="success" size="small" effect="dark">{{ txData.compliance }}</el-tag>
            <el-tag type="success" size="small" effect="dark">TR {{ txData.travelRule }}</el-tag>
          </div>
        </div>
      </div>
      <!-- Parties -->
      <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div class="originator-box rounded-md p-3">
          <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
            {{ $t('txLens.detail.originatorOurCustomer') }}
          </div>
          <div class="text-sm font-semibold text-g-900">{{ txData.originator.name }}</div>
          <div class="text-xs text-g-600 mt-0.5">{{ txData.originator.detail }}</div>
          <div class="text-xs text-g-500 font-mono mt-0.5">{{ txData.originator.address }}</div>
        </div>
        <div
          class="text-xl font-bold"
          :class="
            txData.direction === 'Outgoing'
              ? 'text-[var(--el-color-primary)]'
              : 'text-[var(--el-color-success)]'
          "
        >
          →
        </div>
        <div class="beneficiary-box rounded-md p-3">
          <div class="text-[10px] font-bold text-g-500 uppercase tracking-wider mb-1">
            {{ $t('txLens.detail.beneficiaryCounterparty') }}
          </div>
          <div class="text-sm font-semibold text-g-900">{{ txData.beneficiary.name }}</div>
          <div class="text-xs text-g-600 mt-0.5">{{ txData.beneficiary.detail }}</div>
          <div class="text-xs text-g-500 font-mono mt-0.5">{{ txData.beneficiary.address }}</div>
        </div>
      </div>
      <!-- Review Result Switcher -->
      <div class="flex items-center gap-3 pt-3 mt-3 border-t border-[var(--default-border)]">
        <span class="text-[10px] font-bold text-g-500 uppercase tracking-wider">{{
          $t('txLens.detail.reviewResult')
        }}</span>
        <el-radio-group v-model="reviewOutcome" size="small">
          <el-radio-button value="none">{{ $t('txLens.detail.rrNone') }}</el-radio-button>
          <el-radio-button value="true-positive">{{
            $t('txLens.detail.rrTruePositive')
          }}</el-radio-button>
          <el-radio-button value="false-positive">{{
            $t('txLens.detail.rrFalsePositive')
          }}</el-radio-button>
          <el-radio-button value="false-negative">{{
            $t('txLens.detail.rrFalseNegative')
          }}</el-radio-button>
        </el-radio-group>
      </div>
      <!-- Lifecycle Row -->
      <div class="tx-lifecycle mt-3 pt-3 border-t border-[var(--default-border)]">
        <div class="lc-stage" v-for="stage in lifecycleStages" :key="stage.key">
          <div class="lc-stage-dot" :class="stage.dotClass"></div>
          <div class="lc-stage-content">
            <div class="lc-stage-label">{{ stage.label }}</div>
            <div class="lc-stage-state" :class="stage.stateClass">{{ stage.state }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Action Bar (visible during active review) ═══ -->
    <div v-if="showActionBar" class="flex items-center gap-3 py-3 mb-1">
      <span class="text-xs text-g-500">{{ $t('txLens.detail.pendingReview') }}</span>
      <div class="flex-1" />
      <el-button type="danger" plain @click="handleDecision('rejected')">
        {{ $t('txLens.detail.reject') }}
      </el-button>
      <el-button type="primary" @click="handleDecision('approved')">
        {{ $t('txLens.detail.approve') }}
      </el-button>
    </div>

    <!-- ═══ Section Tabs ═══ -->
    <el-tabs v-model="activeSection" class="section-tabs">
      <!-- ═══════ Compliance Tab ═══════ -->
      <el-tab-pane :label="$t('txLens.detail.tabCompliance')" name="compliance">
        <!-- Compliance Sub-Tabs -->
        <el-tabs v-model="compSubTab" class="mb-4">
          <!-- Risk Profile -->
          <el-tab-pane :label="$t('txLens.detail.compRiskProfile')" name="assessment">
            <!-- Rules Triggered -->
            <div class="art-card mb-4">
              <div
                class="p-4 border-b border-[var(--default-border)] flex items-center justify-between"
              >
                <span class="text-sm font-semibold text-g-900">{{
                  $t('txLens.detail.rulesTriggered')
                }}</span>
                <span class="text-xs font-semibold text-g-500">{{
                  $t('txLens.detail.rulesCount', { count: rulesTriggered.length })
                }}</span>
              </div>
              <div class="p-4 flex flex-col gap-2">
                <div
                  v-for="rule in rulesTriggered"
                  :key="rule.key"
                  class="border border-[var(--default-border)] rounded-lg p-3"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm font-semibold text-g-900">{{ rule.name }}</span>
                    <span
                      class="text-xs font-medium text-primary cursor-pointer"
                      @click="openRuleDetail(rule)"
                      >{{ $t('txLens.detail.viewRule') }}</span
                    >
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in rule.tags"
                      :key="tag"
                      class="px-2 py-0.5 bg-g-50 border border-[var(--default-border)] rounded text-[11px] text-g-700"
                      >{{ tag }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Due Diligence -->
            <div class="art-card mb-4">
              <div class="p-4 border-b border-[var(--default-border)]">
                <span class="text-sm font-semibold text-g-900">{{ $t('txLens.detail.cdd') }}</span>
              </div>
              <div class="p-4 grid grid-cols-2 gap-2">
                <div
                  v-for="item in cddItems"
                  :key="item.key"
                  class="flex items-center gap-1.5 text-xs text-g-700"
                >
                  <span class="text-success font-bold">✓</span>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>

            <!-- Screening Results -->
            <div class="art-card mb-4">
              <div class="p-4 border-b border-[var(--default-border)]">
                <span class="text-sm font-semibold text-g-900">{{
                  $t('txLens.detail.screeningResults')
                }}</span>
              </div>
              <div class="p-4">
                <div class="mb-4">
                  <div
                    class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                  >
                    {{ $t('txLens.detail.entityScreening') }}
                  </div>
                  <div
                    v-for="item in entityScreening"
                    :key="item.key"
                    class="flex items-center justify-between py-1.5"
                  >
                    <span class="text-xs text-g-700">{{ item.label }}</span>
                    <el-tag
                      :type="item.status === 'CLEAR' ? 'success' : 'danger'"
                      size="small"
                      effect="dark"
                      >{{ item.status }}</el-tag
                    >
                  </div>
                </div>
                <div>
                  <div
                    class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-[var(--default-border)]"
                  >
                    {{ $t('txLens.detail.onChainScreening') }}
                  </div>
                  <div
                    v-for="item in onChainScreening"
                    :key="item.key"
                    class="flex items-center justify-between py-1.5"
                  >
                    <span class="text-xs text-g-700">{{ item.label }}</span>
                    <el-tag type="success" size="small" effect="dark">{{
                      $t('txLens.detail.clear')
                    }}</el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- Travel Rule Compliance -->
            <div class="art-card mb-4">
              <div class="p-4 border-b border-[var(--default-border)]">
                <span class="text-sm font-semibold text-g-900">{{
                  $t('txLens.detail.travelRuleCompliance')
                }}</span>
              </div>
              <div class="p-4">
                <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4 mb-3">
                  <div class="text-sm font-semibold text-g-900 mb-2">
                    {{ vaspIdentity.name }}
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                        $t('txLens.detail.jurisdiction')
                      }}</span>
                      <span class="text-sm text-g-800 font-medium">{{
                        vaspIdentity.jurisdiction
                      }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                        $t('txLens.detail.regulatoryStatus')
                      }}</span>
                      <span class="text-sm text-g-800 font-medium">{{
                        vaspIdentity.regulatoryStatus
                      }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                        $t('txLens.detail.trCapable')
                      }}</span>
                      <span class="text-sm text-g-800 font-medium">{{
                        vaspIdentity.trCapable
                      }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[11px] font-semibold text-g-500 uppercase">DID</span>
                      <span class="text-xs text-g-800 font-medium font-mono">{{
                        vaspIdentity.did
                      }}</span>
                    </div>
                  </div>
                </div>
                <div
                  class="flex items-center justify-between px-3 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
                >
                  <span class="text-xs font-semibold text-g-600">{{
                    $t('txLens.detail.ivms101PiiExchange')
                  }}</span>
                  <span
                    class="text-xs font-semibold"
                    :class="piiValid ? 'text-success' : 'text-danger'"
                  >
                    {{
                      piiValid
                        ? $t('txLens.detail.valid')
                        : $t('txLens.detail.invalid', { count: piiMissingCount })
                    }}
                  </span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Communication -->
          <el-tab-pane :label="$t('txLens.detail.compCommunication')" name="communication">
            <div class="art-card mb-4">
              <div class="p-4">
                <div class="flex justify-end gap-2 mb-4">
                  <el-button size="small" @click="requestInfoVisible = true">
                    {{ $t('txLens.detail.requestInfo') }}
                  </el-button>
                  <el-button size="small" @click="requestInfoVisible = true">
                    {{ $t('txLens.detail.requestPiiUpdate') }}
                  </el-button>
                </div>
                <!-- Communication Rounds -->
                <div
                  v-for="(round, idx) in commRounds"
                  :key="round.id"
                  class="mb-5 pb-5 border-b border-[var(--default-border)] last:border-b-0 last:mb-0 last:pb-0"
                  :class="{ 'pii-round': round.isPii }"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span
                      class="text-sm font-semibold"
                      :class="round.isPii ? 'text-orange-700' : 'text-g-900'"
                    >
                      {{
                        round.isPii
                          ? $t('txLens.detail.roundPiiValidation', { n: commRounds.length - idx })
                          : $t('txLens.detail.roundQuestionsRaised', {
                              n: commRounds.length - idx
                            })
                      }}
                    </span>
                    <span class="text-[11px] text-g-400">{{ round.time }}</span>
                  </div>
                  <div class="text-[11px] text-g-500 mb-1.5">{{ round.by }}</div>
                  <div class="text-xs text-g-600 mb-2.5">{{ round.description }}</div>
                  <!-- PII Validation Fields -->
                  <div v-if="round.isPii" class="flex flex-col gap-2 mb-2.5">
                    <div
                      v-for="field in round.piiFields || []"
                      :key="field.name"
                      class="flex items-center gap-3 px-3 py-2 rounded-md bg-g-50 text-sm"
                    >
                      <span class="font-semibold text-g-700 flex-1">{{ field.name }}</span>
                      <span
                        class="text-[11px] font-semibold text-danger bg-danger-50 px-2 py-0.5 rounded"
                        >{{ field.status }}</span
                      >
                    </div>
                  </div>
                  <!-- Q&A Items -->
                  <div v-for="qa in round.questions" :key="qa.qNum" class="mb-2.5">
                    <div class="flex gap-1.5 mb-1">
                      <span class="text-[11px] font-bold text-primary flex-shrink-0"
                        >Q{{ qa.qNum }}</span
                      >
                      <span class="text-xs text-g-800" v-html="qa.text" />
                    </div>
                    <div class="pl-5">
                      <div class="text-[10px] font-semibold text-g-400 uppercase mb-0.5">
                        {{ $t('txLens.detail.answer') }}
                      </div>
                      <div
                        v-if="qa.file"
                        class="text-xs text-primary flex items-center gap-1 cursor-pointer"
                      >
                        <ArtSvgIcon icon="ri:file-line" />
                        <span>{{ qa.file }}</span>
                      </div>
                      <div v-else-if="qa.textAnswer" class="text-xs text-g-700 leading-relaxed">
                        {{ qa.textAnswer }}
                      </div>
                      <div v-else class="text-[11px] text-g-400 italic">
                        {{ $t('txLens.detail.awaitingResponse') }}
                      </div>
                    </div>
                  </div>
                  <!-- Response Status -->
                  <div
                    v-if="round.responseTime"
                    class="text-[11px] text-g-400 mt-2 pt-1.5 border-t border-dashed border-[var(--default-border)]"
                  >
                    {{ $t('txLens.detail.responseSubmitted') }}: {{ round.responseTime }}
                  </div>
                  <div
                    v-else-if="round.pending"
                    class="flex items-center justify-between text-[11px] text-warning mt-2 pt-1.5 border-t border-dashed border-[var(--default-border)]"
                  >
                    <span>{{ round.pending }}</span>
                    <el-button size="small" text type="danger">{{
                      $t('txLens.detail.cancelRound')
                    }}</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Fund Disposition (only for Incoming) -->
          <el-tab-pane
            v-if="txData.direction === 'Incoming'"
            :label="$t('txLens.detail.compFundDisposition')"
            name="disposition"
          >
            <div class="art-card mb-4">
              <div class="p-4 border-b border-[var(--default-border)]">
                <span class="text-sm font-semibold text-g-900">{{
                  $t('txLens.detail.currentStatus')
                }}</span>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.receivedAmount')
                    }}</span>
                    <span class="text-sm text-g-800 font-medium">{{
                      fundStatus.receivedAmount
                    }}</span>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.heldSince')
                    }}</span>
                    <span class="text-sm text-g-800 font-medium">{{ fundStatus.heldSince }}</span>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                      $t('txLens.detail.currentStatus')
                    }}</span>
                    <span class="text-sm font-bold" :class="fundStatus.statusColor">{{
                      fundStatus.status
                    }}</span>
                  </div>
                </div>
                <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4">
                  <div class="text-xs text-g-600 mb-3 leading-relaxed">
                    {{ $t('txLens.detail.fundHeldDescription') }}
                  </div>
                  <div class="flex gap-3 flex-wrap">
                    <el-button type="success" plain @click="handleDisposition('released')">{{
                      $t('txLens.detail.releaseToCustomer')
                    }}</el-button>
                    <el-button type="danger" plain @click="handleDisposition('forfeited')">{{
                      $t('txLens.detail.forfeitToDesignated')
                    }}</el-button>
                  </div>
                  <div v-if="showForfeitAddress" class="mt-3">
                    <label class="text-[11px] text-g-500 block mb-1">{{
                      $t('txLens.detail.designatedForfeitureAddress')
                    }}</label>
                    <el-input placeholder="0x..." class="font-mono text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Compliance Timeline -->
          <el-tab-pane :label="$t('txLens.detail.compTimeline')" name="timeline">
            <div class="art-card mb-4">
              <div class="p-4 border-b border-[var(--default-border)]">
                <span class="text-sm font-semibold text-g-900">{{
                  $t('txLens.detail.compTimeline')
                }}</span>
              </div>
              <div class="p-4">
                <div class="timeline-chain">
                  <div v-for="node in complianceTimeline" :key="node.label" class="timeline-node">
                    <div class="timeline-dot" :class="node.dotClass" />
                    <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
                    <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                    <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <!-- ═══════ Travel Rule Tab ═══════ -->
      <el-tab-pane :label="$t('txLens.detail.tabTravelRule')" name="travel-rule">
        <!-- VASP Identity -->
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.vaspIdentity')
            }}</span>
          </div>
          <div class="p-4">
            <div class="bg-g-50 border border-[var(--default-border)] rounded-lg p-4 mb-3">
              <div class="text-sm font-semibold text-g-900 mb-2">{{ vaspIdentity.name }}</div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                    $t('txLens.detail.jurisdiction')
                  }}</span>
                  <span class="text-sm text-g-800 font-medium">{{
                    vaspIdentity.jurisdiction
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                    $t('txLens.detail.regulatoryStatus')
                  }}</span>
                  <span class="text-sm text-g-800 font-medium">{{
                    vaspIdentity.regulatoryStatus
                  }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">{{
                    $t('txLens.detail.trCapable')
                  }}</span>
                  <span class="text-sm text-g-800 font-medium">{{ vaspIdentity.trCapable }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] font-semibold text-g-500 uppercase">DID</span>
                  <span class="text-xs text-g-800 font-medium font-mono">{{
                    vaspIdentity.did
                  }}</span>
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-3 py-2.5 bg-g-50 border border-[var(--default-border)] rounded-md"
            >
              <span class="text-xs font-semibold text-g-600">{{
                $t('txLens.detail.ivms101PiiExchange')
              }}</span>
              <span class="text-xs font-semibold text-success">{{
                $t('txLens.detail.valid')
              }}</span>
            </div>
          </div>
        </div>

        <!-- IVMS101 PII Details -->
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.ivms101PiiDetails')
            }}</span>
          </div>
          <div class="p-4 grid grid-cols-2 gap-2.5">
            <div
              v-for="field in piiFields"
              :key="field.label"
              class="px-3 py-2 rounded-md bg-g-50 border border-[var(--default-border)]"
            >
              <div class="text-[10px] font-semibold text-g-500 uppercase mb-0.5">
                {{ field.label }}
              </div>
              <div class="text-xs text-g-800 font-medium">{{ field.value }}</div>
            </div>
          </div>
        </div>

        <!-- Manual Resolution / Network Negotiation -->
        <div class="art-card mb-4">
          <div class="p-4">
            <el-tabs v-model="trOpsTab" class="mb-4">
              <el-tab-pane :label="$t('txLens.detail.manualResolution')" name="manual">
                <div class="text-xs text-g-500 mb-3 leading-relaxed">
                  {{ $t('txLens.detail.offNetworkDescription') }}
                </div>
                <div class="flex gap-3 mb-4 flex-wrap">
                  <el-button size="small" @click="generateShareLink">
                    <ArtSvgIcon icon="ri:link" class="mr-1" />{{
                      $t('txLens.detail.generateShareLink')
                    }}
                  </el-button>
                  <el-button size="small" @click="uploadProofVisible = true">
                    <ArtSvgIcon icon="ri:upload-line" class="mr-1" />{{
                      $t('txLens.detail.uploadProof')
                    }}
                  </el-button>
                </div>
                <div class="flex gap-3 mb-4">
                  <el-button type="primary" size="small">{{
                    $t('txLens.detail.resolve')
                  }}</el-button>
                  <el-button type="danger" plain size="small">{{ $t('common.cancel') }}</el-button>
                </div>
                <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">{{
                  $t('txLens.detail.manualTrace')
                }}</div>
                <div class="timeline-chain">
                  <div v-for="node in manualTraceTimeline" :key="node.label" class="timeline-node">
                    <div class="timeline-dot" :class="node.dotClass" />
                    <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
                    <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                    <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
                    <div v-if="node.link" class="text-[11px] text-primary font-mono mt-1 break-all">
                      {{ node.link }}
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane :label="$t('txLens.detail.networkNegotiation')" name="network">
                <div class="text-xs text-g-500 mb-3 leading-relaxed">
                  {{ $t('txLens.detail.networkLifecycleDescription') }}
                </div>
                <div class="mb-4">
                  <el-button type="danger" plain size="small" @click="cancelTransferVisible = true">
                    {{ $t('txLens.detail.cancelTransfer') }}
                  </el-button>
                </div>
                <div class="text-[11px] font-bold text-g-500 uppercase tracking-wider mb-3">{{
                  $t('txLens.detail.networkTrace')
                }}</div>
                <div class="timeline-chain">
                  <div v-for="node in networkTraceTimeline" :key="node.label" class="timeline-node">
                    <div class="timeline-dot" :class="node.dotClass" />
                    <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
                    <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                    <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-tab-pane>

      <!-- ═══════ Sign-off Tab (only for Outgoing) ═══════ -->
      <el-tab-pane
        v-if="txData.direction === 'Outgoing'"
        :label="$t('txLens.detail.tabSignOff')"
        name="signoff"
      >
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.approvalFlow')
            }}</span>
          </div>
          <div class="p-4">
            <div class="timeline-chain">
              <div v-for="node in approvalFlowTimeline" :key="node.label" class="timeline-node">
                <div class="timeline-dot" :class="node.dotClass" />
                <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
                <div class="text-xs text-g-600 mt-0.5" :class="node.detailClass">{{
                  node.detail
                }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
                <!-- Multi-sign approvals -->
                <div v-if="node.approvers" class="flex flex-col gap-2 mt-2">
                  <div
                    v-for="approver in node.approvers"
                    :key="approver.name"
                    class="flex items-start gap-2 px-2.5 py-2 bg-g-50 border border-[var(--default-border)] rounded-md"
                  >
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                      :class="
                        approver.status === 'Approved'
                          ? 'bg-success-100 text-success'
                          : 'bg-g-100 text-g-500'
                      "
                    >
                      {{ approver.initials }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-g-900">{{ approver.name }}</span>
                        <span
                          class="text-[11px] font-medium"
                          :class="approver.status === 'Approved' ? 'text-success' : 'text-g-500'"
                          >{{ approver.status }}</span
                        >
                      </div>
                      <div class="text-[11px] text-g-500 mt-0.5">{{ approver.email }}</div>
                      <div class="text-[11px] text-g-500 font-mono mt-0.5 break-all">
                        {{ approver.address }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ═══════ On-Chain Tab ═══════ -->
      <el-tab-pane :label="$t('txLens.detail.tabOnChain')" name="onchain">
        <!-- Block Information -->
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.blockInformation')
            }}</span>
          </div>
          <div class="p-4 grid grid-cols-3 gap-4">
            <div v-for="item in blockInfo" :key="item.label" class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{ item.label }}</span>
              <span
                class="text-sm font-medium"
                :class="{ 'font-mono text-xs': item.mono, 'text-success': item.green }"
                >{{ item.value }}</span
              >
            </div>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.txDetails')
            }}</span>
          </div>
          <div class="p-4 grid grid-cols-3 gap-4">
            <div v-for="item in txDetails" :key="item.label" class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-g-500 uppercase">{{ item.label }}</span>
              <span
                class="text-sm font-medium"
                :class="{ 'font-mono text-xs': item.mono, 'text-success': item.green }"
                >{{ item.value }}</span
              >
            </div>
          </div>
        </div>

        <!-- On-Chain Timeline -->
        <div class="art-card mb-4">
          <div class="p-4 border-b border-[var(--default-border)]">
            <span class="text-sm font-semibold text-g-900">{{
              $t('txLens.detail.onChainTimeline')
            }}</span>
          </div>
          <div class="p-4">
            <div class="timeline-chain">
              <div v-for="node in onChainTimeline" :key="node.label" class="timeline-node">
                <div class="timeline-dot completed" />
                <div class="text-sm font-semibold text-g-800">{{ node.label }}</div>
                <div class="text-xs text-g-600 mt-0.5">{{ node.detail }}</div>
                <div class="text-[11px] text-g-400 mt-0.5">{{ node.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ═══ Rule Detail Modal ═══ -->
    <el-dialog
      v-model="ruleDetailVisible"
      :title="selectedRule?.name || 'Rule Details'"
      width="680px"
      destroy-on-close
    >
      <div v-if="selectedRule" class="space-y-4">
        <div>
          <div class="text-xs font-semibold text-g-500 uppercase mb-1">Description</div>
          <div
            class="p-3 bg-g-50 border border-[var(--default-border)] rounded-md text-sm text-g-700"
          >
            This rule triggers when the transaction matches the defined risk factors.
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="text-xs font-semibold text-g-500 uppercase mb-1">Direction</div>
            <div class="p-2 bg-g-50 border border-[var(--default-border)] rounded text-sm"
              >Outgoing</div
            >
          </div>
          <div>
            <div class="text-xs font-semibold text-g-500 uppercase mb-1">Min Amount</div>
            <div class="p-2 bg-g-50 border border-[var(--default-border)] rounded text-sm"
              >10,000 AED</div
            >
          </div>
          <div>
            <div class="text-xs font-semibold text-g-500 uppercase mb-1">Severity</div>
            <div class="p-2 bg-g-50 border border-[var(--default-border)] rounded text-sm"
              >Critical</div
            >
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold text-g-500 uppercase mb-2">Triggered Factors</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in selectedRule.tags"
              :key="tag"
              class="px-2 py-1 bg-primary-50 border border-primary-200 rounded text-xs text-primary font-medium"
              >{{ tag }}</span
            >
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="ruleDetailVisible = false">Close</el-button>
      </template>
    </el-dialog>

    <!-- ═══ Request Information Modal ═══ -->
    <el-dialog
      v-model="requestInfoVisible"
      title="Request Information"
      width="560px"
      destroy-on-close
    >
      <div class="space-y-3">
        <div v-for="(q, idx) in questionInputs" :key="idx" class="flex items-start gap-2">
          <el-input
            v-model="questionInputs[idx]"
            type="textarea"
            :rows="2"
            placeholder="Enter your question..."
            class="flex-1"
          />
          <el-button
            :icon="'ri:close-line'"
            circle
            size="small"
            @click="removeQuestion(idx)"
            :disabled="questionInputs.length <= 1"
          />
        </div>
      </div>
      <template #footer>
        <el-button text @click="addQuestion">+ Add Question</el-button>
        <el-button type="primary" @click="submitRequestInfo">Send Request</el-button>
      </template>
    </el-dialog>

    <!-- ═══ Share Link Modal ═══ -->
    <el-dialog
      v-model="shareLinkVisible"
      title="Share Link Generated"
      width="500px"
      destroy-on-close
    >
      <div class="space-y-4">
        <p class="text-sm text-g-600 leading-relaxed">
          Send this secure link to the counterparty VASP. They can view transaction details and PII,
          then approve or reject.
        </p>
        <div class="p-3 bg-g-50 border border-[var(--default-border)] rounded-md">
          <div class="text-[11px] font-semibold text-g-500 uppercase mb-1">Secure Share URL</div>
          <div class="text-sm text-primary font-mono break-all">{{ generatedShareLink }}</div>
          <div class="text-[11px] text-g-500 mt-2">⏱ Expires in 72 hours</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="shareLinkVisible = false">Close</el-button>
        <el-button type="primary" @click="copyShareLink">Copy Link</el-button>
      </template>
    </el-dialog>

    <!-- ═══ Upload Proof Modal ═══ -->
    <el-dialog
      v-model="uploadProofVisible"
      title="Upload Proof Document"
      width="500px"
      destroy-on-close
    >
      <div class="space-y-4">
        <p class="text-sm text-g-600 leading-relaxed">
          Attach compliance documents, transaction confirmations, or other proof for audit trail.
        </p>
        <div
          class="border-2 border-dashed border-g-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary"
          @click="($refs.fileInput as HTMLInputElement)?.click()"
        >
          <ArtSvgIcon icon="ri:upload-cloud-line" class="text-4xl text-g-400 mb-2" />
          <div class="text-sm text-g-600 mb-1">Click to upload or drag and drop</div>
          <div class="text-[11px] text-g-500">PDF, PNG, JPG (max 10MB)</div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>
        <div v-if="uploadedFiles.length > 0" class="space-y-2">
          <div
            v-for="(file, idx) in uploadedFiles"
            :key="idx"
            class="flex items-center justify-between px-3 py-2 bg-g-50 border border-[var(--default-border)] rounded-md"
          >
            <div class="flex items-center gap-2">
              <ArtSvgIcon icon="ri:file-line" class="text-g-500" />
              <div>
                <div class="text-xs font-medium text-g-800">{{ file.name }}</div>
                <div class="text-[11px] text-g-500">{{ (file.size / 1024).toFixed(1) }} KB</div>
              </div>
            </div>
            <el-button
              :icon="'ri:close-line'"
              circle
              size="small"
              @click="removeUploadedFile(idx)"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadProofVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitProofUpload">Upload</el-button>
      </template>
    </el-dialog>

    <!-- ═══ Cancel Transfer Modal ═══ -->
    <el-dialog
      v-model="cancelTransferVisible"
      :title="$t('txLens.detail.cancelTransfer')"
      width="500px"
      destroy-on-close
    >
      <div class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-g-600 block mb-1">{{
            $t('txLens.detail.selectCancellationReason')
          }}</label>
          <el-select v-model="cancelReason" class="w-full">
            <el-option :label="$t('txLens.detail.reasonError')" value="error" />
            <el-option :label="$t('txLens.detail.reasonWrongRecipient')" value="wrong-recipient" />
            <el-option
              :label="$t('txLens.detail.reasonCustomerRequest')"
              value="customer-request"
            />
            <el-option :label="$t('txLens.detail.reasonComplianceHold')" value="compliance-hold" />
          </el-select>
        </div>
        <div>
          <label class="text-xs font-semibold text-g-600 block mb-1">{{
            $t('txLens.detail.additionalNotes')
          }}</label>
          <el-input
            v-model="cancelNotes"
            type="textarea"
            :rows="3"
            :placeholder="$t('txLens.detail.additionalNotes')"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelTransferVisible = false">{{
          $t('txLens.detail.cancel')
        }}</el-button>
        <el-button type="danger" @click="confirmCancelTransfer">{{
          $t('txLens.detail.confirmCancellation')
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'TransactionLensDetail' })

  const route = useRoute()
  const router = useRouter()
  const orderId = route.params.id as string

  // ─── State ───
  const activeSection = ref('compliance')
  const compSubTab = ref('assessment')
  const trOpsTab = ref('manual')
  const reviewOutcome = ref('none')
  const showActionBar = ref(true)
  const showForfeitAddress = ref(false)
  const piiValid = ref(false)
  const piiMissingCount = ref(3)

  // ─── Modal State ───
  const ruleDetailVisible = ref(false)
  const selectedRule = ref<null | { key: string; name: string; tags: string[] }>(null)
  const requestInfoVisible = ref(false)
  const questionInputs = ref([''])
  const shareLinkVisible = ref(false)
  const generatedShareLink = ref('')
  const uploadProofVisible = ref(false)
  const uploadedFiles = ref<File[]>([])
  const cancelTransferVisible = ref(false)
  const cancelReason = ref('')
  const cancelNotes = ref('')

  // ─── Mock Transaction Data ───
  const txData = reactive({
    amount: '0.1 BTC',
    fiatAmount: '15,000 AED',
    orderId: orderId || 'ORDER-2026-07-28-0042',
    time: '2026-07-28 10:30 UTC',
    direction: 'Outgoing',
    status: 'Settled',
    compliance: 'Clear',
    travelRule: 'Complete',
    signOff: 'Approved',
    fundDisposition: '',
    originator: {
      name: 'CryptoVault Ltd',
      detail: 'Unit: Treasury · Account: Primary Pay-Out',
      address: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26'
    },
    beneficiary: {
      name: 'John Doe',
      detail: '',
      address: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75'
    }
  })

  // ─── Lifecycle Stages ──
  const lifecycleStages = computed(() => {
    const stages: Array<{
      key: string
      label: string
      state: string
      dotClass: string
      stateClass: string
    }> = []

    // Compliance - always shown
    stages.push({
      key: 'compliance',
      label: 'Compliance',
      state: txData.compliance,
      dotClass:
        txData.compliance === 'Clear'
          ? 'done'
          : txData.compliance === 'Flagged'
            ? 'rejected'
            : 'active',
      stateClass:
        txData.compliance === 'Clear'
          ? 'done'
          : txData.compliance === 'Flagged'
            ? 'rejected'
            : 'active'
    })

    // Travel Rule - always shown
    stages.push({
      key: 'travel',
      label: 'Travel Rule',
      state: txData.travelRule,
      dotClass:
        txData.travelRule === 'Complete'
          ? 'done'
          : txData.travelRule === 'Mismatch'
            ? 'rejected'
            : 'active',
      stateClass:
        txData.travelRule === 'Complete'
          ? 'done'
          : txData.travelRule === 'Mismatch'
            ? 'rejected'
            : 'active'
    })

    if (txData.direction === 'Outgoing') {
      // Sign-off - outgoing only
      stages.push({
        key: 'signoff',
        label: 'Sign-off',
        state: txData.signOff,
        dotClass: txData.signOff === 'Approved' ? 'done' : 'pending',
        stateClass: txData.signOff === 'Approved' ? 'done' : 'pending'
      })
      // On-Chain - outgoing only
      stages.push({
        key: 'onchain',
        label: 'On-Chain',
        state: txData.status,
        dotClass:
          txData.status === 'Settled' ? 'done' : txData.status === 'Failed' ? 'rejected' : 'active',
        stateClass:
          txData.status === 'Settled' ? 'done' : txData.status === 'Failed' ? 'rejected' : 'active'
      })
    } else {
      // On-Chain - incoming
      stages.push({
        key: 'onchain',
        label: 'On-Chain',
        state: txData.status,
        dotClass:
          txData.status === 'Confirmed'
            ? 'done'
            : txData.status === 'Failed'
              ? 'rejected'
              : 'active',
        stateClass:
          txData.status === 'Confirmed'
            ? 'done'
            : txData.status === 'Failed'
              ? 'rejected'
              : 'active'
      })
      // Fund Disposition - incoming only
      if (txData.fundDisposition) {
        stages.push({
          key: 'disposition',
          label: 'Fund Disposition',
          state: txData.fundDisposition,
          dotClass:
            txData.fundDisposition === 'Released'
              ? 'released'
              : txData.fundDisposition === 'Forfeited'
                ? 'forfeited'
                : 'held',
          stateClass:
            txData.fundDisposition === 'Released'
              ? 'released'
              : txData.fundDisposition === 'Forfeited'
                ? 'forfeited'
                : 'held'
        })
      }
    }

    return stages
  })

  type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

  function statusType(status: string): TagType | undefined {
    const map: Record<string, TagType> = {
      Settled: 'info',
      Broadcasted: 'warning',
      Confirmed: 'success',
      Failed: 'danger'
    }
    return map[status]
  }

  // ─── Rules Triggered ───
  const rulesTriggered = [
    {
      key: 'sanctions-hit',
      name: 'Sanctions Hit Block',
      tags: ['Beneficiary: OFAC SDN']
    },
    {
      key: 'large-tx',
      name: 'Large Transaction Review',
      tags: ['Amount ≥ 10,000 AED']
    },
    {
      key: 'high-risk-juris',
      name: 'High-Risk Jurisdiction Block',
      tags: ['Beneficiary Jurisdiction: KP (North Korea)']
    }
  ]

  // ─── CDD Items ───
  const cddItems = [
    { key: 'onboarding', label: 'Onboarding Status: Onboarded' },
    { key: 'customerType', label: 'Customer Type: Qualified Investor' },
    { key: 'riskLevel', label: 'Risk Level: 3. High' },
    { key: 'proof', label: 'Proof (CRS/FATCA): Passive NFE' },
    { key: 'corporateId', label: 'Corporate Identity Verified' },
    { key: 'sourceOfWealth', label: 'Source of Wealth Verified' },
    { key: 'sourceOfFunds', label: 'Source of Funds Verified' },
    { key: 'financialThreshold', label: 'Financial Threshold Met' }
  ]

  // ─── Screening ───
  const entityScreening = [
    { key: 'vasp', label: 'VASP — The UCE DMCC', status: 'CLEAR' },
    { key: 'beneficiary', label: 'Beneficiary — John Doe', status: 'OFAC SDN' }
  ]
  const onChainScreening = [
    { key: 'originatorAddr', label: 'Originator Address', status: 'CLEAR' },
    { key: 'beneficiaryAddr', label: 'Beneficiary Address', status: 'CLEAR' }
  ]

  // ─── VASP Identity ───
  const vaspIdentity = {
    name: 'The UCE DMCC',
    jurisdiction: 'AE (UAE)',
    regulatoryStatus: 'Exempt',
    trCapable: 'Yes ✓',
    did: 'did:web:cregisio-8f89b...am'
  }

  // ─── Communication Rounds ───
  const commRounds: Array<{
    id: number
    isPii: boolean
    time: string
    by: string
    description: string
    questions: Array<{ qNum: number; text: string; file: string; textAnswer: string }>
    piiFields?: Array<{ name: string; status: string }>
    responseTime: string
    pending: string
  }> = [
    {
      id: 1,
      isPii: false,
      time: '2026-07-28 10:30 UTC',
      by: 'By: Compliance Team',
      description: 'Additional clarification required after reviewing your first submission:',
      questions: [
        {
          qNum: 1,
          text: 'Please provide <strong>proof of business relationship</strong> with the beneficiary.',
          file: 'Business_relationship_contract.pdf',
          textAnswer: ''
        },
        {
          qNum: 2,
          text: 'Please clarify the <strong>purpose of this transaction</strong>.',
          file: '',
          textAnswer:
            'Payment for consulting services provided by the beneficiary for regulatory audit preparation.'
        }
      ],
      responseTime: '2026-07-28 11:45 UTC',
      pending: ''
    },
    {
      id: 2,
      isPii: false,
      time: '2026-07-28 09:15 UTC',
      by: 'By: Compliance Team',
      description: 'Our compliance team has reviewed this transaction and requires clarification:',
      questions: [
        {
          qNum: 1,
          text: 'Please provide <strong>source of funds documentation</strong>.',
          file: 'Source_of_funds_statement.pdf',
          textAnswer: ''
        },
        {
          qNum: 2,
          text: "Clarify the <strong>beneficiary's identity</strong> and relationship.",
          file: '',
          textAnswer: 'Independent compliance consultant engaged on a project basis.'
        }
      ],
      responseTime: '2026-07-28 10:05 UTC',
      pending: ''
    }
  ]

  // ─── Fund Status ───
  const fundStatus = reactive({
    receivedAmount: '50,000 USDT',
    heldSince: '2026-07-28 10:35 UTC',
    status: 'Held',
    statusColor: 'text-warning'
  })

  function handleDisposition(action: string) {
    if (action === 'forfeited') {
      showForfeitAddress.value = true
      return
    }
    showForfeitAddress.value = false
    const labels: Record<string, string> = { released: 'Released', held: 'Held' }
    const colors: Record<string, string> = { released: 'text-success', held: 'text-warning' }
    fundStatus.status = labels[action] || 'Held'
    fundStatus.statusColor = colors[action] || 'text-warning'
  }

  // ─── Compliance Timeline ───
  const complianceTimeline = [
    {
      label: 'Rule Triggered',
      detail: 'Sanctions Hit Block — Beneficiary: OFAC SDN',
      time: '2026-07-28 10:28:16 UTC',
      dotClass: 'info'
    },
    {
      label: 'Auto-Rejected',
      detail: 'Transaction blocked by compliance rule',
      time: '2026-07-28 10:28:16 UTC',
      dotClass: 'failed'
    },
    {
      label: 'Customer Escalation',
      detail: 'Customer disputed the auto-rejection',
      time: '2026-07-28 10:45:00 UTC',
      dotClass: 'pending'
    },
    {
      label: 'Sarah Chen — Approved',
      detail: 'Compliance Officer · Manual override',
      time: '2026-07-28 11:15:00 UTC',
      dotClass: 'completed'
    }
  ]

  // ─── PII Fields ───
  const piiFields = [
    { label: 'Originator Name', value: 'CryptoVault Ltd' },
    { label: 'Originator Account', value: '0xCA79D8bcF574956736E5B1C0F0f73ABF458F2d26' },
    { label: 'Originator Address', value: 'Unit 1203, The Opus, Dubai, UAE' },
    { label: 'Originator LEI', value: '52990098765432109876' },
    { label: 'Beneficiary Name', value: 'John Doe' },
    { label: 'Beneficiary Account', value: '0xb20BED6c015a8e9579eae17762aA65d78d2E0b75' }
  ]

  // ─── Manual Trace Timeline ───
  const manualTraceTimeline = [
    {
      label: 'VASP Not Found on Network',
      detail:
        'Beneficiary VASP not found on Notabene, SYGNA, or other supported networks. Automatic delivery failed.',
      time: '2026-07-28 09:01:15 UTC',
      dotClass: 'info',
      link: ''
    },
    {
      label: 'Share Link Generated',
      detail:
        'Secure share link generated by Compliance Officer to deliver transfer & PII to counterparty manually.',
      time: '2026-07-28 09:05:00 UTC',
      dotClass: 'pending',
      link: 'https://custody.cregis.com/tr-share/a3f8b2c1'
    },
    {
      label: 'Beneficiary Authorized',
      detail:
        'Beneficiary VASP authorized the transfer via share link. Proceeding to on-chain settlement.',
      time: '2026-07-28 09:30:00 UTC',
      dotClass: 'completed',
      link: ''
    }
  ]

  // ─── Network Trace Timeline ───
  const networkTraceTimeline = [
    {
      label: 'Travel Rule Messaging Initiated',
      detail:
        'Transaction approved by compliance. Travel Rule messaging initiated (amount ≥ 3,500 AED threshold).',
      time: '2026-07-28 09:00:00 UTC',
      dotClass: 'info'
    },
    {
      label: 'Transfer Created',
      detail:
        'Originator created outgoing transfer with originator PII via Notabene network. Beneficiary VASP: The UCE DMCC.',
      time: '2026-07-28 09:00:12 UTC',
      dotClass: 'completed'
    },
    {
      label: 'Awaiting Counterparty Authorization',
      detail: 'Beneficiary VASP has been notified. Waiting for authorization or rejection.',
      time: '2026-07-28 09:00:12 UTC',
      dotClass: 'pending'
    }
  ]

  // ─── Approval Flow Timeline ───
  const approvalFlowTimeline = [
    {
      label: 'Initiated',
      detail: 'John Doe',
      time: '2026-07-28 10:25:00 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: null
    },
    {
      label: 'Risk Policy Check',
      detail: 'Passed (Auto)',
      time: '2026-07-28 10:25:01 UTC',
      dotClass: 'completed',
      detailClass: 'text-success',
      approvers: null
    },
    {
      label: 'Approval',
      detail: 'Multi-sign: 2 of 3 approvals collected',
      time: '2026-07-28 10:27:30 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: [
        {
          initials: 'AM',
          name: 'Alex Morgan',
          status: 'Approved',
          email: 'alex.morgan@cregis.com',
          address: '0x71C...4aF2e9'
        },
        {
          initials: 'SL',
          name: 'Sam Lee',
          status: 'Approved',
          email: 'sam.lee@cregis.com',
          address: '0x9B3...d7E1c4'
        },
        {
          initials: 'JD',
          name: 'John Doe',
          status: 'Pending',
          email: 'john.doe@cregis.com',
          address: '0x4F8...c2B9a7'
        }
      ]
    },
    {
      label: 'Execution',
      detail: 'Transaction broadcasted to network',
      time: '2026-07-28 10:28:15 UTC',
      dotClass: 'completed',
      detailClass: '',
      approvers: null
    }
  ]

  // ─── Block Info ───
  const blockInfo = [
    { label: 'Network', value: 'Ethereum Mainnet', mono: false, green: false },
    { label: 'Block Number', value: '19,847,231', mono: true, green: false },
    { label: 'Block Hash', value: '0x8f2d4e6a...4421b3c9', mono: true, green: false },
    { label: 'Confirmations', value: '128', mono: false, green: false },
    { label: 'Block Time', value: '2026-07-28 10:28:42 UTC', mono: false, green: false },
    { label: 'Finalized', value: 'Yes', mono: false, green: true }
  ]

  // ─── Transaction Details ───
  const txDetails = [
    {
      label: 'TX Hash',
      value: '0x8f2d1a3b5c7e9f0d2b4c6e8a0f2d4e6a1b3c5e7f9d0b2c4e6a8f0d2b4c6e',
      mono: true,
      green: false
    },
    { label: 'Nonce', value: '347', mono: true, green: false },
    { label: 'Status', value: 'Success', mono: false, green: true },
    { label: 'Gas Used', value: '21,000', mono: true, green: false },
    { label: 'Gas Price', value: '25 Gwei', mono: true, green: false },
    {
      label: 'Transaction Fee',
      value: '0.000525 ETH (≈ 1.84 AED)',
      mono: true,
      green: false
    }
  ]

  // ─── On-Chain Timeline ───
  const onChainTimeline = [
    {
      label: 'Broadcasted',
      detail: 'Signed and submitted to mempool',
      time: '2026-07-28 10:28:15 UTC'
    },
    {
      label: 'Included in Block',
      detail: 'Block #19,847,231',
      time: '2026-07-28 10:28:42 UTC'
    },
    {
      label: 'Confirmations Reached',
      detail: '128 confirmations — fully finalized',
      time: '2026-07-28 10:35:00 UTC'
    },
    {
      label: 'Settlement Complete',
      detail: 'Funds credited to beneficiary wallet',
      time: '2026-07-28 10:35:00 UTC'
    }
  ]

  // ─── Modal Handlers ───
  function openRuleDetail(rule: { key: string; name: string; tags: string[] }) {
    selectedRule.value = rule
    ruleDetailVisible.value = true
  }

  function addQuestion() {
    questionInputs.value.push('')
  }

  function removeQuestion(index: number) {
    if (questionInputs.value.length > 1) {
      questionInputs.value.splice(index, 1)
    }
  }

  function submitRequestInfo() {
    const validQuestions = questionInputs.value.filter((q) => q.trim())
    if (validQuestions.length === 0) {
      ElMessage.warning('Please enter at least one question')
      return
    }
    // Add new round to commRounds
    const newRound = {
      id: Date.now(),
      isPii: false,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      by: 'By: Compliance Team',
      description: 'Additional clarification required:',
      questions: validQuestions.map((q, i) => ({
        qNum: i + 1,
        text: q,
        file: '',
        textAnswer: ''
      })),
      responseTime: '',
      pending: 'Pending customer response'
    }
    commRounds.unshift(newRound)
    requestInfoVisible.value = false
    questionInputs.value = ['']
    compSubTab.value = 'communication'
    ElMessage.success('Request sent successfully')
  }

  function generateShareLink() {
    const token = Math.random().toString(36).substring(2, 10)
    generatedShareLink.value = `https://custody.cregis.com/tr-share/${token}`
    shareLinkVisible.value = true
  }

  function copyShareLink() {
    navigator.clipboard.writeText(generatedShareLink.value)
    ElMessage.success('Link copied to clipboard')
  }

  function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) {
      uploadedFiles.value = Array.from(input.files)
    }
  }

  function removeUploadedFile(index: number) {
    uploadedFiles.value.splice(index, 1)
  }

  function submitProofUpload() {
    if (uploadedFiles.value.length === 0) {
      ElMessage.warning('Please select files to upload')
      return
    }
    ElMessage.success(`${uploadedFiles.value.length} file(s) uploaded successfully`)
    uploadedFiles.value = []
    uploadProofVisible.value = false
  }

  function confirmCancelTransfer() {
    if (!cancelReason.value) {
      ElMessage.warning('Please select a cancellation reason')
      return
    }
    ElMessage.success('Transfer cancelled successfully')
    cancelTransferVisible.value = false
    cancelReason.value = ''
    cancelNotes.value = ''
  }

  function handleDecision(decision: string) {
    if (decision === 'approved') {
      ElMessage.success('Transaction approved.')
    } else {
      ElMessage.warning('Transaction rejected.')
    }
  }
</script>

<style scoped>
  /* Originator / Beneficiary boxes */
  .originator-box {
    background: var(--el-color-primary-light-9);
    border-left: 3px solid var(--el-color-primary);
  }

  .beneficiary-box {
    background: var(--el-color-success-light-9);
    border-left: 3px solid var(--el-color-success);
  }

  .pii-round {
    border-color: var(--el-color-warning-light-5);
  }

  /* Lifecycle Row */
  .tx-lifecycle {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .lc-stage {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .lc-stage-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .lc-stage-dot.done {
    background: #16a34a;
  }

  .lc-stage-dot.active {
    background: #d97706;
  }

  .lc-stage-dot.rejected {
    background: #dc2626;
  }

  .lc-stage-dot.pending {
    background: var(--el-text-color-placeholder);
  }

  .lc-stage-dot.released {
    background: #16a34a;
  }

  .lc-stage-dot.held {
    background: #d97706;
  }

  .lc-stage-dot.forfeited {
    background: #dc2626;
  }

  .lc-stage-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .lc-stage-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--el-text-color-secondary);
    line-height: 1;
  }

  .lc-stage-state {
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
  }

  .lc-stage-state.done {
    color: #16a34a;
  }

  .lc-stage-state.active {
    color: #d97706;
  }

  .lc-stage-state.rejected {
    color: #dc2626;
  }

  .lc-stage-state.pending {
    color: var(--el-text-color-secondary);
  }

  .lc-stage-state.released {
    color: #16a34a;
  }

  .lc-stage-state.held {
    color: #d97706;
  }

  .lc-stage-state.forfeited {
    color: #dc2626;
  }

  .lc-sep {
    width: 1px;
    height: 20px;
    background: var(--el-border-color-light);
    flex-shrink: 0;
  }

  /* Timeline chain */
  .timeline-chain {
    position: relative;
    padding-left: 24px;
  }

  .timeline-chain::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 7px;
    width: 2px;
    content: '';
    background: var(--default-border);
  }

  .timeline-node {
    position: relative;
    padding-bottom: 16px;
  }

  .timeline-node:last-child {
    padding-bottom: 0;
  }

  .timeline-dot {
    position: absolute;
    top: 4px;
    left: -20px;
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .timeline-dot.completed {
    background: var(--el-color-success);
    box-shadow: 0 0 0 2px var(--el-color-success-light-5);
  }

  .timeline-dot.pending {
    background: var(--el-color-warning);
    box-shadow: 0 0 0 2px var(--el-color-warning-light-5);
  }

  .timeline-dot.failed {
    background: var(--el-color-danger);
    box-shadow: 0 0 0 2px var(--el-color-danger-light-5);
  }

  .timeline-dot.info {
    background: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
  }
</style>
