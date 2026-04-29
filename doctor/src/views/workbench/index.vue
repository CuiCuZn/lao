<template>
  <div class="workbench-shell">
    <main class="workbench-main">
      <section class="overview-banner">
        <div class="overview-copy">
          <h1 class="overview-title">{{ greetingText }}，{{ doctorDisplayName }}</h1>
          <p class="overview-description">{{ overviewDescription }}</p>
        </div>

        <div class="control-actions">
          <span class="panel-status control-status"
            :class="[`is-${sseStatus}`, { 'is-highlighted': sseStatus !== 'offline' }]">
            <span class="status-dot"></span>
            {{ connectionStatusText }}
          </span>

          <el-button class="online-action-btn" :class="{ 'is-online': isOnlineRequested }"
            :type="isOnlineRequested ? 'danger' : 'primary'" :loading="isSwitchingOnlineStatus" round
            @click="toggleOnlineStatus">
            {{ onlineActionButtonText }}
          </el-button>
        </div>
      </section>

      <section class="metrics-row">
        <article v-for="card in metricCards" :key="card.key" class="metric-card" :class="`is-${card.tone}`">
          <div class="metric-copy">
            <span class="metric-label">{{ card.label }}</span>
            <strong class="metric-value">{{ card.value }}</strong>
            <!-- <p class="metric-hint">{{ card.hint }}</p> -->
          </div>

          <div class="metric-icon">
            <el-icon>
              <component :is="card.icon" />
            </el-icon>
          </div>
        </article>
      </section>

      <section class="workspace-grid">
        <article class="panel queue-panel">
          <div class="panel-header">
            <div class="panel-heading">
              <span class="panel-kicker">{{ t('workbench.pendingTitle') }}</span>
              <!-- <p class="panel-description">{{ t('workbench.pendingPanelHint', { count: pendingCount }) }}</p> -->
            </div>
          </div>

          <div v-if="pendingPatients.length > 0" class="queue-list">
            <article v-for="item in pendingPatients" :key="item.id" class="queue-card">
              <div class="patient-avatar" :style="{ background: getAvatarGradient(item.patientName) }">
                {{ item.patientName.slice(0, 1) }}
              </div>

              <div class="queue-content">
                <div class="queue-header">
                  <div class="queue-info-wrap">
                    <h4>
                      {{ item.patientName }}
                      <span v-if="item.sexText || item.age" class="patient-tag">
                        {{ item.sexText }} {{ formatAgeLabel(item.age) }}
                      </span>
                    </h4>
                  </div>

                  <!-- <div class="queue-no">{{ item.queueNo }}</div> -->
                </div>

                <div class="queue-meta">
                  <span>{{ formatPendingDisplayTime(item) }}</span>
                </div>
              </div>

              <el-button class="queue-action" size="small" type="primary" round @click="openAcceptDialog(item)">
                {{ t('workbench.acceptAction') }}
              </el-button>
            </article>
          </div>

          <div v-else class="empty-state">
            <el-icon class="empty-icon">
              <Box />
            </el-icon>
            <h4>{{ pendingEmptyDescription }}</h4>
          </div>
        </article>

        <article class="panel unfinished-panel">
          <div class="panel-header">
            <div class="panel-heading">
              <span class="panel-kicker">{{ t('workbench.recordPanelTitle') }}</span>
            </div>
          </div>

          <div class="unfinished-list">
            <article v-for="item in unfinishedConsultations" :key="item.id" class="unfinished-card">
              <div class="patient-avatar" :style="{ background: getAvatarGradient(item.patientName) }">
                {{ item.patientName.slice(0, 1) }}
              </div>

              <div class="unfinished-content">
                <div class="unfinished-top">
                  <h4>{{ item.displayName || item.patientName }}</h4>
                  <span :class="['unfinished-progress', getDiagnosisStatusClass(item.progressText)]">
                    {{ item.progressText }}
                  </span>
                </div>
                <p class="unfinished-result">{{ t('workbench.diagnosisLabel') }}{{ item.projectName }}</p>

                <div class="queue-meta unfinished-meta">
                  <span class="unfinished-time-chip">
                    <el-icon>
                      <Clock />
                    </el-icon>
                    {{ item.scheduledAt }}
                  </span>
                </div>
              </div>

              <el-button v-if="item.progressText !== t('workbench.completedStatus')" type="primary"
                class="queue-action continue-action" size="small" round :loading="continuingConsultationId === item.id"
                @click="handleContinueConsultation(item)">
                {{ t('workbench.continueAction') }}
              </el-button>
              <el-button v-else type="info" plain class="queue-action detail-action" size="small" round
                @click="openCaseDetail(item)">
                {{ t('workbench.viewDetail', '查看详情') }}
              </el-button>
            </article>
          </div>
        </article>
      </section>
    </main>

    <aside class="workbench-side">
      <article class="doctor-card">
        <span class="panel-kicker">{{ t('workbench.doctorTitle') }}</span>

        <div class="doctor-top">
          <div class="doctor-avatar-wrap">
            <div class="doctor-avatar" :style="{ background: getAvatarGradient(doctorDisplayName) }">
              {{ doctorInitial }}
            </div>
          </div>

          <h3 class="doctor-name">{{ doctorDisplayName }}</h3>
          <p class="doctor-tagline">{{ doctorTagline }}</p>
          <!-- <span class="doctor-role-pill">{{ doctorInstitution }}</span> -->
        </div>

        <div class="doctor-details">
          <div class="detail-item">
            <span class="detail-icon">
              <el-icon>
                <PhoneFilled />
              </el-icon>
            </span>
            <div>
              <label>{{ t('workbench.phoneLabel') }}</label>
              <strong>{{ doctorPhone }}</strong>
            </div>
          </div>

          <div class="detail-item">
            <span class="detail-icon">
              <el-icon>
                <Document />
              </el-icon>
            </span>
            <div>
              <label>{{ t('workbench.specialtyLabel') }}</label>
              <strong>{{ doctorSpecialty }}</strong>
            </div>
          </div>
        </div>
      </article>
    </aside>

    <el-dialog v-model="acceptDialogVisible" :show-close="false" width="400px" class="accept-request-dialog"
      append-to-body destroy-on-close style="border-radius: 16px;">
      <div v-if="activePatient" class="accept-dialog-content">
        <div class="accept-avatar">
          {{ activePatient.patientName.slice(0, 1) }}
        </div>
        <h2 class="accept-title">{{ t('workbench.acceptRequestTitle') }}</h2>

        <div class="accept-actions">
          <el-button class="action-btn reject-btn" :disabled="acceptingConsultation" @click="handleReject">
            <el-icon>
              <Delete />
            </el-icon> {{ t('workbench.rejectAction') }}
          </el-button>
          <el-button class="action-btn resolve-btn" type="success" :loading="acceptingConsultation"
            @click="handleConfirmAccept">
            <el-icon>
              <VideoCamera />
            </el-icon> {{ t('workbench.acceptRequestAction') }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="t('workbench.viewDetail', '查看详情')" size="60%" destroy-on-close
      append-to-body>
      <case-detail v-if="drawerVisible" :case-id="currentCaseId" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Box,
  Clock,
  DataAnalysis,
  Document,
  PhoneFilled,
  UserFilled,
  Delete,
  VideoCamera
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { switchWorkbenchOnlineStatus, getDepartmentList, getDiagnosisStats, getCurrentReceptionList } from '@/api/workbench'
import { getPatientDetail } from '@/api/patient'
import { getBasicInfo, getVideoChannelId, rejectVideo } from '@/api/video'
import type {
  ConsultationMode,
  ConsultationNavigationContext,
  CurrentReceptionItem,
  IncompleteConsultation,
  PendingConsultation
} from '@/api/types'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  showDesktopNotification
} from '@/utils/desktop-notification'
import { connectSse, type SseMessage } from '@/utils/sse'
import CaseDetail from './components/CaseDetail.vue'

