<template>
  <app-page plain>
    <section class="intake-page">
      <div class="intake-shell">
        <div class="intake-header">
          <button type="button" class="back-btn" @click="goBack">
            <el-icon><arrow-left /></el-icon>
            <span>{{ t('common.back') }}</span>
          </button>

          <div class="header-copy">
            <h2>{{ t('assistant.intake.pageTitle') }}</h2>
            <p>{{ t('assistant.intake.pageSubtitle') }}</p>
          </div>

          <div class="save-status" :class="`is-${saveState}`">
            {{ saveStatusText }}
          </div>
        </div>

        <div class="intake-grid">
          <section class="form-panel">
            <div class="panel-title">
              <el-icon><tickets /></el-icon>
              <h3>{{ t('assistant.intake.basicTitle') }}</h3>
            </div>

            <div class="form-grid">
              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.name') }}<i>*</i></span>
                <input v-model="form.patientName" :placeholder="t('assistant.intake.placeholders.name')" @blur="triggerImmediateSave" />
              </label>

              <div class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.sex') }}<i>*</i></span>
                <div class="gender-group">
                  <label class="gender-option">
                    <input v-model="form.patientSex" type="radio" value="0" @change="triggerImmediateSave" />
                    <span>{{ t('assistant.intake.sexOptions.male') }}</span>
                  </label>
                  <label class="gender-option">
                    <input v-model="form.patientSex" type="radio" value="1" @change="triggerImmediateSave" />
                    <span>{{ t('assistant.intake.sexOptions.female') }}</span>
                  </label>
                </div>
              </div>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.birthday') }}<i>*</i></span>
                <input v-model="form.patientBirthday" :placeholder="t('assistant.intake.placeholders.birthday')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.age') }}</span>
                <input v-model="form.patientAge" :placeholder="t('assistant.intake.placeholders.age')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.idCard') }}<i>*</i></span>
                <input v-model="form.patientIdCard" :placeholder="t('assistant.intake.placeholders.idCard')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.phone') }}<i>*</i></span>
                <input v-model="form.patientPhone" :placeholder="t('assistant.intake.placeholders.phone')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.medicalAccount') }}</span>
                <input
                  v-model="form.medicalAccount"
                  :placeholder="t('assistant.intake.placeholders.medicalAccount')"
                  @blur="triggerImmediateSave"
                />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.address') }}</span>
                <input v-model="form.address" :placeholder="t('assistant.intake.placeholders.address')" @blur="triggerImmediateSave" />
              </label>
            </div>
          </section>

          <section class="form-panel">
            <div class="panel-title">
              <el-icon><document /></el-icon>
              <h3>{{ t('assistant.intake.caseTitle') }}</h3>
            </div>

            <div class="form-stack">
              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.chiefComplaint') }}<i>*</i></span>
                <textarea
                  v-model="form.chiefComplaint"
                  :placeholder="t('assistant.intake.placeholders.chiefComplaint')"
                  @blur="triggerImmediateSave"
                />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.presentIllness') }}</span>
                <textarea
                  v-model="form.presentIllness"
                  :placeholder="t('assistant.intake.placeholders.presentIllness')"
                  @blur="triggerImmediateSave"
                />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.pastHistory') }}</span>
                <textarea
                  v-model="form.pastHistory"
                  :placeholder="t('assistant.intake.placeholders.pastHistory')"
                  @blur="triggerImmediateSave"
                />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.allergyHistory') }}</span>
                <textarea
                  v-model="form.allergyHistory"
                  :placeholder="t('assistant.intake.placeholders.allergyHistory')"
                  @blur="triggerImmediateSave"
                />
              </label>

              <label class="field field-full">
                <span class="field-label">{{ t('assistant.intake.fields.familyHistory') }}</span>
                <textarea
                  v-model="form.familyHistory"
                  :placeholder="t('assistant.intake.placeholders.familyHistory')"
                  @blur="triggerImmediateSave"
                />
              </label>
            </div>
          </section>
        </div>

        <div class="four-diagnosis-section">
          <div class="four-diagnosis-head">
            <h3>{{ t('assistant.intake.fourDiagnosis.title') }}</h3>

            <div class="device-connection">
              <span class="device-connection-status">
                <i />
                {{ t('assistant.intake.fourDiagnosis.deviceStatusOffline') }}
              </span>
              <button type="button" class="connect-device-btn">
                {{ t('assistant.intake.fourDiagnosis.connectDevice') }}
              </button>
            </div>
          </div>

          <div class="device-card-grid">
            <article
              v-for="card in fourDiagnosisCards"
              :key="card.key"
              class="device-card"
              :class="[`is-${card.mode}`]"
            >
              <div class="device-card-head">
                <div class="device-card-title">
                  <span class="device-card-dot" :class="`is-${card.tone}`" />
                  <span>{{ card.title }}</span>
                  <small>{{ card.subtitle }}</small>
                </div>
                <span class="device-card-status">{{ t('assistant.intake.fourDiagnosis.pending') }}</span>
              </div>

              <div class="device-card-body">
                <div class="device-card-preview">
                  <p>{{ card.emptyText }}</p>
                </div>

                <button type="button" class="collect-btn">
                  {{ card.actionText }}
                </button>
              </div>
            </article>
          </div>

          <div class="diagnosis-result-panel">
            <span>{{ t('assistant.intake.fourDiagnosis.diagnosisTitle') }}</span>
          </div>
        </div>

        <div class="intake-submit-wrap">
          <button type="button" class="intake-submit-btn" @click="goToDoctorSelect">
            {{ t('assistant.intake.submitSummary') }}
          </button>
        </div>
      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Document, Tickets } from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'
