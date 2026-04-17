<template>
  <app-page plain>
    <section class="identify-page">
      <div class="identify-shell">
        <div class="identify-top">
          <button type="button" class="back-btn" @click="goHome">
            <el-icon><arrow-left /></el-icon>
            <span>{{ t('common.backHome') }}</span>
          </button>
        </div>

        <div class="identify-hero">
          <h1>{{ t('assistant.patientIdentify.pageTitle') }}</h1>
          <p>{{ t('assistant.patientIdentify.pageSubtitle') }}</p>
        </div>

        <div class="verify-panel">
          <div class="verify-tabs">
            <button
              v-for="item in verifyTabs"
              :key="item.value"
              type="button"
              class="verify-tab"
              :class="{ active: activeType === item.value }"
              @click="changeType(item.value)"
            >
              {{ item.label }}
            </button>
          </div>

          <div class="verify-body">
            <div class="verify-input-wrap">
              <input
                v-model.trim="verifyCode"
                class="verify-input"
                :placeholder="currentPlaceholder"
                @keyup.enter="handleVerify"
              />
            </div>

            <button type="button" class="verify-button" :disabled="loading" @click="handleVerify">
              {{ loading ? t('assistant.patientIdentify.verifying') : t('assistant.patientIdentify.submitText') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { verifyPatient } from '@/api/patient'
import type { PatientVerifyType } from '@/api/types'
import AppPage from '@/components/AppPage.vue'

const { t } = useI18n()
const router = useRouter()

const activeType = ref<PatientVerifyType>(0)
const verifyCode = ref('')
const loading = ref(false)

const verifyTabs = computed(() => [
  { value: 0 as PatientVerifyType, label: t('assistant.patientIdentify.tabs.visitNo') },
  { value: 1 as PatientVerifyType, label: t('assistant.patientIdentify.tabs.idCard') },
  { value: 2 as PatientVerifyType, label: t('assistant.patientIdentify.tabs.phone') }
])

const currentPlaceholder = computed(() => {
  const placeholderMap: Record<PatientVerifyType, string> = {
    0: t('assistant.patientIdentify.placeholders.visitNo'),
    1: t('assistant.patientIdentify.placeholders.idCard'),
    2: t('assistant.patientIdentify.placeholders.phone')
  }
  return placeholderMap[activeType.value]
})

const changeType = (type: PatientVerifyType) => {
  activeType.value = type
  verifyCode.value = ''
}

const goHome = () => {
  router.push('/assistant/workbench')
}

const hasMeaningfulData = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
  }

  return true
}

const getQueryPatientId = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalized = String(value).trim()
  return normalized
}

const handleVerify = async () => {
  const code = verifyCode.value.trim()
  if (!code) {
    ElMessage.warning(currentPlaceholder.value)
    return
  }

  loading.value = true

  try {
    const response = await verifyPatient({
      verifyType: activeType.value,
      verifyCode: code
    })
    const verifyData = response?.data

    if (hasMeaningfulData(verifyData)) {
      const patientId = getQueryPatientId(verifyData?.patientId)
      await router.push({
        path: '/assistant/intake',
        ...(patientId ? { query: { patientId } } : {})
      })
    } else {
      await ElMessageBox.alert(response?.msg || t('assistant.patientIdentify.emptyDataMessage'), t('common.tip'), {
        confirmButtonText: t('common.confirm'),
        type: 'warning'
      })
      await router.push('/assistant/intake')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.identify-page {
  position: relative;
  min-height: calc(100vh - 40px);
  padding: 32px 20px 56px;
  overflow: hidden;
  background:
    radial-gradient(circle at 24% 12%, rgba(182, 221, 255, 0.9), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(208, 239, 249, 0.82), transparent 20%),
    linear-gradient(180deg, #cae4fa 0%, #c7e0f8 44%, #bfd8f2 100%);
}

.identify-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(142deg, rgba(255, 255, 255, 0.34) 18%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(40deg, rgba(255, 255, 255, 0) 44%, rgba(255, 255, 255, 0.24) 56%, rgba(255, 255, 255, 0) 68%);
  pointer-events: none;
}

.identify-page::after {
  position: absolute;
  inset: auto -8% -16% auto;
  width: 54%;
  aspect-ratio: 1 / 1;
  content: '';
  background: radial-gradient(circle, rgba(126, 187, 255, 0.3) 0%, rgba(126, 187, 255, 0.06) 48%, transparent 72%);
  filter: blur(10px);
  pointer-events: none;
}

.identify-shell {
  position: relative;
  z-index: 1;
  width: min(780px, 100%);
  margin: 0 auto;
}

.identify-top {
  display: flex;
  justify-content: flex-start;
}

.back-btn {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #607183;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(66, 98, 141, 0.08);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.back-btn :deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.back-btn span {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.back-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.9);
}

.identify-hero {
  margin-top: 54px;
  text-align: center;
}

.identify-hero h1 {
  margin: 0;
  color: #161f2c;
  font-size: clamp(34px, 4.4vw, 46px);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0.02em;
}

.identify-hero p {
  max-width: 680px;
  margin: 16px auto 0;
  color: #617283;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
}

.verify-panel {
  margin-top: 70px;
  overflow: hidden;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.74);
  box-shadow: 0 24px 54px rgba(53, 88, 129, 0.14);
  backdrop-filter: blur(12px);
}

.verify-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 12px;
  gap: 10px;
  background: linear-gradient(180deg, rgba(247, 250, 255, 0.92), rgba(238, 245, 255, 0.8));
}

.verify-tab {
  min-height: 58px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #7d8da0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
}

.verify-tab.active {
  color: #236ad8;
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(69, 114, 187, 0.12);
}

.verify-body {
  padding: 18px 18px 18px;
}

.verify-input-wrap {
  padding: 0 4px;
}

.verify-input {
  width: 100%;
  height: 104px;
  padding: 0 18px;
  border: 1px solid #e1e9f4;
  border-radius: 18px;
  outline: none;
  background: rgba(255, 255, 255, 0.96);
  color: #243447;
  font-size: 18px;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.verify-input:focus {
  border-color: #4b79ee;
  box-shadow: 0 0 0 4px rgba(75, 121, 238, 0.12);
}

.verify-input::placeholder {
  color: #c2ccda;
  font-weight: 600;
}

.verify-button {
  width: 100%;
  height: 54px;
  margin-top: 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4d78f4 0%, #3c67ef 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 34px rgba(75, 121, 238, 0.24);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.verify-button:hover {
  transform: translateY(-1px);
  filter: saturate(1.03);
}

.verify-button:disabled {
  cursor: not-allowed;
  transform: none;
  filter: none;
  background: linear-gradient(135deg, #8ba9ef 0%, #7597ea 100%);
  box-shadow: none;
}

@media (max-width: 900px) {
  .identify-page {
    padding: 24px 16px 40px;
  }

  .identify-hero {
    margin-top: 36px;
  }

  .verify-panel {
    margin-top: 48px;
  }
}

@media (max-width: 640px) {
  .identify-hero p {
    font-size: 14px;
  }

  .verify-tabs {
    grid-template-columns: 1fr;
  }

  .verify-tab {
    min-height: 50px;
  }

  .verify-input {
    height: 88px;
    font-size: 16px;
  }
}
</style>