type SseStatus = 'offline' | 'connecting' | 'connected' | 'reconnecting' | 'error'
type MetricTone = 'sky' | 'amber' | 'violet'

interface MetricCard {
  key: string
  label: string
  value: string
  hint: string
  tone: MetricTone
  icon: Component
}

const ONLINE_STATUS_STORAGE_KEY = 'doctor_workbench_online'
const DOCTOR_RTC_CONTEXT_KEY = 'doctor_rtc_context'

const userStore = useUserStore()
const router = useRouter()
const { t, locale } = useI18n()
const isOnline = ref(resolveInitialOnlineState())
const isPreparingOnline = ref(false)
const isSwitchingOnlineStatus = ref(false)

const departmentOptions = ref<any[]>([])

const pendingPatients = ref<PendingConsultation[]>([])
const diagnosisStats = ref({
  todayReceptionCount: 0,
  pendingReceptionCount: 0,
  monthReceptionCount: 0
})
const currentReceptionList = ref<CurrentReceptionItem[]>([])
const sseStatus = ref<SseStatus>(isOnline.value ? 'connecting' : 'offline')
const reconnectAttempts = ref(0)

const acceptDialogVisible = ref(false)
const activePatient = ref<PendingConsultation | null>(null)
const acceptingConsultation = ref(false)
const continuingConsultationId = ref('')

const drawerVisible = ref(false)
const currentCaseId = ref('')

const openCaseDetail = (item: IncompleteConsultation) => {
  if (!item.caseId) {
    ElMessage.warning(t('workbench.missingCaseId'))
    return
  }
  currentCaseId.value = String(item.caseId)
  drawerVisible.value = true
}

const openAcceptDialog = (item: PendingConsultation) => {
  activePatient.value = item
  acceptDialogVisible.value = true
}

const openIncomingAcceptDialog = (item: PendingConsultation) => {
  if (acceptDialogVisible.value || acceptingConsultation.value) {
    return
  }

  openAcceptDialog(item)
}

