<template>
  <section class="doctor-consultation-page">
    <div v-if="pageError" class="consultation-error-state">
      <div class="error-card">
        <el-icon class="error-icon"><warning-filled /></el-icon>
        <h2>{{ t('doctorVideo.consultation.errorTitle') }}</h2>
        <p>{{ pageError }}</p>
        <el-button type="primary" @click="goBackToWorkbench">
          {{ t('doctorVideo.consultation.backWorkbench') }}
        </el-button>
      </div>
    </div>

    <div v-else class="consultation-layout">
      <consult-subtitle-timeline
        class="subtitle-column"
        :items="timeline.items.value"
        :loading="session.subtitleLoading.value"
        :error="''"
        :on-retry="retrySubtitle"
        :update-scroll-state="timeline.updateScrollState"
        :scroll-to-latest-if-needed="timeline.scrollToLatestIfNeeded"
        :scroll-version="timeline.scrollVersion.value"
        :chat-draft="chatDraft"
        :chat-sending="chatSending"
        :chat-input-disabled="chatInputDisabled"
        :chat-send-disabled="chatSendDisabled"
        :chat-status-text="chatStatusText"
        :translation-enabled="translationEnabled"
        :on-chat-input="handleChatInput"
        :on-chat-send="handleChatSend"
      />

      <section class="video-column">
        <div class="featured-stage">
          <div class="stage-pill">
            <span class="stage-dot" />
            <span>{{ t('doctorVideo.consultation.inCall') }}</span>
            <span>{{ consultationDuration }}</span>
          </div>

          <div v-if="session.connectionError.value" class="connection-banner">
            {{ session.connectionError.value }}
          </div>

          <div class="preview-row">
            <consult-participant-card
              :user-name="previewParticipant.userName"
              :track="previewParticipant.track"
              :muted="previewParticipant.muted"
              :speaking="previewParticipant.speaking"
              :badge="previewParticipant.track ? '' : previewParticipant.placeholderBadge"
              :mirror="previewParticipantRole === 'doctor'"
              compact
              @click="toggleFeaturedParticipant"
            />
          </div>

          <consult-participant-card
            class="featured-card"
            :user-name="featuredParticipant.userName"
            :track="featuredParticipant.track"
            :muted="featuredParticipant.muted"
            :speaking="featuredParticipant.speaking"
            :badge="featuredParticipant.track ? '' : featuredParticipant.placeholderBadge"
            :mirror="featuredParticipantRole === 'doctor'"
            :show-status="false"
          />


          <div class="stage-controls">
            <consult-room-controls
              :camera-enabled="session.cameraEnabled.value"
              :mic-enabled="session.micEnabled.value"
              :on-toggle-camera="session.toggleCamera"
              :on-switch-camera="openCameraSwitchDialog"
              :on-toggle-mic="session.toggleMic"
              :on-leave="handleLeave"
              :camera-switching="session.cameraSwitching.value"
              show-camera
            />
          </div>
        </div>

        <footer class="session-summary">
          <div class="doctor-panel">
            <img class="doctor-avatar" :src="doctorAvatarImage" alt="" />

            <div class="doctor-copy">
              <div class="doctor-heading">
                <strong>{{ doctorName }}</strong>
                <span v-if="session.joined.value" class="doctor-status">
                  {{ t('doctorVideo.consultation.connected') }}
                </span>
              </div>

              <p v-if="doctorGoodAt" class="doctor-good-at">
                <span>{{ t('doctorVideo.consultation.goodAt') }}:</span>
                {{ doctorGoodAt }}
              </p>
            </div>
          </div>
        </footer>
      </section>

      <aside class="record-column">
        <div class="record-shell">
          <el-tabs v-model="activeTab" class="record-tabs" stretch>
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.outpatient')" name="outpatient" />
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.fourDiagnoses')" name="fourDiagnoses" />
            <el-tab-pane :label="t('doctorVideo.consultation.tabs.history')" name="history" />
          </el-tabs>

          <div v-if="activeTab === 'outpatient'" class="record-content">
            <button
              type="button"
              class="ai-button"
              :disabled="generatingMedicalRecord"
              @click="handleGenerateMedicalRecord"
            >
              {{ generatingMedicalRecord ? t('doctorVideo.consultation.aiGenerating') : t('doctorVideo.consultation.aiGenerate') }}
            </button>

            <section class="record-section">
              <h3>{{ t('doctorVideo.consultation.basicInfo') }}</h3>

              <div class="compact-info-row">
                <div v-for="field in basicInfoFields" :key="field.label" class="compact-info-item">
                  <span class="compact-label">{{ field.label }}：</span>
                  <span class="compact-value">{{ field.value }}</span>
                </div>
              </div>
            </section>

            <section class="record-section">
              <el-form :model="outpatientRecordForm" label-position="top" class="compact-history-form">
                <el-form-item :label="t('doctorVideo.consultation.chiefComplaint')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.chiefComplaint"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.chiefComplaint'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.currentHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.currentHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.currentHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.pastHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.pastHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.pastHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.allergyHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.allergyHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.allergyHistory'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.familyHistory')" class="compact-form-item">
                  <el-input
                    v-model="outpatientRecordForm.familyHistory"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.familyHistory'))"
                  />
                </el-form-item>
              </el-form>
            </section>

            <section class="record-section">
              <h3>{{ t('doctorVideo.consultation.diagnosisFormTitle') }}</h3>
              <el-form :model="diagnosisForm" :rules="diagnosisRules" ref="diagnosisFormRef" label-position="top" class="compact-diagnosis-form">
                <el-form-item :label="t('doctorVideo.consultation.diagnosis')" prop="diseaseNameCn" class="compact-form-item">
                  <el-input
                    v-model="diagnosisForm.diseaseNameCn"
                    :placeholder="resolveInputPlaceholder(t('doctorVideo.consultation.diagnosis'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.check')" prop="syndromeTypeCn" class="compact-form-item">
                  <el-input
                    v-model="diagnosisForm.syndromeTypeCn"
                    :placeholder="resolveInputPlaceholder(t('doctorVideo.consultation.check'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.therapy')" prop="therapyCn" class="compact-form-item">
                  <el-input
                    type="textarea"
                    :rows="2"
                    resize="none"
                    v-model="diagnosisForm.therapyCn"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.therapy'))"
                  />
                </el-form-item>
                <el-form-item :label="t('doctorVideo.consultation.advice')" prop="adviceCn" class="compact-form-item">
                  <el-input
                    type="textarea"
                    :rows="2"
                    resize="none"
                    v-model="diagnosisForm.adviceCn"
                    :placeholder="resolveTextareaPlaceholder(t('doctorVideo.consultation.advice'))"
                  />
                </el-form-item>
                <div class="submit-btn-wrapper">
                  <el-button type="primary" :loading="submittingDiagnosis" @click="onSubmitDiagnosis" style="width: 100%;">
                    {{ t('doctorVideo.consultation.submitDiagnosis') }}
                  </el-button>
                </div>
              </el-form>
            </section>
          </div>

          <div v-else-if="activeTab === 'history'" class="record-content">
            <div v-if="historyCaseLoading" class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseLoadingTitle') }}</h3>
              <p>{{ t('doctorVideo.consultation.historyCaseLoadingDescription') }}</p>
            </div>

            <div v-else-if="historyCaseError" class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseErrorTitle') }}</h3>
              <p>{{ historyCaseError }}</p>
            </div>

            <div v-else-if="historyCaseList.length" class="history-case-list">
              <article v-for="item in historyCaseList" :key="`${item.caseId}-${item.date}`" class="history-case-card">
                <div class="history-case-head">
                  <strong>{{ item.departmentName || t('workbench.notAvailable') }}</strong>
                  <span>{{ formatHistoryCaseDate(item.date) }}</span>
                </div>

                <div class="history-case-meta">
                  <span>{{ t('doctorVideo.consultation.historyCaseId') }}: {{ item.caseId || '--' }}</span>
                </div>

                <p class="history-case-diagnosis">
                  {{ t('workbench.diagnosisLabel') }}{{ item.diagnosis || t('doctorVideo.consultation.notFilled') }}
                </p>
              </article>
            </div>

            <div v-else class="empty-record-state">
              <h3>{{ t('doctorVideo.consultation.historyCaseEmptyTitle') }}</h3>
              <p>{{ t('doctorVideo.consultation.historyCaseEmptyDescription') }}</p>
            </div>
          </div>

          <div v-else class="empty-record-state">
            <h3>{{ t('doctorVideo.consultation.noCaseTitle') }}</h3>
            <p>{{ t('doctorVideo.consultation.noCaseDescription') }}</p>
          </div>
        </div>
      </aside>
    </div>

    <consult-camera-select-dialog
      v-model="cameraDialogVisible"
      :devices="session.cameraDevices.value"
      :selected-device-id="session.selectedCameraId.value"
      :loading="session.cameraDeviceLoading.value"
      :switching="session.cameraSwitching.value"
      :initial-required="cameraDialogRequired"
      @confirm="handleCameraSelectionConfirm"
      @refresh="refreshCameraDevices"
    />
  </section>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { addWrittenRecord, translateConsultationText } from '@/api/patient'
