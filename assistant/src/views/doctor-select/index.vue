<template>
  <app-page>
    <section class="doctor-select-page">
      <div class="doctor-select-header">
        <button type="button" class="back-btn" @click="goBack">
          <el-icon><arrow-left /></el-icon>
          <span>{{ t('common.back') }}</span>
        </button>

        <div class="header-copy">
          <h2>{{ t('assistant.doctorSelect.pageTitle') }}</h2>
          <p>{{ t('assistant.doctorSelect.pageSubtitle') }}</p>
        </div>

        <div class="header-spacer" />
      </div>

      <section class="patient-summary-panel">
        <div class="patient-profile">
          <div class="patient-avatar">{{ patientAvatar }}</div>

          <div class="patient-copy">
            <div class="patient-primary">
              <strong>{{ patientSummary.name }}</strong>
              <span>{{ patientSummary.ageLabel }}</span>
              <span>{{ patientSummary.sexLabel }}</span>
            </div>
            <p>{{ t('assistant.doctorSelect.patientVisitNo') }}: {{ patientSummary.visitNo }}</p>
          </div>
        </div>

        <div class="complaint-summary">
          <span>{{ t('assistant.doctorSelect.currentComplaint') }}</span>
          <strong>{{ patientSummary.complaint }}</strong>
        </div>
      </section>

      <div class="department-toolbar">
        <div class="department-strip">
          <template v-if="departmentOptions.length">
            <button
              v-for="department in departmentOptions"
              :key="department.id"
              type="button"
              class="department-chip"
              :class="{ active: selectedDepartmentId === department.id }"
              @click="handleDepartmentChange(department.id)"
            >
              {{ department.name }}
            </button>
          </template>

          <span v-else class="empty-chip">{{ departmentStatusText }}</span>
        </div>

        <button type="button" class="refresh-btn" :disabled="doctorLoading" @click="handleRefreshDoctors">
          <el-icon><refresh-right /></el-icon>
          <span>{{ doctorLoading ? t('assistant.doctorSelect.refreshingDoctors') : t('assistant.doctorSelect.refreshDoctors') }}</span>
        </button>
      </div>

      <div v-if="doctorLoading" class="doctor-state-card">
        {{ t('assistant.doctorSelect.loadingDoctors') }}
      </div>

      <div v-else-if="!doctorCards.length" class="doctor-state-card">
        {{ t('assistant.doctorSelect.noDoctors') }}
      </div>

      <div v-else class="doctor-grid">
        <article
          v-for="doctor in doctorCards"
          :key="doctor.id"
          class="doctor-card"
          :class="{ selected: selectedDoctorId === doctor.id }"
        >
          <div class="doctor-card-head">
            <div class="doctor-avatar">{{ doctor.avatarLabel }}</div>

            <div class="doctor-copy">
              <div class="doctor-title-row">
                <strong>{{ doctor.name }}</strong>
                <span>{{ doctor.title }}</span>
              </div>

              <p class="doctor-department">{{ doctor.departmentName }}</p>

              <div class="doctor-status" :class="{ offline: !doctor.online }">
                <i />
                <span>{{ doctor.online ? t('assistant.doctorSelect.online') : t('assistant.doctorSelect.offline') }}</span>
              </div>
            </div>
          </div>

          <div class="doctor-metrics">
            <span>{{ t('assistant.doctorSelect.metrics.consultations') }}: {{ doctor.consultationText }}</span>
            <span>{{ t('assistant.doctorSelect.metrics.approval') }}: {{ doctor.approvalText }}</span>
          </div>

          <div class="doctor-specialty">
            <span>{{ t('assistant.doctorSelect.specialties') }}</span>
            <p>{{ doctor.specialty }}</p>
          </div>

          <button
            type="button"
            class="doctor-select-btn"
            :disabled="!doctor.online"
            @click="selectDoctor(doctor.id)"
          >
            {{ selectedDoctorId === doctor.id ? t('assistant.doctorSelect.selectedDoctor') : t('assistant.doctorSelect.selectDoctor') }}
          </button>
        </article>
      </div>

      <div class="doctor-action-bar">
        <span>{{ selectedDoctorId ? selectedDoctorName : t('assistant.doctorSelect.footerTip') }}</span>

        <button type="button" class="doctor-action-btn" :disabled="!selectedDoctorId || creatingRoom" @click="handleCreateRoom">
          {{ creatingRoom ? t('assistant.doctorSelect.footerLoading') : t('assistant.doctorSelect.footerAction') }}
        </button>
      </div>
    </section>
  </app-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, RefreshRight } from '@element-plus/icons-vue'