const handleReject = async () => {
  if (!activePatient.value || acceptingConsultation.value) {
    return
  }

  acceptingConsultation.value = true

  try {
    const currentPatient = activePatient.value
    const caseId = currentPatient.caseId?.trim()
    const doctorAideId = currentPatient.doctorAideId?.trim()

    if (!caseId) {
      throw new Error(t('workbench.missingCaseId'))
    }

    if (!doctorAideId) {
      throw new Error(t('workbench.missingDoctorAideId'))
    }

    const channelId = currentPatient.roomId?.trim() || resolveChannelId((await getVideoChannelId(caseId))?.data)

    if (!channelId) {
      throw new Error(t('workbench.roomIdLoadFailed'))
    }

    await rejectVideo(caseId, channelId, doctorAideId)

    pendingPatients.value = []
    diagnosisStats.value.pendingReceptionCount = 0
    acceptDialogVisible.value = false
    activePatient.value = null
    void loadDiagnosisStats().catch((error) => {
      console.error('Failed to refresh diagnosis stats after rejecting video:', error)
    })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('workbench.rejectFailed'))
  } finally {
    acceptingConsultation.value = false
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function buildConsultationNavigationContext(
  seedData: Partial<ConsultationNavigationContext>,
  consultationMode: ConsultationMode,
  roomId: string
): ConsultationNavigationContext {
  const rawRecord = isObjectRecord(seedData.raw) ? seedData.raw : {}
  const mergedRecord = {
    ...rawRecord,
    ...seedData
  } as Record<string, unknown>
  const patientName =
    pickString(mergedRecord, ['patientName', 'name', 'nickName', 'userName']) ||
    (typeof seedData.patientName === 'string' ? seedData.patientName.trim() : '') ||
    t('workbench.unknownPatient')
  const numericAge = pickNumber(mergedRecord, ['age', 'patientAge'])
  const textAge =
    numericAge > 0
      ? numericAge
      : pickString(mergedRecord, ['age', 'patientAge']) || seedData.age || ''
  const sexText =
    formatPatientSex(pickString(mergedRecord, ['patientSex', 'sex', 'gender'])) ||
    (typeof seedData.sexText === 'string' ? seedData.sexText.trim() : '')
  const patientId =
    pickString(mergedRecord, ['patientId', 'patId', 'id']) ||
    (seedData.patientId !== null && seedData.patientId !== undefined ? String(seedData.patientId).trim() : '')
  const caseId =
    pickString(mergedRecord, ['caseId', 'caseID', 'medicalCaseId']) ||
    (seedData.caseId !== null && seedData.caseId !== undefined ? String(seedData.caseId).trim() : '')
  const videoId =
    pickString(mergedRecord, ['videoId', 'videoID']) ||
    (seedData.videoId !== null && seedData.videoId !== undefined ? String(seedData.videoId).trim() : '')
  const doctorAideId =
    pickString(mergedRecord, ['doctorAideId', 'doctorAidId']) ||
    (seedData.doctorAideId !== null && seedData.doctorAideId !== undefined ? String(seedData.doctorAideId).trim() : '')

  return {
    patientName,
    age: textAge,
    sexText,
    complaint: pickString(mergedRecord, ['mainSuit', 'chiefComplaint', 'complaint', 'summary', 'reason']) || '',
    historyIllness: pickString(mergedRecord, ['historyIllness']) || '',
    previousHistory: pickString(mergedRecord, ['previousHistory']) || '',
    allergichistory: pickString(mergedRecord, ['allergichistory']) || '',
    familyhistory: pickString(mergedRecord, ['familyhistory']) || '',
    occupation: pickString(mergedRecord, ['occupation']) || '',
    marriage: pickString(mergedRecord, ['marriage']) || '',
    caseId,
    videoId,
    patientId,
    doctorAideId,
    roomId,
    consultationMode,
    raw: mergedRecord
  }
}

async function prepareConsultationNavigation(
  seedData: Partial<ConsultationNavigationContext>,
  consultationMode: ConsultationMode
) {
  const rawRecord = isObjectRecord(seedData.raw) ? seedData.raw : {}
  const resolvedCaseId =
    (seedData.caseId !== null && seedData.caseId !== undefined ? String(seedData.caseId).trim() : '') ||
    pickString(rawRecord, ['caseId', 'caseID', 'medicalCaseId'])
  const resolvedPatientId =
    (seedData.patientId !== null && seedData.patientId !== undefined ? String(seedData.patientId).trim() : '') ||
    pickString(rawRecord, ['patientId', 'patId', 'id'])
  const resolvedDoctorAideId =
    (seedData.doctorAideId !== null && seedData.doctorAideId !== undefined ? String(seedData.doctorAideId).trim() : '') ||
    pickString(rawRecord, ['doctorAideId', 'doctorAidId'])

  if (!resolvedCaseId) {
    throw new Error(t('workbench.missingCaseId'))
  }

  const shouldFetchBasicInfo =
    consultationMode === 'continue' ||
    !seedData.patientName ||
    !seedData.complaint ||
    !seedData.historyIllness ||
    !seedData.sexText
  const shouldFetchPatientDetail = consultationMode === 'continue' && Boolean(resolvedPatientId)

  const [channelResponse, basicResponse, patientResponse] = await Promise.all([
    getVideoChannelId(resolvedCaseId),
    shouldFetchBasicInfo ? getBasicInfo(resolvedCaseId).catch(() => null) : Promise.resolve(null),
    shouldFetchPatientDetail ? getPatientDetail(resolvedPatientId).catch(() => null) : Promise.resolve(null)
  ])

  const roomId = resolveChannelId(channelResponse?.data)

  if (!roomId) {
    throw new Error(t('workbench.roomIdLoadFailed'))
  }

  const basicInfo = isObjectRecord((basicResponse as any)?.data) ? (basicResponse as any).data : {}
  const patientDetail = isObjectRecord((patientResponse as any)?.data) ? (patientResponse as any).data : {}
  const navigationContext = buildConsultationNavigationContext(
    {
      ...seedData,
      ...basicInfo,
      ...patientDetail,
      caseId: resolvedCaseId,
      patientId: resolvedPatientId || pickString({ ...basicInfo, ...patientDetail }, ['patientId', 'patId', 'id']),
      doctorAideId:
        resolvedDoctorAideId ||
        pickString({ ...basicInfo, ...patientDetail }, ['doctorAideId', 'doctorAidId']),
      raw: {
        ...rawRecord,
        ...basicInfo,
        ...patientDetail,
        ...(resolvedDoctorAideId ? { doctorAideId: resolvedDoctorAideId } : {})
      }
    },
    consultationMode,
    roomId
  )

  sessionStorage.setItem(DOCTOR_RTC_CONTEXT_KEY, JSON.stringify(navigationContext))

  const nextQuery: Record<string, string> = {
    caseId: String(navigationContext.caseId || resolvedCaseId),
    roomId,
    source: 'workbench',
    consultationMode
  }

  if (navigationContext.patientId !== null && navigationContext.patientId !== undefined) {
    const normalizedPatientId = String(navigationContext.patientId).trim()
    if (normalizedPatientId) {
      nextQuery.patientId = normalizedPatientId
    }
  }

  if (navigationContext.videoId !== null && navigationContext.videoId !== undefined) {
    const normalizedVideoId = String(navigationContext.videoId).trim()
    if (normalizedVideoId) {
      nextQuery.videoId = normalizedVideoId
    }
  }

  if (navigationContext.doctorAideId !== null && navigationContext.doctorAideId !== undefined) {
    const normalizedDoctorAideId = String(navigationContext.doctorAideId).trim()
    if (normalizedDoctorAideId) {
      nextQuery.doctorAideId = normalizedDoctorAideId
    }
  }

  await router.push({
    path: '/doctor-rtc',
    query: nextQuery
  })
}

const handleConfirmAccept = async () => {
  if (!activePatient.value || acceptingConsultation.value) {
    return
  }

  acceptingConsultation.value = true

  try {
    const currentPatient = activePatient.value
    await prepareConsultationNavigation(currentPatient, 'accept')

    acceptDialogVisible.value = false
    activePatient.value = null
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('workbench.acceptFailed'))
  } finally {
    acceptingConsultation.value = false
  }
}

const unfinishedConsultations = computed<IncompleteConsultation[]>(() =>
  currentReceptionList.value.map((item, index) => ({
    id: String(item.caseId || `unfinished-${index + 1}`),
    patientName: item.patientName?.trim() || t('workbench.unknownPatient'),
    displayName: formatReceptionPatientName(item),
    projectName: item.diagnosisResult?.trim() || t('workbench.notAvailable'),
    scheduledAt: formatReceptionVisitDate(item.visitDate),
    progressText: formatDiagnosisStatus(item.diagnosisStatus),
    caseId: item.caseId,
    patientId: pickString(item as Record<string, unknown>, ['patientId', 'patId', 'id']),
    patientSex: item.patientSex,
    patientAge: item.patientAge,
    videoId: pickString(item as Record<string, unknown>, ['videoId', 'videoID']),
    doctorAideId: pickString(item as Record<string, unknown>, ['doctorAideId', 'doctorAidId']),
    roomId: pickString(item as Record<string, unknown>, ['roomId', 'channelId']),
    raw: item
  }))
)

const handleContinueConsultation = async (item: IncompleteConsultation) => {
  if (!item?.id || continuingConsultationId.value) {
    return
  }

  continuingConsultationId.value = item.id

  try {
    await prepareConsultationNavigation(item, 'continue')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('workbench.continueFailed'))
  } finally {
    continuingConsultationId.value = ''
  }
}

let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let sseConnection: ReturnType<typeof connectSse> | undefined
let manualClose = false
let activeStreamId = 0
let isOnlineSwitchRequestRunning = false