import type { ConsultationMode, GenerateMedicalRecordData } from '@/api/types'
import { generateMedicalRecord, getCaseList, getVideoConversation, getVideoId, getVideoTime, getVideoToken, saveSubtitle, submitDiagnosis } from '@/api/video'
import doctorAvatarImage from '@/assets/doctor_avatar.png'
import { useUserStore } from '@/stores/user'
import { showConfirmDialog } from '@/utils/confirm-dialog'
import ConsultCameraSelectDialog from './components/ConsultCameraSelectDialog.vue'
import ConsultParticipantCard from './components/ConsultParticipantCard.vue'
import ConsultRoomControls from './components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from './components/ConsultSubtitleTimeline.vue'
import { createDoctorConsultationChatService } from './services/consultation-chat'
import { useDoctorConsultationSession } from './composables/useDoctorConsultationSession'
import { useDoctorSubtitleTimeline } from './composables/useDoctorSubtitleTimeline'
import type {
  ConsultationChatPayload,
  ConsultationMessageType,
  DoctorRtcContext,
  SubtitleTimelineItem
} from './types'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'
const DOCTOR_RTC_CONTEXT_KEY = 'doctor_rtc_context'

interface ConsultationHistoryItem {
  messageType: ConsultationMessageType
  isDoctor: 0 | 1 | 2
  contentCn: string
  contentLo: string
  timestamp: number
  sequence: number
}

