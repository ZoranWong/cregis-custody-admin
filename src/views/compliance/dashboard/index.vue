<template>
  <div class="page-content">
    <div class="art-card">
      <div class="flex flex-col items-center justify-center py-20">
        <ArtSvgIcon icon="ri:dashboard-line" class="text-6xl text-g-300 mb-4" />
        <h2 class="text-xl font-semibold text-g-700 mb-2">Compliance Transaction Oversight</h2>
        <p class="text-sm text-g-500 max-w-md text-center">
          Real-time compliance monitoring dashboard will be displayed here, providing comprehensive
          visibility into transaction compliance status and trends.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ComplianceDashboard' })
</script>