const doctorProfile = computed(() => userStore.profile)
const doctorDisplayName = computed(() => {
  return doctorProfile.value?.nickName || userStore.nickname || userStore.name || t('workbench.unknownDoctor')
})
const doctorInitial = computed(() => doctorDisplayName.value.slice(0, 1).toUpperCase())
const doctorInstitution = computed(() => {
  return (
    doctorProfile.value?.deptName ||
    doctorProfile.value?.departmentName ||
    doctorProfile.value?.companyName ||
    doctorProfile.value?.orgName ||
    doctorProfile.value?.organizationName ||
    doctorProfile.value?.hospitalName ||
    doctorProfile.value?.clinicName ||
    t('workbench.notAvailable')
  ) as string
})
const doctorDepartment = computed(() => {
  if (doctorProfile.value?.departmentId) {
    const matched = departmentOptions.value.find(d =>
      String(d.id) === String(doctorProfile.value?.departmentId) ||
      String(d.departmentId) === String(doctorProfile.value?.departmentId) ||
      String(d.deptId) === String(doctorProfile.value?.departmentId)
    )
    if (matched) return matched.departmentName || matched.name || matched.deptName || t('workbench.notAvailable')
  }
  return doctorProfile.value?.deptName || doctorProfile.value?.departmentName || t('workbench.notAvailable')
})
const doctorTitle = computed(() => {
  return doctorProfile.value?.title || doctorProfile.value?.postName || t('workbench.notAvailable')
})
const doctorPhone = computed(() => {
  return doctorProfile.value?.phonenumber || doctorProfile.value?.phoneNumber || t('workbench.notAvailable')
})
const doctorSpecialty = computed(() => {
  return (
    doctorProfile.value?.goodAt ||
    doctorProfile.value?.specialty ||
    doctorProfile.value?.speciality ||
    doctorProfile.value?.expertise ||
    doctorProfile.value?.description ||
    t('workbench.notAvailable')
  ) as string
})
const doctorTagline = computed(() => {
  const segments = [doctorTitle.value, doctorDepartment.value].filter(
    (segment) => segment && segment !== t('workbench.notAvailable')
  )
  return segments.length > 0 ? segments.join(' · ') : doctorInstitution.value
})
const pendingCount = computed(() => pendingPatients.value.length)
const isOnlineRequested = computed(() => isOnline.value || isPreparingOnline.value)
const onlineActionButtonText = computed(() =>
  isOnlineRequested.value ? t('workbench.disableOnlineAction') : t('workbench.enableOnlineAction')
)
const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return t('workbench.morningGreeting')
  if (hour < 14) return t('workbench.noonGreeting')
  if (hour < 18) return t('workbench.afternoonGreeting')
  return t('workbench.eveningGreeting')
})
const connectionStatusText = computed(() => {
  const statusTextMap: Record<SseStatus, string> = {
    offline: t('workbench.sseOffline'),
    connecting: t('workbench.sseConnecting'),
    connected: t('workbench.sseConnected'),
    reconnecting: t('workbench.sseReconnecting'),
    error: t('workbench.sseError')
  }
  return statusTextMap[sseStatus.value]
})
const overviewDescription = computed(() => {
  if (!isOnlineRequested.value) {
    return t('workbench.heroOfflineDescription')
  }
  return t('workbench.heroQueueDescription', { count: pendingCount.value })
})
const pendingEmptyTitle = computed(() => {
  if (!isOnlineRequested.value) return t('workbench.pendingEmptyOfflineTitle')
  if (sseStatus.value === 'error') return t('workbench.pendingEmptyErrorTitle')
  if (sseStatus.value === 'connecting' || sseStatus.value === 'reconnecting') return t('workbench.pendingEmptyLoadingTitle')
  return t('workbench.pendingEmptyTitle')
})
const pendingEmptyDescription = computed(() => {
  if (!isOnlineRequested.value) return t('workbench.pendingEmptyOffline')
  if (sseStatus.value === 'error') return t('workbench.pendingEmptyError')
  if (sseStatus.value === 'connecting' || sseStatus.value === 'reconnecting') return t('workbench.pendingEmptyLoading')
  return t('workbench.pendingEmpty')
})
const metricCards = computed<MetricCard[]>(() => [
  {
    key: 'today',
    label: t('workbench.todayVisitsTitle'),
    value: String(diagnosisStats.value.todayReceptionCount || 0),
    hint: t('workbench.todayVisitsTrend', { count: 3 }),
    tone: 'sky',
    icon: UserFilled
  },
  {
    key: 'pending',
    label: t('workbench.pendingTitle'),
    value: String(diagnosisStats.value.pendingReceptionCount || 0),
    hint: t('workbench.pendingCardHint'),
    tone: 'amber',
    icon: Clock
  },
  {
    key: 'month',
    label: t('workbench.monthlyVisitsTitle'),
    value: String(diagnosisStats.value.monthReceptionCount || 0),
    hint: t('workbench.monthlyVisitsHint'),
    tone: 'violet',
    icon: DataAnalysis
  }
])

async function loadDiagnosisStats() {
  const response = await getDiagnosisStats()
  const data = response?.data || {}

  diagnosisStats.value = {
    todayReceptionCount: Number(data.todayReceptionCount || 0),
    pendingReceptionCount: Number(data.pendingReceptionCount || 0),
    monthReceptionCount: Number(data.monthReceptionCount || 0)
  }
}

async function loadCurrentReceptionList() {
  const response = await getCurrentReceptionList()
  currentReceptionList.value = Array.isArray(response?.data) ? response.data : []
}

onMounted(async () => {
  if (isOnlineRequested.value) {
    startSse()
  } else {
    sseStatus.value = 'offline'
  }

  try {
    const res = await getDepartmentList()
    departmentOptions.value = (res as any).data || (res as any).rows || []
  } catch (error) {
    console.error('Failed to get department list:', error)
  }

  try {
    await loadDiagnosisStats()
  } catch (error) {
    console.error('Failed to get diagnosis stats:', error)
  }

  try {
    await loadCurrentReceptionList()
  } catch (error) {
    console.error('Failed to get current reception list:', error)
  }
})

onBeforeUnmount(() => {
  closeSse(true)
})

function persistOnlineState(value: boolean) {
  isOnline.value = value
  localStorage.setItem(ONLINE_STATUS_STORAGE_KEY, String(value))
}

function resolveInitialOnlineState() {
  const onlineValue = userStore.profile?.isOnLine
  if (onlineValue !== undefined && onlineValue !== null) {
    const resolved = String(onlineValue) === '1'
    localStorage.setItem(ONLINE_STATUS_STORAGE_KEY, String(resolved))
    return resolved
  }

  return localStorage.getItem(ONLINE_STATUS_STORAGE_KEY) !== 'false'
}