interface HistoryCaseRecord {
  caseId: string
  departmentName: string
  diagnosis: string
  date: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { locale, t } = useI18n()
const session = useDoctorConsultationSession()
const activeTab = ref('outpatient')
const pageError = ref('')
const consultationDuration = ref('00:00:00')
const consultationContext = ref<DoctorRtcContext>({})
const savedSubtitleKeys = new Set<string>()
const chatDraft = ref('')
const chatSending = ref(false)
const historyCaseList = ref<HistoryCaseRecord[]>([])
const historyCaseLoading = ref(false)
const historyCaseError = ref('')
const generatingMedicalRecord = ref(false)
const cameraDialogVisible = ref(false)
const cameraDialogRequired = ref(false)
const featuredParticipantRole = ref<'doctor' | 'patient'>('patient')
let durationTimer = 0
let durationStartedAt = 0
let durationRequestId = 0
let pendingInitialCameraSelection: ((deviceId: string) => void) | null = null
let leavingInProgress = false

const normalizeConsultationMode = (value: unknown): ConsultationMode => {
  return value === 'continue' ? 'continue' : 'accept'
}

const normalizeConsultationLang = (value: unknown): 'lo' | 'cn' | undefined => {
  const normalizedValue = value !== null && value !== undefined ? String(value).trim().toLowerCase() : ''
  if (normalizedValue === 'cn' || normalizedValue === 'zh-cn' || normalizedValue === 'zh') return 'cn'
  if (normalizedValue === 'lo' || normalizedValue === 'lo-la' || normalizedValue === 'lao') return 'lo'
  return undefined
}

const queryValue = (key: string) => {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

const loadConsultationContext = () => {
  try {
    const raw = sessionStorage.getItem(DOCTOR_RTC_CONTEXT_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    consultationContext.value = {
      ...parsed,
      consultationMode: normalizeConsultationMode(parsed?.consultationMode)
    }
  } catch {
    consultationContext.value = {}
  }
}

const doctorId = computed(() => {
  const userId = userStore.profile?.userId
  return userId !== null && userId !== undefined ? String(userId) : userStore.name || ''
})

const doctorName = computed(() => {
  return userStore.profile?.nickName || userStore.nickname || userStore.name || t('workbench.unknownDoctor')
})

const doctorGoodAt = computed(() => {
  const profile = userStore.profile
  const value =
    profile?.goodAt ||
    profile?.specialty ||
    profile?.speciality ||
    profile?.expertise ||
    profile?.description ||
    ''

  return value !== null && value !== undefined ? String(value).trim() : ''
})

const roomId = computed(() => {
  const storedRoomId = consultationContext.value.roomId
  if (storedRoomId !== null && storedRoomId !== undefined && String(storedRoomId).trim() !== '') {
    return String(storedRoomId).trim()
  }

  return queryValue('roomId')
})
const caseId = computed(() => {
  const storedCaseId = consultationContext.value.caseId
  return storedCaseId !== null && storedCaseId !== undefined && String(storedCaseId).trim() !== ''
    ? String(storedCaseId)
    : queryValue('caseId')
})
const videoId = computed(() => {
  const storedVideoId = consultationContext.value.videoId
  return storedVideoId !== null && storedVideoId !== undefined && String(storedVideoId).trim() !== ''
    ? String(storedVideoId)
    : queryValue('videoId')
})
const patientId = computed(() => {
  const storedPatientId = consultationContext.value.patientId
  return storedPatientId !== null && storedPatientId !== undefined && String(storedPatientId).trim() !== ''
    ? String(storedPatientId)
    : queryValue('patientId')
})
const doctorAideId = computed(() => {
  const storedDoctorAideId = consultationContext.value.doctorAideId
  return storedDoctorAideId !== null && storedDoctorAideId !== undefined && String(storedDoctorAideId).trim() !== ''
    ? String(storedDoctorAideId)
    : queryValue('doctorAideId')
})
const consultationMode = computed<ConsultationMode>(() => {
  const queryMode = queryValue('consultationMode')
  if (queryMode) {
    return normalizeConsultationMode(queryMode)
  }

  return normalizeConsultationMode(consultationContext.value.consultationMode)
})
const isContinueConsultation = computed(() => consultationMode.value === 'continue')
const consultationLang = computed<'lo' | 'cn'>(() => {
  return (
    normalizeConsultationLang(queryValue('consultationLang')) ||
    normalizeConsultationLang(consultationContext.value.consultationLang) ||
    'lo'
  )
})
const translationEnabled = computed(() => consultationLang.value === 'lo')

const patientName = computed(() => {
  return consultationContext.value.patientName || queryValue('patientId') || t('workbench.unknownPatient')
})

const doctorPreviewBadge = computed(() => t('doctorVideo.consultation.selfBadge'))
const waitingPatientBadge = computed(() => t('doctorVideo.consultation.waitingPatient'))

const buildPlaceholderParticipant = (userId: string, userName: string, placeholderBadge: string) => ({
  userId,
  userName,
  track: null,
  muted: true,
  speaking: false,
  placeholderBadge
})

const findRemoteParticipant = (userId: string) => {
  const normalizedUserId = userId?.trim()
  if (!normalizedUserId) {
    return null
  }

  return session.remoteParticipants.value.find((participant) => participant.userId === normalizedUserId) || null
}

const patientStageParticipant = computed(() => {
  const expectedPatientId = patientId.value
  return (
    findRemoteParticipant(expectedPatientId) ||
    (!expectedPatientId ? session.remoteParticipants.value.find((participant) => participant.track) : null) ||
    buildPlaceholderParticipant(
      expectedPatientId || 'patient-placeholder',
      patientName.value,
      waitingPatientBadge.value
    )
  )
})

const doctorSelfParticipant = computed(() => ({
  userId: session.channelContext.value?.userId || doctorId.value || 'doctor',
  userName: doctorName.value,
  track: session.localPreviewTrack.value,
  muted: !session.micEnabled.value,
  speaking: false,
  placeholderBadge: doctorPreviewBadge.value
}))

const featuredParticipant = computed(() => {
  return featuredParticipantRole.value === 'patient' ? patientStageParticipant.value : doctorSelfParticipant.value
})

const previewParticipantRole = computed<'doctor' | 'patient'>(() => {
  return featuredParticipantRole.value === 'patient' ? 'doctor' : 'patient'
})

const previewParticipant = computed(() => {
  return previewParticipantRole.value === 'patient' ? patientStageParticipant.value : doctorSelfParticipant.value
})

const featuredCaptionText = computed(() => {
  return featuredParticipantRole.value === 'patient'
    ? `${t('doctorVideo.consultation.patientPrefix')}${patientName.value}`
    : doctorName.value
})

const toggleFeaturedParticipant = () => {
  featuredParticipantRole.value = previewParticipantRole.value
}

const resolveInputPlaceholder = (label: string) => {
  return t('doctorVideo.consultation.inputPlaceholder', { label })
}

const resolveTextareaPlaceholder = (label: string) => {
  return t('doctorVideo.consultation.textareaPlaceholder', { label })
}

const resolveContextText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const formatMarriage = (value: unknown) => {
  const text = resolveContextText(value).toLowerCase()

  if (text === '0') {
    return t('assistant.caseResult.unmarried')
  }

  if (text === '1') {
    return t('assistant.caseResult.married')
  }

  return resolveContextText(value)
}

const normalizeHistoryCaseList = (value: unknown): HistoryCaseRecord[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      return {
        caseId: resolveContextText(record.caseId),
        departmentName: resolveContextText(record.departmentName),
        diagnosis: resolveContextText(record.diagnosis),
        date: resolveContextText(record.date)
      }
    })
    .filter((item): item is HistoryCaseRecord => Boolean(item))
}

const formatHistoryCaseDate = (value: string) => {
  if (!value) {
    return t('workbench.notAvailable')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(resolveUiLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const basicInfoFields = computed(() => [
  {
    label: t('doctorVideo.consultation.name'),
    value: patientName.value
  },
  {
    label: t('doctorVideo.consultation.gender'),
    value: consultationContext.value.sexText || t('workbench.notAvailable')
  },
  {
    label: t('doctorVideo.consultation.age'),
    value:
      consultationContext.value.age !== null &&
      consultationContext.value.age !== undefined &&
      String(consultationContext.value.age).trim() !== ''
        ? String(consultationContext.value.age).trim()
        : t('workbench.notAvailable')
  },
  {
    label: t('doctorVideo.consultation.marriage'),
    value: formatMarriage(consultationContext.value.marriage) || t('doctorVideo.consultation.notFilled')
  },
  {
    label: t('doctorVideo.consultation.occupation'),
    value: resolveContextText(consultationContext.value.occupation) || t('doctorVideo.consultation.notFilled')
  }
])

const outpatientRecordForm = reactive({
  chiefComplaint: '',
  currentHistory: '',
  pastHistory: '',
  allergyHistory: '',
  familyHistory: ''
})

const diagnosisFormRef = ref<FormInstance>()
const diagnosisForm = ref({
  diseaseNameCn: '',
  syndromeTypeCn: '',
  therapyCn: '',
  adviceCn: ''
})

const diagnosisRules = computed<FormRules>(() => ({
  diseaseNameCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.diagnosis')), trigger: 'blur' }],
  syndromeTypeCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.check')), trigger: 'blur' }],
  therapyCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.therapy')), trigger: 'blur' }],
  adviceCn: [{ required: true, message: resolveInputPlaceholder(t('doctorVideo.consultation.advice')), trigger: 'blur' }]
}))

const submittingDiagnosis = ref(false)

const syncOutpatientRecordForm = () => {
  outpatientRecordForm.chiefComplaint = resolveContextText(consultationContext.value.complaint)
  outpatientRecordForm.currentHistory = resolveContextText(consultationContext.value.historyIllness)
  outpatientRecordForm.pastHistory = resolveContextText(consultationContext.value.previousHistory)
  outpatientRecordForm.allergyHistory = resolveContextText(consultationContext.value.allergichistory)
  outpatientRecordForm.familyHistory = resolveContextText(consultationContext.value.familyhistory)
}

const persistConsultationContext = (payload: Partial<DoctorRtcContext>) => {
  consultationContext.value = {
    ...consultationContext.value,
    ...payload
  }

  try {
    sessionStorage.setItem(DOCTOR_RTC_CONTEXT_KEY, JSON.stringify(consultationContext.value))
  } catch {
    undefined
  }
}

const resolveGeneratedRecordText = (
  record: GenerateMedicalRecordData,
  fieldName: 'mainSuit' | 'historyIllness' | 'previousHistory' | 'allergichistory' | 'familyhistory'
) => {
  const preferLao = locale.value === 'lo'
  const localizedKey = `${fieldName}${preferLao ? 'Lo' : 'Cn'}` as keyof GenerateMedicalRecordData
  const fallbackKey = `${fieldName}${preferLao ? 'Cn' : 'Lo'}` as keyof GenerateMedicalRecordData

  return takeOptionalText(record[localizedKey]) || takeOptionalText(record[fallbackKey])
}

const resolveUiLocale = () => {
  if (locale.value === 'zh-cn') return 'zh-CN'
  if (locale.value === 'lo') return 'lo-LA'
  if (locale.value === 'en') return 'en-US'
  return 'zh-CN'
}

const applyGeneratedMedicalRecord = (record: GenerateMedicalRecordData) => {
  const chiefComplaint = resolveGeneratedRecordText(record, 'mainSuit')
  const currentHistory = resolveGeneratedRecordText(record, 'historyIllness')
  const pastHistory = resolveGeneratedRecordText(record, 'previousHistory')
  const allergyHistory = resolveGeneratedRecordText(record, 'allergichistory')
  const familyHistory = resolveGeneratedRecordText(record, 'familyhistory')

  outpatientRecordForm.chiefComplaint = chiefComplaint
  outpatientRecordForm.currentHistory = currentHistory
  outpatientRecordForm.pastHistory = pastHistory
  outpatientRecordForm.allergyHistory = allergyHistory
  outpatientRecordForm.familyHistory = familyHistory

  persistConsultationContext({
    complaint: chiefComplaint,
    historyIllness: currentHistory,
    previousHistory: pastHistory,
    allergichistory: allergyHistory,
    familyhistory: familyHistory
  })
}

const handleGenerateMedicalRecord = async () => {
  if (!caseId.value) {
    ElMessage.warning(t('doctorVideo.consultation.aiGenerateCaseUnavailable'))
    return
  }

  generatingMedicalRecord.value = true

  try {
    const response = await generateMedicalRecord(caseId.value)
    const record = response?.data

    if (!record) {
      throw new Error('Missing generated medical record data.')
    }

    applyGeneratedMedicalRecord(record)
    ElMessage.success(t('doctorVideo.consultation.aiGenerateSuccess'))
  } catch (error) {
    console.warn('Failed to generate doctor medical record.', error)
    ElMessage.error(error instanceof Error && error.message ? error.message : t('doctorVideo.consultation.aiGenerateFailed'))
  } finally {
    generatingMedicalRecord.value = false
  }
}

const fetchHistoryCaseList = async () => {
  if (!patientId.value || !caseId.value) {
    historyCaseList.value = []
    historyCaseError.value = ''
    historyCaseLoading.value = false
    return
  }

  historyCaseLoading.value = true
  historyCaseError.value = ''

  try {
    const response = await getCaseList(patientId.value, caseId.value)
    historyCaseList.value = normalizeHistoryCaseList(response?.data)
  } catch (error) {
    historyCaseList.value = []
    historyCaseError.value = t('doctorVideo.consultation.historyCaseLoadFailed')
    console.warn('Failed to load history case list.', error)
  } finally {
    historyCaseLoading.value = false
  }
}

const onSubmitDiagnosis = () => {
  if (!diagnosisFormRef.value) return
  diagnosisFormRef.value.validate(async (valid) => {
    if (valid) {
      if (!caseId.value) {
        ElMessage.warning(t('doctorVideo.consultation.diagnosisCaseUnavailable'))
        return
      }
      const submitCaseId = Number(caseId.value)
      if (!Number.isFinite(submitCaseId)) {
        ElMessage.warning(t('doctorVideo.consultation.diagnosisCaseUnavailable'))
        return
      }
      submittingDiagnosis.value = true
      try {
        await submitDiagnosis({
          caseId: submitCaseId,
          ...(doctorAideId.value ? { doctorAideId: doctorAideId.value } : {}),
          diseaseNameCn: diagnosisForm.value.diseaseNameCn,
          syndromeTypeCn: diagnosisForm.value.syndromeTypeCn,
          therapyCn: diagnosisForm.value.therapyCn,
          adviceCn: diagnosisForm.value.adviceCn,
          mainSuitCn: outpatientRecordForm.chiefComplaint,
          historyIllnessCn: outpatientRecordForm.currentHistory,
          previousHistoryCn: outpatientRecordForm.pastHistory,
          allergichistoryCn: outpatientRecordForm.allergyHistory,
          familyhistoryCn: outpatientRecordForm.familyHistory
        })
        ElMessage.success(t('doctorVideo.consultation.submitDiagnosisSuccess'))
        await leaveConsultation()
      } catch (error) {
        ElMessage.error(t('doctorVideo.consultation.submitDiagnosisFailed'))
      } finally {
        submittingDiagnosis.value = false
      }
    }
  })
}

const buildSubtitleSaveKey = (item: SubtitleTimelineItem) => {
  if (item.beginTime > 0) {
    return `${item.speakerId}_${item.sourceLanguage}_begin_${item.beginTime}`
  }

  if (item.sentenceIndex >= 0) {
    return `${item.speakerId}_${item.sourceLanguage}_sentence_${item.sentenceIndex}`
  }

  return `${item.speakerId}_${item.sourceLanguage}_item_${item.id}`
}

const resolveSubtitleSavePayload = (item: SubtitleTimelineItem) => {
  const sourceText = item.sourceText.trim()
  const translatedText = item.translatedText.trim()

  if (!translationEnabled.value) {
    if (!item.sourceFinal || !sourceText) {
      return null
    }

    return {
      recordCn: sourceText,
      recordLo: ''
    }
  }

  if (!item.sourceFinal || !item.translatedFinal || !sourceText || !translatedText) {
    return null
  }

  if (item.sourceLanguage === 'cn') {
    return {
      recordCn: sourceText,
      recordLo: translatedText
    }
  }

  if (item.sourceLanguage === 'lo') {
    return {
      recordCn: translatedText,
      recordLo: sourceText
    }
  }

  return null
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':')
}

const parseVideoTime = (value: unknown) => {
  if (value === null || value === undefined) {
    return Number.NaN
  }

  return Date.parse(String(value))
}

const resolveVideoDurationMs = (value: unknown) => {
  if (!isObjectRecord(value)) {
    return 0
  }

  const startTime = parseVideoTime(value.videoStartTime)
  const currentTime = parseVideoTime(value.newDate)
  if (!Number.isFinite(startTime) || !Number.isFinite(currentTime)) {
    return 0
  }

  return Math.max(0, currentTime - startTime)
}

const syncConsultationDuration = () => {
  consultationDuration.value = formatDuration(Date.now() - durationStartedAt)
}

const clearConsultationDurationTimer = () => {
  if (durationTimer) {
    window.clearInterval(durationTimer)
    durationTimer = 0
  }
}

const stopConsultationDuration = () => {
  durationRequestId += 1
  durationStartedAt = 0
  consultationDuration.value = '00:00:00'
  clearConsultationDurationTimer()
}

const startConsultationDuration = async (resolvedVideoId: string) => {
  durationRequestId += 1
  const currentRequestId = durationRequestId
  clearConsultationDurationTimer()
  durationStartedAt = Date.now()
  consultationDuration.value = '00:00:00'
  durationTimer = window.setInterval(syncConsultationDuration, 1000)

  if (!resolvedVideoId) {
    return
  }

  try {
    const response = await getVideoTime(resolvedVideoId)
    if (currentRequestId !== durationRequestId) {
      return
    }

    durationStartedAt = Date.now() - resolveVideoDurationMs(response?.data)
    syncConsultationDuration()
  } catch (error) {
    console.warn('Failed to load doctor consultation video duration.', error)
  }
}

const takeOptionalTimestamp = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value < 1_000_000_000_000 ? value * 1000 : value
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value)

    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue
    }