import { getPatientDetail, savePatient } from '@/api/patient'
import type { PatientSaveParams } from '@/api/types'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

interface IntakePatientData {
  patientId?: string | number
  patientNumber?: string
  caseId?: string | number
  mainSuit?: string
  mainSuitLo?: string
  mainSuitCn?: string
  historyIllness?: string
  historyIllnessLo?: string
  historyIllnessCn?: string
  previousHistory?: string
  previousHistoryLo?: string
  previousHistoryCn?: string
  allergichistory?: string
  allergichistoryLo?: string
  allergichistoryCn?: string
  familyhistory?: string
  familyhistoryLo?: string
  familyhistoryCn?: string
  chiefComplaint?: string
  presentIllness?: string
  pastHistory?: string
  allergyHistory?: string
  familyHistory?: string
  patientIdCard?: string
  patientPhone?: string
  patientName?: string
  patientSex?: string
  patientBirthday?: string
  medicalAccount?: string | null
  address?: string | null
  [key: string]: unknown
}

const formatBirthday = (value?: string) => {
  if (!value) {
    return ''
  }

  return value.replace('T', ' ').slice(0, 10)
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

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toIsoDateTime = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return ''
  }

  if (normalized.includes('T')) {
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? normalized : date.toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const date = new Date(`${normalized}T00:00:00`)
    return Number.isNaN(date.getTime()) ? normalized : date.toISOString()
  }

  const date = new Date(normalized.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? normalized : date.toISOString()
}

const createEmptyForm = () => ({
  patientName: '',
  patientSex: '',
  patientBirthday: '',
  patientAge: '',
  patientIdCard: '',
  patientPhone: '',
  medicalAccount: '',
  address: '',
  chiefComplaint: '',
  presentIllness: '',
  pastHistory: '',
  allergyHistory: '',
  familyHistory: ''
})

const patientId = ref<number | undefined>(undefined)
const caseId = ref<number | undefined>(undefined)

const form = reactive(createEmptyForm())

const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const initialized = ref(false)
const lastSavedSnapshot = ref('')
const queuedSave = ref(false)
const loadingDetail = ref(false)

