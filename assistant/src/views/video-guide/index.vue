<template>
  <app-page>
    <div class="page-template">
      <h2>{{ t('route.videoGuide') }}</h2>
      <p>{{ t('assistant.emptyPage') }}</p>
    </div>
  </app-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppPage from '@/components/AppPage.vue'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.page-template {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.page-template h2 {
  margin: 0;
  color: var(--assistant-text);
  font-size: 24px;
}

.page-template p {
  margin: 0;
  color: var(--assistant-text-soft);
  line-height: 1.8;
}
</style>