function resetOnlinePreparation() {
  isPreparingOnline.value = false
  isSwitchingOnlineStatus.value = false
  isOnlineSwitchRequestRunning = false
}

const handleOnlineChange = async (value: string | number | boolean) => {
  const nextValue = Boolean(value)
  if (isSwitchingOnlineStatus.value) return

  if (nextValue) {
    if (isOnlineRequested.value) return
    isPreparingOnline.value = true
    reconnectAttempts.value = 0
    startSse()
    return
  }

  if (!isOnlineRequested.value) return

  if (isPreparingOnline.value && !isOnline.value) {
    resetOnlinePreparation()
    closeSse(false)
    sseStatus.value = 'offline'
    return
  }

  isSwitchingOnlineStatus.value = true
  try {
    await switchWorkbenchOnlineStatus()
    persistOnlineState(false)
    closeSse(false)
    sseStatus.value = 'offline'
  } finally {
    resetOnlinePreparation()
  }
}

const toggleOnlineStatus = () => {
  void handleOnlineChange(!isOnlineRequested.value)
}

async function finalizeOnlineActivation() {
  if (!isPreparingOnline.value || isOnline.value || isOnlineSwitchRequestRunning) return

  isOnlineSwitchRequestRunning = true
  isSwitchingOnlineStatus.value = true
  try {
    await switchWorkbenchOnlineStatus()
    persistOnlineState(true)
    isPreparingOnline.value = false
    void prepareDesktopNotificationPermission()
  } catch {
    persistOnlineState(false)
    isPreparingOnline.value = false
    closeSse(false)
    sseStatus.value = 'offline'
  } finally {
    isSwitchingOnlineStatus.value = false
    isOnlineSwitchRequestRunning = false
  }
}

function startSse() {
  if (!isOnlineRequested.value) {
    resetOnlinePreparation()
    persistOnlineState(false)
    sseStatus.value = 'offline'
    return
  }

  closeSse(false)
  manualClose = false
  sseStatus.value = reconnectAttempts.value > 0 ? 'reconnecting' : 'connecting'
  activeStreamId += 1
  const streamId = activeStreamId

  const token = getToken()
  const langMap: Record<string, string> = {
    'zh-cn': 'zh_CN',
    lo: 'lo_LA',
    en: 'en_US'
  }
  const baseUrl = (import.meta.env.VITE_API_URL || '/lao-api').replace(/\/$/, '')
  const streamUrl = `${baseUrl}/resource/sse`

  sseConnection = connectSse(streamUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      clientid: import.meta.env.VITE_APP_CLIENT_ID || '',
      'content-language': langMap[localStorage.getItem('lang') || 'zh-cn'] || 'zh_CN'
    },
    onOpen: () => {
      if (streamId !== activeStreamId) return
      sseStatus.value = 'connected'
      reconnectAttempts.value = 0
      void finalizeOnlineActivation()
    },
    onMessage: (message) => {
      if (streamId !== activeStreamId) return
      handleSseMessage(message)
    },
    onError: () => {
      if (streamId !== activeStreamId) return
      sseStatus.value = 'error'
    },
    onClose: () => {
      if (streamId === activeStreamId && !manualClose) scheduleReconnect()
    }
  })
}

function closeSse(isUnmount: boolean) {
  manualClose = true
  activeStreamId += 1
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
  sseConnection?.close()
  sseConnection = undefined
  if (isUnmount) {
    manualClose = true
  }
}

function scheduleReconnect() {
  if (manualClose || !isOnlineRequested.value) return
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectAttempts.value += 1
  sseStatus.value = 'reconnecting'
  reconnectTimer = setTimeout(() => {
    startSse()
  }, Math.min(3000 + reconnectAttempts.value * 1000, 10000))
}

async function prepareDesktopNotificationPermission() {
  if (getDesktopNotificationPermission() !== 'default') {
    return
  }

  await requestDesktopNotificationPermission()
}

function notifyIncomingConsultation(item: PendingConsultation) {
  const title = t('common.tip') || 'Notice'
  const message = t('workbench.incomingConsultationNotification', {
    patientName: item.patientName || t('workbench.unknownPatient')
  })
  const notificationTag = [item.id, item.roomId || item.caseId].filter(Boolean).join('-')

  showDesktopNotification({
    title,
    body: message,
    tag: `pending-consultation-${notificationTag || item.id}`,
    onClick: (_event, notification) => {
      window.focus()
      notification.close()
    }
  })
}

async function handleSseMessage(message: SseMessage) {
  const payload = parsePayload(message.data)

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return

  const record = payload as Record<string, unknown>
  const patientId = record.patientId
  const caseId = record.caseId

  if (!patientId || !caseId) return

  try {
    const [patientResp, basicResp] = await Promise.all([
      getPatientDetail(patientId as string | number),
      getBasicInfo(caseId as string | number)
    ])

    const detail = (patientResp as any).data || {}
    const basicInfo = (basicResp as any).data || {}

    const incomingItem = normalizePendingItem({ ...record, ...basicInfo, ...detail }, message, 0)

    const isNew = !pendingPatients.value.some(
      (item) => item.id === incomingItem.id && item.roomId === incomingItem.roomId
    )

    pendingPatients.value = mergePendingItems(pendingPatients.value, [incomingItem]).slice(0, 8)

    if (isNew) {
      notifyIncomingConsultation(incomingItem)
      openIncomingAcceptDialog(incomingItem)
    }
  } catch (error) {
    console.error('Failed to fetch patient or basic details:', error)
  }
}

function parsePayload(raw: string): unknown {
  try {
    const normalizedRaw = raw.replace(
      /("(doctorAideId|doctorAidId|patientId|caseId|videoId)"\s*:\s*)(-?\d{16,})/g,
      '$1"$3"'
    )
    return JSON.parse(normalizedRaw)
  } catch {
    return raw
  }
}

function shouldReplaceQueue(payload: unknown): boolean {
  if (Array.isArray(payload)) return true
  if (payload && typeof payload === 'object') {
    return ['list', 'rows', 'items', 'queue', 'pendingList', 'waitingList', 'records'].some((key) =>
      Array.isArray((payload as Record<string, unknown>)[key])
    )
  }
  return false
}