const buildSavePayload = (): PatientSaveParams => ({
  ...(patientId.value !== undefined ? { patientId: patientId.value } : {}),
  patientName: form.patientName.trim(),
  patientSex: form.patientSex,
  patientBirthday: toIsoDateTime(form.patientBirthday),
  patientIdCard: form.patientIdCard.trim(),
  patientPhone: form.patientPhone.trim(),
  medicalAccount: form.medicalAccount.trim(),
  address: form.address.trim(),
  ...(caseId.value !== undefined ? { caseId: caseId.value } : {}),
  mainSuit: form.chiefComplaint.trim(),
  historyIllness: form.presentIllness.trim(),
  previousHistory: form.pastHistory.trim(),
  allergichistory: form.allergyHistory.trim(),
  familyhistory: form.familyHistory.trim()
})

const validateForm = () => {
  return Boolean(
    form.patientName.trim() &&
    form.patientSex &&
    form.patientBirthday.trim() &&
    form.patientIdCard.trim() &&
    form.patientPhone.trim() &&
    form.chiefComplaint.trim()
  )
}

const saveStatusText = computed(() => {
  const map = {
    idle: t('assistant.intake.saveIdle'),
    loading: t('assistant.intake.saveLoading'),
    saving: t('assistant.intake.saveSaving'),
    saved: t('assistant.intake.saveSaved'),
    error: t('assistant.intake.saveError')
  }
  return loadingDetail.value ? map.loading : map[saveState.value]
})

const fourDiagnosisCards = computed(() => [
  {
    key: 'inspection',
    tone: 'blue',
    mode: 'preview',
    title: t('assistant.intake.fourDiagnosis.cards.inspection.title'),
    subtitle: t('assistant.intake.fourDiagnosis.cards.inspection.subtitle'),
    emptyText: t('assistant.intake.fourDiagnosis.cards.inspection.empty'),
    actionText: t('assistant.intake.fourDiagnosis.cards.inspection.action')
  },
  {
    key: 'pulse',
    tone: 'cyan',
    mode: 'preview',
    title: t('assistant.intake.fourDiagnosis.cards.pulse.title'),
    subtitle: t('assistant.intake.fourDiagnosis.cards.pulse.subtitle'),
    emptyText: t('assistant.intake.fourDiagnosis.cards.pulse.empty'),
    actionText: t('assistant.intake.fourDiagnosis.cards.pulse.action')
  },
  {
    key: 'auscultation',
    tone: 'teal',
    mode: 'result',
    title: t('assistant.intake.fourDiagnosis.cards.auscultation.title'),
    subtitle: t('assistant.intake.fourDiagnosis.cards.auscultation.subtitle'),
    emptyText: t('assistant.intake.fourDiagnosis.cards.auscultation.empty'),
    actionText: t('assistant.intake.fourDiagnosis.cards.auscultation.action')
  },
  {
    key: 'inquiry',
    tone: 'sky',
    mode: 'result',
    title: t('assistant.intake.fourDiagnosis.cards.inquiry.title'),
    subtitle: t('assistant.intake.fourDiagnosis.cards.inquiry.subtitle'),
    emptyText: t('assistant.intake.fourDiagnosis.cards.inquiry.empty'),
    actionText: t('assistant.intake.fourDiagnosis.cards.inquiry.action')
  }
])

const takeText = (...values: unknown[]) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value)
    }
  }
  return ''
}

const takeLocalizedCaseText = (data: Record<string, unknown>, cnKey: string, loKey: string, fallbackKey: string, currentValue: string) => {
  if (locale.value === 'lo') {
    return takeText(data[loKey], data[fallbackKey], currentValue)
  }

  return takeText(data[cnKey], data[fallbackKey], currentValue)
}

