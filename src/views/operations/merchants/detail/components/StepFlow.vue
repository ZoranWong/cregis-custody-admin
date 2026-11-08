<!--
  统一步骤条（主步骤条 36px / KYB 子进度 24px 共用）。

  主步骤条与子进度在视觉上是同一套语言：实心圆圈（背景=状态色，图标白），
  左侧连线用 ::before 绘制，线宽与圆圈尺寸由 --step-size 联动。
  两处场景只传 size，不复制结构，避免两边样式漂移。
-->
<template>
  <div class="step-flow" :class="size === 'sm' ? 'step-flow--sm' : 'step-flow--lg'">
    <div v-for="step in steps" :key="step.key" class="step" :class="step.state || 'pending'">
      <div class="step-circle">
        <ArtSvgIcon v-if="step.icon" :icon="step.icon" />
        <template v-else>{{ step.text }}</template>
      </div>
      <div class="step-label">{{ step.label }}</div>
      <div v-if="step.meta" class="step-meta">{{ step.meta }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { StepItem } from '@/features/merchant/merchantStepper'

  defineOptions({ name: 'MerchantStepFlow' })

  withDefaults(
    defineProps<{
      steps: StepItem[]
      /** lg = 主步骤条 36px；sm = KYB 子进度 24px */
      size?: 'lg' | 'sm'
    }>(),
    { size: 'lg' }
  )
</script>

<style scoped>
  .step-flow {
    display: flex;
    align-items: flex-start;

    --step-size: 36px;
  }

  /* 主步骤条：36px 实心圆圈 */
  .step-flow--lg {
    --step-size: 36px;
  }

  /* KYB 子进度：24px 实心圆圈 */
  .step-flow--sm {
    --step-size: 24px;
  }

  .step {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* 左侧连线（首步隐藏）；线宽随圆圈尺寸缩放：36px→3px / 24px→2px
     垂直居中：top = (圆高 - 线高) / 2 = size*(12-1)/24 = size*11/24 */
  .step::before {
    position: absolute;
    top: calc(var(--step-size) * 11 / 24);
    right: 50%;
    left: -50%;
    z-index: 0;
    height: calc(var(--step-size) / 12);
    content: '';
    background: var(--tone-track-idle);
    border-radius: calc(var(--step-size) / 24);
  }

  .step:first-child::before {
    display: none;
  }

  /* 连线颜色：跟随步骤状态
     进行中 / 等待 → 绿→琥珀渐变；完成 → 绿；失败 / 待处理 → 中性灰 */
  .step.completed::before {
    background: var(--tone-track-done);
  }

  .step.active::before,
  .step.waiting::before {
    background: linear-gradient(90deg, var(--tone-track-done) 0%, var(--tone-track-progress) 100%);
  }

  .step.failed::before {
    background: var(--tone-track-idle);
  }

  /* ── 实心圆圈：状态色填充 + 白色图标/序号 ──
   * 亮色用 -text 档做底（白字 ≥5:1，达标 AA）；暗色底色是亮色系，
   * 白字只有 2–3:1，改为近黑前景（≥5.9:1），见 .dark 覆盖。 */
  .step-circle {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--step-size);
    height: var(--step-size);
    font-size: calc(var(--step-size) * 13 / 36); /* 36→13px, 24→8.7px */
    font-weight: 700;
    color: #fff;
    background: var(--tone-neutral-text); /* 待处理：中性灰（白字 7.58:1） */
    border-radius: 50%;
    transition: background 0.2s ease;
  }

  /* 已完成：实心绿 + 白勾 */
  .step.completed .step-circle {
    background: var(--tone-done-text);
  }

  /* 进行中 / 等待：实心琥珀（警告色）+ 白时钟 + 呼吸光环 */
  .step.active .step-circle,
  .step.waiting .step-circle {
    background: var(--tone-progress-text);
  }

  .step.active .step-circle {
    animation: step-pulse 2.4s ease-in-out infinite;
  }

  /* 呼吸光环与圆圈同色（琥珀），不再混用 info 蓝 */
  @keyframes step-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 3px var(--tone-progress-ring);
    }

    50% {
      box-shadow: 0 0 0 6px var(--tone-progress-ring-soft);
    }
  }

  /* 被拒：实心红 + 白叉 */
  .step.failed .step-circle {
    background: var(--tone-error-text);
  }

  /* 暗色：填充改用品牌亮色（-mark），彩色状态前景改近黑 */
  :global(.dark) .step-circle {
    background: var(--tone-neutral-mark);
  }

  :global(.dark) .step.completed .step-circle {
    background: var(--tone-done-mark);
  }

  :global(.dark) .step.active .step-circle,
  :global(.dark) .step.waiting .step-circle {
    background: var(--tone-progress-mark);
  }

  :global(.dark) .step.failed .step-circle {
    background: var(--tone-error-mark);
  }

  :global(.dark) .step.completed .step-circle,
  :global(.dark) .step.active .step-circle,
  :global(.dark) .step.waiting .step-circle,
  :global(.dark) .step.failed .step-circle {
    color: #0b0b0c;
  }

  /* ── 文案：label + meta，颜色与状态联动 ── */
  .step-label {
    max-width: 160px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--tone-muted-text);
    text-wrap: balance; /* 必须换行时两行均分，避免末行只有一个词 */
  }

  .step.completed .step-label {
    font-weight: 600;
    color: var(--tone-done-text);
  }

  .step.active .step-label,
  .step.waiting .step-label {
    font-weight: 700;
    color: var(--tone-progress-text);
  }

  .step.failed .step-label {
    font-weight: 700;
    color: var(--tone-error-text);
  }

  .step-meta {
    margin-top: 3px;
    font-size: 11px;
    color: var(--tone-muted-text);
  }

  .step.completed .step-meta {
    color: var(--tone-done-text);
  }

  .step.active .step-meta,
  .step.waiting .step-meta {
    font-weight: 500;
    color: var(--tone-progress-text);
  }

  .step.failed .step-meta {
    font-weight: 600;
    color: var(--tone-error-text);
  }

  /* 子进度的 label/meta 略小一档（圆圈也更小） */
  .step-flow--sm .step-label {
    margin-top: 6px;
    font-size: 11px;
  }

  .step-flow--sm .step-meta {
    font-size: 10px;
  }
</style>