import AppPage from '@/components/AppPage.vue'
import { listDepartment, listDepartmentDoctors } from '@/api/department'
import { getPatientDetail } from '@/api/patient'
import { createVideoRoom } from '@/api/video'
import { broadcastPatientContextSync, broadcastVideoRoomCreated } from '@/utils/patient-channel'

interface DepartmentOption {
  id: string
  name: string
}

interface DoctorCard {
  id: string
  name: string
  title: string
  departmentName: string
  online: boolean
  consultationText: string
  approvalText: string
  specialty: string
  avatarLabel: string
}

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const departmentOptions = ref<DepartmentOption[]>([])
const selectedDepartmentId = ref('all')
const selectedDoctorId = ref('')
const doctorCards = ref<DoctorCard[]>([])
const departmentLoading = ref(false)
const doctorLoading = ref(false)
const doctorRequestToken = ref(0)
const creatingRoom = ref(false)

const patientSummary = reactive({
  name: t('common.notAvailable'),
  ageLabel: t('common.notAvailable'),
  sexLabel: t('common.notAvailable'),
  visitNo: t('common.notAvailable'),
  complaint: t('common.notAvailable'),
  caseId: '' as string | number
})

const pickText = (source: Record<string, unknown> | null | undefined, keys: string[]) => {
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

const toArray = (value: unknown) => {
  return Array.isArray(value) ? value : []
}

const parseList = (response: Record<string, unknown> | null | undefined) => {
  const dataList = toArray(response?.data)
  if (dataList.length) {
    return dataList
  }

  const rowList = toArray(response?.rows)
  if (rowList.length) {
    return rowList
  }

  const nestedRows = response?.data && typeof response.data === 'object' ? toArray((response.data as Record<string, unknown>).rows) : []
  return nestedRows
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

const formatApproval = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  const text = String(value).trim()
  if (text.includes('%')) {
    return text
  }

  const numeric = Number(text)
  if (!Number.isFinite(numeric)) {
    return text
  }

  if (numeric <= 1) {
    return `${(numeric * 100).toFixed(1)}%`
  }

  return `${numeric.toFixed(1)}%`
}

const formatConsultations = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  return String(value).trim()
}

const isDoctorOnline = (source: Record<string, unknown>) => {
  const onlineStatus = String(
    source.isOnLine ?? source.onlineStatus ?? source.isOnline ?? source.online ?? source.status ?? '1'
  )
    .trim()
    .toLowerCase()

  if (['0', 'false', 'offline', 'off'].includes(onlineStatus)) {
    return false
  }

  return true
}

const buildAvatarLabel = (value: string) => {
  const text = value.trim()
  if (!text) {
    return '?'
  }

  return text.slice(0, 1)
}

const normalizeDepartment = (item: Record<string, unknown>): DepartmentOption | null => {
  const id = pickText(item, ['departmentId', 'deptId', 'id'])
  const name = pickText(item, ['departmentName', 'deptName', 'name'])

  if (!id || !name) {
    return null
  }

  return { id, name }
}

const getDepartmentNameById = (departmentId: string) => {
  const matchedDepartment = departmentOptions.value.find((item) => item.id === departmentId)
  return matchedDepartment?.name || ''
}

const normalizeDoctor = (item: Record<string, unknown>, fallbackDepartmentName: string): DoctorCard | null => {
  const id = pickText(item, ['doctorId', 'userId', 'id'])
  const name = pickText(item, ['doctorName', 'nickName', 'userName', 'name'])
  const doctorDepartmentId = pickText(item, ['departmentId', 'deptId'])

  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    title: pickText(item, ['title', 'jobTitle', 'postName']) || t('common.notAvailable'),
    departmentName:
      pickText(item, ['departmentName', 'deptName']) ||
      getDepartmentNameById(doctorDepartmentId) ||
      fallbackDepartmentName ||
      t('common.notAvailable'),
    online: isDoctorOnline(item),
    consultationText: formatConsultations(
      item.receptionCount ?? item.receiveCount ?? item.receiveNum ?? item.consultationCount ?? item.visitCount ?? item.orderCount
    ),
    approvalText: formatApproval(item.praiseRate ?? item.goodRate ?? item.approvalRate ?? item.favorRate),
    specialty: pickText(item, ['goodAt', 'specialty', 'speciality', 'expertise', 'description']) || t('common.notAvailable'),
    avatarLabel: buildAvatarLabel(name)
  }
}