function normalizePendingItems(payload: unknown, message: SseMessage): PendingConsultation[] {
  const sourceList = extractSourceList(payload)
  if (sourceList.length > 0) {
    return sourceList.map((item, index) => normalizePendingItem(item, message, index))
  }

  if (payload && typeof payload === 'object') {
    return [normalizePendingItem(payload as Record<string, unknown>, message, 0)]
  }

  if (typeof payload === 'string' && payload.trim()) {
    return [{
      id: `${message.id || message.event}-${Date.now()}`,
      patientName: t('workbench.realtimeMessagePatient'),
      queueNo: '--',
      complaint: payload.trim(),
      waitMinutes: 0,
      updatedAt: formatShortTime(Date.now()),
      departmentName: t('workbench.notAvailable'),
      sourceEvent: message.event
    }]
  }

  return []
}

function extractSourceList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const keys = ['list', 'rows', 'items', 'queue', 'pendingList', 'waitingList', 'records']
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[]
    }
    if (record.data && typeof record.data === 'object') return extractSourceList(record.data)
  }

  return []
}

function normalizePendingItem(item: Record<string, unknown>, message: SseMessage, index: number): PendingConsultation {
  const patientName =
    pickString(item, ['patientName', 'name', 'nickName', 'userName']) || t('workbench.unknownPatient')
  const patientId = pickString(item, ['patientId', 'patId'])
  const caseId = pickString(item, ['caseId', 'caseID', 'medicalCaseId'])
  const doctorAideId = pickString(item, ['doctorAideId', 'doctorAidId'])
  const roomId = pickString(item, ['roomId', 'channelId'])
  const queueNo = pickString(item, ['queueNo', 'queueNumber', 'serialNo', 'number', 'code']) || '--'
  const complaint =
    pickString(item, ['mainSuit', 'chiefComplaint', 'complaint', 'summary', 'reason', 'purpose']) ||
    t('workbench.pendingDefaultComplaint')
  const waitMinutes = pickNumber(item, ['waitMinutes', 'waitTime', 'elapsedMinutes']) || 0
  const updatedAt =
    pickString(item, ['appointmentTime', 'createTime', 'registerTime', 'updateTime']) || formatShortTime(Date.now())
  const departmentName =
    pickString(item, ['departmentName', 'deptName', 'clinicName']) || t('workbench.notAvailable')

  const ageData = pickNumber(item, ['age', 'patientAge']) || pickString(item, ['age', 'patientAge'])
  const sexData = pickString(item, ['patientSex', 'sex', 'gender'])
  const sexText = formatPatientSex(sexData)
  const historyIllness = pickString(item, ['historyIllness'])
  const previousHistory = pickString(item, ['previousHistory'])
  const allergichistory = pickString(item, ['allergichistory'])
  const familyhistory = pickString(item, ['familyhistory'])

  return {
    id:
      pickString(item, ['id', 'recordId', 'registrationId', 'patientId']) ||
      `${message.id || message.event}-${queueNo}-${index}`,
    patientName,
    queueNo,
    complaint,
    waitMinutes,
    updatedAt,
    departmentName,
    sourceEvent: message.event,
    age: ageData,
    sexText,
    patientId,
    caseId,
    doctorAideId,
    roomId,
    historyIllness,
    previousHistory,
    allergichistory,
    familyhistory,
    raw: item
  }
}

function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function pickNumber(item: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  }
  return 0
}

function formatReceptionPatientName(item: CurrentReceptionItem): string {
  const name = item.patientName?.trim() || t('workbench.unknownPatient')
  const sexText = formatPatientSex(item.patientSex)
  const extras = [sexText, formatAgeLabel(item.patientAge)].filter(Boolean)
  return extras.length ? `${name} (${extras.join(' ')})` : name
}

function formatPatientSex(value?: string): string {
  const normalizedValue = value?.trim().toLowerCase()
  if (normalizedValue === '0' || normalizedValue === 'male' || normalizedValue === '男') return t('workbench.male')
  if (normalizedValue === '1' || normalizedValue === 'female' || normalizedValue === '女') return t('workbench.female')
  return value?.trim() || ''
}

function formatDiagnosisStatus(value?: string): string {
  const normalizedValue = value?.trim()
  if (normalizedValue === '0' || normalizedValue === '未完成') return t('workbench.incompleteStatus')
  if (normalizedValue === '1' || normalizedValue === '已完成') return t('workbench.completedStatus')
  return value?.trim() || t('workbench.notAvailable')
}

function getDiagnosisStatusClass(value: string): string {
  if (value === t('workbench.completedStatus')) {
    return 'unfinished-progress--completed'
  }

  if (value === t('workbench.incompleteStatus')) {
    return 'unfinished-progress--incomplete'
  }

  return ''
}

function formatAgeLabel(value?: string | number): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return `${String(value).trim()}${t('workbench.ageSuffix')}`
}

function formatReceptionVisitDate(value?: string): string {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return new Intl.DateTimeFormat(resolveLocale(), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function resolveChannelId(data: unknown): string {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (typeof data === 'number') return String(data)

  if (data && typeof data === 'object') {
    return pickString(data as Record<string, unknown>, ['channelId', 'roomId', 'id', 'data'])
  }

  return ''
}

function mergePendingItems(current: PendingConsultation[], incoming: PendingConsultation[]): PendingConsultation[] {
  const next = [...current]
  incoming.forEach((item) => {
    const existingIndex = next.findIndex((currentItem) => currentItem.id === item.id)
    if (existingIndex >= 0) {
      next.splice(existingIndex, 1, item)
    } else {
      next.unshift(item)
    }
  })
  return next
}

function formatWaitMinutes(minutes: number): string {
  if (minutes <= 0) return t('workbench.justNow')
  return t('workbench.waitMinutes', { count: minutes })
}

function formatPendingDisplayTime(item: PendingConsultation): string {
  const parsedDate = parseDateValue(item.updatedAt)
  if (parsedDate) {
    return formatShortTime(parsedDate.getTime())
  }

  return item.updatedAt || t('workbench.justNow')
}

function parseDateValue(value?: string): Date | null {
  if (!value) {
    return null
  }

  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return null
  }

  const parsed = new Date(normalizedValue)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

function formatShortTime(timestamp: number): string {
  return new Intl.DateTimeFormat(resolveLocale(), {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp))
}

function resolveLocale(): string {
  if (locale.value === 'zh-cn') return 'zh-CN'
  if (locale.value === 'lo') return 'lo-LA'
  if (locale.value === 'en') return 'en-US'
  return 'zh-CN'
}

function getAvatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #4f8cff 0%, #67c8ff 100%)',
    'linear-gradient(135deg, #ff7ab6 0%, #ffb36b 100%)',
    'linear-gradient(135deg, #26c2a3 0%, #8be6c3 100%)',
    'linear-gradient(135deg, #7d88ff 0%, #b19cff 100%)'
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}
</script>

<style lang="scss" scoped>
.workbench-shell {
  --surface: #ffffff;
  --surface-soft: #f8fbff;
  --surface-muted: #f3f7fb;
  --border: #e5edf6;
  --border-strong: #d9e4ef;
  --text-main: #1d2f42;
  --text-sub: #6c7d91;
  --text-soft: #8b9caf;
  --primary: #1f78ff;
  --primary-soft: #edf5ff;
  --success: #10b981;
  --warning: #f59e0b;
  --violet: #8b5cf6;

  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 5px;
  padding: 5px 8px 5px 5px;
  min-width: 0;
}

.workbench-main,
.workbench-side {
  height: calc(100vh - 60px);
  overflow: hidden;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.overview-banner,
.metric-card,
.panel,
.doctor-card {
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.overview-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px;
  border-radius: 10px;
  animation: rise-in 0.45s ease both;
}

.overview-copy {
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.panel-kicker,
.doctor-role-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
}

.overview-title {
  margin: 0;
  color: var(--text-main);
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.overview-description {
  margin: 0;
  max-width: 640px;
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1.75;
}

.online-action-btn {
  min-width: 118px;
  min-height: 38px;
  box-shadow: 0 8px 18px rgba(31, 120, 255, 0.12);
}

.online-action-btn.is-online {
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.12);
}

.control-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  animation: rise-in 0.5s ease both;
}

.metric-card:nth-child(2) {
  animation-delay: 0.04s;
}

.metric-card:nth-child(3) {
  animation-delay: 0.08s;
}

.metric-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 20px;
  flex-shrink: 0;
}

