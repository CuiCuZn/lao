<template>
  <app-page plain>
    <section class="case-result-page">
      <div v-if="pageError" class="case-result-state">
        <el-result icon="warning" :title="t('assistant.caseResult.pageTitle')" :sub-title="pageError">
          <template #extra>
            <el-button type="primary" @click="goBack">{{ backButtonText }}</el-button>
          </template>
        </el-result>
      </div>

      <div v-else class="case-result-layout">
        <header class="page-header">
          <el-button class="back-button" text @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>{{ backButtonText }}</span>
          </el-button>

          <div class="page-hero">
            <h1>{{ t('assistant.caseResult.pageTitle') }}</h1>
          </div>
        </header>

        <section v-loading="loading" class="page-content">
          <article v-if="!isFromRecords" class="hero-card">
            <div class="hero-check">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <h2>{{ t('assistant.caseResult.completedTitle') }}</h2>
            <p>{{ t('assistant.caseResult.completedDescription') }}</p>

            <div class="hero-meta">
              <span v-for="item in heroMetaItems" :key="item.label" class="hero-chip">
                <el-icon><component :is="item.icon" /></el-icon>
                <strong>{{ item.label }}</strong>
                <span>{{ item.value }}</span>
              </span>
            </div>
          </article>

          <section class="info-card">
            <header class="section-title">
              <el-icon><UserFilled /></el-icon>
              <span>{{ t('assistant.caseResult.patientInfo') }}</span>
            </header>

            <div class="detail-grid detail-grid--four">
              <div v-for="item in patientInfoItems" :key="item.label" class="detail-item">
                <span class="detail-label">{{ item.label }}</span>
                <strong class="detail-value">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <section class="info-card">
            <header class="section-title">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ t('assistant.caseResult.consultationInfo') }}</span>
            </header>

            <div class="detail-grid detail-grid--four">
              <div v-for="item in consultationInfoItems" :key="item.label" class="detail-item">
                <span class="detail-label">{{ item.label }}</span>
                <strong class="detail-value">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <section class="info-card">
            <header class="section-title">
              <el-icon><Document /></el-icon>
              <span>{{ t('assistant.caseResult.recordInfo') }}</span>
            </header>

            <div class="narrative-list">
              <article v-for="item in recordNarratives" :key="item.label" class="narrative-item">
                <h3>{{ item.label }}</h3>
                <p>{{ item.value }}</p>
              </article>
            </div>
          </section>

          <section class="info-card">
            <header class="section-title">
              <el-icon><DataBoard /></el-icon>
              <span>{{ t('assistant.caseResult.diagnosisData') }}</span>
            </header>

            <div class="four-diagnosis-result">
              <iframe
                v-if="fourApparatusUrl"
                class="four-diagnosis-pdf"
                :src="fourApparatusUrl"
                :title="t('assistant.caseResult.diagnosisData')"
              ></iframe>

              <div v-else class="four-diagnosis-empty">
                <el-icon class="four-diagnosis-empty-icon"><first-aid-kit /></el-icon>
                <h3>{{ t('assistant.caseResult.noDiagnosisDataTitle') }}</h3>
                <p>{{ t('assistant.caseResult.noDiagnosisDataDescription') }}</p>
              </div>
            </div>
          </section>

          <section class="info-card">
            <header class="section-title">
              <el-icon><Tickets /></el-icon>
              <span>{{ t('assistant.caseResult.diagnosisPlan') }}</span>
            </header>

            <div class="plan-grid">
              <div v-for="item in diagnosisPlanItems" :key="item.label" class="plan-item">
                <span class="detail-label">{{ item.label }}</span>
                <div class="plan-value">{{ item.value }}</div>
              </div>
            </div>

            <section class="prescription-section">
              <div v-if="prescriptionTextItems.length" class="prescription-text-list">
                <div v-for="item in prescriptionTextItems" :key="item.label" class="plan-item">
                  <span class="detail-label">{{ item.label }}</span>
                  <div class="plan-value">{{ item.value }}</div>
                </div>
              </div>

              <table v-if="prescriptionDetailRows.length" class="result-table result-table--prescription prescription-detail-table">
                <thead>
                  <tr>
                    <th>{{ t('assistant.caseResult.drugName') }}</th>
                    <th>{{ t('assistant.caseResult.dosage') }}</th>
                    <th>{{ t('assistant.caseResult.unit') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in prescriptionDetailRows" :key="`${row.name}-${row.dosage}-${row.unit}-${index}`">
                    <td>{{ row.name }}</td>
                    <td>{{ row.dosage }}</td>
                    <td>{{ row.unit }}</td>
                  </tr>
                </tbody>
              </table>

              <div v-if="!prescriptionTextItems.length && !prescriptionDetailRows.length" class="empty-block empty-block--compact">
                {{ t('assistant.caseResult.noPrescription') }}
              </div>
            </section>
          </section>
        </section>

      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Calendar,
  CircleCheckFilled,
  DataBoard,
  Document,
  FirstAidKit,
  OfficeBuilding,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'
import { listDictData } from '@/api/dict'
import { getCaseDetail, getCaseDrugDetail } from '@/api/record'
import type { CaseDrugDetailData, DictDataVO } from '@/api/types'
import { formatSexByDict, loadSexDict } from '@/utils/sex-dict'

type DetailRecord = Record<string, unknown>

interface DetailItem {
  label: string
  value: string
}

interface PrescriptionRow {
  name: string
  dosage: string
  unit: string
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const PRESCRIPTION_CATEGORY_DICT_TYPE = 'drug_type'
const PRESCRIPTION_MODEL_DICT_TYPE = 'drug_model'
const PRESCRIPTION_UNIT_DICT_TYPE = 'drug_detail_unit'

const loading = ref(false)
const pageError = ref('')
const detail = ref<DetailRecord | null>(null)
const prescriptionDetail = ref<CaseDrugDetailData | null>(null)
const prescriptionCategoryOptions = ref<DictDataVO[]>([])
const prescriptionModelOptions = ref<DictDataVO[]>([])
const prescriptionUnitOptions = ref<DictDataVO[]>([])

const isFromRecords = computed(() => {
  const queryFrom = route.query.from
  if (Array.isArray(queryFrom)) {
    return queryFrom[0] === 'records'
  }

  return queryFrom === 'records'
})

const backButtonText = computed(() => {
  return isFromRecords.value
    ? t('assistant.caseResult.backToRecords')
    : t('assistant.caseResult.backToHome')
})

const caseId = computed(() => {
  const queryCaseId = route.query.caseId
  if (Array.isArray(queryCaseId)) {
    return typeof queryCaseId[0] === 'string' ? queryCaseId[0].trim() : ''
  }

  return typeof queryCaseId === 'string' ? queryCaseId.trim() : ''
})

const isRecord = (value: unknown): value is DetailRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value).trim()
  return text || ''
}

const normalizeDictListPayload = (response: { rows?: DictDataVO[] | null; data?: DictDataVO[] | null }) => {
  return response.rows || response.data || []
}

const findDictOption = (options: DictDataVO[], value: unknown) => {
  const text = takeOptionalText(value)
  if (!text) {
    return null
  }

  const exactValueMatched = options.find((item) => takeOptionalText(item.dictValue) === text)
  if (exactValueMatched) {
    return exactValueMatched
  }

  const normalizedText = text.toLowerCase()
  const normalizedValueMatched = options.find((item) => takeOptionalText(item.dictValue).toLowerCase() === normalizedText)
  if (normalizedValueMatched) {
    return normalizedValueMatched
  }

  const exactLabelMatched = options.find((item) => takeOptionalText(item.dictLabel) === text)
  if (exactLabelMatched) {
    return exactLabelMatched
  }

  return options.find((item) => takeOptionalText(item.dictLabel).toLowerCase() === normalizedText) || null
}

const formatDictLabel = (options: DictDataVO[], value: unknown) => {
  const text = takeOptionalText(value)
  if (!text) {
    return ''
  }

  return findDictOption(options, value)?.dictLabel || text
}

const loadPrescriptionDictionaries = async () => {
  try {
    const [categoryResponse, modelResponse, unitResponse] = await Promise.all([
      listDictData({ dictType: PRESCRIPTION_CATEGORY_DICT_TYPE }),
      listDictData({ dictType: PRESCRIPTION_MODEL_DICT_TYPE }),
      listDictData({ dictType: PRESCRIPTION_UNIT_DICT_TYPE })
    ])

    prescriptionCategoryOptions.value = normalizeDictListPayload(categoryResponse)
    prescriptionModelOptions.value = normalizeDictListPayload(modelResponse)
    prescriptionUnitOptions.value = normalizeDictListPayload(unitResponse)
  } catch (error) {
    console.warn('Failed to load assistant case prescription dictionaries.', error)
    prescriptionCategoryOptions.value = []
    prescriptionModelOptions.value = []
    prescriptionUnitOptions.value = []
  }
}

const formatDate = (value: unknown) => {
  const text = takeOptionalText(value)
  if (!text) {
    return t('assistant.caseResult.notAvailable')
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    return text
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDuration = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    const totalSeconds = Math.floor(value)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return t('assistant.caseResult.durationMinuteSecond', { minutes, seconds })
  }

  const text = takeOptionalText(value)
  return text || t('assistant.caseResult.notAvailable')
}

const formatGender = (value: unknown) => {
  return formatSexByDict(value)
}

const formatMarriage = (value: unknown) => {
  const text = takeOptionalText(value).toLowerCase()

  if (text === '0') {
    return t('assistant.caseResult.unmarried')
  }

  if (text === '1') {
    return t('assistant.caseResult.married')
  }

  return takeOptionalText(value)
}

const getCandidateRecords = () => {
  if (!detail.value) {
    return []
  }

  const source = detail.value
  const candidates: DetailRecord[] = [source]
  const nestedKeys = [
    'patient',
    'patientInfo',
    'consultation',
    'consultationInfo',
    'caseInfo',
    'caseDetail',
    'diagnosis',
    'diagnosisInfo',
    'result',
    'detail',
    'record',
    'summary',
    'fourDiagnosis',
    'fourDiagnosisResult',
    'constitutionResult',
    'tongueResult',
    'faceResult',
    'pulseResult',
    'prescription'
  ]

  nestedKeys.forEach((key) => {
    const nextValue = source[key]
    if (isRecord(nextValue)) {
      candidates.push(nextValue)
    }
  })

  return candidates
}

const pickText = (keys: string[], fallback = '') => {
  const records = getCandidateRecords()

  for (const record of records) {
    for (const key of keys) {
      const value = takeOptionalText(record[key])
      if (value) {
        return value
      }
    }
  }

  return fallback
}

const pickValue = (keys: string[]) => {
  const records = getCandidateRecords()

  for (const record of records) {
    for (const key of keys) {
      const value = record[key]
      if (takeOptionalText(value)) {
        return value
      }
    }
  }

  return undefined
}

const parseVideoTime = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10000000000 ? value * 1000 : value
  }

  const text = takeOptionalText(value)
  if (!text) {
    return Number.NaN
  }

  const numericValue = Number(text)
  if (Number.isFinite(numericValue)) {
    return numericValue < 10000000000 ? numericValue * 1000 : numericValue
  }

  return Date.parse(text)
}