const patientAvatar = computed(() => buildAvatarLabel(patientSummary.name === t('common.notAvailable') ? '' : patientSummary.name))

const selectedDoctorName = computed(() => {
  const selected = doctorCards.value.find((item) => item.id === selectedDoctorId.value)
  return selected ? `${selected.name} ${t('assistant.doctorSelect.selectedDoctor')}` : t('assistant.doctorSelect.footerTip')
})

const departmentStatusText = computed(() => {
  return departmentLoading.value ? t('assistant.doctorSelect.loadingDepartments') : t('assistant.doctorSelect.noDepartments')
})

const getRoutePatientId = () => {
  const queryValue = Array.isArray(route.query.patientId) ? route.query.patientId[0] : route.query.patientId
  return queryValue ? String(queryValue).trim() : ''
}

const redirectToHome = async () => {
  await router.replace('/assistant/workbench')
}

const loadPatientSummary = async () => {
  const patientId = getRoutePatientId()
  if (!patientId) {
    await redirectToHome()
    return false
  }

  const response = await getPatientDetail(patientId)
  const detail = (response?.data || {}) as Record<string, unknown>
  const age = pickText(detail, ['patientAge']) || calculateAge(pickText(detail, ['patientBirthday']))
  const complaint =
    locale.value === 'lo'
      ? pickText(detail, ['mainSuitLo', 'mainSuit'])
      : pickText(detail, ['mainSuitCn', 'mainSuit'])

  patientSummary.name = pickText(detail, ['patientName', 'name']) || t('common.notAvailable')
  patientSummary.ageLabel = age ? `${age}${t('assistant.doctorSelect.ageSuffix')}` : t('common.notAvailable')
  patientSummary.sexLabel = formatSex(detail.patientSex)
  patientSummary.visitNo = pickText(detail, ['patientNumber', 'visitNo', 'visitNumber']) || t('common.notAvailable')
  patientSummary.complaint = complaint || t('common.notAvailable')
  patientSummary.caseId = (detail.caseId as string | number) || ''
  broadcastPatientContextSync({ patientId })
  return true
}

const loadDoctorList = async (departmentId: string, options?: { preserveSelection?: boolean }) => {
  doctorLoading.value = true
  const previousSelectedDoctorId = selectedDoctorId.value
  if (!options?.preserveSelection) {
    selectedDoctorId.value = ''
  }
  const currentToken = ++doctorRequestToken.value

  try {
    const targetDepartmentId = departmentId === 'all' ? '0' : departmentId
    const selectedDepartment = departmentOptions.value.find((item) => item.id === departmentId)
    const response = await listDepartmentDoctors(targetDepartmentId)

    if (currentToken !== doctorRequestToken.value) {
      return
    }

    doctorCards.value = parseList(response as Record<string, unknown>)
      .map((record) =>
        normalizeDoctor(
          record as Record<string, unknown>,
          selectedDepartment?.name || t('assistant.doctorSelect.allDepartments')
        )
      )
      .filter((record): record is DoctorCard => Boolean(record))

    if (options?.preserveSelection) {
      const matchedDoctor = doctorCards.value.find((item) => item.id === previousSelectedDoctorId && item.online)
      selectedDoctorId.value = matchedDoctor ? matchedDoctor.id : ''
    }
  } finally {
    if (currentToken === doctorRequestToken.value) {
      doctorLoading.value = false
    }
  }
}

const loadDepartments = async () => {
  departmentLoading.value = true

  try {
    const response = await listDepartment()
    const departments = parseList(response as Record<string, unknown>)
      .map((item) => normalizeDepartment(item as Record<string, unknown>))
      .filter((item): item is DepartmentOption => Boolean(item))

    departmentOptions.value = [{ id: 'all', name: t('assistant.doctorSelect.allDepartments') }, ...departments]
    await loadDoctorList(selectedDepartmentId.value)
  } finally {
    departmentLoading.value = false
  }
}

const handleDepartmentChange = async (departmentId: string) => {
  if (selectedDepartmentId.value === departmentId && doctorCards.value.length) {
    return
  }

  selectedDepartmentId.value = departmentId
  await loadDoctorList(departmentId)
}