    const parsedTimestamp = new Date(value).getTime()
    if (Number.isFinite(parsedTimestamp) && parsedTimestamp > 0) {
      return parsedTimestamp
    }
  }

  return 0
}

const resolveTextFromUnknown = (value: unknown, depth = 0): string => {
  if (depth > 3) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolvedText = resolveTextFromUnknown(item, depth + 1)
      if (resolvedText) {
        return resolvedText
      }
    }
    return ''
  }

  if (!isObjectRecord(value)) {
    return ''
  }

  const candidateKeys = [
    'contentLo',
    'translatedText',
    'translation',
    'lo',
    'lao',
    'result',
    'value',
    'text'
  ]

  for (const key of candidateKeys) {
    const resolvedText = resolveTextFromUnknown(value[key], depth + 1)
    if (resolvedText) {
      return resolvedText
    }
  }

  for (const nestedValue of Object.values(value)) {
    const resolvedText = resolveTextFromUnknown(nestedValue, depth + 1)
    if (resolvedText) {
      return resolvedText
    }
  }

  return ''
}

const resolveTranslationText = (payload: unknown) => {
  const translatedText = resolveTextFromUnknown(payload)

  if (!translatedText) {
    throw new Error('Missing translated text from response.')
  }

  return translatedText
}

const resolveHistoryMessageType = (
  record: Record<string, unknown>,
  fallbackType?: ConsultationMessageType
): ConsultationMessageType => {
  const explicitType = takeOptionalText(record.messageType || record.type || record.recordType).toLowerCase()

  if (explicitType.includes('manual') || explicitType.includes('chat') || explicitType.includes('written') || explicitType.includes('text')) {
    return 'manual'
  }

  if (explicitType.includes('subtitle') || explicitType.includes('record')) {
    return 'subtitle'
  }

  if (record.contentCn !== undefined || record.contentLo !== undefined) {
    return 'manual'
  }

  if (record.recordCn !== undefined || record.recordLo !== undefined) {
    return 'subtitle'
  }

  return fallbackType || 'subtitle'
}

