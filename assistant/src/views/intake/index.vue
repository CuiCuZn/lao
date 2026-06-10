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
          </div>

          <div style="width: 100px; display: flex; justify-content: flex-end;">
            <div class="save-status" :class="`is-${saveState}`">
              {{ saveStatusText }}
            </div>
          </div>
        </div>

        <div class="intake-grid">
          <section class="form-panel">
            <div class="panel-title">
              <el-icon><tickets /></el-icon>
              <h3>{{ t('assistant.intake.basicTitle') }}</h3>
              <div v-if="displayPatientId" class="patient-record-id">
                <span>{{ t('assistant.intake.patientId') }}：</span>
                <strong>{{ displayPatientId }}</strong>
              </div>
            </div>

            <div class="form-grid">
              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.name') }}<i>*</i></span>
                <input v-model="form.patientName" :placeholder="t('assistant.intake.placeholders.name')" @blur="triggerImmediateSave" />
              </label>

              <div class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.sex') }}<i>*</i></span>
                <div class="gender-group">
                  <label v-for="item in sexOptions" :key="item.dictValue" class="gender-option">
                    <input v-model="form.patientSex" type="radio" :value="item.dictValue" @change="triggerImmediateSave" />
                    <span>{{ item.dictLabel }}</span>
                  </label>
                </div>
              </div>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.birthday') }}<i>*</i></span>
                <el-date-picker
                  v-model="form.patientBirthday"
                  class="field-date-picker"
                  type="date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :editable="false"
                  :placeholder="t('assistant.intake.placeholders.birthday')"
                  @change="triggerImmediateSave"
                />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.age') }}</span>
                <input
                  v-model="form.patientAge"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :placeholder="t('assistant.intake.placeholders.age')"
                  @input="handleAgeInput"
                  @blur="handleAgeBlur"
                />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.idCard') }}<i>*</i></span>
                <input v-model="form.patientIdCard" :placeholder="t('assistant.intake.placeholders.idCard')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.phone') }}<i>*</i></span>
                <input v-model="form.patientPhone" :placeholder="t('assistant.intake.placeholders.phone')" @blur="triggerImmediateSave" />
              </label>

              <label class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.job') }}</span>
                <input v-model="form.job" :placeholder="t('assistant.intake.placeholders.job')" @blur="triggerImmediateSave" />
              </label>

              <div class="field field-half">
                <span class="field-label">{{ t('assistant.intake.fields.maritalStatus') }}</span>
                <div class="radio-group">
                  <label v-for="item in maritalStatusOptions" :key="item.dictValue" class="radio-option">
                    <input v-model="form.maritalStatus" type="radio" :value="item.dictValue" @change="triggerImmediateSave" />
                    <span>{{ item.dictLabel }}</span>
                  </label>
                </div>
              </div>

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

          <section class="form-panel placeholder-panel">
            <div class="panel-title">
              <el-icon><document /></el-icon>
              <h3>{{ t('assistant.intake.fourDiagnosis.displayTitle') }}</h3>
              <button
                v-if="fourApparatusUrl"
                type="button"
                class="four-fullscreen-btn"
                :title="t('assistant.intake.fourDiagnosis.fullscreen')"
                @click="pdfPreviewVisible = true"
              >
                <el-icon><full-screen /></el-icon>
              </button>
            </div>

            <div class="placeholder-body">
              <iframe
                v-if="fourApparatusUrl"
                class="four-apparatus-pdf"
                :src="fourApparatusUrl"
                :title="t('assistant.intake.fourDiagnosis.displayTitle')"
              ></iframe>

              <div v-else class="four-diagnosis-empty">
                <el-icon class="four-empty-icon"><first-aid-kit /></el-icon>
                <h4>{{ t('assistant.intake.fourDiagnosis.emptyTitle') }}</h4>
                <p>{{ t('assistant.intake.fourDiagnosis.emptyDescription') }}</p>
                <button type="button" class="fetch-four-btn" :disabled="fetchingFourData" @click="fetchFourDiagnosisData">
                  <el-icon><download /></el-icon>
                  <span>{{ t('assistant.intake.fourDiagnosis.fetchData') }}</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <div class="intake-submit-wrap">
          <button type="button" class="intake-submit-btn" @click="goToDoctorSelect">
            {{ t('assistant.intake.submitSummary') }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="basicInfoDialogVisible" class="basic-info-dialog-mask">
      <div class="basic-info-dialog">
        <div class="basic-info-dialog-icon">!</div>
        <h3>{{ t('assistant.intake.fourDiagnosis.completeBasicInfo') }}</h3>
        <button type="button" @click="basicInfoDialogVisible = false">
          {{ t('assistant.intake.fourDiagnosis.dialogConfirm') }}
        </button>
      </div>
    </div>

    <div v-if="fourCollectionDialogVisible" class="four-collection-dialog-mask">
      <div class="four-collection-dialog">
        <div class="four-collection-icon">!</div>
        <h3>{{ t('assistant.intake.fourDiagnosis.collectionMissingTitle') }}</h3>
        <p>{{ t('assistant.intake.fourDiagnosis.collectionMissingDescription') }}</p>
        <div class="four-collection-actions">
          <button type="button" class="four-collection-secondary" @click="skipFourCollection">
            {{ t('assistant.intake.fourDiagnosis.skipCollection') }}
          </button>
          <button type="button" class="four-collection-primary" @click="goCollectFourDiagnosisData">
            {{ t('assistant.intake.fourDiagnosis.goCollection') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="pdfPreviewVisible" class="pdf-preview-mask" @click.self="pdfPreviewVisible = false">
      <div class="pdf-preview-dialog">
        <div class="pdf-preview-header">
          <h3>{{ t('assistant.intake.fourDiagnosis.displayTitle') }}</h3>
          <button type="button" :title="t('common.cancel')" @click="pdfPreviewVisible = false">
            <el-icon><close /></el-icon>
          </button>
        </div>
        <iframe
          class="pdf-preview-frame"
          :src="fourApparatusUrl"
          :title="t('assistant.intake.fourDiagnosis.displayTitle')"
        ></iframe>
      </div>
    </div>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Close, Document, Download, FirstAidKit, FullScreen, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AppPage from '@/components/AppPage.vue'
import { listDictData } from '@/api/dict'
import { getPatientDetail, savePatient } from '@/api/patient'
import type { DictDataVO, PatientSaveParams } from '@/api/types'
import { usePatientSessionStore } from '@/stores/patient-session'
import { loadSexDict, sexDictOptions } from '@/utils/sex-dict'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sessionStore = usePatientSessionStore()

interface IntakePatientData {
  patientId?: string | number
  patientNumber?: string
  caseId?: string | number
  patientIdCard?: string
  fourApparatusUrl?: string
  patientPhone?: string
  patientName?: string
  patientSex?: string
  patientBirthday?: string
  job?: string | null
  maritalStatus?: string | null
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

const normalizeAge = (value: string, clampMin = false) => {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  const age = Number(digits)

  if (!Number.isFinite(age)) {
    return ''
  }

  if (age > 120) {
    return '120'
  }

  if (clampMin && age < 1) {
    return '1'
  }

  return String(age)
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const hasMeaningfulValue = (value: unknown) => {
  return value !== null && value !== undefined && String(value).trim() !== ''
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
  job: '',
  maritalStatus: '',
  medicalAccount: '',
  address: ''
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
const maritalStatusDict = ref<DictDataVO[]>([])
const fourApparatusUrl = ref('')
const fetchingFourData = ref(false)
const basicInfoDialogVisible = ref(false)
const fourCollectionDialogVisible = ref(false)
const pdfPreviewVisible = ref(false)
let savingPromise: Promise<boolean> | null = null

const maritalStatusOptions = computed(() => {
  if (maritalStatusDict.value.length > 0) {
    return maritalStatusDict.value
  }

  return [
    { dictLabel: t('assistant.intake.maritalStatusOptions.unmarried'), dictValue: '0' },
    { dictLabel: t('assistant.intake.maritalStatusOptions.married'), dictValue: '1' }
  ]
})

const sexOptions = computed(() => sexDictOptions.value)

const displayPatientId = computed(() => {
  return patientId.value === undefined ? '' : String(patientId.value)
})

const buildSavePayload = (): PatientSaveParams => ({
  ...(patientId.value !== undefined ? { patientId: patientId.value } : {}),
  patientName: form.patientName.trim(),
  patientSex: form.patientSex,
  patientBirthday: toIsoDateTime(form.patientBirthday),
  patientIdCard: form.patientIdCard.trim(),
  patientPhone: form.patientPhone.trim(),
  job: form.job.trim(),
  maritalStatus: form.maritalStatus,
  medicalAccount: form.medicalAccount.trim(),
  address: form.address.trim(),
  ...(caseId.value !== undefined ? { caseId: caseId.value } : {}),
  mainSuit: '',
  historyIllness: '',
  previousHistory: '',
  allergichistory: '',
  familyhistory: ''
})

const validateForm = () => {
  return Boolean(
    form.patientName.trim() &&
    form.patientSex &&
    form.patientBirthday.trim() &&
    form.patientIdCard.trim() &&
    form.patientPhone.trim()
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

const takeText = (...values: unknown[]) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value)
    }
  }
  return ''
}

const hydrateForm = (data?: IntakePatientData | null) => {
  if (!data) {
    return
  }

  if (data.patientId !== undefined && data.patientId !== null) {
    patientId.value = toNumber(data.patientId)
  }

  if (data.caseId !== undefined && data.caseId !== null) {
    caseId.value = toNumber(data.caseId)
    sessionStore.setCaseId(caseId.value)
  }

  fourApparatusUrl.value = takeText(data.fourApparatusUrl, fourApparatusUrl.value)
  form.patientName = takeText(data.patientName, form.patientName)
  form.patientSex = takeText(data.patientSex, form.patientSex)
  form.patientBirthday = takeText(formatBirthday(String(data.patientBirthday || '')), form.patientBirthday)
  form.patientIdCard = takeText(data.patientIdCard, form.patientIdCard)
  form.patientPhone = takeText(data.patientPhone, form.patientPhone)
  form.job = takeText(data.job, data.occupation, form.job)
  form.maritalStatus = takeText(data.maritalStatus, data.marriage, form.maritalStatus)
  form.medicalAccount = takeText(data.medicalAccount, form.medicalAccount)
  form.address = takeText(data.address, form.address)

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

const submitSave = async (): Promise<boolean> => {
  if (!validateForm()) {
    saveState.value = 'idle'
    return false
  }

  const payload = buildSavePayload()
  const snapshot = JSON.stringify(payload)

  if (snapshot === lastSavedSnapshot.value) {
    return true
  }

  if (savingPromise) {
    queuedSave.value = true
    await savingPromise
    return submitSave()
  }

  saveState.value = 'saving'

  savingPromise = (async () => {
    try {
      const response = await savePatient(payload)
      if (response?.data?.patientId !== undefined) {
        patientId.value = toNumber(response.data.patientId)
        await syncPatientIdToRoute()
      }
      if (response?.data?.caseId !== undefined) {
        caseId.value = toNumber(response.data.caseId)
        sessionStore.setCaseId(caseId.value)
      }
      lastSavedSnapshot.value = JSON.stringify(buildSavePayload())
      saveState.value = 'saved'
      return true
    } catch {
      saveState.value = 'error'
      return false
    } finally {
      savingPromise = null
    }
  })()

  const saved = await savingPromise

  if (queuedSave.value) {
    queuedSave.value = false
    return submitSave()
  }

  return saved
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

const refreshFourDiagnosisDetail = async () => {
  const currentPatientId = patientId.value ?? getRoutePatientId()
  if (currentPatientId === undefined || fetchingFourData.value) {
    return false
  }

  fetchingFourData.value = true

  try {
    const response = await getPatientDetail(currentPatientId)
    const detail = (response?.data || null) as IntakePatientData | null
    hydrateForm(detail)
    return Boolean(fourApparatusUrl.value)
  } finally {
    fetchingFourData.value = false
  }
}

const fetchFourDiagnosisData = async () => {
  if (!displayPatientId.value) {
    basicInfoDialogVisible.value = true
    return
  }

  const hasFourData = await refreshFourDiagnosisDetail()
  if (!hasFourData) {
    ElMessage.warning(t('assistant.intake.fourDiagnosis.noData'))
  }
}

const goCollectFourDiagnosisData = async () => {
  fourCollectionDialogVisible.value = false
  await fetchFourDiagnosisData()
}

const goNextStep = () => {
  const currentPatientId = patientId.value ?? getRoutePatientId()

  if (currentPatientId === undefined) {
    return
  }

  router.push({
    path: '/assistant/doctor-select',
    query: { patientId: String(currentPatientId) }
  })
}

const skipFourCollection = () => {
  fourCollectionDialogVisible.value = false
  goNextStep()
}

const handleAgeInput = () => {
  form.patientAge = normalizeAge(form.patientAge)
}

const handleAgeBlur = () => {
  form.patientAge = normalizeAge(form.patientAge, true)
  triggerImmediateSave()
}

watch(
  () => form.patientBirthday,
  (value) => {
    form.patientAge = normalizeAge(calculateAge(value))
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

const loadMaritalStatusDict = async () => {
  try {
    const response = await listDictData({ dictType: 'sys_marriage_status' })
    maritalStatusDict.value = response.rows || response.data || []
  } catch {
    maritalStatusDict.value = []
  }
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

const ensureCaseIdReady = async (detail?: IntakePatientData | null) => {
  if (hasMeaningfulValue(detail?.caseId) && caseId.value !== undefined) {
    sessionStore.setCaseId(caseId.value)
    return
  }

  if (!validateForm()) {
    sessionStore.setCaseId(undefined)
    return
  }

  await submitSave()
}

const initializeFromRouteQuery = async () => {
  initialized.value = false
  clearSaveTimer()
  queuedSave.value = false
  saveState.value = 'idle'

  patientId.value = getRoutePatientId()
  caseId.value = undefined
  fourApparatusUrl.value = ''
  fourCollectionDialogVisible.value = false
  pdfPreviewVisible.value = false
  sessionStore.setCaseId(undefined)
  resetForm()

  if (patientId.value === undefined) {
    resetSaveBaseline()
    initialized.value = true
    return
  }

  loadingDetail.value = true

  try {
    const response = await getPatientDetail(patientId.value)
    const detail = (response?.data || null) as IntakePatientData | null
    hydrateForm(detail)
    await ensureCaseIdReady(detail)
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

onMounted(() => {
  void loadSexDict()
  void loadMaritalStatusDict()
})

onBeforeUnmount(() => {
  clearSaveTimer()
})

const goBack = () => {
  router.push('/assistant/patient-identify')
}

const goToDoctorSelect = async () => {
  clearSaveTimer()
  const saved = await submitSave()
  if (!saved) {
    return
  }

  if ((patientId.value ?? getRoutePatientId()) === undefined) {
    return
  }

  if (fourApparatusUrl.value) {
    goNextStep()
    return
  }

  fourCollectionDialogVisible.value = true
}
</script>

<style scoped lang="scss">
.intake-page {
  flex: 1 1 auto;
  position: relative;
  height: calc(100vh - 40px);
  min-height: 0;
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
  height: 100%;
  min-height: 0;
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
  font-size: 19px;
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
  font-size: clamp(33px, 3.8vw, 43px);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0.02em;
}

.header-copy p {
  margin: 14px 0 0;
  color: #617283;
  font-size: 20px;
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
  font-size: 17px;
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
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
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
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: 0 20px 38px rgba(75, 121, 238, 0.24);
}

.form-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 20px 20px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.76);
  box-shadow: 0 24px 54px rgba(53, 88, 129, 0.14);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.panel-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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
  font-size: 23px;
  font-weight: 800;
}

.patient-record-id {
  min-width: 0;
  max-width: 100%;
  margin-left: auto;
  padding: 7px 12px;
  color: #4b79ee;
  display: inline-flex;
  align-items: center;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
}

.patient-record-id span {
  flex: none;
}

.patient-record-id strong {
  min-width: 0;
  color: #4b79ee;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
}

.four-fullscreen-btn {
  width: 36px;
  height: 36px;
  margin-left: auto;
  border: 0;
  border-radius: 10px;
  background: rgba(237, 244, 255, 0.96);
  color: #4b79ee;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.four-fullscreen-btn:hover {
  transform: translateY(-1px);
  background: rgba(222, 235, 255, 0.98);
}

.form-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 14px;
  padding: 0 6px 4px 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.form-grid::-webkit-scrollbar {
  width: 6px;
}

.form-grid::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(104, 132, 166, 0.28);
}

.form-grid::-webkit-scrollbar-track {
  background: transparent;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.placeholder-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.placeholder-body {
  flex: 1;
  min-height: 0;
  border: 1px solid #dbe8f4;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.four-apparatus-pdf {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: 0;
  border-radius: 14px;
  background: #ffffff;
}

.four-diagnosis-empty {
  width: 100%;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8294aa;
}

.four-empty-icon {
  color: #d4dae2;
  font-size: 72px;
  line-height: 1;
}

.four-diagnosis-empty h4 {
  margin: 26px 0 0;
  color: #71849a;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
}

.four-diagnosis-empty p {
  margin: 22px 0 0;
  color: #9aabba;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
}

.fetch-four-btn {
  min-width: 210px;
  height: 54px;
  margin-top: 42px;
  border: 0;
  border-radius: 12px;
  background: #2f66ee;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(47, 102, 238, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.fetch-four-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(47, 102, 238, 0.26);
}

.fetch-four-btn:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.basic-info-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.08);
}

.basic-info-dialog {
  width: min(548px, 100%);
  min-height: 350px;
  border-radius: 22px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px 42px;
  box-shadow: 0 24px 70px rgba(54, 78, 108, 0.16);
}

.basic-info-dialog-icon {
  width: 76px;
  height: 76px;
  border: 4px solid #ff9130;
  border-radius: 50%;
  color: #ff9b1f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  font-weight: 800;
  line-height: 1;
}

.basic-info-dialog h3 {
  margin: 28px 0 0;
  color: #1d2a3d;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.3;
}

.basic-info-dialog button {
  min-width: 170px;
  height: 66px;
  margin-top: 52px;
  border: 0;
  border-radius: 14px;
  background: #2f66ee;
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(47, 102, 238, 0.2);
}

.four-collection-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.08);
}

.four-collection-dialog {
  width: min(548px, 100%);
  min-height: 350px;
  border-radius: 22px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px 42px;
  box-shadow: 0 24px 70px rgba(54, 78, 108, 0.16);
}

.four-collection-icon {
  width: 76px;
  height: 76px;
  border: 4px solid #ff9130;
  border-radius: 50%;
  color: #ff9b1f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  font-weight: 800;
  line-height: 1;
}

.four-collection-dialog h3 {
  margin: 28px 0 0;
  color: #1d2a3d;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.28;
  text-align: center;
}

.four-collection-dialog p {
  margin: 28px 0 0;
  color: #98a8bc;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  text-align: center;
}

.four-collection-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 36px;
}

.four-collection-actions button {
  height: 58px;
  border-radius: 14px;
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.four-collection-actions button:hover {
  transform: translateY(-1px);
}

.four-collection-secondary {
  border: 1px solid #dce5ef;
  background: #f8fafc;
  color: #617083;
}

.four-collection-primary {
  border: 1px solid #2f66ee;
  background: #2f66ee;
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(47, 102, 238, 0.22);
}

.pdf-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(15, 23, 42, 0.36);
}

.pdf-preview-dialog {
  width: min(1180px, 100%);
  height: min(820px, 92vh);
  min-height: 420px;
  border-radius: 18px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
}

.pdf-preview-header {
  flex: none;
  height: 58px;
  padding: 0 14px 0 22px;
  border-bottom: 1px solid #e4edf7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.pdf-preview-header h3 {
  min-width: 0;
  margin: 0;
  color: #172033;
  font-size: 20px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pdf-preview-header button {
  flex: none;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #71849a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  cursor: pointer;
}

.pdf-preview-header button:hover {
  background: #eef4fb;
  color: #2f66ee;
}

.pdf-preview-frame {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #ffffff;
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
  font-size: 19px;
  font-weight: 600;
}

.field-label i {
  margin-left: 4px;
  color: #ff5a58;
  font-style: normal;
}

.field input:not([type='radio']),
.field textarea {
  width: 100%;
  border: 1px solid #dde6ef;
  outline: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  color: #25364a;
  font-size: 19px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:not([type='radio']) {
  height: 44px;
  padding: 0 14px;
}

.field textarea {
  min-height: 90px;
  padding: 12px 14px;
  resize: vertical;
}

.field input:not([type='radio']):focus,
.field textarea:focus {
  border-color: #4b79ee;
  box-shadow: 0 0 0 4px rgba(75, 121, 238, 0.12);
}

.field input:not([type='radio'])::placeholder,
.field textarea::placeholder {
  color: #a5b2c1;
}

.field :deep(.field-date-picker.el-date-editor) {
  width: 100%;
}

.field :deep(.field-date-picker .el-input__wrapper) {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: inset 0 0 0 1px #dde6ef;
  transition: box-shadow 0.2s ease;
}

.field :deep(.field-date-picker .el-input__inner) {
  color: #25364a;
  font-size: 19px;
}

.field :deep(.field-date-picker .el-input__inner::placeholder) {
  color: #a5b2c1;
}

.field :deep(.field-date-picker.is-focus .el-input__wrapper),
.field :deep(.field-date-picker .el-input__wrapper:hover) {
  box-shadow:
    inset 0 0 0 1px #4b79ee,
    0 0 0 4px rgba(75, 121, 238, 0.12);
}

.gender-group,
.radio-group {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px 18px;
  padding: 0 2px;
  flex-wrap: wrap;
}

.radio-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: center;
  align-items: center;
  column-gap: 12px;
  row-gap: 8px;
}

.gender-option,
.radio-option {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  color: #233244;
  font-size: 19px;
  cursor: pointer;
}

.radio-option {
  gap: 8px;
}

.radio-option span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gender-option input,
.radio-option input {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
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

  .placeholder-body {
    min-height: 0;
    padding: 24px 18px;
    gap: 14px;
  }

  .four-collection-dialog {
    min-height: 350px;
    padding: 36px 22px 38px;
  }

  .four-collection-icon {
    width: 76px;
    height: 76px;
    font-size: 50px;
  }

  .four-collection-dialog h3 {
    margin-top: 28px;
    font-size: 28px;
  }

  .four-collection-dialog p {
    margin-top: 24px;
    font-size: 18px;
  }

  .four-collection-actions {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 30px;
  }

  .four-collection-actions button {
    height: 54px;
    font-size: 20px;
  }
}
</style>