.metric-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
}

.metric-value {
  color: var(--text-main);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.metric-hint {
  margin: 0;
  font-size: 12px;
}

.metric-card.is-sky .metric-icon {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary);
}

.metric-card.is-amber .metric-icon {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.metric-card.is-violet .metric-icon {
  background: rgba(139, 92, 246, 0.14);
  color: var(--violet);
}

.metric-card.is-sky .metric-hint {
  color: #16a34a;
}

.metric-card.is-amber .metric-hint {
  color: #ea580c;
}

.metric-card.is-violet .metric-hint {
  color: var(--text-sub);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 5px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.panel {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  border-radius: 10px;
  animation: rise-in 0.55s ease both;
}

.unfinished-panel {
  height: 100%;
  min-height: 0;
  animation-delay: 0.05s;
}

.unfinished-panel .panel-header {
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading {
  min-width: 0;
}

.panel-description {
  margin: 6px 0 0;
  color: var(--text-sub);
  font-size: 12px;
  line-height: 1.6;
}

.queue-list,
.unfinished-list,
.doctor-details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  min-height: 0;
}

.panel-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 700;
}

.control-status {
  position: relative;
  min-height: 36px;
  padding: 0 14px;
  box-shadow: 0 8px 20px rgba(31, 120, 255, 0.08);
}

.control-status.is-highlighted {
  animation: status-pulse 1.8s ease-in-out infinite;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--text-soft);
}

.control-status .status-dot {
  animation: status-dot-pulse 1.4s ease-in-out infinite;
}

.panel-status.is-connected {
  border-color: rgba(16, 185, 129, 0.16);
  color: #0f9f6e;
}

.panel-status.is-connected .status-dot {
  background: var(--success);
}

.panel-status.is-connecting,
.panel-status.is-reconnecting {
  border-color: rgba(59, 130, 246, 0.14);
  color: var(--primary);
}

.panel-status.is-connecting .status-dot,
.panel-status.is-reconnecting .status-dot {
  background: var(--primary);
}

.panel-status.is-error {
  border-color: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.panel-status.is-error .status-dot {
  background: var(--warning);
}

.panel-status.is-offline {
  border-color: rgba(148, 163, 184, 0.2);
  color: var(--text-sub);
}

.panel-status.is-offline.control-status {
  box-shadow: none;
  animation: none;
}

.panel-status.is-offline.control-status .status-dot {
  animation: none;
}

.unfinished-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.unfinished-list::-webkit-scrollbar {
  width: 6px;
}

.unfinished-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.55);
}

.unfinished-list::-webkit-scrollbar-track {
  background: transparent;
}

.queue-card,
.unfinished-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid var(--border);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.queue-card:hover,
.unfinished-card:hover {
  transform: translateY(-2px);
  border-color: #d3e4f7;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.06);
}

.patient-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.queue-content,
.unfinished-content {
  flex: 1;
  min-width: 0;
}

.queue-header h4,
.unfinished-top h4,
.doctor-name {
  margin: 0;
  color: var(--text-main);
  font-size: 16px;
}

.queue-header p,
.doctor-tagline {
  margin: 6px 0 0;
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.6;
}

.unfinished-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.unfinished-result {
  margin: 8px 0 0;
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.7;
}

.queue-header p.info-row span {
  color: var(--text-sub);
}

.patient-tag {
  font-size: 12px;
  color: var(--text-sub);
  margin-left: 6px;
  font-weight: normal;
}

.queue-no {
  min-width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--text-main);
  font-size: 18px;
  font-weight: 700;
}

.queue-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.queue-meta span,
.unfinished-progress {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: #62758a;
  font-size: 11px;
}