const resolveHistoryDoctorFlag = (record: Record<string, unknown>): 0 | 1 | 2 | null => {
  const directValue = record.isDoctor ?? record.is_doctor ?? record.fromDoctor ?? record.doctor

  if (typeof directValue === 'number') {
    return directValue === 0 || directValue === 1 || directValue === 2 ? directValue : null
  }

  if (typeof directValue === 'boolean') {
    return directValue ? 0 : 1
  }

  if (typeof directValue === 'string') {
    const normalizedValue = directValue.trim().toLowerCase()

    if (normalizedValue === '0' || normalizedValue === 'doctor' || normalizedValue === 'self' || normalizedValue === 'true') {
      return 0
    }

    if (normalizedValue === '1' || normalizedValue === 'patient' || normalizedValue === 'remote' || normalizedValue === 'false') {
      return 1
    }

    if (normalizedValue === '2' || normalizedValue === 'aide' || normalizedValue === 'assistant') {
      return 2
    }
  }

  const roleValue = takeOptionalText(record.role || record.speakerRole || record.senderRole).toLowerCase()

  if (roleValue.includes('doctor')) {
    return 0
  }

  if (roleValue.includes('patient')) {
    return 1
  }

  if (roleValue.includes('aide') || roleValue.includes('assistant')) {
    return 2
  }

  return null
}

const resolveHistoryTexts = (record: Record<string, unknown>) => {
  let contentCn =
    takeOptionalText(record.contentCn) ||
    takeOptionalText(record.recordCn) ||
    takeOptionalText(record.cn)
  let contentLo =
    takeOptionalText(record.contentLo) ||
    takeOptionalText(record.recordLo) ||
    takeOptionalText(record.lo)

  if (contentCn && contentLo) {
    return {
      contentCn,
      contentLo
    }
  }

  const sourceText = takeOptionalText(record.sourceText)
  const translatedText = takeOptionalText(record.translatedText)
  const sourceLanguage = takeOptionalText(record.sourceLanguage).toLowerCase()
  const targetLanguage = takeOptionalText(record.targetLanguage).toLowerCase()

  if (sourceText && translatedText) {
    if (sourceLanguage === 'cn' || sourceLanguage === 'zh' || sourceLanguage === 'zh-cn') {
      contentCn = sourceText
      contentLo = translatedText
    } else if (sourceLanguage === 'lo' || sourceLanguage === 'lao') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'cn' || targetLanguage === 'zh' || targetLanguage === 'zh-cn') {
      contentCn = translatedText
      contentLo = sourceText
    } else if (targetLanguage === 'lo' || targetLanguage === 'lao') {
      contentCn = sourceText
      contentLo = translatedText
    }
  } else if (sourceText && !translatedText) {
    if (sourceLanguage === 'lo' || sourceLanguage === 'lao') {
      contentLo = sourceText
    } else {
      contentCn = sourceText
    }
  }

  return {
    contentCn,
    contentLo
  }
}

