<template>
  <el-dialog
    v-model="visible"
    :title="t('patient.visitDetail')"
    width="720px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <div v-loading="loading" class="visit-detail-body">
      <!-- 患者基本信息 -->
      <div class="detail-section-title">{{ t('patient.patientBasicInfo') }}</div>
      <div class="detail-grid">
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.name') }}</span>
          <span class="detail-value">{{ display(detail.patientName) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.ageGender') }}</span>
          <span class="detail-value">{{ ageGender }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.marriage') }}</span>
          <span class="detail-value">{{ displayMarriage(detail.maritalStatus) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.visitId') }}</span>
          <span class="detail-value">{{ display(detail.patientNumber) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.phone') }}</span>
          <span class="detail-value">{{ display(detail.patientPhone) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.occupation') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.job }">
            {{ detail.job || t('patient.notAvailable') }}
          </span>
        </div>
      </div>

      <!-- 就诊信息 -->
      <div class="detail-section-title">{{ t('patient.visitInfo') }}</div>
      <div class="detail-grid">
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.visitDate') }}</span>
          <span class="detail-value">{{ displayDate(detail.visitDate) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.visitDept') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.departmentName }">
            {{ detail.departmentName || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.doctor') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.doctorName }">
            {{ detail.doctorName || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.callDuration') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !callDurationText }">
            {{ callDurationText || t('patient.notAvailable') }}
          </span>
        </div>
      </div>

      <!-- 病历 -->
      <div class="detail-section-title">{{ t('patient.medicalRecord') }}</div>
      <div class="detail-grid detail-grid--single">
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.chiefComplaint') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.mainSuit }">
            {{ detail.mainSuit || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.currentHistory') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.historyIllness }">
            {{ detail.historyIllness || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.pastHistory') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.previousHistory }">
            {{ detail.previousHistory || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.allergyHistory') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.allergichistory }">
            {{ detail.allergichistory || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.familyHistory') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.familyhistory }">
            {{ detail.familyhistory || t('patient.notAvailable') }}
          </span>
        </div>
      </div>

      <!-- 诊断与治疗 -->
      <div class="detail-section-title">{{ t('patient.diagnosisTreatment') }}</div>
      <div class="detail-grid">
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.diagnosisResult') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.diagnosisResult }">
            {{ detail.diagnosisResult || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.syndromeType') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.syndromeType }">
            {{ detail.syndromeType || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.prescription') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.prescriptions }">
            {{ detail.prescriptions || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.advice') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !detail.advice }">
            {{ detail.advice || t('patient.notAvailable') }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">{{ t('common.close') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { to } from 'await-to-js'
import { getPatientVisitDetail } from '@/api/patient'
import type { PatientVisitDetailVO } from '@/api/types'

const { t } = useI18n()

const visible = ref(false)
const loading = ref(false)

const detail = reactive<PatientVisitDetailVO>({})

const display = (val?: string) => (val ? val : '--')

const displayMarriage = (val?: string) => {
  if (!val) return '--'
  if (val === '1' || val === '已婚') return t('patient.married')
  if (val === '0' || val === '未婚') return t('patient.unmarried')
  return val
}

/** 年龄/性别展示：优先用后端 ageSex，否则本地拼接 */
const ageGender = computed(() => {
  if (detail.ageSex) return detail.ageSex
  const age = detail.patientAge != null ? `${detail.patientAge}${t('patient.ageUnit')}` : ''
  const sex = detail.patientSex
    ? detail.patientSex === '0' || detail.patientSex === '男'
      ? t('patient.male')
      : detail.patientSex === '1' || detail.patientSex === '女'
        ? t('patient.female')
        : detail.patientSex
    : ''
  const text = [age, sex].filter(Boolean).join('/')
  return text || '--'
})

/** 通话时长：优先用后端 callDuration 文本 */
const callDurationText = computed(() => detail.callDuration || '')

const displayDate = (val?: string) => {
  if (!val) return '--'
  const d = new Date(String(val).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const open = async (caseId?: string | number) => {
  if (caseId == null) return
  visible.value = true
  loading.value = true
  resetDetail()
  const [err, res] = await to(getPatientVisitDetail(caseId))
  loading.value = false
  if (err) return
  if (res?.data) Object.assign(detail, res.data)
}

const resetDetail = () => {
  Object.keys(detail).forEach(k => delete (detail as any)[k])
}

const handleClosed = () => {
  resetDetail()
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.visit-detail-body {
  max-height: 65vh;
  overflow-y: auto;
}
.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
  margin-top: 16px;
  &:first-child {
    margin-top: 0;
  }
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
}
.detail-grid--single {
  grid-template-columns: 1fr;
}
.detail-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
  &.full {
    grid-column: 1 / -1;
  }
}
.detail-label {
  font-size: 13px;
  color: #909399;
}
.detail-value {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}
.text-muted {
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
