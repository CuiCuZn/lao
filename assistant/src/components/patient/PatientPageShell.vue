<template>
  <div class="patient-page-shell">
    <div class="patient-page-shell__body">
      <patient-info-header />

      <main class="patient-page-shell__content">
        <div class="patient-page-shell__content-inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import PatientInfoHeader from './PatientInfoHeader.vue'
</script>

<style scoped lang="scss">
.patient-page-shell {
  height: 100vh;
  padding: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(67, 126, 255, 0.14), transparent 28%),
    radial-gradient(circle at top right, rgba(44, 196, 150, 0.12), transparent 26%),
    linear-gradient(180deg, #edf3fb 0%, #f6f9fd 100%);
}

.patient-page-shell__body {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.patient-page-shell__content {
  flex: 1;
  min-height: 0;
  display: flex;
  border-radius: 24px;
  border: 1px solid rgba(225, 233, 244, 0.96);
  background: rgba(248, 250, 253, 0.92);
  box-shadow: 0 18px 48px rgba(60, 86, 117, 0.08);
  overflow: hidden;
}

.patient-page-shell__content-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

@media (max-width: 640px) {
  .patient-page-shell {
    padding: 10px;
  }

  .patient-page-shell__body {
    min-height: 0;
  }
}
</style>