const normalizeHistoryItem = (
  rawItem: unknown,
  sequence: number,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem | null => {
  if (!isObjectRecord(rawItem)) {
    return null
  }

  const { contentCn, contentLo } = resolveHistoryTexts(rawItem)
  const isDoctor = resolveHistoryDoctorFlag(rawItem)

  if ((!contentCn && !contentLo) || isDoctor === null) {
    return null
  }

  return {
    messageType: resolveHistoryMessageType(rawItem, fallbackType),
    isDoctor,
    contentCn,
    contentLo,
    timestamp:
      takeOptionalTimestamp(
        rawItem.timestamp ||
          rawItem.createTime ||
          rawItem.createdAt ||
          rawItem.updateTime ||
          rawItem.beginTime ||
          rawItem.anchorTimestamp
      ) || 0,
    sequence
  }
}

const collectHistoryItems = (
  payload: unknown,
  sequenceOffset = 0,
  fallbackType?: ConsultationMessageType
): ConsultationHistoryItem[] => {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeHistoryItem(item, sequenceOffset + index, fallbackType))
      .filter((item): item is ConsultationHistoryItem => Boolean(item))
  }

  if (!isObjectRecord(payload)) {
    return []
  }

  const groups: Array<{ items: unknown[]; type?: ConsultationMessageType }> = []
  const subtitleKeys = [
    'subtitleList',
    'subtitles',
    'subtitleRecords',
    'videoRecordList',
    'videoRecords',
    'recordList',
    'records'
  ]
  const manualKeys = [
    'writtenList',
    'writtenRecords',
    'chatList',
    'chatRecords',
    'conversationList',
    'conversations',
    'messageList',
    'messages'
  ]

  subtitleKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'subtitle'
      })
    }
  })

  manualKeys.forEach((key) => {
    if (Array.isArray(payload[key])) {
      groups.push({
        items: payload[key] as unknown[],
        type: 'manual'
      })
    }
  })

  if (groups.length > 0) {
    let nextSequence = sequenceOffset
    return groups.flatMap((group) => {
      const items = collectHistoryItems(group.items, nextSequence, group.type)
      nextSequence += group.items.length
      return items
    })
  }

  if (Array.isArray(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  if (isObjectRecord(payload.data)) {
    return collectHistoryItems(payload.data, sequenceOffset, fallbackType)
  }

  const fallbackListKey = ['list', 'rows', 'items'].find((key) => Array.isArray(payload[key]))
  if (fallbackListKey) {
    return collectHistoryItems(payload[fallbackListKey], sequenceOffset, fallbackType)
  }

  const singleItem = normalizeHistoryItem(payload, sequenceOffset, fallbackType)
  return singleItem ? [singleItem] : []
}

const normalizeConversationHistory = (payload: unknown) => {
  const normalizedItems = collectHistoryItems(payload)

  if (!normalizedItems.length) {
    return []
  }

  const fallbackBaseTimestamp = Date.now() - normalizedItems.length * 1000

  return normalizedItems
    .map((item, index) => ({
      ...item,
      timestamp: item.timestamp || fallbackBaseTimestamp + index
    }))
    .sort((left, right) => {
      const timestampDelta = left.timestamp - right.timestamp

      if (timestampDelta !== 0) {
        return timestampDelta
      }

      return left.sequence - right.sequence
    })
}

const appendConversationHistory = (items: ConsultationHistoryItem[]) => {
  items.forEach((item) => {
    const doctorMessage = item.isDoctor === 0
    const aideMessage = item.isDoctor === 2
    const sourceText = translationEnabled.value
      ? doctorMessage ? item.contentCn : item.contentLo
      : item.contentCn || item.contentLo
    timeline.appendHistoryMessage({
      speakerId: doctorMessage
        ? doctorId.value || 'doctor'
        : aideMessage
          ? `aide:${doctorAideId.value || 'aide'}`
          : `patient:${patientId.value || 'patient'}`,
      speakerName: doctorMessage
        ? doctorName.value
        : aideMessage
          ? t('doctorVideo.consultation.aideFallbackName')
          : patientName.value,
      side: doctorMessage ? 'self' : 'remote',
      messageType: item.messageType,
      sourceText,
      translatedText: translationEnabled.value ? doctorMessage ? item.contentLo : item.contentCn : '',
      sourceLanguage: translationEnabled.value ? doctorMessage ? 'cn' : 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? doctorMessage ? 'lo' : 'cn' : 'cn',
      timestamp: item.timestamp
    })
  })
}

const loadConversationHistory = async (resolvedVideoId: string) => {
  if (!isContinueConsultation.value || !resolvedVideoId) {
    return
  }

  try {
    const historyResponse = await getVideoConversation(resolvedVideoId)
    const historyItems = normalizeConversationHistory(historyResponse?.data)

    if (!historyItems.length) {
      return
    }

    appendConversationHistory(historyItems)
  } catch (error) {
    console.warn('Failed to load doctor consultation conversation history.', error)
    ElMessage.warning(t('doctorVideo.consultation.historyLoadFailed'))
  }
}

const persistConsultationVideoId = (nextVideoId: string) => {
  if (!nextVideoId) {
    return
  }

  persistConsultationContext({
    videoId: nextVideoId
  })
}

const handleSubtitleFinalized = (item: SubtitleTimelineItem) => {
  const resolvedVideoId = videoId.value
  const currentUserId = session.channelContext.value?.userId || doctorId.value
  const payload = resolveSubtitleSavePayload(item)

  if (!resolvedVideoId || !payload || !currentUserId || item.speakerId !== currentUserId) {
    return
  }

  const saveKey = buildSubtitleSaveKey(item)
  if (savedSubtitleKeys.has(saveKey)) {
    return
  }

  savedSubtitleKeys.add(saveKey)
  void saveSubtitle({
    videoId: resolvedVideoId,
    isDoctor: 0,
    ...payload
  }).catch((error) => {
    console.warn('Failed to save doctor subtitle record.', error)
  })
}

const timeline = useDoctorSubtitleTimeline({
  getCurrentUserId: () => session.channelContext.value?.userId || doctorId.value,
  getCurrentUserName: () => doctorName.value,
  getRemoteUsers: () => session.allUsers.value.filter((item) => item.userId !== doctorId.value),
  getTranslationEnabled: () => translationEnabled.value,
  onFinalizedItem: handleSubtitleFinalized
})

const chat = createDoctorConsultationChatService({
  onMessage: ({ contentCn, contentLo, role }) => {
    const resolvedPatientId = patientId.value || 'patient'
    const sender =
      role === 0
        ? {
            speakerId: doctorId.value || 'doctor',
            speakerName: doctorName.value,
            side: 'self' as const
          }
        : role === 2
          ? {
              speakerId: `aide:${doctorAideId.value || 'aide'}`,
              speakerName: t('doctorVideo.consultation.aideFallbackName'),
              side: 'remote' as const
            }
          : {
              speakerId: `patient:${resolvedPatientId}`,
              speakerName: patientName.value,
              side: 'remote' as const
            }

    timeline.appendManualMessage({
      ...sender,
      sourceText: translationEnabled.value ? contentLo : contentCn || contentLo,
      translatedText: translationEnabled.value ? contentCn : '',
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: 'cn'
    })
  },
  onError: (error) => {
    console.warn('Doctor consultation chat websocket error.', error)
  }
})

const chatInputDisabled = computed(() => false)
const chatSendDisabled = computed(() => {
  return (
    chatSending.value ||
    !chatDraft.value.trim() ||
    !patientId.value ||
    !doctorAideId.value ||
    !caseId.value ||
    chat.connectionStatus.value !== 'connected'
  )
})

const chatStatusText = computed(() => {
  if (!patientId.value) {
    return t('doctorVideo.consultation.chatPatientUnavailable')
  }

  if (!doctorAideId.value) {
    return t('doctorVideo.consultation.chatUnavailable')
  }

  if (!caseId.value) {
    return t('doctorVideo.consultation.chatCaseUnavailable')
  }

  if (chat.connectionStatus.value === 'connecting') {
    return t('doctorVideo.consultation.chatConnecting')
  }

  if (chat.connectionStatus.value === 'connected') {
    return t('doctorVideo.consultation.chatConnected')
  }

  return t('doctorVideo.consultation.chatUnavailable')
})

const connectConsultationChat = async () => {
  try {
    await chat.connect()
  } catch (error) {
    console.warn('Failed to connect doctor consultation chat websocket.', error)
    ElMessage.warning(t('doctorVideo.consultation.chatConnectFailed'))
  }
}

const refreshCameraDevices = async () => {
  try {
    await session.loadCameraDevices()
  } catch (error) {
    console.warn('Failed to load doctor camera devices.', error)
    ElMessage.warning(t('doctorVideo.consultation.cameraLoadFailed'))
  }
}

const requestInitialCameraSelection = async () => {
  await refreshCameraDevices()

  if (session.rememberedCameraAvailable.value && session.selectedCameraId.value) {
    return session.selectedCameraId.value
  }

  cameraDialogRequired.value = true
  cameraDialogVisible.value = true

  return new Promise<string>((resolve) => {
    pendingInitialCameraSelection = resolve
  })
}

const openCameraSwitchDialog = async () => {
  cameraDialogRequired.value = false
  cameraDialogVisible.value = true
  await refreshCameraDevices()
}

const handleCameraSelectionConfirm = async (deviceId: string) => {
  if (cameraDialogRequired.value) {
    session.selectCamera(deviceId)
    pendingInitialCameraSelection?.(deviceId)
    pendingInitialCameraSelection = null
    cameraDialogVisible.value = false
    cameraDialogRequired.value = false
    return
  }

  try {
    await session.switchCamera(deviceId)
    cameraDialogVisible.value = false
    ElMessage.success(t('doctorVideo.consultation.cameraSwitchSuccess'))
  } catch (error) {
    console.warn('Failed to switch doctor camera.', error)
    ElMessage.warning(t('doctorVideo.consultation.cameraSwitchFailed'))
  }
}

const handleChatInput = (value: string) => {
  chatDraft.value = value
}

const appendLocalManualMessage = (payload: ConsultationChatPayload) => {
  const currentUserId = session.channelContext.value?.userId || doctorId.value || 'doctor'
  timeline.appendManualMessage({
    speakerId: currentUserId,
    speakerName: doctorName.value,
    side: 'self',
    sourceText: payload.contentCn,
    translatedText: translationEnabled.value ? payload.contentLo : '',
    sourceLanguage: 'cn',
    targetLanguage: translationEnabled.value ? 'lo' : 'cn'
  })
}

const handleChatSend = async () => {
  const normalizedText = chatDraft.value.trim()

  if (!normalizedText) {
    ElMessage.warning(t('doctorVideo.consultation.chatInputRequired'))
    return
  }

  if (!patientId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatPatientUnavailable'))
    return
  }

  if (!doctorAideId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatUnavailable'))
    return
  }

  if (!caseId.value) {
    ElMessage.warning(t('doctorVideo.consultation.chatCaseUnavailable'))
    return
  }

  if (chat.connectionStatus.value !== 'connected') {
    ElMessage.warning(t('doctorVideo.consultation.chatUnavailable'))
    return
  }

  chatDraft.value = ''
  chatSending.value = true

  try {
    const contentLo = translationEnabled.value
      ? resolveTranslationText((await translateConsultationText({
          source: 'cn',
          to: 'lo',
          text: normalizedText
        }))?.data)
      : ''
    const payload = {
      contentCn: normalizedText,
      contentLo
    }

    appendLocalManualMessage(payload)

    const [sendResult, saveResult] = await Promise.allSettled([
      chat.sendTranslatedMessage({
        patientId: patientId.value,
        doctorAideId: doctorAideId.value,
        role: 0,
        ...payload
      }),
      addWrittenRecord({
        caseId: caseId.value,
        isDoctor: 0,
        contentCn: normalizedText,
        contentLo
      })
    ])

    if (sendResult.status === 'rejected') {
      console.warn('Failed to send doctor consultation chat websocket message.', sendResult.reason)
      ElMessage.warning(t('doctorVideo.consultation.chatSendFailed'))
    }

    if (saveResult.status === 'rejected') {
      console.warn('Failed to save doctor consultation manual chat record.', saveResult.reason)
      ElMessage.warning(t('doctorVideo.consultation.chatSaveFailed'))
    }
  } catch (error) {
    console.warn('Failed to translate doctor consultation chat message.', error)
    if (!chatDraft.value) {
      chatDraft.value = normalizedText
    }
    ElMessage.warning(t('doctorVideo.consultation.chatTranslateFailed'))
  } finally {
    chatSending.value = false
  }
}

const goBackToWorkbench = async () => {
  await router.replace('/workbench')
}

const bootstrapConsultation = async () => {
  if (!doctorId.value || !roomId.value) {
    pageError.value = t('doctorVideo.consultation.missingParams')
    return
  }

  const initialCameraId = await requestInitialCameraSelection()
  await session.prepareLocalTracks(initialCameraId)

  try {
    const primaryChannelId = `${roomId.value}_cn`
    const secondaryChannelId = `${roomId.value}_lo`
    const videoIdPromise = caseId.value
      ? getVideoId(caseId.value)
          .then((response) => {
            if (response?.data === null || response?.data === undefined) {
              return ''
            }

            const nextVideoId = String(response.data).trim()
            persistConsultationVideoId(nextVideoId)
            return nextVideoId
          })
          .catch((error) => {
            console.warn('Failed to get doctor consultation videoId before entering the room.', error)
            return ''
          })
      : Promise.resolve(videoId.value || '')
    const [primaryResponse, secondaryResponse, resolvedVideoId] = await Promise.all([
      getVideoToken({
        channelId: primaryChannelId,
        userId: doctorId.value
      }),
      translationEnabled.value
        ? getVideoToken({
            channelId: secondaryChannelId,
            userId: doctorId.value
          })
        : Promise.resolve(null),
      videoIdPromise
    ])

    const token =
      primaryResponse?.data !== null && primaryResponse?.data !== undefined
        ? String(primaryResponse.data)
        : ''
    const secondaryToken =
      secondaryResponse?.data !== null && secondaryResponse?.data !== undefined
        ? String(secondaryResponse.data)
        : ''

    if (!token || (translationEnabled.value && !secondaryToken)) {
      throw new Error(t('doctorVideo.consultation.joinFailed'))
    }

    await session.enterConsultationRoom({
      appId: RTC_APP_ID,
      appKey: RTC_APP_KEY,
      userId: doctorId.value,
      channelName: roomId.value,
      userName: doctorName.value,
      token,
      secondaryToken,
      language: 'cn',
      translationEnabled: translationEnabled.value
    })

    const resolvedConsultationVideoId = takeOptionalText(resolvedVideoId) || videoId.value
    void startConsultationDuration(resolvedConsultationVideoId)
    await loadConversationHistory(resolvedConsultationVideoId)
    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : t('doctorVideo.consultation.joinFailed')
  }
}

const retrySubtitle = async () => {
  const taskPolicy = isContinueConsultation.value ? 'auto' : 'skip'
  await session.stopSubtitleTasks(taskPolicy)
  await session.cleanupSubtitle()
  timeline.bindAsrStreams(session.subtitleBindings.value)
  await session.bootstrapSubtitle({ taskPolicy })
}

const leaveConsultation = async () => {
  savedSubtitleKeys.clear()
  stopConsultationDuration()
  chatDraft.value = ''
  pendingInitialCameraSelection = null
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
  await goBackToWorkbench()
}

const handleLeave = async () => {
  if (leavingInProgress) {
    return
  }

  leavingInProgress = true
  const confirmed = await showConfirmDialog({
    title: t('doctorVideo.consultation.leaveConfirmTitle'),
    message: t('doctorVideo.consultation.leaveConfirmMessage'),
    description: t('doctorVideo.consultation.leaveConfirmDescription'),
    cancelText: t('doctorVideo.consultation.leaveConfirmCancel'),
    confirmText: t('doctorVideo.consultation.leaveConfirmConfirm'),
    type: 'danger',
    icon: 'warning'
  })

  if (!confirmed) {
    leavingInProgress = false
    return
  }

  try {
    await leaveConsultation()
  } finally {
    leavingInProgress = false
  }
}

onMounted(async () => {
  loadConsultationContext()
  syncOutpatientRecordForm()
  void fetchHistoryCaseList()
  await bootstrapConsultation()
})

watch([patientId, caseId], () => {
  void fetchHistoryCaseList()
})

onBeforeUnmount(async () => {
  stopConsultationDuration()
  savedSubtitleKeys.clear()
  chatDraft.value = ''
  pendingInitialCameraSelection = null
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: isContinueConsultation.value ? 'auto' : 'skip' })
})
</script>

