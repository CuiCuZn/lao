<template>
  <div class="placeholder-view">
    <div class="placeholder-card">
      <div class="placeholder-badge">{{ routeTitle }}</div>
      <h2>{{ routeTitle }}</h2>
      <p>{{ t('placeholder.pageDescription') }}</p>
      <p v-if="viewPath" class="route-path">
        {{ t('placeholder.routePath') }}: <span>{{ viewPath }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t, te } = useI18n()

const routeTitle = computed(() => {
  const rawTitle = typeof route.meta?.title === 'string' ? route.meta.title : ''
  if (!rawTitle) {
    return t('placeholder.pageTitle')
  }
  if (rawTitle.includes('.') && te(rawTitle)) {
    return t(rawTitle)
  }
  return rawTitle
})

const viewPath = computed(() => {
  return typeof route.meta?.viewPath === 'string' ? route.meta.viewPath : ''
})
</script>

<style scoped lang="scss">
.placeholder-view {
  min-height: 100%;
}

.placeholder-card {
  border-radius: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fbfe 100%);
  border: 1px solid #e5ecf4;
  box-shadow: 0 18px 48px rgba(34, 63, 97, 0.08);
}

.placeholder-badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(58, 135, 255, 0.08);
  color: #2f6fdc;
  font-size: 13px;
  font-weight: 600;
}

h2 {
  margin: 18px 0 10px;
  color: #1f2d3d;
  font-size: 22px;
}

p {
  margin: 0;
  color: #66788a;
  line-height: 1.8;
}

.route-path {
  margin-top: 12px;
  font-size: 13px;
}

.route-path span {
  color: #2f6fdc;
}
</style>