const formatCallDuration = () => {
  const startTime = parseVideoTime(pickValue(['videoStartTime']))
  const endTime = parseVideoTime(pickValue(['videoEndTime']))

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return t('assistant.caseResult.notAvailable')
  }

  return formatDuration((endTime - startTime) / 1000)
}

const resolveDisplayText = (value: string) => {
  return value || t('assistant.caseResult.notAvailable')
}

const fourApparatusUrl = computed(() => pickText(['fourApparatusUrl']))

const resolvePatientId = () => {
  return pickText(['caseId', 'caseID', 'medicalCaseId']) || caseId.value
}

const heroMetaItems = computed(() => [
  {
    icon: Calendar,
    label: t('assistant.caseResult.visitDate'),
    value: formatDate(pickText(['visitTime', 'visitDate', 'createTime', 'registerTime', 'updateTime']))
  },
  {
    icon: Document,
    label: t('assistant.caseResult.visitId'),
    value: resolveDisplayText(resolvePatientId())
  }
])

const patientInfoItems = computed<DetailItem[]>(() => [
  {
    label: t('assistant.caseResult.name'),
    value: resolveDisplayText(pickText(['patientName', 'name']))
  },
  (() => {
    const ageText = pickText(['patientAge', 'age'])
    const genderText = formatGender(pickText(['patientSex', 'sex', 'gender']))

    return {
      label: t('assistant.caseResult.ageGender'),
      value: resolveDisplayText(
        [ageText ? `${ageText}${t('assistant.caseResult.ageSuffix')}` : '', genderText]
          .filter(Boolean)
          .join('/')
      )
    }
  })(),
  {
    label: t('assistant.caseResult.marriage'),
    value: resolveDisplayText(formatMarriage(pickText(['marriage', 'maritalStatus'])))
  },
  {
    label: t('assistant.caseResult.patientId'),
    value: resolveDisplayText(resolvePatientId())
  },
  {
    label: t('assistant.caseResult.idCard'),
    value: resolveDisplayText(pickText(['patientIdCard', 'idCard', 'identityCard']))
  },
  {
    label: t('assistant.caseResult.phone'),
    value: resolveDisplayText(pickText(['patientPhone', 'phone', 'mobile']))
  },
  {
    label: t('assistant.caseResult.occupation'),
    value: resolveDisplayText(pickText(['occupation', 'job']))
  }
])