<style scoped lang="scss">
.doctor-consultation-page {
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(109, 180, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(241, 246, 252, 0.95) 0%, rgba(248, 251, 255, 0.98) 100%);
}

.consultation-layout {
  display: grid;
  grid-template-columns: 370px minmax(0, 1fr) 360px;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.subtitle-column {
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(77, 103, 154, 0.08);
}

.video-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.featured-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 14px 14px 110px;
  border: 1.5px solid rgba(53, 118, 242, 0.92);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 6px 20px rgba(80, 104, 150, 0.08);
  overflow: hidden;
}

.stage-pill {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.96);
  color: #233a64;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(76, 100, 145, 0.12);
}

.stage-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fca68;
  box-shadow: 0 0 0 3px rgba(47, 202, 104, 0.14);
}

.connection-banner {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 6;
  transform: translateX(-50%);
  max-width: calc(100% - 314px);
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 241, 241, 0.96);
  color: #c54949;
  font-size: 12px;
  font-weight: 700;
}

.preview-row {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 5;
  display: grid;
  grid-template-columns: minmax(226px, 270px);
  gap: 8px;
  width: min(270px, calc(100% - 314px));
}

.preview-row :deep(.consult-participant-card) {
  width: 100%;
  cursor: pointer;
}

.featured-card {
  height: 100%;
}

