<template>
  <header class="patient-info-header">
    <div class="header-main">
      <div class="header-badge">患</div>

      <div class="header-copy">
        <p>{{ t('assistant.patientVideo.header.title') }}</p>
        <strong>{{ patientName }}</strong>
      </div>
    </div>

    <div class="header-meta">
      <div class="meta-item">
        <span>{{ t('assistant.intake.fields.sex') }}</span>
        <strong>{{ patientSex }}</strong>
      </div>

      <div class="meta-item">
        <span>{{ t('assistant.intake.fields.age') }}</span>
        <strong>{{ patientAge }}</strong>
      </div>

      <div class="meta-item">
        <span>{{ t('assistant.doctorSelect.patientVisitNo') }}</span>
        <strong>{{ visitNo }}</strong>
      </div>

      <div class="meta-item meta-item--status">
        <span>{{ t('common.tip') }}</span>
        <strong :class="{ error: Boolean(sessionStore.error) }">{{ statusText }}</strong>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePatientSessionStore } from '@/stores/patient-session'

const { t } = useI18n()
const sessionStore = usePatientSessionStore()

const takeText = (source: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!source) {
    return ''
  }

  for (const key of keys) {
    const value = source[key]
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value).trim()
    }
  }

  return ''
}

const calculateAge = (birthday?: string) => {
  if (!birthday) {
    return ''
  }

  const date = new Date(birthday)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  const dayDiff = now.getDate() - date.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age >= 0 ? String(age) : ''
}

const formatSex = (value: unknown) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (normalized === '0' || normalized === 'male' || normalized === '男') {
    return t('assistant.intake.sexOptions.male')
  }

  if (normalized === '1' || normalized === 'female' || normalized === '女') {
    return t('assistant.intake.sexOptions.female')
  }

  return t('common.notAvailable')
}

const patientName = computed(() => {
  return takeText(sessionStore.patientDetail, ['patientName', 'name']) || t('common.notAvailable')
})

const patientSex = computed(() => {
  return formatSex(sessionStore.patientDetail?.patientSex)
})

const patientAge = computed(() => {
  const age = takeText(sessionStore.patientDetail, ['patientAge']) || calculateAge(takeText(sessionStore.patientDetail, ['patientBirthday']))
  return age ? `${age}${t('assistant.doctorSelect.ageSuffix')}` : t('common.notAvailable')
})

const visitNo = computed(() => {
  return takeText(sessionStore.patientDetail, ['patientNumber', 'visitNo', 'visitNumber']) || t('common.notAvailable')
})

const statusText = computed(() => {
  if (sessionStore.loading) {
    return t('assistant.patientVideo.header.syncing')
  }

  if (sessionStore.error) {
    return t('assistant.patientVideo.header.syncFailed')
  }

  if (sessionStore.patientDetail) {
    return t('common.ready')
  }

  return t('common.notAvailable')
})
</script>

<style scoped lang="scss">
.patient-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 76px;
  padding: 14px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(223, 232, 242, 0.92);
  box-shadow: 0 14px 36px rgba(57, 84, 117, 0.08);
}

.header-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-badge {
  width: 42px;
  height: 42px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(180deg, #4b8eff 0%, #316de8 100%);
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
}

.header-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-copy p,
.meta-item span {
  margin: 0;
  color: #8b9ab0;
  font-size: 12px;
  line-height: 1;
}

.header-copy strong {
  color: #243347;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.header-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(90px, auto));
  gap: 14px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item strong {
  color: #26364b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.meta-item--status strong.error {
  color: #df5d50;
}

@media (max-width: 1080px) {
  .patient-info-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-meta {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .patient-info-header {
    padding: 16px;
  }

  .header-copy strong {
    font-size: 20px;
  }

  .header-meta {
    grid-template-columns: 1fr;
  }
}
</style>
