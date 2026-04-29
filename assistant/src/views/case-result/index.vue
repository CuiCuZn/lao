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
            <p>{{ t('assistant.caseResult.pageSubtitle') }}</p>
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

            <div v-if="hasDiagnosisData" class="diagnosis-content">
              <section class="constitution-panel">
                <div class="bar-chart">
                  <div v-for="item in constitutionItems" :key="item.label" class="bar-column">
                    <span class="bar-value">{{ item.value }}</span>
                    <div class="bar-track">
                      <span class="bar-fill" :style="{ height: `${item.percent}%` }" />
                    </div>
                    <span class="bar-label">{{ item.label }}</span>
                  </div>
                </div>

                <div class="constitution-summary">{{ constitutionSummary }}</div>
              </section>

              <div class="result-table-stack">
                <section class="result-table-card">
                  <div class="result-table-card__title">{{ t('assistant.caseResult.tongueResult') }}</div>
                  <table class="result-table">
                    <tbody>
                      <tr v-for="row in tongueRows" :key="row.label">
                        <th>{{ row.label }}</th>
                        <td>{{ row.value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section class="result-table-card">
                  <div class="result-table-card__title">{{ t('assistant.caseResult.faceResult') }}</div>
                  <table class="result-table">
                    <tbody>
                      <tr v-for="row in faceRows" :key="row.label">
                        <th>{{ row.label }}</th>
                        <td>{{ row.value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section class="result-table-card">
                  <div class="result-table-card__title">{{ t('assistant.caseResult.pulseResult') }}</div>
                  <table class="result-table result-table--pulse">
                    <thead>
                      <tr>
                        <th></th>
                        <th>{{ t('assistant.caseResult.leftHand') }}</th>
                        <th>{{ t('assistant.caseResult.rightHand') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in pulseRows" :key="row.label">
                        <th>{{ row.label }}</th>
                        <td>{{ row.left }}</td>
                        <td>{{ row.right }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </div>
            </div>

            <div v-else class="empty-block">
              {{ t('assistant.caseResult.noDiagnosisData') }}
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
              <div class="result-table-card__title">{{ t('assistant.caseResult.prescription') }}</div>

              <table v-if="prescriptionRows.length" class="result-table result-table--prescription">
                <thead>
                  <tr>
                    <th>{{ t('assistant.caseResult.drugName') }}</th>
                    <th>{{ t('assistant.caseResult.dosage') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in prescriptionRows" :key="`${row.name}-${index}`">
                    <td>{{ row.name }}</td>
                    <td>{{ row.dosage }}</td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="empty-block empty-block--compact">
                {{ t('assistant.caseResult.noPrescription') }}
              </div>
            </section>
          </section>
        </section>

        <footer class="action-bar">
          <el-button plain class="action-button action-button--secondary" @click="handlePrint">
            <el-icon><Printer /></el-icon>
            <span>{{ t('assistant.caseResult.printPrescription') }}</span>
          </el-button>
          <el-button v-if="!isFromRecords" type="primary" class="action-button" @click="startNewVisit">
            <el-icon><Plus /></el-icon>
            <span>{{ t('assistant.caseResult.startNewVisit') }}</span>
          </el-button>
        </footer>
      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Calendar,
  CircleCheckFilled,
  DataBoard,
  Document,
  OfficeBuilding,
  Plus,
  Printer,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'
import { getCaseDetail } from '@/api/record'

type DetailRecord = Record<string, unknown>

interface DetailItem {
  label: string
  value: string
}

interface ChartItem {
  label: string
  value: number
  percent: number
}

interface PulseRow {
  label: string
  left: string
  right: string
}

interface PrescriptionRow {
  name: string
  dosage: string
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const pageError = ref('')
const detail = ref<DetailRecord | null>(null)

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

const takeOptionalNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
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
    return `${minutes}分${seconds}秒`
  }

  const text = takeOptionalText(value)
  return text || t('assistant.caseResult.notAvailable')
}

const formatGender = (value: unknown) => {
  const text = takeOptionalText(value).toLowerCase()

  if (text === '1' || text === '男' || text === 'male' || text === 'm') {
    return t('assistant.caseResult.male')
  }

  if (text === '0' || text === '女' || text === 'female' || text === 'f') {
    return t('assistant.caseResult.female')
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

const pickNumber = (keys: string[]) => {
  const records = getCandidateRecords()

  for (const record of records) {
    for (const key of keys) {
      const value = takeOptionalNumber(record[key])
      if (value > 0) {
        return value
      }
    }
  }

  return 0
}

const pickNestedRecord = (keys: string[]) => {
  const records = getCandidateRecords()

  for (const record of records) {
    for (const key of keys) {
      const value = record[key]
      if (isRecord(value)) {
        return value
      }
    }
  }

  return null
}

const resolveDisplayText = (value: string) => {
  return value || t('assistant.caseResult.notAvailable')
}

const resolvePatientId = () => {
  return pickText(['patientNumber', 'patientId', 'visitNo', 'medicalNo', 'caseNo']) || caseId.value
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
    value: resolveDisplayText(pickText(['marriage', 'maritalStatus']))
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

const constitutionItems = computed<ChartItem[]>(() => {
  const definitions = [
    { label: t('assistant.caseResult.balancedType'), keys: ['balancedScore', 'pingheScore', 'constitutionBalanced'] },
    { label: t('assistant.caseResult.qiDeficiencyType'), keys: ['qiDeficiencyScore', 'qixuScore'] },
    { label: t('assistant.caseResult.yangDeficiencyType'), keys: ['yangDeficiencyScore', 'yangxuScore'] },
    { label: t('assistant.caseResult.yinDeficiencyType'), keys: ['yinDeficiencyScore', 'yinxuScore'] },
    { label: t('assistant.caseResult.bloodStasisType'), keys: ['bloodStasisScore', 'xueyuScore'] }
  ]

  const rawValues = definitions.map((item) => ({
    label: item.label,
    value: pickNumber(item.keys)
  }))
  const maxValue = Math.max(...rawValues.map((item) => item.value), 100)

  return rawValues.map((item) => ({
    ...item,
    percent: item.value > 0 ? Math.max(10, Math.round((item.value / maxValue) * 100)) : 0
  }))
})

const constitutionSummary = computed(() => {
  return resolveDisplayText(
    pickText(['constitutionConclusion', 'constitutionResultText', 'constitutionSummary'], '')
  )
})

const tongueRows = computed<DetailItem[]>(() => {
  const source = pickNestedRecord(['tongueResult']) || {}

  return [
    {
      label: t('assistant.caseResult.tongueColor'),
      value: resolveDisplayText(
        takeOptionalText(source.tongueColor) || pickText(['tongueColor', 'sheSe', 'tongueBodyColor'])
      )
    },
    {
      label: t('assistant.caseResult.tongueShape'),
      value: resolveDisplayText(
        takeOptionalText(source.tongueShape) || pickText(['tongueShape', 'sheXing'])
      )
    },
    {
      label: t('assistant.caseResult.tongueCoatingColor'),
      value: resolveDisplayText(
        takeOptionalText(source.coatingColor) || pickText(['coatingColor', 'furColor', 'taiSe'])
      )
    },
    {
      label: t('assistant.caseResult.tongueCoatingQuality'),
      value: resolveDisplayText(
        takeOptionalText(source.coatingQuality) || pickText(['coatingQuality', 'furQuality', 'taiZhi'])
      )
    },
    {
      label: t('assistant.caseResult.sublingualVein'),
      value: resolveDisplayText(
        takeOptionalText(source.sublingualVein) || pickText(['sublingualVein', 'subLingualVein'])
      )
    }
  ]
})

const faceRows = computed<DetailItem[]>(() => {
  const source = pickNestedRecord(['faceResult']) || {}

  return [
    {
      label: t('assistant.caseResult.complexion'),
      value: resolveDisplayText(takeOptionalText(source.complexion) || pickText(['complexion', 'faceColor']))
    },
    {
      label: t('assistant.caseResult.faceLuster'),
      value: resolveDisplayText(takeOptionalText(source.faceLuster) || pickText(['faceLuster', 'luster']))
    },
    {
      label: t('assistant.caseResult.lipColor'),
      value: resolveDisplayText(takeOptionalText(source.lipColor) || pickText(['lipColor']))
    },
    {
      label: t('assistant.caseResult.localFeature'),
      value: resolveDisplayText(takeOptionalText(source.localFeature) || pickText(['localFeature', 'faceFeature']))
    }
  ]
})

const pulseRows = computed<PulseRow[]>(() => {
  const source = pickNestedRecord(['pulseResult']) || {}

  return [
    {
      label: t('assistant.caseResult.cun'),
      left: resolveDisplayText(
        takeOptionalText(source.leftCun) || pickText(['leftCun', 'pulseLeftCun'])
      ),
      right: resolveDisplayText(
        takeOptionalText(source.rightCun) || pickText(['rightCun', 'pulseRightCun'])
      )
    },
    {
      label: t('assistant.caseResult.guan'),
      left: resolveDisplayText(
        takeOptionalText(source.leftGuan) || pickText(['leftGuan', 'pulseLeftGuan'])
      ),
      right: resolveDisplayText(
        takeOptionalText(source.rightGuan) || pickText(['rightGuan', 'pulseRightGuan'])
      )
    },
    {
      label: t('assistant.caseResult.chi'),
      left: resolveDisplayText(
        takeOptionalText(source.leftChi) || pickText(['leftChi', 'pulseLeftChi'])
      ),
      right: resolveDisplayText(
        takeOptionalText(source.rightChi) || pickText(['rightChi', 'pulseRightChi'])
      )
    }
  ]
})

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

const prescriptionRows = computed<PrescriptionRow[]>(() => {
  if (!detail.value) {
    return []
  }

  const arrayKeys = ['prescriptionList', 'drugList', 'medicineList', 'medicines', 'prescriptionDrugs']

  for (const key of arrayKeys) {
    const value = detail.value[key]
    if (!Array.isArray(value)) {
      continue
    }

    const normalizedRows = value
      .map((item) => {
        if (!isRecord(item)) {
          return null
        }

        const name = takeOptionalText(
          item.drugName || item.name || item.medicineName || item.herbName || item.medicinalName
        )
        const dosageValue = takeOptionalText(item.dosage || item.amount || item.weight || item.useAmount)
        const unit = takeOptionalText(item.unit)
        const dosage = `${dosageValue}${unit}`.trim()

        if (!name && !dosage) {
          return null
        }

        return {
          name: name || t('assistant.caseResult.notAvailable'),
          dosage: dosage || t('assistant.caseResult.notAvailable')
        }
      })
      .filter((item): item is PrescriptionRow => Boolean(item))

    if (normalizedRows.length) {
      return normalizedRows
    }
  }

  const prescriptionText = pickText(['prescriptionCn', 'prescription', 'recipe'])
  if (!prescriptionText) {
    return []
  }

  return prescriptionText
    .split(/\r?\n|,|，|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      name: item,
      dosage: t('assistant.caseResult.notAvailable')
    }))
})

const hasDiagnosisData = computed(() => {
  if (constitutionItems.value.some((item) => item.value > 0)) {
    return true
  }

  if (constitutionSummary.value !== t('assistant.caseResult.notAvailable')) {
    return true
  }

  const rows = [...tongueRows.value, ...faceRows.value]
  if (rows.some((item) => item.value !== t('assistant.caseResult.notAvailable'))) {
    return true
  }

  return pulseRows.value.some(
    (item) =>
      item.left !== t('assistant.caseResult.notAvailable') || item.right !== t('assistant.caseResult.notAvailable')
  )
})

const goBack = () => {
  router.push(isFromRecords.value ? '/assistant/records' : '/assistant/workbench')
}

const startNewVisit = () => {
  router.push('/assistant/patient-identify')
}

const handlePrint = () => {
  window.print()
}

const fetchDetail = async () => {
  if (!caseId.value) {
    pageError.value = t('assistant.caseResult.missingCaseId')
    return
  }

  loading.value = true
  pageError.value = ''

  try {
    const response = await getCaseDetail(caseId.value)
    detail.value = isRecord(response?.data) ? response.data : {}
  } catch (error) {
    console.warn('Failed to load assistant case result detail.', error)
    pageError.value = t('assistant.caseResult.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchDetail()
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
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 800;
}

.page-hero p {
  margin: 0;
  color: #6d7c95;
  font-size: 14px;
  font-weight: 600;
}

.page-content {
  width: 100%;
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
  font-size: 42px;
}

.hero-card h2 {
  margin: 0;
  color: #131d30;
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 800;
}

.hero-card p {
  margin: 0;
  color: #6f7b8f;
  font-size: 15px;
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
  font-size: 14px;
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
  font-size: 18px;
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
  font-size: 18px;
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
  font-size: 14px;
}

.detail-value {
  color: #18243c;
  font-size: 18px;
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
  font-size: 16px;
  font-weight: 700;
}

.narrative-item p {
  margin: 0;
  color: #273551;
  font-size: 15px;
  line-height: 1.9;
}

.diagnosis-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.constitution-panel {
  padding: 14px 18px 20px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfcff 0%, #f4f8ff 100%);
  border: 1px solid #e8eef9;
}

.bar-chart {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  min-height: 260px;
  align-items: end;
}

.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.bar-value {
  color: #758299;
  font-size: 13px;
  font-weight: 700;
}

.bar-track {
  width: 52px;
  height: 180px;
  display: flex;
  align-items: flex-end;
  border-radius: 16px 16px 10px 10px;
  background: linear-gradient(180deg, #eef3fb 0%, #f7f9fd 100%);
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 16px 16px 10px 10px;
  background: linear-gradient(180deg, #2d7cff 0%, #1d58cf 100%);
  box-shadow: 0 10px 24px rgba(35, 95, 208, 0.22);
}

.bar-label {
  color: #35445f;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
}

.constitution-summary {
  width: fit-content;
  margin: 18px auto 0;
  padding: 10px 16px;
  border-radius: 12px;
  background: #fff1e7;
  color: #ef7c2f;
  font-size: 15px;
  font-weight: 700;
}

.result-table-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-table-card__title {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 16px;
  background: #f0f2f6;
  color: #1d2a44;
  font-size: 16px;
  font-weight: 800;
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
  font-size: 15px;
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

.result-table--pulse thead th {
  background: #f0f2f6;
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
  min-height: 56px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fbfcff;
  border: 1px solid #e5ebf5;
  color: #23324f;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.prescription-section {
  margin-top: 18px;
}

.result-table--prescription th {
  background: #f0f2f6;
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
  font-size: 14px;
  text-align: center;
}

.empty-block--compact {
  min-height: 88px;
  margin-top: 12px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 16px 16px 0 0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -14px 34px rgba(95, 118, 160, 0.12);
  backdrop-filter: blur(10px);
}

.action-button {
  min-width: 168px;
  height: 48px;
  border-radius: 14px;
  padding-inline: 20px;
  font-size: 15px;
  font-weight: 700;
}

.action-button--secondary {
  border-color: #d6e1f2;
  color: #40506a;
  background: #ffffff;
}

.case-result-state {
  min-height: calc(100vh - 54px);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .detail-grid--four,
  .plan-grid {
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
    font-size: 30px;
  }

  .bar-chart {
    min-height: 220px;
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

  .constitution-panel {
    padding-inline: 10px;
  }

  .bar-chart {
    gap: 8px;
  }

  .bar-track {
    width: 40px;
    height: 150px;
  }

  .action-bar {
    flex-direction: column;
    padding: 12px 10px calc(12px + env(safe-area-inset-bottom));
  }

  .action-button {
    width: 100%;
  }

  .result-table th,
  .result-table td {
    padding: 12px 10px;
    font-size: 13px;
  }
}
</style>