.featured-caption {
  position: absolute;
  left: 50%;
  bottom: 104px;
  z-index: 4;
  transform: translateX(-50%);
  border-radius: 999px;
  padding: 6px 14px;
  background: rgba(74, 78, 89, 0.72);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.stage-controls {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 5;
  transform: translateX(-50%);
}

.session-summary {
  border: 1px solid #d7e4f7;
  border-radius: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #edf4ff 0%, #eef6ff 100%);
}

.doctor-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.doctor-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
}

.doctor-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.doctor-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.doctor-heading strong {
  color: #22365d;
  font-size: 15px;
  font-weight: 800;
}

.doctor-status {
  color: #24a35c;
  font-size: 12px;
  font-weight: 700;
}

.doctor-copy p {
  margin: 0;
  color: #5f7395;
  font-size: 13px;
}

.doctor-good-at {
  max-width: min(520px, 46vw);
  line-height: 1.5;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-good-at span {
  color: #22365d;
  font-weight: 800;
}

.record-column {
  min-height: 0;
}

.record-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 20px rgba(77, 103, 154, 0.08);
  overflow: hidden;
}

.record-tabs {
  padding: 0 12px;
  border-bottom: 1px solid #e6eef8;
}

.record-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 14px;
}

.ai-button {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #3d77f0 0%, #255cdb 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.ai-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.record-section {
  margin-top: 14px;
}

.record-section h3 {
  margin: 0 0 10px;
  color: #f25c35;
  font-size: 15px;
  font-weight: 700;
}

.compact-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  background: #f8fbff;
  border: 1px solid #e2edff;
  border-radius: 8px;
  padding: 10px 12px;
}

.compact-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-label {
  color: #6c7e97;
  font-size: 13px;
  font-weight: 600;
}

.compact-value {
  color: #203351;
  font-size: 13px;
  font-weight: 500;
}

.compact-history-form,
.compact-diagnosis-form {
  background: #f8fbff;
  border: 1px solid #e2edff;
  border-radius: 8px;
  padding: 12px;
}

.compact-history-form :deep(.el-form-item__label),
.compact-diagnosis-form :deep(.el-form-item__label) {
  padding-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  white-space: normal;
}

.compact-history-form :deep(.el-textarea__inner),
.compact-diagnosis-form :deep(.el-textarea__inner) {
  min-height: 72px;
  line-height: 1.6;
}

.compact-diagnosis-form :deep(.el-input__wrapper),
.compact-history-form :deep(.el-textarea__inner),
.compact-diagnosis-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.compact-form-item {
  margin-bottom: 15px;
}

.compact-history-form .compact-form-item:last-child,
.compact-diagnosis-form .compact-form-item:last-child {
  margin-bottom: 0;
}

.submit-btn-wrapper {
  margin-top: 12px;
}

.history-case-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-case-card {
  border: 1px solid #e2edff;
  border-radius: 8px;
  background: #f8fbff;
  padding: 10px;
  box-shadow: 0 4px 10px rgba(78, 114, 168, 0.06);
}

.history-case-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.history-case-head strong {
  color: #203351;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
}

.history-case-head span,
.history-case-meta {
  color: #6c7e97;
  font-size: 12px;
  line-height: 1.6;
}

.history-case-meta {
  margin-top: 6px;
}

.history-case-diagnosis {
  margin: 8px 0 0;
  color: #203351;
  font-size: 14px;
  line-height: 1.7;
}

.empty-record-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #617693;
  text-align: center;
}

.empty-record-state h3,
.error-card h2 {
  margin: 0;
}

.consultation-error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(420px, 100%);
  padding: 28px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(64, 89, 139, 0.12);
  text-align: center;
}

.error-card p {
  margin: 0;
  color: #647791;
  line-height: 1.7;
}

.error-icon {
  font-size: 34px;
  color: #e15656;
}

@media (max-width: 1600px) {
  .consultation-layout {
    grid-template-columns: 340px minmax(0, 1fr) 320px;
  }
}

@media (max-width: 1320px) {
  .consultation-layout {
    grid-template-columns: minmax(320px, 1fr) minmax(0, 1.3fr);
  }

  .record-column {
    grid-column: 1 / -1;
    min-height: 420px;
  }

  .record-shell {
    height: auto;
  }

  .history-case-head {
    flex-direction: column;
  }
}

@media (max-width: 1080px) {
  .consultation-layout {
    grid-template-columns: 1fr;
  }

  .subtitle-column,
  .record-column {
    min-height: 320px;
  }

  .preview-row {
    position: static;
    width: 100%;
    margin-top: 36px;
    margin-bottom: 10px;
    grid-template-columns: minmax(0, 1fr);
  }

  .featured-stage {
    padding-top: 14px;
  }

  .featured-caption {
    bottom: 118px;
    font-size: 14px;
  }

  .stage-controls {
    width: calc(100% - 24px);
  }

  .diagnosis-grid,
  .record-grid {
    grid-template-columns: 1fr;
  }
}
</style>