const selectDoctor = (doctorId: string) => {
  const doctor = doctorCards.value.find((item) => item.id === doctorId)
  if (!doctor || !doctor.online) {
    return
  }

  selectedDoctorId.value = doctorId
}

const handleRefreshDoctors = async () => {
  await loadDoctorList(selectedDepartmentId.value, { preserveSelection: true })
}

const handleCreateRoom = async () => {
  const patientId = getRoutePatientId()
  if (!patientId || !selectedDoctorId.value || creatingRoom.value) {
    return
  }

  creatingRoom.value = true

  try {
    const response = await createVideoRoom({
      patientId,
      userId: selectedDoctorId.value,
      ...(patientSummary.caseId ? { caseId: patientSummary.caseId } : {})
    })
    broadcastVideoRoomCreated({
      patientId,
      doctorId: selectedDoctorId.value,
      ...(patientSummary.caseId ? { caseId: patientSummary.caseId } : {}),
      roomId: response?.data !== null && response?.data !== undefined ? String(response.data) : ''
    })
    ElMessage.success(t('assistant.doctorSelect.createRoomSuccess'))
  } finally {
    creatingRoom.value = false
  }
}

const goBack = () => {
  const patientId = getRoutePatientId()
  router.push({
    path: '/assistant/intake',
    ...(patientId ? { query: { patientId } } : {})
  })
}

watch(
  () => route.query.patientId,
  () => {
    void loadPatientSummary()
  },
  { immediate: true }
)

onMounted(() => {
  if (!getRoutePatientId()) {
    void redirectToHome()
    return
  }

  void loadDepartments()
})
</script>

