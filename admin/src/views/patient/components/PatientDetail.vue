<template>
  <el-dialog
    v-model="visible"
    :title="`${t('patient.patientDetail')} - ${patientName || ''}`"
    width="720px"
    align-center
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <div v-loading="loading" class="detail-body">
      <!-- 基本信息 -->
      <div class="detail-section-title">{{ t('patient.basicInfo') }}</div>
      <div class="detail-grid">
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.name') }}</span>
          <span class="detail-value">{{ display(basicInfo.patientName) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.gender') }}</span>
          <span class="detail-value">{{ displayGender(basicInfo.patientSex) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.birthday') }}</span>
          <span class="detail-value">{{ birthdayWithAge }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.phone') }}</span>
          <span class="detail-value">{{ display(basicInfo.patientPhone) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.idCard') }}</span>
          <span class="detail-value">{{ display(basicInfo.patientIdCard) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.marriage') }}</span>
          <span class="detail-value">{{ displayMarriage(basicInfo.maritalStatus) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.occupation') }}</span>
          <span class="detail-value">{{ display(basicInfo.job) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.bloodType') }}</span>
          <span class="detail-value">{{ display(basicInfo.bloodType) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.visitId') }}</span>
          <span class="detail-value">{{ display(basicInfo.patientNumber) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.emergencyContact') }}</span>
          <span class="detail-value">{{ display(basicInfo.emergencyContact) }}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">{{ t('patient.emergencyPhone') }}</span>
          <span class="detail-value">{{ display(basicInfo.emergencyContactPhone) }}</span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.address') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !basicInfo.address }">
            {{ basicInfo.address || t('patient.notAvailable') }}
          </span>
        </div>
        <div class="detail-group full">
          <span class="detail-label">{{ t('patient.remark') }}</span>
          <span class="detail-value" :class="{ 'text-muted': !basicInfo.remark }">
            {{ basicInfo.remark || t('patient.notAvailable') }}
          </span>
        </div>
      </div>

      <!-- 就诊记录 -->
      <div class="detail-section-title visit-title">{{ t('patient.visitRecords') }}</div>
      <table class="mini-table">
        <thead>
          <tr>
            <th>{{ t('patient.colCaseId') }}</th>
            <th>{{ t('patient.colVisitDate') }}</th>
            <th>{{ t('patient.colDoctor') }}</th>
            <th>{{ t('patient.colDept') }}</th>
            <th>{{ t('patient.colDiagnosis') }}</th>
            <th>{{ t('common.operate') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in visitRecords" :key="item.caseId ?? idx">
            <td>{{ item.caseId ?? '--' }}</td>
            <td>{{ formatDateTime(item.visitDate) }}</td>
            <td :class="{ 'text-muted': !item.doctorName }">{{ item.doctorName || '--' }}</td>
            <td :class="{ 'text-muted': !item.departmentName }">{{ item.departmentName || '--' }}</td>
            <td>
              <span v-if="item.diagnosisResult" class="tag tag-info">{{ item.diagnosisResult }}</span>
              <span v-else class="text-muted">--</span>
            </td>
            <td>
              <el-button link type="primary" @click="handleViewVisit(item.caseId)">{{ t('common.view') }}</el-button>
            </td>
          </tr>
          <tr v-if="!visitRecords.length && !loading">
            <td colspan="6" class="empty-row">{{ t('patient.noVisitRecords') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">{{ t('common.close') }}</el-button>
        <el-button type="primary" @click="handleEdit">{{ t('common.edit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { to } from 'await-to-js'
import { getPatientManageDetail } from '@/api/patient'
import type { PatientProfileVO, PatientVisitRecordVO } from '@/api/types'

const { t } = useI18n()

const visible = ref(false)
const loading = ref(false)
const patientName = ref('')

const basicInfo = reactive<PatientProfileVO>({})
const visitRecords = ref<PatientVisitRecordVO[]>([])

const emit = defineEmits<{
  (e: 'edit', patientId: string | number): void
  (e: 'view-visit', caseId: string | number): void
}>()

const display = (val?: string) => (val ? val : '--')

const displayGender = (sex?: string) => {
  if (!sex) return '--'
  if (sex === '0' || sex === '男') return t('patient.male')
  if (sex === '1' || sex === '女') return t('patient.female')
  return sex
}

const displayMarriage = (val?: string) => {
  if (!val) return '--'
  if (val === '1' || val === '已婚') return t('patient.married')
  if (val === '0' || val === '未婚') return t('patient.unmarried')
  return val
}

/** 出生日期 + 自动计算年龄 */
const birthdayWithAge = computed(() => {
  const b = basicInfo.patientBirthday
  if (!b) return '--'
  const d = new Date(String(b).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return b
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const age = calcAge(d)
  return `${d.getFullYear()}-${mm}-${dd}${age != null ? `（${age}${t('patient.ageUnit')}）` : ''}`
})

const calcAge = (birth: Date) => {
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

const formatDateTime = (val?: string) => {
  if (!val) return '--'
  const d = new Date(String(val).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 16)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`
}

const open = async (patientId?: string | number, name?: string) => {
  if (!patientId) return
  patientName.value = name || ''
  visible.value = true
  loading.value = true
  Object.keys(basicInfo).forEach(k => delete (basicInfo as any)[k])
  visitRecords.value = []
  const [err, res] = await to(getPatientManageDetail(patientId))
  loading.value = false
  if (err) return
  const data = res?.data
  if (data?.basicInfo) {
    Object.assign(basicInfo, data.basicInfo)
    if (!patientName.value && data.basicInfo.patientName) {
      patientName.value = data.basicInfo.patientName
    }
  }
  visitRecords.value = data?.visitRecords || []
}

const handleViewVisit = (caseId?: string | number) => {
  if (caseId == null) return
  emit('view-visit', caseId)
}

const handleEdit = () => {
  const id = basicInfo.patientId
  if (id == null) return
  emit('edit', id)
}

const handleClosed = () => {
  patientName.value = ''
  Object.keys(basicInfo).forEach(k => delete (basicInfo as any)[k])
  visitRecords.value = []
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.detail-body {
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
}
.visit-title {
  margin-top: 20px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
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
  word-break: break-all;
}
.text-muted {
  color: #909399;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    padding: 8px 12px;
    background: #fafbfc;
    color: #606266;
    font-weight: 600;
    border-bottom: 1px solid #ebeef5;
    font-size: 12px;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #ebeef5;
    color: #303133;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  .empty-row {
    text-align: center;
    color: #909399;
    padding: 28px 0;
  }
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}
.tag-info {
  background: #f4f4f5;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
