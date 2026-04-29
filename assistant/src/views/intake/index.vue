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
            </div>

            <div class="placeholder-body">
              <img class="diagnosis-image diagnosis-image-zhu" :src="zhuImage" alt="" />
              <div class="diagnosis-table-wrap">
                <table class="diagnosis-table">
                  <tbody>
                    <tr>
                      <th class="table-title" colspan="6">舌象诊断结果</th>
                    </tr>
                    <tr>
                      <th>舌色</th>
                      <td>淡白色</td>
                      <th>舌形</th>
                      <td>点次舌，齿痕舌</td>
                      <th>舌态</th>
                      <td>正常</td>
                    </tr>
                    <tr>
                      <th>苔色</th>
                      <td>黄白相间苔</td>
                      <th>苔质</th>
                      <td>厚苔</td>
                      <th>舌下络脉</th>
                      <td>正常</td>
                    </tr>
                  </tbody>
                </table>

                <table class="diagnosis-table">
                  <tbody>
                    <tr>
                      <th class="table-title" colspan="4">面相诊断结果</th>
                    </tr>
                    <tr>
                      <th>面色</th>
                      <td>面色淡黄</td>
                      <th>面部光泽</th>
                      <td>少量光泽</td>
                    </tr>
                    <tr>
                      <th>唇色</th>
                      <td>青紫</td>
                      <th>局部特征</th>
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>

                <table class="diagnosis-table">
                  <tbody>
                    <tr>
                      <th class="table-title" colspan="3">脉象诊断结果</th>
                    </tr>
                    <tr>
                      <th></th>
                      <td>左手</td>
                      <td>右手</td>
                    </tr>
                    <tr>
                      <th>寸</th>
                      <td>虚</td>
                      <td>缓</td>
                    </tr>
                    <tr>
                      <th>关</th>
                      <td>缓</td>
                      <td>虚</td>
                    </tr>
                    <tr>
                      <th>尺</th>
                      <td>虚</td>
                      <td>虚</td>
                    </tr>
                  </tbody>
                </table>
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
  </app-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Document, Tickets } from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'
import { listDictData } from '@/api/dict'
import { getPatientDetail, savePatient } from '@/api/patient'
import type { DictDataVO, PatientSaveParams } from '@/api/types'
import { usePatientSessionStore } from '@/stores/patient-session'
import zhuImage from '@/assets/zhu.png'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sessionStore = usePatientSessionStore()

interface IntakePatientData {
  patientId?: string | number
  patientNumber?: string
  caseId?: string | number
  patientIdCard?: string
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

const maritalStatusOptions = computed(() => {
  if (maritalStatusDict.value.length > 0) {
    return maritalStatusDict.value
  }

  return [
    { dictLabel: t('assistant.intake.maritalStatusOptions.unmarried'), dictValue: '0' },
    { dictLabel: t('assistant.intake.maritalStatusOptions.married'), dictValue: '1' }
  ]
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
      sessionStore.setCaseId(caseId.value)
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
  void loadMaritalStatusDict()
})

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
  font-size: 16px;
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
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96) 0%, rgba(240, 246, 253, 0.92) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 18px;
  padding: 22px;
  overflow: auto;
  overscroll-behavior: contain;
}

.diagnosis-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.diagnosis-image-zhu {
  max-height: 230px;
}

.diagnosis-table-wrap {
  width: 100%;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.diagnosis-table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  table-layout: fixed;
  background: rgba(255, 255, 255, 0.92);
  color: #111827;
  font-size: 12px;
  line-height: 1.45;
}

.diagnosis-table th,
.diagnosis-table td {
  height: 34px;
  padding: 6px 8px;
  border: 1px solid #e5e9f0;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.diagnosis-table th {
  background: #f0f2ff;
  font-weight: 700;
}

.diagnosis-table td {
  background: rgba(255, 255, 255, 0.96);
}

.diagnosis-table .table-title {
  height: 36px;
  background: #f5f5f5;
  font-size: 13px;
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
  font-size: 14px;
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
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 2px;
  flex-wrap: wrap;
}

.gender-option,
.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  color: #233244;
  font-size: 14px;
  cursor: pointer;
}

.radio-option {
  gap: 6px;
}

.radio-option span {
  min-width: 2em;
}

.gender-option input,
.radio-option input {
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
}
</style>
