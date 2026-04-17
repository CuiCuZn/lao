<template>
  <app-page plain>
    <section class="workbench-page">
      <div class="workbench-hero">
        <h1>{{ t('assistant.workbench.pageTitle') }}</h1>
        <p>{{ t('assistant.workbench.pageSubtitle') }}</p>
      </div>

      <div class="entry-grid">
        <button
          v-for="card in cards"
          :key="card.path"
          type="button"
          class="entry-card"
          :style="{
            '--card-surface': card.surface,
            '--card-shadow': card.shadow,
            '--icon-color': card.iconColor
          }"
          @click="goTo(card.path)"
        >
          <div class="entry-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>

          <div class="entry-copy">
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
          </div>
        </button>
      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Document, FirstAidKit, UserFilled } from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'

const { t } = useI18n()
const router = useRouter()

const cards = computed(() => [
  {
    path: '/assistant/patient-identify',
    title: t('assistant.workbench.clinicTitle'),
    description: t('assistant.workbench.clinicDescription'),
    icon: UserFilled,
    iconColor: '#3f72f0',
    surface: 'linear-gradient(135deg, #8fb0fb 0%, #4d78f4 52%, #3c67ef 100%)',
    shadow: '0 24px 44px rgba(75, 121, 238, 0.24)'
  },
  {
    path: '/assistant/records',
    title: t('assistant.workbench.recordTitle'),
    description: t('assistant.workbench.recordDescription'),
    icon: Document,
    iconColor: '#2db27b',
    surface: 'linear-gradient(135deg, #4fe0b8 0%, #34ca91 48%, #29b977 100%)',
    shadow: '0 24px 44px rgba(47, 188, 124, 0.24)'
  },
  {
    path: '/assistant/pending-records',
    title: t('assistant.workbench.pendingTitle'),
    description: t('assistant.workbench.pendingDescription'),
    icon: FirstAidKit,
    iconColor: '#ef7f1b',
    surface: 'linear-gradient(135deg, #ffb55a 0%, #ff9842 56%, #ff8634 100%)',
    shadow: '0 24px 44px rgba(255, 148, 56, 0.24)'
  }
])

const goTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
.workbench-page {
  position: relative;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 56px 32px 72px;
  overflow: hidden;
  background:
    radial-gradient(circle at 24% 12%, rgba(182, 221, 255, 0.9), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(208, 239, 249, 0.82), transparent 20%),
    linear-gradient(180deg, #cae4fa 0%, #c7e0f8 44%, #bfd8f2 100%);
}

.workbench-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(142deg, rgba(255, 255, 255, 0.34) 18%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(40deg, rgba(255, 255, 255, 0) 44%, rgba(255, 255, 255, 0.28) 56%, rgba(255, 255, 255, 0) 68%);
  pointer-events: none;
}

.workbench-page::after {
  position: absolute;
  inset: auto -12% -18% auto;
  width: 58%;
  aspect-ratio: 1 / 1;
  content: '';
  background: radial-gradient(circle, rgba(126, 187, 255, 0.28) 0%, rgba(126, 187, 255, 0.05) 48%, transparent 72%);
  filter: blur(10px);
  pointer-events: none;
}

.workbench-hero,
.entry-grid {
  position: relative;
  z-index: 1;
}

.workbench-hero {
  margin-top: 4px;
  text-align: center;
}

.workbench-hero h1 {
  margin: 0;
  color: #161f2c;
  font-size: clamp(36px, 4.6vw, 52px);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0.02em;
}

.workbench-hero p {
  margin: 16px 0 0;
  color: #617283;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.entry-grid {
  width: min(980px, 100%);
  margin-top: 118px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.entry-card {
  position: relative;
  min-height: 255px;
  padding: 38px 28px 32px;
  border: none;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 34px;
  cursor: pointer;
  background: var(--card-surface);
  box-shadow: var(--card-shadow);
  transform: translateY(0);
  transition: transform 0.24s ease, box-shadow 0.24s ease, filter 0.24s ease;
  animation: card-enter 0.55s ease both;
}

.entry-card:nth-child(2) {
  animation-delay: 0.06s;
}

.entry-card:nth-child(3) {
  animation-delay: 0.12s;
}

.entry-card::before {
  position: absolute;
  inset: 0;
  content: '';
  border-radius: inherit;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.entry-card:hover {
  transform: translateY(-6px);
  filter: saturate(1.03);
}

.entry-icon {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 249, 255, 0.92));
  box-shadow: 0 14px 30px rgba(33, 70, 126, 0.16);
  color: var(--icon-color);
  font-size: 30px;
}

.entry-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  text-align: center;
}

.entry-copy h2 {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.28;
}

.entry-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.7;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .entry-grid {
    width: min(880px, 100%);
  }

  .entry-copy h2 {
    font-size: 24px;
  }
}

@media (max-width: 900px) {
  .workbench-page {
    min-height: calc(100vh - 40px);
    padding: 34px 16px 44px;
  }

  .entry-grid {
    margin-top: 56px;
    grid-template-columns: 1fr;
  }

  .entry-card {
    min-height: 220px;
  }
}

@media (max-width: 640px) {
  .workbench-hero p {
    font-size: 14px;
  }

  .entry-card {
    padding: 30px 22px 26px;
    gap: 26px;
  }

  .entry-copy {
    gap: 16px;
  }

  .entry-copy h2 {
    font-size: 24px;
  }
}
</style>