const consultationInfoItems = computed<DetailItem[]>(() => [
  {
    label: t('assistant.caseResult.visitDate'),
    value: formatDate(pickText(['visitTime', 'visitDate', 'createTime', 'registerTime', 'updateTime']))
  },
  {
    label: t('assistant.caseResult.department'),
    value: resolveDisplayText(pickText(['departmentName', 'deptName']))
  },
  {
    label: t('assistant.caseResult.doctor'),
    value: resolveDisplayText(pickText(['doctorName', 'nickName', 'userName']))
  },
  {
    label: t('assistant.caseResult.callDuration'),
    value: formatCallDuration()
  }
])

const recordNarratives = computed<DetailItem[]>(() => [
  {
    label: t('assistant.caseResult.chiefComplaint'),
    value: resolveDisplayText(pickText(['mainSuitCn', 'mainSuit', 'chiefComplaint']))
  },
  {
    label: t('assistant.caseResult.currentHistory'),
    value: resolveDisplayText(pickText(['historyIllnessCn', 'historyIllness', 'currentHistory']))
  },
  {
    label: t('assistant.caseResult.pastHistory'),
    value: resolveDisplayText(pickText(['previousHistoryCn', 'previousHistory', 'pastHistory']))
  },
  {
    label: t('assistant.caseResult.allergyHistory'),
    value: resolveDisplayText(pickText(['allergichistoryCn', 'allergichistory', 'allergyHistory']))
  },
  {
    label: t('assistant.caseResult.familyHistory'),
    value: resolveDisplayText(pickText(['familyhistoryCn', 'familyhistory', 'familyHistory']))
  }
])