const hydrateForm = (data?: Record<string, unknown> | null) => {
  if (!data) {
    return
  }

  if (data.patientId !== undefined && data.patientId !== null) {
    patientId.value = toNumber(data.patientId)
  }

  if (data.caseId !== undefined && data.caseId !== null) {
    caseId.value = toNumber(data.caseId)
  }

  form.patientName = takeText(data.patientName, form.patientName)
  form.patientSex = takeText(data.patientSex, form.patientSex)
  form.patientBirthday = takeText(formatBirthday(String(data.patientBirthday || '')), form.patientBirthday)
  form.patientIdCard = takeText(data.patientIdCard, form.patientIdCard)
  form.patientPhone = takeText(data.patientPhone, form.patientPhone)
  form.medicalAccount = takeText(data.medicalAccount, form.medicalAccount)
  form.address = takeText(data.address, form.address)
  form.chiefComplaint = takeLocalizedCaseText(data, 'mainSuitCn', 'mainSuitLo', 'mainSuit', form.chiefComplaint)
  form.presentIllness = takeLocalizedCaseText(
    data,
    'historyIllnessCn',
    'historyIllnessLo',
    'historyIllness',
    form.presentIllness
  )
  form.pastHistory = takeLocalizedCaseText(
    data,
    'previousHistoryCn',
    'previousHistoryLo',
    'previousHistory',
    form.pastHistory
  )
  form.allergyHistory = takeLocalizedCaseText(
    data,
    'allergichistoryCn',
    'allergichistoryLo',
    'allergichistory',
    form.allergyHistory
  )
  form.familyHistory = takeLocalizedCaseText(
    data,
    'familyhistoryCn',
    'familyhistoryLo',
    'familyhistory',
    form.familyHistory
  )

  if (form.patientBirthday) {
    form.patientAge = calculateAge(form.patientBirthday)
  }
}

const clearSaveTimer = () => {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value)
    saveTimer.value = null
  }
}

const submitSave = async () => {
  if (!validateForm()) {
    saveState.value = 'idle'
    return
  }

  const payload = buildSavePayload()
  const snapshot = JSON.stringify(payload)

  if (snapshot === lastSavedSnapshot.value) {
    return
  }

  if (saveState.value === 'saving') {
    queuedSave.value = true
    return
  }

  saveState.value = 'saving'

  try {
    const response = await savePatient(payload)
    if (response?.data?.patientId !== undefined) {
      patientId.value = toNumber(response.data.patientId)
      await syncPatientIdToRoute()
    }
    if (response?.data?.caseId !== undefined) {
      caseId.value = toNumber(response.data.caseId)
    }
    lastSavedSnapshot.value = JSON.stringify(buildSavePayload())
    saveState.value = 'saved'
  } catch {
    saveState.value = 'error'
  } finally {
    if (queuedSave.value) {
      queuedSave.value = false
      void submitSave()
    }
  }
}

const scheduleAutoSave = () => {
  if (!initialized.value) {
    return
  }

  clearSaveTimer()
  saveTimer.value = setTimeout(() => {
    void submitSave()
  }, 800)
}

const triggerImmediateSave = () => {
  if (!initialized.value) {
    return
  }

  clearSaveTimer()
  void submitSave()
}

watch(
  () => form.patientBirthday,
  (value) => {
    form.patientAge = calculateAge(value)
  }
)

watch(
  form,
  () => {
    scheduleAutoSave()
  },
  { deep: true }
)

const resetSaveBaseline = () => {
  lastSavedSnapshot.value = JSON.stringify(buildSavePayload())
}

const resetForm = () => {
  Object.assign(form, createEmptyForm())
}

const getRoutePatientId = () => {
  const queryValue = Array.isArray(route.query.patientId) ? route.query.patientId[0] : route.query.patientId
  return toNumber(queryValue)
}

const syncPatientIdToRoute = async () => {
  if (patientId.value === undefined) {
    return
  }

  const currentQueryPatientId = Array.isArray(route.query.patientId) ? route.query.patientId[0] : route.query.patientId
  const nextPatientId = String(patientId.value)

  if (currentQueryPatientId === nextPatientId) {
    return
  }

  await router.replace({
    path: route.path,
    query: {
      ...route.query,
      patientId: nextPatientId
    }
  })
}

