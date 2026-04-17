<template>
  <div class="app-page" :class="{ 'is-plain': plain }">
    <app-topbar :plain="plain" />

    <main class="app-page-body" :class="{ 'is-plain': plain }">
      <div class="app-page-slot">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    plain?: boolean
  }>(),
  {
    plain: false
  }
)

import AppTopbar from './AppTopbar.vue'
</script>

<style scoped lang="scss">
.app-page {
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.app-page-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  // padding: 24px;
  border-radius: 10px;
  background: var(--assistant-surface);
  border: 1px solid var(--assistant-border);
  box-shadow: var(--assistant-shadow);
  backdrop-filter: blur(16px);
}

.app-page.is-plain {
  padding: 0;
  gap: 0;
}

.app-page-body.is-plain {
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.app-page-slot {
  flex: 0 0 auto;
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .app-page {
    padding: 12px;
    gap: 12px;
  }

  .app-page-body {
    padding: 18px;
  }
}
</style>