const diagnosisPlanItems = computed<DetailItem[]>(() => [
  {
    label: t('assistant.caseResult.diseaseName'),
    value: resolveDisplayText(pickText(['diseaseNameCn', 'diseaseName']))
  },
  {
    label: t('assistant.caseResult.syndromeType'),
    value: resolveDisplayText(pickText(['syndromeTypeCn', 'syndromeType']))
  },
  {
    label: t('assistant.caseResult.therapy'),
    value: resolveDisplayText(pickText(['therapyCn', 'therapy']))
  },
  {
    label: t('assistant.caseResult.advice'),
    value: resolveDisplayText(pickText(['adviceCn', 'advice', 'medicalAdvice']))
  }
])

const prescriptionTextItems = computed<DetailItem[]>(() => {
  const prescription = prescriptionDetail.value
  if (!prescription) {
    return []
  }

  return [
    {
      label: t('assistant.caseResult.prescriptionDrugModel'),
      value: formatDictLabel(prescriptionModelOptions.value, prescription.drugModel)
    },
    {
      label: t('assistant.caseResult.prescriptionDrugType'),
      value: formatDictLabel(prescriptionCategoryOptions.value, prescription.drugType)
    },
    {
      label: t('assistant.caseResult.prescriptionDrugUsage'),
      value: takeOptionalText(prescription.drugUsage)
    },
    {
      label: t('assistant.caseResult.prescriptionDrugEffect'),
      value: takeOptionalText(prescription.drugEffect)
    },
    {
      label: t('assistant.caseResult.prescriptionDrugCure'),
      value: takeOptionalText(prescription.drugCure)
    },
    {
      label: t('assistant.caseResult.prescriptionDrugAttention'),
      value: takeOptionalText(prescription.drugAttention)
    }
  ]
    .filter((item) => item.value)
    .map((item) => ({
      ...item,
      value: resolveDisplayText(item.value)
    }))
})