const initializeFromRouteQuery = async () => {
  initialized.value = false
  clearSaveTimer()
  queuedSave.value = false
  saveState.value = 'idle'

  patientId.value = getRoutePatientId()
  caseId.value = undefined
  resetForm()

  if (patientId.value === undefined) {
    resetSaveBaseline()
    initialized.value = true
    return
  }

  loadingDetail.value = true

  try {
    const response = await getPatientDetail(patientId.value)
    hydrateForm(response?.data)
  } finally {
    loadingDetail.value = false
    resetSaveBaseline()
    initialized.value = true
  }
}

watch(
  () => route.query.patientId,
  () => {
    const nextPatientId = getRoutePatientId()
    if (initialized.value && nextPatientId === patientId.value) {
      return
    }

    void initializeFromRouteQuery()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearSaveTimer()
})

const goBack = () => {
  router.push('/assistant/patient-identify')
}

const goToDoctorSelect = () => {
  const currentPatientId = patientId.value ?? getRoutePatientId()

  router.push({
    path: '/assistant/doctor-select',
    ...(currentPatientId !== undefined ? { query: { patientId: String(currentPatientId) } } : {})
  })
}
</script>

<style scoped lang="scss">
.intake-page {
  flex: 0 0 auto;
  position: relative;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  padding: 30px 16px 28px;
  background:
    radial-gradient(circle at 24% 12%, rgba(182, 221, 255, 0.9), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(208, 239, 249, 0.82), transparent 20%),
    linear-gradient(180deg, #cae4fa 0%, #c7e0f8 44%, #bfd8f2 100%);
}

.intake-page::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(142deg, rgba(255, 255, 255, 0.34) 18%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(40deg, rgba(255, 255, 255, 0) 44%, rgba(255, 255, 255, 0.24) 56%, rgba(255, 255, 255, 0) 68%);
  pointer-events: none;
}

.intake-page::after {
  position: absolute;
  inset: auto -10% -18% auto;
  width: 54%;
  aspect-ratio: 1 / 1;
  content: '';
  background: radial-gradient(circle, rgba(126, 187, 255, 0.3) 0%, rgba(126, 187, 255, 0.06) 48%, transparent 72%);
  filter: blur(10px);
  pointer-events: none;
}

.intake-shell {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.intake-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
}

.back-btn {
  min-height: 38px;
  width: fit-content;
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

.header-copy {
  text-align: center;
}

.header-copy h2 {
  margin: 0;
  color: #161f2c;
  font-size: clamp(28px, 3.8vw, 38px);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0.02em;
}

.header-copy p {
  margin: 14px 0 0;
  color: #617283;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.75;
}

.save-status {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  justify-self: end;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.72);
  color: #7a8b9d;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 12px 30px rgba(66, 98, 141, 0.08);
}

.save-status.is-saving {
  color: #236ad8;
}

.save-status.is-saved {
  color: #1e9d62;
}

.save-status.is-error {
  color: #d14343;
}

.intake-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.four-diagnosis-section {
  box-sizing: border-box;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.76);
  box-shadow: 0 24px 54px rgba(53, 88, 129, 0.14);
  backdrop-filter: blur(12px);
}

.four-diagnosis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.four-diagnosis-head h3 {
  margin: 0;
  color: #1f2c3d;
  font-size: 18px;
  font-weight: 800;
}

.device-connection {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid #e2ecf5;
  background: rgba(255, 255, 255, 0.96);
}

.device-connection-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #36475b;
  font-size: 13px;
  font-weight: 500;
}

.device-connection-status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  box-shadow: 0 0 0 4px rgba(255, 77, 79, 0.12);
}

.connect-device-btn,
.collect-btn {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4d78f4 0%, #3c67ef 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(75, 121, 238, 0.18);
}

.connect-device-btn {
  min-width: 92px;
  height: 36px;
  padding: 0 16px;
}

.device-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 0 20px 20px;
}

.device-card {
  border: 1px solid #d9e6f1;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  overflow: hidden;
  box-shadow: 0 16px 34px rgba(84, 111, 150, 0.06);
}