.unfinished-progress--incomplete {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.unfinished-progress--completed {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #16a34a;
}

.unfinished-meta {
  margin-top: 12px;
}

.unfinished-time-chip {
  gap: 6px;
  color: var(--primary) !important;
  background: rgba(59, 130, 246, 0.08) !important;
  border-color: rgba(59, 130, 246, 0.12) !important;
}

.queue-action {
  min-width: 84px;
  min-height: 36px;
  justify-self: end;
}

.continue-action {
  --el-button-bg-color: #d85a2b;
  --el-button-border-color: #d85a2b;
  --el-button-hover-bg-color: #c94f23;
  --el-button-hover-border-color: #c94f23;
  --el-button-active-bg-color: #b9461f;
  --el-button-active-border-color: #b9461f;
  --el-button-disabled-bg-color: rgba(216, 90, 43, 0.55);
  --el-button-disabled-border-color: rgba(216, 90, 43, 0.45);
  color: #fff;
}

.continue-action:hover,
.continue-action:focus {
  background: #c94f23;
  border-color: #c94f23;
  color: #fff;
}

.continue-action:active {
  background: #b9461f;
  border-color: #b9461f;
  color: #fff;
}

.detail-action {
  --el-button-bg-color: #357efe;
  --el-button-border-color: #357efe;
  --el-button-hover-bg-color: #246fe8;
  --el-button-hover-border-color: #246fe8;
  --el-button-active-bg-color: #1d62d2;
  --el-button-active-border-color: #1d62d2;
  background: #357efe !important;
  border-color: #357efe !important;
  color: #fff !important;
}

.detail-action:hover,
.detail-action:focus {
  background: #246fe8 !important;
  border-color: #246fe8 !important;
  color: #fff !important;
}

.detail-action:active {
  background: #1d62d2 !important;
  border-color: #1d62d2 !important;
  color: #fff !important;
}

.secondary-action {
  border-color: #d9e5f2;
  color: var(--text-main);
  background: linear-gradient(180deg, #ffffff 0%, #f6f9fd 100%);
}

.empty-state {
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 18px;
  border: 1px dashed var(--border-strong);
  border-radius: 18px;
}

.empty-icon {
  font-size: 34px;
  color: var(--primary);
}

.empty-state h4 {
  margin: 12px 0 0;
  color: var(--text-main);
  font-size: 16px;
}

.empty-state p {
  margin: 8px 0 0;
  max-width: 300px;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.6;
}

.doctor-card {
  flex: 1;
  position: sticky;
  top: 0;
  padding: 18px;
  border-radius: 10px;
  animation: rise-in 0.6s ease both 0.08s;
}

.doctor-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 0 16px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.doctor-avatar-wrap {
  width: 112px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(29, 116, 255, 0.08) 0%, rgba(103, 200, 255, 0.12) 100%);
}

.doctor-avatar {
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #fff;
  font-size: 32px;
  font-weight: 700;
}

.doctor-name {
  font-size: 30px;
  line-height: 1.06;
}

.detail-item label {
  color: var(--text-soft);
}

.doctor-details {
  gap: 10px;
}

.detail-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
}

.detail-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--primary-soft);
  color: var(--primary);
}

.detail-item div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item strong {
  color: #24364a;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes status-pulse {

  0%,
  100% {
    box-shadow: 0 8px 20px rgba(31, 120, 255, 0.08);
    opacity: 1;
  }

  50% {
    box-shadow: 0 12px 24px rgba(31, 120, 255, 0.18);
    opacity: 0.94;
  }
}

@keyframes status-dot-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.35);
    opacity: 0.72;
  }
}

@media (max-width: 1280px) {
  .workbench-shell {
    grid-template-columns: 1fr;
  }

  .doctor-card {
    position: static;
  }
}

@media (max-width: 1080px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .overview-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-copy {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .metrics-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {

  .overview-banner,
  .panel,
  .doctor-card {
    padding: 14px;
    border-radius: 16px;
  }

  .overview-title {
    font-size: 24px;
  }

  .control-actions,
  .panel-header,
  .queue-header,
  .unfinished-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .queue-card,
  .unfinished-card {
    grid-template-columns: 1fr;
  }

  .queue-action {
    justify-self: stretch;
  }
}

:deep(.accept-request-dialog) {
  border-radius: 20px !important;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
  animation: accept-dialog-pop 0.34s cubic-bezier(0.18, 0.89, 0.32, 1.18) both;
}

:deep(.accept-request-dialog .el-dialog__header) {
  display: none;
}

:deep(.accept-request-dialog .el-dialog__body) {
  padding: 40px 30px;
}

.accept-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.accept-avatar {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8da1 0%, #ff527f 100%);
  color: #ffffff;
  font-size: 40px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(255, 82, 127, 0.3);
  margin-bottom: 24px;
  animation: accept-avatar-pulse 1.8s ease-in-out infinite;
}

.accept-avatar::before,
.accept-avatar::after {
  position: absolute;
  inset: -10px;
  content: '';
  border-radius: inherit;
  border: 2px solid rgba(255, 82, 127, 0.34);
  animation: accept-avatar-ring 1.8s ease-out infinite;
}

.accept-avatar::after {
  animation-delay: 0.55s;
}

.accept-title {
  margin: 0 0 32px;
  color: #1a2533;
  font-size: 20px;
  font-weight: bold;
}

.accept-actions {
  display: flex;
  width: 100%;
  gap: 16px;
}

.action-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
}

.reject-btn {
  border: 1px solid #e2e8f0;
  color: #ff527f;
  background: #ffffff;
}

.reject-btn:hover {
  background: #fff0f3;
  border-color: #ffadbf;
  color: #ff3b6a;
}

.resolve-btn {
  position: relative;
  overflow: hidden;
  transform: scale(1.04);
  background: #10b981;
  border: none;
  color: #ffffff;
  box-shadow:
    0 0 0 0 rgba(16, 185, 129, 0.42),
    0 14px 28px rgba(16, 185, 129, 0.38);
  animation: accept-btn-pulse 1.25s ease-in-out infinite;
}

.resolve-btn:hover {
  background: #0ca372;
  transform: translateY(-1px) scale(1.06);
  box-shadow:
    0 0 0 8px rgba(16, 185, 129, 0.14),
    0 18px 34px rgba(16, 185, 129, 0.46);
}

.resolve-btn::after {
  position: absolute;
  inset: -55% auto -55% -80%;
  width: 58%;
  content: '';
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  transform: skewX(-18deg);
  animation: accept-btn-shine 1.35s ease-in-out infinite;
  pointer-events: none;
}

.resolve-btn .el-icon,
.reject-btn .el-icon {
  margin-right: 6px;
  font-size: 18px;
}

@keyframes accept-dialog-pop {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes accept-avatar-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(255, 82, 127, 0.3);
  }

  50% {
    transform: scale(1.06);
    box-shadow: 0 14px 34px rgba(255, 82, 127, 0.42);
  }
}

@keyframes accept-avatar-ring {
  0% {
    opacity: 0.8;
    transform: scale(0.92);
  }

  100% {
    opacity: 0;
    transform: scale(1.34);
  }
}

@keyframes accept-btn-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 0 rgba(16, 185, 129, 0.44),
      0 14px 28px rgba(16, 185, 129, 0.38);
  }

  50% {
    box-shadow:
      0 0 0 10px rgba(16, 185, 129, 0.12),
      0 22px 40px rgba(16, 185, 129, 0.48);
  }
}

@keyframes accept-btn-shine {
  0% {
    left: -65%;
  }

  52%,
  100% {
    left: 124%;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.accept-request-dialog),
  .accept-avatar,
  .accept-avatar::before,
  .accept-avatar::after,
  .resolve-btn,
  .resolve-btn::after {
    animation: none;
  }
}
</style>