const prescriptionDetailRows = computed<PrescriptionRow[]>(() => {
  return (prescriptionDetail.value?.detailList || [])
    .map((item) => {
      const name = takeOptionalText(item.drugDetailName)
      const unit = formatDictLabel(prescriptionUnitOptions.value, item.drugDetailUnit)
      const dosage = takeOptionalText(item.drugDetailShare)

      if (!name && !dosage && !unit) {
        return null
      }

      return {
        name: name || t('assistant.caseResult.notAvailable'),
        dosage: dosage || t('assistant.caseResult.notAvailable'),
        unit: unit || t('assistant.caseResult.notAvailable')
      }
    })
    .filter((item): item is PrescriptionRow => Boolean(item))
})

const goBack = () => {
  router.push(isFromRecords.value ? '/assistant/records' : '/assistant/workbench')
}

let resultPageUrl = ''

const pushResultPageHistoryState = () => {
  resultPageUrl = window.location.href
  history.pushState(null, '', resultPageUrl)
}

const handleResultPagePopState = () => {
  history.pushState(null, '', resultPageUrl || location.href)
  // alert('当前页面不允许返回')
}

const fetchDetail = async () => {
  if (!caseId.value) {
    pageError.value = t('assistant.caseResult.missingCaseId')
    return
  }

  loading.value = true
  pageError.value = ''
  prescriptionDetail.value = null

  try {
    const [detailResult, prescriptionResult] = await Promise.allSettled([
      getCaseDetail(caseId.value),
      getCaseDrugDetail(caseId.value)
    ])

    if (detailResult.status === 'rejected') {
      throw detailResult.reason
    }

    const response = detailResult.value
    detail.value = isRecord(response?.data) ? response.data : {}

    if (prescriptionResult.status === 'fulfilled') {
      prescriptionDetail.value = prescriptionResult.value?.data || null
    } else {
      console.warn('Failed to load assistant case prescription detail.', prescriptionResult.reason)
    }
  } catch (error) {
    console.warn('Failed to load assistant case result detail.', error)
    pageError.value = t('assistant.caseResult.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSexDict()
  void loadPrescriptionDictionaries()
  void fetchDetail()

  if (!isFromRecords.value) {
    pushResultPageHistoryState()
    window.addEventListener('popstate', handleResultPagePopState)
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', handleResultPagePopState)
})
</script>

<style scoped lang="scss">
.case-result-page {
  min-height: 100%;
  --case-result-content-width: 1280px;
}

.case-result-layout {
  min-height: 100%;
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-header {
  position: relative;
  min-height: 86px;
}

.back-button {
  position: absolute;
  top: 0;
  left: 0;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dbe5f3;
  color: #2d3748;
  box-shadow: 0 10px 24px rgba(109, 133, 177, 0.08);
}

.back-button:hover {
  background: #ffffff;
  color: #165dff;
}

.page-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.page-hero h1 {
  margin: 0;
  color: #18263e;
  font-size: clamp(29px, 3vw, 39px);
  font-weight: 800;
}

.page-hero p {
  margin: 0;
  color: #6d7c95;
  font-size: 19px;
  font-weight: 600;
}

.page-content {
  width: 50%;
  max-width: var(--case-result-content-width);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-card,
.info-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 18px 38px rgba(86, 111, 158, 0.08);
}

.hero-card {
  padding: 34px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.hero-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #2daa72;
  color: #ffffff;
  font-size: 47px;
}

.hero-card h2 {
  margin: 0;
  color: #131d30;
  font-size: clamp(37px, 4vw, 53px);
  font-weight: 800;
}

.hero-card p {
  margin: 0;
  color: #6f7b8f;
  font-size: 20px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #f2f4f8;
  color: #5e6c83;
  font-size: 19px;
}

.hero-chip strong {
  color: #4c596f;
  font-weight: 700;
}

.hero-chip span:last-child {
  color: #333f56;
  font-weight: 700;
}

.info-card {
  padding: 20px 22px 22px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  color: #10213d;
  font-size: 23px;
  font-weight: 800;
}

.section-title .el-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1f6fff 0%, #1759d5 100%);
  color: #ffffff;
  font-size: 23px;
}

.detail-grid {
  display: grid;
  gap: 18px 24px;
}

.detail-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.detail-item {
  min-width: 0;
}

.detail-label {
  display: block;
  margin-bottom: 10px;
  color: #737f93;
  font-size: 19px;
}

.detail-value {
  color: #18243c;
  font-size: 23px;
  font-weight: 700;
  line-height: 1.6;
  word-break: break-all;
}

.narrative-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.narrative-item h3 {
  margin: 0 0 8px;
  color: #3d4f69;
  font-size: 21px;
  font-weight: 700;
}

.narrative-item p {
  margin: 0;
  color: #273551;
  font-size: 20px;
  line-height: 1.9;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.result-table th,
.result-table td {
  padding: 16px 14px;
  border: 1px solid #e6ebf3;
  text-align: center;
  font-size: 20px;
}

.result-table th {
  background: #f4f6ff;
  color: #1f2b44;
  font-weight: 800;
}

.result-table td {
  color: #2a3752;
  background: #ffffff;
}

.four-diagnosis-result {
  min-height: 340px;
  border-radius: 14px;
  background: #f6f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.four-diagnosis-pdf {
  width: 100%;
  height: 560px;
  min-height: 340px;
  border: 0;
  background: #ffffff;
}

.four-diagnosis-empty {
  min-height: 300px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 38px 24px;
}

.four-diagnosis-empty-icon {
  color: #d4dae2;
  font-size: 80px;
  line-height: 1;
}

.four-diagnosis-empty h3 {
  margin: 54px 0 0;
  color: #6d7d91;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.3;
}

.four-diagnosis-empty p {
  margin: 22px 0 0;
  color: #9aabba;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.plan-item {
  min-width: 0;
}

.plan-value {
  box-sizing: border-box;
  min-height: 56px;
  max-height: calc(3.6em + 30px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fbfcff;
  border: 1px solid #e5ebf5;
  color: #23324f;
  font-size: 20px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.prescription-section {
  margin-top: 18px;
}

.prescription-text-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
  margin-top: 0;
}

.prescription-detail-table {
  margin-top: 12px;
  border: 1px solid #e6ebf3;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 14px;
  overflow: hidden;
}

.result-table--prescription th {
  background: #f0f2f6;
}

.prescription-detail-table th,
.prescription-detail-table td {
  border-width: 0 1px 1px 0;
}

.prescription-detail-table th:last-child,
.prescription-detail-table td:last-child {
  border-right: 0;
}

.prescription-detail-table tbody tr:last-child td {
  border-bottom: 0;
}

.result-table--prescription td:nth-child(2) {
  text-align: center;
}

.empty-block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border-radius: 14px;
  border: 1px dashed #d7e1f0;
  background: #fbfcff;
  color: #8490a5;
  font-size: 19px;
  text-align: center;
}

.empty-block--compact {
  min-height: 88px;
  margin-top: 12px;
}

.case-result-state {
  min-height: calc(100vh - 54px);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .detail-grid--four,
  .plan-grid,
  .prescription-text-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-header {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .back-button {
    position: static;
    align-self: flex-start;
  }

  .hero-card h2 {
    font-size: 35px;
  }

  .prescription-text-list {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 720px) {
  .case-result-layout {
    padding: 12px 10px 16px;
  }

  .hero-card,
  .info-card {
    border-radius: 14px;
  }

  .hero-card {
    padding: 28px 16px 20px;
  }

  .hero-meta {
    flex-direction: column;
    width: 100%;
  }

  .hero-chip {
    width: 100%;
    justify-content: center;
  }

  .detail-grid--four,
  .plan-grid {
    grid-template-columns: 1fr;
  }

  .four-diagnosis-result {
    min-height: 280px;
  }

  .four-diagnosis-pdf {
    height: 420px;
  }

  .four-diagnosis-empty {
    min-height: 260px;
    padding: 32px 16px;
  }

  .four-diagnosis-empty-icon {
    font-size: 66px;
  }

  .four-diagnosis-empty h3 {
    margin-top: 36px;
    font-size: 21px;
  }

  .four-diagnosis-empty p {
    font-size: 16px;
  }

  .result-table th,
  .result-table td {
    padding: 12px 10px;
    font-size: 18px;
  }
}
</style>