.device-card-head {
  min-height: 38px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(180deg, #f7fbff 0%, #f1f7fc 100%);
  border-bottom: 1px solid #e4edf5;
}

.device-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1f2d3d;
  font-size: 14px;
  font-weight: 600;
}

.device-card-title small {
  color: #5f7082;
  font-size: 13px;
  font-weight: 500;
}

.device-card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.device-card-dot.is-blue {
  background: #168fd4;
}

.device-card-dot.is-cyan {
  background: #1f9ff2;
}

.device-card-dot.is-teal {
  background: #16a6a0;
}

.device-card-dot.is-sky {
  background: #41a0f3;
}

.device-card-status {
  color: #8d9bad;
  font-size: 12px;
  font-weight: 500;
}

.device-card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

.device-card-preview {
  min-height: 114px;
  border: 1px dashed #dbe4ec;
  border-radius: 16px;
  background: #fbfdff;
  padding: 18px 14px;
}

.device-card-preview p {
  margin: 0;
  color: #a3afbd;
  font-size: 14px;
  line-height: 1.7;
}

.device-card.is-preview .device-card-preview {
  display: grid;
  place-items: center;
  text-align: center;
}

.device-card.is-result .device-card-preview {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
}

.collect-btn {
  width: 100%;
  height: 38px;
}

.diagnosis-result-panel {
  min-height: 210px;
  border-top: 1px solid #d9e6f1;
  background: rgba(255, 255, 255, 0.96);
  display: grid;
  place-items: center;
  padding: 28px 20px;
}

.diagnosis-result-panel span {
  color: #1f2c3d;
  font-size: 18px;
  font-weight: 700;
}

.intake-submit-wrap {
  padding: 4px 0 26px;
}

.intake-submit-btn {
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #4d78f4 0%, #3c67ef 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: 0 20px 38px rgba(75, 121, 238, 0.24);
}

.form-panel {
  height: 100%;
  min-height: 620px;
  padding: 20px 20px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.76);
  box-shadow: 0 24px 54px rgba(53, 88, 129, 0.14);
  backdrop-filter: blur(12px);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
  color: #4b79ee;
}

.panel-title :deep(.el-icon) {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(237, 244, 255, 0.98), rgba(225, 237, 255, 0.9));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.panel-title h3 {
  margin: 0;
  color: #172033;
  font-size: 18px;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 14px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-half {
  grid-column: span 1;
}

.field-full {
  grid-column: 1 / -1;
}

.field-label {
  color: #25364a;
  font-size: 14px;
  font-weight: 600;
}

.field-label i {
  margin-left: 4px;
  color: #ff5a58;
  font-style: normal;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #dde6ef;
  outline: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  color: #25364a;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input {
  height: 44px;
  padding: 0 14px;
}

.field textarea {
  min-height: 90px;
  padding: 12px 14px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: #4b79ee;
  box-shadow: 0 0 0 4px rgba(75, 121, 238, 0.12);
}

.field input::placeholder,
.field textarea::placeholder {
  color: #a5b2c1;
}

.gender-group {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 2px;
}

.gender-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #233244;
  font-size: 14px;
  cursor: pointer;
}

.gender-option input {
  margin: 0;
  accent-color: #168fd4;
}

@media (max-width: 960px) {
  .intake-header {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .back-btn,
  .save-status {
    justify-self: flex-start;
  }

  .intake-grid {
    grid-template-columns: 1fr;
  }

  .four-diagnosis-head {
    flex-direction: column;
    align-items: stretch;
  }

  .device-connection {
    justify-content: space-between;
  }

  .device-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .intake-page {
    padding: 20px 8px 0;
  }

  .intake-shell {
    gap: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field-half,
  .field-full {
    grid-column: 1;
  }

  .four-diagnosis-head {
    padding: 16px;
  }

  .device-connection {
    flex-direction: column;
    align-items: stretch;
  }

  .device-card-grid {
    padding: 0 12px 12px;
  }

  .device-card-head {
    padding: 10px 12px;
    align-items: flex-start;
  }

  .device-card-title {
    flex-wrap: wrap;
  }
}
</style>