<style scoped lang="scss">
.doctor-select-page {
  --doctor-page-width: min(1060px, calc(100% - 28px));
  flex: 0 0 auto;
  min-height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding: 16px 0 28px;
  background:
    radial-gradient(circle at top left, rgba(207, 230, 255, 0.52), transparent 34%),
    radial-gradient(circle at top right, rgba(218, 244, 235, 0.52), transparent 34%),
    linear-gradient(180deg, #edf7ff 0%, #f5fbff 100%);
}

.doctor-select-header {
  width: var(--doctor-page-width);
  display: grid;
  grid-template-columns: 88px 1fr 88px;
  align-items: start;
}

.back-btn {
  min-height: 34px;
  width: fit-content;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #66768a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.94);
}

.header-copy {
  text-align: center;
}

.header-copy h2 {
  margin: 0;
  color: #182334;
  font-size: 24px;
  font-weight: 800;
}

.header-copy p {
  margin: 10px 0 0;
  color: #5b6d80;
  font-size: 14px;
  line-height: 1.8;
}

.header-spacer {
  min-height: 34px;
}

.patient-summary-panel {
  width: var(--doctor-page-width);
  padding: 26px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 40px rgba(54, 88, 128, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.patient-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.patient-avatar,
.doctor-avatar {
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  font-weight: 800;
}

.patient-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #5db6ff 0%, #168fd4 100%);
  font-size: 24px;
  flex: none;
}

.patient-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-primary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  color: #5f7082;
}

.patient-primary strong {
  color: #1b2738;
  font-size: 28px;
  font-weight: 800;
}

.patient-primary span,
.patient-copy p,
.complaint-summary span,
.complaint-summary strong {
  font-size: 14px;
}

.patient-copy p {
  margin: 0;
  color: #67788c;
}

.complaint-summary {
  min-width: 120px;
  max-width: 280px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #f8fbff;
  color: #5f7082;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.complaint-summary strong {
  color: #273547;
  line-height: 1.7;
  font-weight: 600;
}

.department-toolbar {
  width: var(--doctor-page-width);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.department-strip {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.department-chip,
.empty-chip,
.refresh-btn {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.department-chip {
  border: 1px solid #dfe8f1;
  background: rgba(255, 255, 255, 0.88);
  color: #6c7d90;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn {
  border: 1px solid #dfe8f1;
  background: rgba(255, 255, 255, 0.88);
  color: #5f7082;
  gap: 8px;
  cursor: pointer;
  flex: none;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #c7d9e8;
  background: rgba(255, 255, 255, 0.96);
}

.refresh-btn:disabled {
  color: #98a9ba;
  cursor: not-allowed;
}

.department-chip.active {
  border-color: transparent;
  background: linear-gradient(180deg, #1697db 0%, #1086d1 100%);
  color: #ffffff;
}

.empty-chip {
  background: rgba(255, 255, 255, 0.72);
  color: #7c8ca0;
}

.doctor-state-card {
  width: var(--doctor-page-width);
  padding: 28px 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  color: #657588;
  font-size: 15px;
  box-shadow: 0 14px 40px rgba(54, 88, 128, 0.06);
}

.doctor-grid {
  width: var(--doctor-page-width);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.doctor-card {
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 40px rgba(54, 88, 128, 0.08);
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.doctor-card.selected {
  border-color: rgba(22, 143, 212, 0.32);
  box-shadow: 0 18px 42px rgba(22, 143, 212, 0.14);
  transform: translateY(-2px);
}

.doctor-card-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.doctor-avatar {
  width: 58px;
  height: 58px;
  flex: none;
  background: linear-gradient(135deg, #477dff 0%, #225fda 100%);
  font-size: 28px;
}

.doctor-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.doctor-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
}

.doctor-title-row strong {
  color: #1d2a3b;
  font-size: 18px;
  font-weight: 800;
}

.doctor-title-row span,
.doctor-department,
.doctor-status span,
.doctor-metrics span,
.doctor-specialty span,
.doctor-specialty p {
  font-size: 14px;
}

.doctor-title-row span,
.doctor-department {
  color: #5f7082;
}

.doctor-department,
.doctor-specialty p {
  margin: 0;
}

.doctor-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0aa363;
  font-weight: 600;
}

.doctor-status i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(10, 163, 99, 0.12);
}

.doctor-status.offline {
  color: #a0aebd;
}

.doctor-status.offline i {
  box-shadow: 0 0 0 4px rgba(160, 174, 189, 0.14);
}

.doctor-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.doctor-metrics span {
  padding: 6px 10px;
  border-radius: 10px;
  background: #f6fbff;
  color: #4a7f57;
  font-weight: 700;
}

.doctor-metrics span:first-child {
  color: #526475;
}

.doctor-specialty {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doctor-specialty span {
  color: #6b7b8f;
  font-weight: 700;
}

.doctor-specialty p {
  color: #2a394a;
  line-height: 1.8;
  font-weight: 600;
}

.doctor-select-btn,
.doctor-action-btn {
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #1697db 0%, #1086d1 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
}

.doctor-select-btn {
  width: 100%;
  height: 54px;
  cursor: pointer;
}

.doctor-select-btn:disabled {
  background: linear-gradient(180deg, #d6e4ee 0%, #c7d8e6 100%);
  color: #8fa1b4;
  cursor: not-allowed;
}

.doctor-action-bar {
  position: sticky;
  bottom: 0;
  align-self: stretch;
  width: 100%;
  margin-top: auto;
  padding: 18px 28px calc(18px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid rgba(216, 228, 239, 0.9);
  box-shadow: 0 -12px 32px rgba(51, 77, 110, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.doctor-action-bar span {
  color: #5c6e82;
  font-size: 15px;
  font-weight: 600;
}

.doctor-action-btn {
  min-width: 200px;
  height: 46px;
  padding: 0 28px;
  cursor: default;
}

.doctor-action-btn:disabled {
  background: linear-gradient(180deg, #c5e2f4 0%, #b5d8ee 100%);
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 960px) {
  .doctor-select-page {
    --doctor-page-width: min(520px, calc(100% - 24px));
  }

  .doctor-select-header {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .header-spacer {
    display: none;
  }

  .patient-summary-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .department-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .complaint-summary {
    width: 100%;
    max-width: none;
  }

  .doctor-grid {
    grid-template-columns: 1fr;
  }

  .doctor-action-bar {
    padding-inline: 16px;
  }
}

@media (max-width: 640px) {
  .doctor-select-page {
    padding-top: 10px;
    gap: 16px;
  }

  .doctor-select-header,
  .patient-summary-panel,
  .department-toolbar,
  .department-strip,
  .doctor-state-card,
  .doctor-grid {
    width: calc(100% - 8px);
  }

  .patient-summary-panel,
  .doctor-card {
    padding: 18px 16px;
  }

  .patient-primary strong {
    font-size: 24px;
  }

  .doctor-action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .doctor-action-btn {
    width: 100%;
  }
}
</style>
