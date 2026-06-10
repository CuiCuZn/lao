<template>
  <patient-page-shell>
    <section class="patient-consultation-page">
      <div v-if="pageError" class="consultation-error-state">
        <div class="error-card">
          <el-icon class="error-icon"><warning-filled /></el-icon>
          <h2>{{ t('assistant.aideVideo.consultation.errorTitle') }}</h2>
          <p>{{ pageError }}</p>
          <el-button type="primary" @click="goBackToWorkbench">
            {{ t('assistant.aideVideo.consultation.backToWorkbench') }}
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
          :translation-enabled="subtitleTranslationEnabled"
          :primary-language="consultationLang"
          :on-chat-input="handleChatInput"
          :on-chat-send="handleChatSend"
        />

        <section class="video-column">
          <div class="featured-stage">
            <div class="stage-pill">
              <span class="stage-dot" />
              <span>{{ t('assistant.aideVideo.consultation.inCall') }}</span>
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
              :placeholder-mode="featuredPlaceholderMode"
              :show-status="false"
            />
          </div>

          <footer class="consultation-footer">
            <div class="doctor-panel">
              <div class="doctor-avatar">{{ doctorAvatarText }}</div>

              <div class="doctor-copy">
                <div class="doctor-heading">
                  <strong>{{ doctorTitle }}</strong>
                </div>

                <p class="doctor-good-at">
                  <span class="doctor-good-at__label">{{ t('assistant.patientVideo.consultation.goodAt') }}:</span>
                  <el-tooltip
                    effect="dark"
                    placement="top-start"
                    :content="doctorGoodAtText"
                    :show-after="300"
                  >
                    <span class="doctor-good-at__text">{{ doctorGoodAtText }}</span>
                  </el-tooltip>
                </p>
              </div>
            </div>

            <div class="consultation-controls">
              <consult-room-controls
                :camera-enabled="patientMediaState.cameraEnabled"
                :mic-enabled="patientMediaState.micEnabled"
                :on-toggle-camera="handleTogglePatientCamera"
                :on-switch-camera="openPatientCameraDialog"
                :on-toggle-mic="handleTogglePatientMic"
                :on-capture="openSideScannerCapture"
                :on-leave="handleLeave"
                :camera-switching="patientMediaState.cameraSwitching"
                :controls-disabled="patientMediaControlsDisabled"
                :capture-controls-disabled="sideScannerCaptureControlsDisabled"
                :capture-label="t('assistant.aideVideo.consultation.captureButton')"
                :show-capture="showSideScannerCaptureButton"
                show-camera
              />
            </div>
          </footer>
        </section>
      </div>

      <consult-camera-select-dialog
        v-model="patientCameraDialogVisible"
        :devices="patientCameraDevices"
        :selected-device-id="patientMediaState.selectedCameraId"
        :loading="patientMediaState.cameraSwitching"
        :switching="patientMediaState.cameraSwitching"
        @confirm="handlePatientCameraSelectionConfirm"
        @refresh="requestPatientMediaState"
      />

      <aide-camera-capture-dialog
        v-model="sideScannerCaptureVisible"
        v-model:recognition-reports="inspectionEditableReports"
        :device="sideScannerCaptureDevice"
        :uploaded-photos="uploadedInspectionPhotos"
        :max-count="SIDE_SCANNER_MAX_PHOTO_COUNT"
        :uploading="sideScannerPhotoUploading"
        :recognizing="inspectionRecognizing"
        :recognition-saving="inspectionSaveLoading"
        :recognition-progress="inspectionRecognitionProgress"
        :recognition-status-text="inspectionRecognitionStatusText"
        :recognition-error="inspectionRecognitionError"
        :has-recognition="Boolean(inspectionBatchId || inspectionEditableReports.length)"
        @capture-confirm="handleSideScannerPhotoConfirm"
        @remove-uploaded-photo="handleUploadedInspectionPhotoRemove"
        @recognize="handleInspectionRecognize"
        @save="handleInspectionSave"
      />

      <div v-if="doctorRejectedDialogVisible" class="rejected-dialog-mask">
        <section
          class="rejected-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-rejected-title"
          aria-describedby="doctor-rejected-description"
        >
          <div class="rejected-dialog-hero" aria-hidden="true">
            <svg class="rejected-call-icon" viewBox="0 0 24 24" focusable="false">
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z"
                fill="currentColor"
              />
              <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
          </div>

          <div class="rejected-dialog-body">
            <h2 id="doctor-rejected-title" class="rejected-dialog-title">
              {{ t('assistant.aideVideo.consultation.rejectedTitle') }}
            </h2>
            <p id="doctor-rejected-description" class="rejected-dialog-message">
              {{ t('assistant.aideVideo.consultation.rejectedDescription', { doctorName: rejectedDoctorName }) }}
            </p>

            <div class="rejected-actions">
              <button
                type="button"
                class="rejected-action rejected-action--primary"
                :disabled="resendRequestLoading || resendRequestUsed"
                @click="handleResendRequest"
              >
                {{ resendRequestLoading ? t('assistant.aideVideo.consultation.resendingRequest') : t('assistant.aideVideo.consultation.resendRequest') }}
              </button>
              <button
                type="button"
                class="rejected-action rejected-action--ghost"
                :disabled="resendRequestLoading"
                @click="handleRejectLater"
              >
                {{ t('assistant.aideVideo.consultation.handleLater') }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  </patient-page-shell>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PatientPageShell from '@/components/patient/PatientPageShell.vue'
import {
  confirmInspectionBatchUpload,
  deleteInspectionReport,
  getInspectionBatchByBatchId,
  getInspectionBatchByCaseId,
  retryInspectionBatch,
  saveInspectionReportItems,
  submitInspectionBatch
} from '@/api/inspection'
import type { InspectionBatchReportItem, InspectionRecognizedItem } from '@/api/types'
import { addWrittenRecord, getPatientDetail, translateConsultationText } from '@/api/patient'
import { getVideoConversation, getVideoTime } from '@/api/video'
import { usePatientSessionStore } from '@/stores/patient-session'
import { useUserStore } from '@/stores/user'
import { navigateToAideConsultationRoom } from '@/utils/aide-consultation'
import {
  clearAssistantConsultationSseContext,
  listenAssistantConsultationCompleted,
  listenAssistantConsultationRejected,
  setAssistantConsultationSseContext,
  startAssistantConsultationSse
} from '@/utils/assistant-consultation-sse'
import { createAideVideoRoom, notifyAideVideoRoomDoctor } from '@/utils/aide-video-room'
import { PATIENT_CHANNEL_MESSAGE_TYPES } from '@/constants/patient'
import { showConfirmDialog } from '@/utils/confirm-dialog'
import {
  broadcastConsultationEnded,
  broadcastConsultationRejected,
  broadcastPatientMediaControlCommand,
  broadcastVideoRoomCreated,
  listenPatientChannelMessages,
  type PatientMediaControlDevice,
  type PatientMediaControlStateMessage
} from '@/utils/patient-channel'
import AideCameraCaptureDialog from '@/views/aide/components/AideCameraCaptureDialog.vue'
import ConsultCameraSelectDialog from '@/views/patient/consultation/components/ConsultCameraSelectDialog.vue'
import ConsultParticipantCard from '@/views/patient/consultation/components/ConsultParticipantCard.vue'
import ConsultRoomControls from '@/views/patient/consultation/components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from '@/views/patient/consultation/components/ConsultSubtitleTimeline.vue'
import { usePatientConsultationSession } from '@/views/patient/consultation/composables/usePatientConsultationSession'
import { usePatientSubtitleTimeline } from '@/views/patient/consultation/composables/usePatientSubtitleTimeline'
import { createPatientConsultationChatService } from '@/views/patient/consultation/services/consultation-chat'
import { normalizeConversationHistory, type ConsultationHistoryItem } from '@/views/patient/consultation/services/consultation-history'
import type { ConsultationChatPayload } from '@/views/patient/consultation/types'
import { uploadConsultationCaptureFiles } from '@/utils/oss-upload'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'
const SIDE_SCANNER_MAX_PHOTO_COUNT = 10
const SIDE_SCANNER_SOURCE_LABEL = 'Document Camera (1bcf:3288)'
const SIDE_SCANNER_LABEL_KEY = 'assistant.aideVideo.consultation.cameraLabels.sideScanner'
const SIDE_SCANNER_CAPTURE_DEV_ENABLED = import.meta.env.DEV

interface AideCapturePhoto {
  id: string
  name: string
  previewUrl: string
  file: File
  createdAt: number
}

interface UploadedInspectionPhoto {
  id: string
  name: string
  previewUrl: string
  fileUrl: string
  objectName: string
  createdAt: number
  reportId?: string | number
}

interface EditableInspectionItem {
  item_name: string
  result_value: string
  reference_range: string
  unit: string
  abnormal_flag: string
  result_status: string
  is_abnormal: boolean
}

interface EditableInspectionReport {
  reportId?: string | number
  batchId?: string | number
  fileUrl?: string
  recognizeStatus?: string | number
  errorMsg?: string
  items: EditableInspectionItem[]
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const sessionStore = usePatientSessionStore()
const session = usePatientConsultationSession()
let leavingInProgress = false
let durationTimer = 0
let durationStartedAt = 0
let durationRequestId = 0
let roomCleanedUp = false
let doctorRejectedHandled = false
let consultationCompletedHandled = false
let stopRejectedListening: (() => void) | null = null
let stopCompletedListening: (() => void) | null = null
let stopPatientChannelListening: (() => void) | null = null
let inspectionPollTimer = 0
let inspectionPollRequestId = 0
let inspectionProgressTimer = 0
let inspectionProgressCeiling = 82
let sideScannerHistoryRequestId = 0

const pageError = ref('')
const consultationDuration = ref('00:00:00')
const chatDraft = ref('')
const chatSending = ref(false)
const patientCameraDialogVisible = ref(false)
const sideScannerCaptureVisible = ref(false)
const uploadedInspectionPhotos = ref<UploadedInspectionPhoto[]>([])
const sideScannerPhotoUploading = ref(false)
const sideScannerHistoryLoading = ref(false)
const inspectionBatchId = ref<string | number>('')
const inspectionSubmittedFileUrls = ref<string[]>([])
const inspectionRecognizing = ref(false)
const inspectionSaveLoading = ref(false)
const inspectionEditableReports = ref<EditableInspectionReport[]>([])
const inspectionRecognitionProgress = ref(0)
const inspectionRecognitionStatusText = ref('')
const inspectionRecognitionError = ref('')
const doctorRejectedDialogVisible = ref(false)
const rejectedDoctorName = ref('')
const resendRequestLoading = ref(false)
const resendRequestUsed = ref(false)
const rejectedEventContext = ref<{ patientId: string; caseId: string; doctorName: string } | null>(null)
const featuredParticipantRole = ref<'doctor' | 'patient'>('doctor')
const patientMediaState = ref({
  patientId: '',
  caseId: '',
  cameraEnabled: false,
  micEnabled: false,
  cameraSwitching: false,
  selectedCameraId: '',
  cameraDevices: [] as PatientMediaControlDevice[],
  error: ''
})

const aideCameraLabelKeys: Record<string, string> = {
  'Front Camera (0bda:d581)': 'assistant.aideVideo.consultation.cameraLabels.doctorCamera',
  'Rear Camera (0bda:d581)': 'assistant.aideVideo.consultation.cameraLabels.patientCamera',
  [SIDE_SCANNER_SOURCE_LABEL]: SIDE_SCANNER_LABEL_KEY
}

const takeText = (source: Record<string, unknown> | null | undefined, keys: string[]) => {
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

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
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
    console.warn('Failed to load aide consultation video duration.', error)
  }
}

const queryValue = (key: string) => {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

const isCurrentPatientMediaContext = (payload: { patientId: string; caseId?: string | number }) => {
  if (payload.patientId && consultationPatientId.value && payload.patientId !== consultationPatientId.value) {
    return false
  }

  const currentCaseId = takeOptionalText(consultationCaseId.value)
  const payloadCaseId = takeOptionalText(payload.caseId)
  if (payloadCaseId && currentCaseId && payloadCaseId !== currentCaseId) {
    return false
  }

  return true
}

const token = computed(() => queryValue('token'))
const secondaryToken = computed(() => queryValue('secondaryToken'))
const channelId = computed(() => queryValue('channelId'))
const userId = computed(() => queryValue('userId'))
const consultationPatientId = computed(() => queryValue('patientId') || takeOptionalText(sessionStore.patientId))
const consultationCaseId = computed(() => takeOptionalText(sessionStore.caseId) || queryValue('caseId'))
const consultationVideoId = computed(() => takeOptionalText(sessionStore.videoId) || queryValue('videoId'))
const consultationDoctorId = computed(() => queryValue('doctorId') || takeOptionalText(sessionStore.doctorId))
const consultationDoctorName = computed(() => queryValue('doctorName') || takeOptionalText(sessionStore.doctorName))
const consultationDoctorGoodAt = computed(() => queryValue('goodAt') || takeOptionalText(sessionStore.doctorGoodAt))
const doctorGoodAtText = computed(() => consultationDoctorGoodAt.value || t('common.notAvailable'))
const consultationLang = computed<'lo' | 'cn'>(() => {
  const rawLang = queryValue('consultationLang') || sessionStore.consultationLang
  return rawLang === 'cn' || rawLang === 'zh-cn' ? 'cn' : 'lo'
})
const translationEnabled = computed(() => consultationLang.value === 'lo')
const subtitleTranslationEnabled = computed(() => true)
const manualChatTranslationEnabled = computed(() => translationEnabled.value || subtitleTranslationEnabled.value)

const aideName = computed(() => {
  return (
    takeOptionalText(userStore.profile?.nickName) ||
    takeOptionalText(userStore.nickname) ||
    takeOptionalText(userStore.profile?.userName) ||
    takeOptionalText(userStore.name) ||
    userId.value ||
    t('assistant.aideVideo.consultation.aideFallbackName')
  )
})

const patientName = computed(() => {
  return (
    takeText(sessionStore.patientDetail, ['patientName', 'name']) ||
    consultationPatientId.value ||
    t('common.notAvailable')
  )
})

const patientMediaStateReady = computed(() => {
  return patientMediaState.value.patientId === consultationPatientId.value
})

const patientMediaControlsDisabled = computed(() => {
  return !patientMediaStateReady.value || patientMediaState.value.cameraSwitching
})

const sideScannerCaptureControlsDisabled = computed(() => {
  if (sideScannerHistoryLoading.value) {
    return true
  }

  if (SIDE_SCANNER_CAPTURE_DEV_ENABLED) {
    return false
  }

  return patientMediaControlsDisabled.value
})

const normalizeAideCameraLabel = (label: string) => {
  return label.trim().replace(/（/g, '(').replace(/）/g, ')')
}

const resolveAideCameraDeviceLabel = (device: PatientMediaControlDevice) => {
  const labelKey = aideCameraLabelKeys[normalizeAideCameraLabel(device.label)]
  return labelKey ? t(labelKey) : device.label
}

const patientCameraDevices = computed(() => {
  return patientMediaState.value.cameraDevices.map((device) => ({
    ...device,
    label: resolveAideCameraDeviceLabel(device)
  })) as unknown as MediaDeviceInfo[]
})

const isSideScannerDevice = (device: PatientMediaControlDevice) => {
  return normalizeAideCameraLabel(device.label) === SIDE_SCANNER_SOURCE_LABEL
}

const sideScannerCaptureDevice = computed(() => {
  const device =
    patientMediaState.value.cameraDevices.find(isSideScannerDevice) ||
    (SIDE_SCANNER_CAPTURE_DEV_ENABLED
      ? patientMediaState.value.cameraDevices.find((item) => Boolean(item.deviceId))
      : null)

  if (!device) {
    return null
  }

  return {
    ...device,
    label: resolveAideCameraDeviceLabel(device)
  }
})

const showSideScannerCaptureButton = computed(() => {
  if (SIDE_SCANNER_CAPTURE_DEV_ENABLED) {
    return true
  }

  return patientMediaStateReady.value && Boolean(sideScannerCaptureDevice.value)
})

const doctorTitle = computed(() => {
  return consultationDoctorName.value
    ? consultationDoctorName.value
    : consultationDoctorId.value
      ? consultationDoctorId.value
      : t('assistant.patientVideo.consultation.waitingDoctor')
})

const doctorAvatarText = computed(() => {
  return doctorTitle.value.slice(0, 1) || '?'
})

const buildPlaceholderParticipant = (userId: string, userName: string, placeholderBadge: string) => ({
  userId,
  userName,
  track: null,
  muted: true,
  speaking: false,
  placeholderBadge
})

const findRemoteParticipant = (userId: string) => {
  const normalizedUserId = takeOptionalText(userId)
  if (!normalizedUserId) {
    return null
  }

  return session.remoteParticipants.value.find((participant) => participant.userId === normalizedUserId) || null
}

const doctorRoomParticipant = computed(() => {
  const doctorId = takeOptionalText(consultationDoctorId.value)
  return doctorId ? findRemoteParticipant(doctorId) : null
})

const doctorStageParticipant = computed(() => {
  const doctorId = takeOptionalText(consultationDoctorId.value)
  return (
    doctorRoomParticipant.value ||
    (!doctorId ? session.remoteParticipants.value.find((participant) => participant.track) : null) ||
    buildPlaceholderParticipant(
      doctorId || 'doctor-placeholder',
      doctorTitle.value,
      t('assistant.patientVideo.consultation.waitingDoctorJoin')
    )
  )
})

const doctorPlaceholderMode = computed<'waiting' | 'avatar'>(() => {
  return doctorRoomParticipant.value && !doctorStageParticipant.value.track ? 'avatar' : 'waiting'
})

const patientPreviewParticipant = computed(() => {
  const patientId = takeOptionalText(consultationPatientId.value)
  return (
    findRemoteParticipant(patientId) ||
    session.remoteParticipants.value.find((participant) => participant.userId !== doctorStageParticipant.value.userId) ||
    buildPlaceholderParticipant(
      patientId || 'patient-placeholder',
      patientName.value,
      t('assistant.pendingRecords.patientInfo')
    )
  )
})

const featuredParticipant = computed(() => {
  return featuredParticipantRole.value === 'doctor' ? doctorStageParticipant.value : patientPreviewParticipant.value
})

const previewParticipantRole = computed<'doctor' | 'patient'>(() => {
  return featuredParticipantRole.value === 'doctor' ? 'patient' : 'doctor'
})

const previewParticipant = computed(() => {
  return previewParticipantRole.value === 'doctor' ? doctorStageParticipant.value : patientPreviewParticipant.value
})

const featuredPlaceholderMode = computed<'waiting' | 'avatar' | 'avatar-name'>(() => {
  return featuredParticipantRole.value === 'doctor' ? doctorPlaceholderMode.value : 'avatar-name'
})

const toggleFeaturedParticipant = () => {
  featuredParticipantRole.value = previewParticipantRole.value
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
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
    'contentCn',
    'translatedText',
    'translation',
    'cn',
    'zh',
    'zhCn',
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

const timeline = usePatientSubtitleTimeline({
  getCurrentUserId: () => session.channelContext.value?.userId || userId.value,
  getCurrentUserName: () => aideName.value,
  getRemoteUsers: () => session.allUsers.value.filter((item) => item.userId !== userId.value),
  getTranslationEnabled: () => subtitleTranslationEnabled.value
})

const resolveHistorySpeaker = (item: ConsultationHistoryItem) => {
  if (item.isDoctor === 2) {
    return {
      speakerId: session.channelContext.value?.userId || userId.value || 'aide',
      speakerName: aideName.value,
      side: 'self' as const
    }
  }

  if (item.isDoctor === 1) {
    return {
      speakerId: `patient:${consultationPatientId.value || 'patient'}`,
      speakerName: patientName.value,
      side: 'remote' as const
    }
  }

  const doctorId = takeOptionalText(consultationDoctorId.value) || 'doctor'
  return {
    speakerId: `doctor:${doctorId}`,
    speakerName: doctorTitle.value,
    side: 'remote' as const
  }
}

const appendConversationHistory = (items: ConsultationHistoryItem[]) => {
  items.forEach((item) => {
    const speaker = resolveHistorySpeaker(item)
    const sourceText = translationEnabled.value ? item.contentLo : item.contentCn || item.contentLo
    const translatedText = translationEnabled.value
      ? item.contentCn
      : subtitleTranslationEnabled.value ? item.contentLo : ''
    timeline.appendHistoryMessage({
      ...speaker,
      messageType: item.messageType,
      sourceText,
      translatedText,
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? 'cn' : subtitleTranslationEnabled.value ? 'lo' : 'cn',
      timestamp: item.timestamp
    })
  })
}

const loadConversationHistory = async (resolvedVideoId: string) => {
  if (!resolvedVideoId) {
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
    console.warn('Failed to load aide consultation conversation history.', error)
  }
}

const notifyPatientVideoRoomCreated = () => {
  const patientId = takeOptionalText(consultationPatientId.value)
  const doctorId = takeOptionalText(consultationDoctorId.value)
  const roomId = takeOptionalText(channelId.value)

  if (!patientId || !doctorId || !roomId) {
    return
  }

  broadcastVideoRoomCreated({
    patientId,
    doctorId,
    doctorName: consultationDoctorName.value || doctorTitle.value,
    goodAt: consultationDoctorGoodAt.value,
    caseId: takeOptionalText(consultationCaseId.value),
    roomId,
    consultationLang: consultationLang.value
  })
}

const buildPatientMediaCommandId = () => {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const sendPatientMediaControlCommand = (
  action: 'set-camera-enabled' | 'set-mic-enabled' | 'switch-camera' | 'request-state',
  options: { enabled?: boolean; deviceId?: string } = {}
) => {
  const patientId = takeOptionalText(consultationPatientId.value)
  if (!patientId) {
    return
  }

  broadcastPatientMediaControlCommand({
    patientId,
    caseId: takeOptionalText(consultationCaseId.value),
    commandId: buildPatientMediaCommandId(),
    action,
    ...options
  })
}

const requestPatientMediaState = () => {
  sendPatientMediaControlCommand('request-state')
}

const handlePatientMediaState = (payload: PatientMediaControlStateMessage['payload']) => {
  if (!isCurrentPatientMediaContext(payload)) {
    return
  }

  patientMediaState.value = {
    patientId: payload.patientId,
    caseId: takeOptionalText(payload.caseId),
    cameraEnabled: payload.cameraEnabled,
    micEnabled: payload.micEnabled,
    cameraSwitching: payload.cameraSwitching,
    selectedCameraId: payload.selectedCameraId,
    cameraDevices: payload.cameraDevices,
    error: payload.error || ''
  }

  if (payload.error) {
    ElMessage.warning(payload.error)
  }
}

const handleTogglePatientCamera = () => {
  if (patientMediaControlsDisabled.value) {
    return
  }

  sendPatientMediaControlCommand('set-camera-enabled', {
    enabled: !patientMediaState.value.cameraEnabled
  })
}

const handleTogglePatientMic = () => {
  if (patientMediaControlsDisabled.value) {
    return
  }

  sendPatientMediaControlCommand('set-mic-enabled', {
    enabled: !patientMediaState.value.micEnabled
  })
}

const openPatientCameraDialog = () => {
  if (!patientMediaStateReady.value) {
    requestPatientMediaState()
    return
  }

  patientCameraDialogVisible.value = true
}

const handlePatientCameraSelectionConfirm = (deviceId: string) => {
  const normalizedDeviceId = takeOptionalText(deviceId)
  if (!normalizedDeviceId) {
    return
  }

  sendPatientMediaControlCommand('switch-camera', {
    deviceId: normalizedDeviceId
  })
  patientCameraDialogVisible.value = false
}

const clearInspectionPollTimer = () => {
  if (inspectionPollTimer) {
    window.clearTimeout(inspectionPollTimer)
    inspectionPollTimer = 0
  }
}

const clearInspectionProgressTimer = () => {
  if (inspectionProgressTimer) {
    window.clearInterval(inspectionProgressTimer)
    inspectionProgressTimer = 0
  }
}

const startInspectionProgressAnimation = () => {
  clearInspectionProgressTimer()
  inspectionProgressTimer = window.setInterval(() => {
    if (!inspectionRecognizing.value) {
      return
    }

    const currentProgress = inspectionRecognitionProgress.value
    const remainingProgress = inspectionProgressCeiling - currentProgress
    if (remainingProgress <= 0.1) {
      return
    }

    const progressStep =
      currentProgress < 30
        ? 1.4
        : currentProgress < 60
          ? 0.9
          : currentProgress < 80
            ? 0.5
            : 0.2

    inspectionRecognitionProgress.value = Number(
      Math.min(inspectionProgressCeiling, currentProgress + progressStep, currentProgress + remainingProgress * 0.08).toFixed(1)
    )
  }, 450)
}

const stopInspectionPolling = () => {
  inspectionPollRequestId += 1
  clearInspectionPollTimer()
  clearInspectionProgressTimer()
  inspectionRecognizing.value = false
}

const clearInspectionRecognitionDisplay = () => {
  stopInspectionPolling()
  inspectionEditableReports.value = []
  inspectionRecognitionProgress.value = 0
  inspectionRecognitionStatusText.value = ''
  inspectionRecognitionError.value = ''
}

const resetInspectionResultState = () => {
  clearInspectionRecognitionDisplay()
  inspectionBatchId.value = ''
  inspectionSubmittedFileUrls.value = []
}

const resetInspectionCaptureState = () => {
  resetInspectionResultState()
  uploadedInspectionPhotos.value = []
  sideScannerPhotoUploading.value = false
  inspectionSaveLoading.value = false
}

const extractInspectionBatchId = (response: unknown) => {
  if (!isObjectRecord(response)) {
    return ''
  }

  const data = response.data
  if (typeof data === 'string' || typeof data === 'number') {
    return data
  }

  if (isObjectRecord(data)) {
    return data.batchId as string | number | undefined
  }

  return response.batchId as string | number | undefined
}

const normalizeInspectionItem = (item: InspectionRecognizedItem | null | undefined): EditableInspectionItem => ({
  item_name: takeOptionalText(item?.item_name),
  result_value: takeOptionalText(item?.result_value),
  reference_range: takeOptionalText(item?.reference_range),
  unit: takeOptionalText(item?.unit),
  abnormal_flag: takeOptionalText(item?.abnormal_flag),
  result_status: takeOptionalText(item?.result_status),
  is_abnormal: Boolean(item?.is_abnormal)
})

const normalizeInspectionReports = (reports: InspectionBatchReportItem[]): EditableInspectionReport[] => {
  return reports.map((report) => ({
    reportId: report.reportId,
    batchId: report.batchId,
    fileUrl: takeOptionalText(report.fileUrl),
    recognizeStatus: report.recognizeStatus,
    errorMsg: takeOptionalText(report.errorMsg),
    items: Array.isArray(report.recognizedItems)
      ? report.recognizedItems.map(normalizeInspectionItem)
      : []
  }))
}

const normalizeUploadedInspectionPhotos = (reports: InspectionBatchReportItem[]): UploadedInspectionPhoto[] => {
  return reports.flatMap((report, index): UploadedInspectionPhoto[] => {
    const fileUrl = takeOptionalText(report.fileUrl)
    if (!fileUrl) {
      return []
    }

    const reportId = takeOptionalText(report.reportId)
    const sortNo = takeOptionalText(report.sortNo)
    const name = `inspection-${sortNo || reportId || index + 1}`

    return [
      {
        id: reportId ? `history-${reportId}` : `history-${index}-${fileUrl}`,
        name,
        previewUrl: fileUrl,
        fileUrl,
        objectName: '',
        createdAt: Date.now() + index,
        ...(report.reportId !== undefined ? { reportId: report.reportId } : {})
      }
    ]
  })
}

const syncUploadedInspectionPhotoReports = (reports: InspectionBatchReportItem[]) => {
  const reportByFileUrl = new Map<string, InspectionBatchReportItem>()
  reports.forEach((report) => {
    const fileUrl = takeOptionalText(report.fileUrl)
    if (fileUrl) {
      reportByFileUrl.set(fileUrl, report)
    }
  })

  uploadedInspectionPhotos.value = uploadedInspectionPhotos.value.map((photo) => {
    const report = reportByFileUrl.get(takeOptionalText(photo.fileUrl))
    return report?.reportId === undefined
      ? photo
      : {
          ...photo,
          reportId: report.reportId
        }
  })
}

const extractBatchIdFromReports = (reports: InspectionBatchReportItem[]) => {
  for (const report of reports) {
    const batchId = takeOptionalText(report.batchId)
    if (batchId) {
      return report.batchId as string | number
    }
  }

  return ''
}

const hydrateInspectionHistoryReports = (reports: InspectionBatchReportItem[]) => {
  if (!reports.length) {
    uploadedInspectionPhotos.value = []
    resetInspectionResultState()
    return
  }

  const photos = normalizeUploadedInspectionPhotos(reports)
  const batchId = extractBatchIdFromReports(reports)
  const statuses = reports.map((report) => getInspectionStatusNumber(report.recognizeStatus))
  const failedReport = reports.find((report) => getInspectionStatusNumber(report.recognizeStatus) === 3)
  const recognized = reports.length > 0 && statuses.every((status) => status === 2)
  const polling = statuses.some((status) => status === 0 || status === 1)

  uploadedInspectionPhotos.value = photos
  inspectionSubmittedFileUrls.value = photos.map((photo) => photo.fileUrl)
  inspectionEditableReports.value = normalizeInspectionReports(reports)
  inspectionBatchId.value = batchId

  if (failedReport) {
    inspectionRecognitionProgress.value = 100
    inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionFailedStatus')
    inspectionRecognitionError.value = failedReport.errorMsg || t('assistant.aideVideo.consultation.recognitionFailed')
    return
  }

  if (recognized) {
    inspectionRecognitionProgress.value = 100
    inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionSuccess')
    inspectionRecognitionError.value = ''
    return
  }

  if (polling && batchId) {
    startInspectionPolling(batchId)
    return
  }

  inspectionRecognitionProgress.value = 0
  inspectionRecognitionStatusText.value = ''
  inspectionRecognitionError.value = ''
}

const buildInspectionSaveItem = (item: EditableInspectionItem): InspectionRecognizedItem => ({
  item_name: item.item_name,
  result_value: item.result_value,
  reference_range: item.reference_range,
  unit: item.unit,
  abnormal_flag: item.abnormal_flag,
  result_status: item.result_status,
  is_abnormal: item.is_abnormal
})

const getInspectionStatusNumber = (status: unknown) => {
  const statusNumber = Number(status)
  return Number.isFinite(statusNumber) ? statusNumber : -1
}

const resolveInspectionPollingText = (reports: InspectionBatchReportItem[]) => {
  if (!reports.length) {
    return t('assistant.aideVideo.consultation.recognitionWaiting')
  }

  const statuses = reports.map((report) => getInspectionStatusNumber(report.recognizeStatus))
  return statuses.some((status) => status === 1)
    ? t('assistant.aideVideo.consultation.recognitionProcessing')
    : t('assistant.aideVideo.consultation.recognitionPending')
}

const pollInspectionBatchResult = async (batchId: string | number, requestId: number) => {
  try {
    const response = await getInspectionBatchByBatchId(batchId)
    if (requestId !== inspectionPollRequestId) {
      return
    }

    const reports = Array.isArray(response?.data) ? response.data : []
    syncUploadedInspectionPhotoReports(reports)
    const failedReport = reports.find((report) => getInspectionStatusNumber(report.recognizeStatus) === 3)

    if (failedReport) {
      stopInspectionPolling()
      inspectionEditableReports.value = normalizeInspectionReports(reports)
      inspectionRecognitionProgress.value = 100
      inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionFailedStatus')
      inspectionRecognitionError.value = failedReport.errorMsg || t('assistant.aideVideo.consultation.recognitionFailed')
      ElMessage.error(t('assistant.aideVideo.consultation.recognitionFailed'))
      return
    }

    const recognized = reports.length > 0 && reports.every((report) => getInspectionStatusNumber(report.recognizeStatus) === 2)
    if (recognized) {
      clearInspectionPollTimer()
      clearInspectionProgressTimer()
      inspectionRecognizing.value = false
      inspectionEditableReports.value = normalizeInspectionReports(reports)
      inspectionRecognitionProgress.value = 100
      inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionSuccess')
      inspectionRecognitionError.value = ''
      return
    }

    inspectionEditableReports.value = normalizeInspectionReports(reports)
    inspectionProgressCeiling = reports.some((report) => getInspectionStatusNumber(report.recognizeStatus) === 1) ? 94 : 82
    inspectionRecognitionStatusText.value = resolveInspectionPollingText(reports)
    inspectionRecognitionError.value = ''
    clearInspectionPollTimer()
    inspectionPollTimer = window.setTimeout(() => {
      void pollInspectionBatchResult(batchId, requestId)
    }, 3000)
  } catch (error) {
    if (requestId !== inspectionPollRequestId) {
      return
    }

    console.warn('Failed to poll inspection recognition result.', error)
    stopInspectionPolling()
    inspectionRecognitionProgress.value = 100
    inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionFailedStatus')
    inspectionRecognitionError.value = t('assistant.aideVideo.consultation.recognitionFailed')
    ElMessage.error(t('assistant.aideVideo.consultation.recognitionFailed'))
  }
}

const startInspectionPolling = (batchId: string | number) => {
  const requestId = inspectionPollRequestId + 1
  inspectionPollRequestId = requestId
  clearInspectionPollTimer()
  inspectionRecognizing.value = true
  inspectionProgressCeiling = 82
  inspectionRecognitionProgress.value = Math.max(inspectionRecognitionProgress.value, 8)
  inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionWaiting')
  inspectionRecognitionError.value = ''
  startInspectionProgressAnimation()
  void pollInspectionBatchResult(batchId, requestId)
}

const openSideScannerCapture = async () => {
  if (sideScannerHistoryLoading.value) {
    return
  }

  resetInspectionCaptureState()

  if (!sideScannerCaptureDevice.value) {
    requestPatientMediaState()

    if (!SIDE_SCANNER_CAPTURE_DEV_ENABLED) {
      return
    }
  }

  const caseId = takeOptionalText(consultationCaseId.value)
  if (!caseId) {
    sideScannerCaptureVisible.value = true
    return
  }

  const requestId = sideScannerHistoryRequestId + 1
  sideScannerHistoryRequestId = requestId
  sideScannerHistoryLoading.value = true

  try {
    const response = await getInspectionBatchByCaseId(caseId)
    if (requestId !== sideScannerHistoryRequestId) {
      return
    }

    const reports = Array.isArray(response?.data) ? response.data : []
    hydrateInspectionHistoryReports(reports)
  } catch (error) {
    if (requestId === sideScannerHistoryRequestId) {
      console.warn('Failed to load inspection history by caseId.', error)
    }
  } finally {
    if (requestId === sideScannerHistoryRequestId) {
      sideScannerHistoryLoading.value = false
      sideScannerCaptureVisible.value = true
    }
  }
}

const handleSideScannerPhotoConfirm = async (photo: AideCapturePhoto) => {
  if (!photo || sideScannerPhotoUploading.value || uploadedInspectionPhotos.value.length >= SIDE_SCANNER_MAX_PHOTO_COUNT) {
    return
  }

  const caseId = takeOptionalText(consultationCaseId.value)
  if (!caseId) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureCaseUnavailable'))
    return
  }

  sideScannerPhotoUploading.value = true

  try {
    const uploadResults = await uploadConsultationCaptureFiles({
      caseId,
      videoId: consultationVideoId.value,
      files: [{
        file: photo.file,
        name: photo.name
      }]
    })
    const uploadResult = uploadResults[0]
    const fileUrl = takeOptionalText(uploadResult?.url)

    if (!uploadResult || !fileUrl) {
      throw new Error('Missing OSS upload URL.')
    }

    clearInspectionRecognitionDisplay()
    uploadedInspectionPhotos.value = [
      ...uploadedInspectionPhotos.value,
      {
        id: photo.id,
        name: photo.name,
        previewUrl: photo.previewUrl,
        fileUrl,
        objectName: uploadResult.objectName,
        createdAt: photo.createdAt
      }
    ]
    ElMessage.success(t('assistant.aideVideo.consultation.captureUploadComplete'))
  } catch (error) {
    console.warn('Failed to upload side scanner photo.', error)
    ElMessage.error(t('assistant.aideVideo.consultation.captureUploadFailed'))
  } finally {
    sideScannerPhotoUploading.value = false
  }
}

const removeUploadedInspectionPhotoLocally = (photo: UploadedInspectionPhoto) => {
  const photoId = takeOptionalText(photo.id)
  const fileUrl = takeOptionalText(photo.fileUrl)
  uploadedInspectionPhotos.value = uploadedInspectionPhotos.value.filter((item) => {
    if (photoId) {
      return item.id !== photoId
    }

    return takeOptionalText(item.fileUrl) !== fileUrl
  })
}

const handleUploadedInspectionPhotoRemove = async (photo: UploadedInspectionPhoto) => {
  if (sideScannerPhotoUploading.value || inspectionRecognizing.value || inspectionSaveLoading.value) {
    return
  }

  const fileUrl = takeOptionalText(photo.fileUrl)
  const matchedReport = inspectionEditableReports.value.find((report) => {
    return takeOptionalText(report.fileUrl) === fileUrl
  })
  const reportId = photo.reportId ?? matchedReport?.reportId

  if (reportId === undefined || reportId === null || takeOptionalText(reportId) === '') {
    removeUploadedInspectionPhotoLocally(photo)
    resetInspectionResultState()
    return
  }

  const caseId = takeOptionalText(consultationCaseId.value)
  if (!caseId) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureCaseUnavailable'))
    return
  }

  const pendingPhotos = uploadedInspectionPhotos.value.filter((item) => {
    return !takeOptionalText(item.reportId) && takeOptionalText(item.fileUrl) !== fileUrl
  })
  sideScannerPhotoUploading.value = true

  try {
    await deleteInspectionReport(reportId)

    try {
      const response = await getInspectionBatchByCaseId(caseId)
      const reports = Array.isArray(response?.data) ? response.data : []
      hydrateInspectionHistoryReports(reports)
      const historicalFileUrls = new Set(uploadedInspectionPhotos.value.map((item) => takeOptionalText(item.fileUrl)))
      uploadedInspectionPhotos.value = [
        ...uploadedInspectionPhotos.value,
        ...pendingPhotos.filter((item) => !historicalFileUrls.has(takeOptionalText(item.fileUrl)))
      ]
    } catch (error) {
      console.warn('Failed to reload inspection reports after deletion.', error)
      removeUploadedInspectionPhotoLocally(photo)
      resetInspectionResultState()
      ElMessage.error(t('assistant.aideVideo.consultation.captureDeleteRefreshFailed'))
    }
  } catch (error) {
    console.warn('Failed to delete inspection report.', error)
    ElMessage.error(t('assistant.aideVideo.consultation.captureDeleteFailed'))
  } finally {
    sideScannerPhotoUploading.value = false
  }
}

const handleInspectionRecognize = async () => {
  if (inspectionRecognizing.value) {
    return
  }

  const caseId = takeOptionalText(consultationCaseId.value)
  if (!caseId) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureCaseUnavailable'))
    return
  }

  const fileUrlList = uploadedInspectionPhotos.value.map((photo) => takeOptionalText(photo.fileUrl)).filter(Boolean)
  if (!fileUrlList.length) {
    ElMessage.warning(t('assistant.aideVideo.consultation.captureUploadedEmpty'))
    return
  }

  const existingBatchId = inspectionBatchId.value || undefined
  const submittedFileUrls = inspectionSubmittedFileUrls.value
  const hasUploadedPhotoChanges =
    fileUrlList.length !== submittedFileUrls.length ||
    fileUrlList.some((fileUrl) => !submittedFileUrls.includes(fileUrl))
  const shouldSubmitBatch = !existingBatchId || hasUploadedPhotoChanges

  inspectionRecognizing.value = true
  inspectionEditableReports.value = []
  inspectionProgressCeiling = 45
  inspectionRecognitionProgress.value = 5
  inspectionRecognitionError.value = ''
  inspectionRecognitionStatusText.value = shouldSubmitBatch
    ? t('assistant.aideVideo.consultation.recognitionSubmitting')
    : t('assistant.aideVideo.consultation.recognitionRetrying')
  startInspectionProgressAnimation()

  try {
    let batchId: string | number | undefined = existingBatchId

    if (shouldSubmitBatch) {
      const submitResponse = await submitInspectionBatch({
        caseId,
        fileUrlList
      })
      batchId = extractInspectionBatchId(submitResponse)
    } else if (batchId) {
      const retryResponse = await retryInspectionBatch(batchId)
      batchId = extractInspectionBatchId(retryResponse) || batchId
    }

    if (!batchId) {
      throw new Error('Missing inspection batchId.')
    }

    inspectionBatchId.value = batchId
    if (shouldSubmitBatch) {
      inspectionSubmittedFileUrls.value = [...fileUrlList]
    }
    startInspectionPolling(batchId)
  } catch (error) {
    console.warn('Failed to start inspection recognition.', error)
    stopInspectionPolling()
    inspectionRecognitionProgress.value = 100
    inspectionRecognitionStatusText.value = t('assistant.aideVideo.consultation.recognitionFailedStatus')
    inspectionRecognitionError.value = t('assistant.aideVideo.consultation.recognitionFailed')
    ElMessage.error(t('assistant.aideVideo.consultation.recognitionFailed'))
  }
}

const handleInspectionSave = async () => {
  if (inspectionSaveLoading.value || inspectionRecognizing.value) {
    return
  }

  const batchId = inspectionBatchId.value
  const reports = inspectionEditableReports.value.filter((report) => takeOptionalText(report.reportId))
  if (!batchId || !reports.length) {
    ElMessage.warning(t('assistant.aideVideo.consultation.recognitionSaveUnavailable'))
    return
  }

  inspectionSaveLoading.value = true

  try {
    await Promise.all(reports.map((report) => {
      return saveInspectionReportItems({
        reportId: report.reportId as string | number,
        items: report.items.map(buildInspectionSaveItem)
      })
    }))
    await confirmInspectionBatchUpload(batchId)
    ElMessage.success(t('assistant.aideVideo.consultation.confirmUploadComplete'))
    sideScannerCaptureVisible.value = false
    resetInspectionCaptureState()
  } catch (error) {
    console.warn('Failed to save inspection recognized items.', error)
    ElMessage.error(t('assistant.aideVideo.consultation.recognitionSaveFailed'))
  } finally {
    inspectionSaveLoading.value = false
  }
}

watch(sideScannerCaptureVisible, (visible) => {
  if (!visible) {
    stopInspectionPolling()
  }
})

const chat = createPatientConsultationChatService({
  onMessage: ({ contentLo, contentCn, role }) => {
    const doctorId = takeOptionalText(consultationDoctorId.value) || 'doctor'
    const sender =
      role === 2
        ? {
            speakerId: session.channelContext.value?.userId || userId.value || 'aide',
            speakerName: aideName.value,
            side: 'self' as const
          }
        : role === 1
          ? {
              speakerId: `patient:${consultationPatientId.value || 'patient'}`,
              speakerName: patientName.value,
              side: 'remote' as const
            }
          : {
              speakerId: `doctor:${doctorId}`,
              speakerName: doctorTitle.value,
              side: 'remote' as const
            }

    timeline.appendManualMessage({
      ...sender,
      sourceText: translationEnabled.value ? contentLo : contentCn || contentLo,
      translatedText: translationEnabled.value ? contentCn : manualChatTranslationEnabled.value ? contentLo : '',
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? 'cn' : manualChatTranslationEnabled.value ? 'lo' : 'cn'
    })
  },
  onError: (error) => {
    console.warn('Aide consultation chat websocket error.', error)
  }
})

const chatInputDisabled = computed(() => false)
const chatSendDisabled = computed(() => {
  return (
    chatSending.value ||
    !chatDraft.value.trim() ||
    !takeOptionalText(consultationDoctorId.value) ||
    !takeOptionalText(consultationPatientId.value) ||
    !takeOptionalText(consultationCaseId.value) ||
    chat.connectionStatus.value !== 'connected'
  )
})

const chatStatusText = computed(() => {
  if (!takeOptionalText(consultationDoctorId.value)) {
    return t('assistant.patientVideo.consultation.chatDoctorUnavailable')
  }

  if (!takeOptionalText(consultationCaseId.value)) {
    return t('assistant.patientVideo.consultation.chatCaseUnavailable')
  }

  if (chat.connectionStatus.value === 'connecting') {
    return t('assistant.patientVideo.consultation.chatConnecting')
  }

  if (chat.connectionStatus.value === 'connected') {
    return t('assistant.patientVideo.consultation.chatConnected')
  }

  return t('assistant.patientVideo.consultation.chatUnavailable')
})

const connectConsultationChat = async () => {
  try {
    await chat.connect(consultationPatientId.value)
  } catch (error) {
    console.warn('Failed to connect aide consultation chat websocket.', error)
    ElMessage.warning(t('assistant.patientVideo.consultation.chatConnectFailed'))
  }
}

const handleChatInput = (value: string) => {
  chatDraft.value = value
}

const appendLocalManualMessage = (payload: ConsultationChatPayload) => {
  const currentUserId = session.channelContext.value?.userId || userId.value || 'aide'
  timeline.appendManualMessage({
    speakerId: currentUserId,
    speakerName: aideName.value,
    side: 'self',
    sourceText: translationEnabled.value ? payload.contentLo : payload.contentCn || payload.contentLo,
    translatedText: translationEnabled.value ? payload.contentCn : manualChatTranslationEnabled.value ? payload.contentLo : '',
    sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
    targetLanguage: translationEnabled.value ? 'cn' : manualChatTranslationEnabled.value ? 'lo' : 'cn'
  })
}

const handleChatSend = async () => {
  const normalizedText = chatDraft.value.trim()

  if (!normalizedText) {
    ElMessage.warning(t('assistant.patientVideo.consultation.chatInputRequired'))
    return
  }

  const doctorId = takeOptionalText(consultationDoctorId.value)
  const caseId = takeOptionalText(consultationCaseId.value)

  if (!doctorId) {
    ElMessage.warning(t('assistant.patientVideo.consultation.chatDoctorUnavailable'))
    return
  }

  if (!caseId) {
    ElMessage.warning(t('assistant.patientVideo.consultation.chatCaseUnavailable'))
    return
  }

  if (chat.connectionStatus.value !== 'connected') {
    ElMessage.warning(t('assistant.patientVideo.consultation.chatUnavailable'))
    return
  }

  chatDraft.value = ''
  chatSending.value = true

  try {
    const contentCn = translationEnabled.value
      ? resolveTranslationText((await translateConsultationText({
          source: 'lo',
          to: 'cn',
          text: normalizedText
        }))?.data)
      : normalizedText
    const contentLo = translationEnabled.value
      ? normalizedText
      : manualChatTranslationEnabled.value
        ? resolveTranslationText((await translateConsultationText({
            source: 'cn',
            to: 'lo',
            text: normalizedText
          }))?.data)
        : ''
    const payload = {
      contentLo,
      contentCn
    }

    appendLocalManualMessage(payload)

    const [sendResult, saveResult] = await Promise.allSettled([
      chat.sendTranslatedMessage({
        doctorId,
        patientId: consultationPatientId.value,
        role: 2,
        ...payload
      }),
      addWrittenRecord({
        caseId,
        isDoctor: 2,
        contentCn,
        contentLo
      })
    ])

    if (sendResult.status === 'rejected') {
      console.warn('Failed to send aide consultation chat websocket message.', sendResult.reason)
      ElMessage.warning(t('assistant.patientVideo.consultation.chatSendFailed'))
    }

    if (saveResult.status === 'rejected') {
      console.warn('Failed to save aide consultation manual chat record.', saveResult.reason)
      ElMessage.warning(t('assistant.patientVideo.consultation.chatSaveFailed'))
    }
  } catch (error) {
    console.warn('Failed to translate aide consultation chat message.', error)
    if (!chatDraft.value) {
      chatDraft.value = normalizedText
    }
    ElMessage.warning(t('assistant.patientVideo.consultation.chatTranslateFailed'))
  } finally {
    chatSending.value = false
  }
}

const ensurePatientProfile = async () => {
  const patientId = consultationPatientId.value
  if (!patientId) {
    return ''
  }

  const existingName = takeText(sessionStore.patientDetail, ['patientName', 'name'])
  if (existingName) {
    return existingName
  }

  try {
    const response = await getPatientDetail(patientId)
    const detail = (response?.data || null) as Record<string, unknown> | null
    sessionStore.setPatientDetail(patientId, detail)
    return takeText(detail, ['patientName', 'name']) || patientId
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    sessionStore.setPatientDetailError(message, patientId)
    return patientId
  }
}

const bootstrapConsultation = async () => {
  if (
    !token.value ||
    (translationEnabled.value && !secondaryToken.value) ||
    !channelId.value ||
    !userId.value ||
    !consultationPatientId.value ||
    !consultationCaseId.value ||
    !consultationDoctorId.value
  ) {
    pageError.value = t('assistant.aideVideo.consultation.missingParams')
    return
  }

  if (consultationDoctorId.value || consultationDoctorName.value) {
    sessionStore.setDoctorInfo({
      doctorId: consultationDoctorId.value,
      doctorName: consultationDoctorName.value,
      goodAt: consultationDoctorGoodAt.value
    })
  }

  try {
    await ensurePatientProfile()

    await session.enterConsultationRoom({
      appId: RTC_APP_ID,
      appKey: RTC_APP_KEY,
      userId: userId.value,
      channelName: channelId.value,
      userName: aideName.value,
      token: token.value,
      secondaryToken: secondaryToken.value,
      language: consultationLang.value,
      translationEnabled: translationEnabled.value,
      subtitleTranslationEnabled: subtitleTranslationEnabled.value,
      publishLocalMedia: false,
      playRemoteAudio: false
    })
    void startConsultationDuration(consultationVideoId.value)

    setAssistantConsultationSseContext({
      patientId: consultationPatientId.value,
      caseId: consultationCaseId.value,
      doctorName: consultationDoctorName.value || doctorTitle.value
    }, router)
    await startAssistantConsultationSse(router)

    await notifyAideVideoRoomDoctor({
      patientId: consultationPatientId.value,
      caseId: consultationCaseId.value,
      doctorId: consultationDoctorId.value,
      consultationLang: consultationLang.value
    })

    await loadConversationHistory(consultationVideoId.value)
    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle({ taskPolicy: 'force' })
    notifyPatientVideoRoomCreated()
    requestPatientMediaState()
  } catch (error) {
    await cleanupConsultationRoom().catch((cleanupError) => {
      console.warn('Failed to cleanup aide consultation after bootstrap failure.', cleanupError)
    })
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : t('assistant.aideVideo.consultation.joinFailed')
  }
}

const retrySubtitle = async () => {
  await session.cleanupSubtitle()
  timeline.bindAsrStreams(session.subtitleBindings.value)
  await session.bootstrapSubtitle({ taskPolicy: 'force' })
}

const goBackToWorkbench = async () => {
  await router.replace('/assistant/workbench')
}

const goBackToPreviousRoute = async () => {
  const previousRoute = router.options.history.state.back
  const previousPath = typeof previousRoute === 'string' ? previousRoute : ''

  if (window.history.length > 1 && previousPath && !previousPath.startsWith('/assistant/aide/consultation')) {
    router.back()
    return
  }

  await goBackToWorkbench()
}

const cleanupConsultationRoom = async () => {
  if (roomCleanedUp) {
    return
  }

  roomCleanedUp = true
  stopConsultationDuration()
  chatDraft.value = ''
  patientCameraDialogVisible.value = false
  sideScannerCaptureVisible.value = false
  resetInspectionCaptureState()
  clearAssistantConsultationSseContext()
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: 'force' })
}

const notifyPatientConsultationEnded = () => {
  broadcastConsultationEnded({
    patientId: takeOptionalText(consultationPatientId.value),
    caseId: takeOptionalText(consultationCaseId.value)
  })
}

const handleLeave = async () => {
  if (leavingInProgress) {
    return
  }

  leavingInProgress = true
  const confirmed = await showConfirmDialog({
    title: t('assistant.aideVideo.consultation.leaveConfirmTitle'),
    description: t('assistant.aideVideo.consultation.leaveConfirmDescription'),
    cancelText: t('assistant.aideVideo.consultation.leaveConfirmCancel'),
    confirmText: t('assistant.aideVideo.consultation.leaveConfirmConfirm'),
    type: 'danger',
    icon: 'warning'
  })

  if (!confirmed) {
    leavingInProgress = false
    return
  }

  try {
    await cleanupConsultationRoom()
    notifyPatientConsultationEnded()
    await goBackToWorkbench()
  } finally {
    leavingInProgress = false
  }
}

const handleDoctorRejected = (event: { patientId: string; caseId: string; doctorName: string }) => {
  if (doctorRejectedHandled) {
    return
  }

  const currentCaseId = takeOptionalText(consultationCaseId.value)
  if (currentCaseId && event.caseId && currentCaseId !== event.caseId) {
    return
  }

  doctorRejectedHandled = true
  rejectedDoctorName.value = event.doctorName || doctorTitle.value
  rejectedEventContext.value = {
    patientId: event.patientId || consultationPatientId.value,
    caseId: event.caseId || consultationCaseId.value,
    doctorName: rejectedDoctorName.value
  }
  resendRequestUsed.value = false
  doctorRejectedDialogVisible.value = true
}

const handleConsultationCompleted = async (event: { patientId: string; caseId: string }) => {
  if (consultationCompletedHandled) {
    return
  }

  const currentCaseId = takeOptionalText(consultationCaseId.value)
  if (currentCaseId && event.caseId && currentCaseId !== event.caseId) {
    return
  }

  consultationCompletedHandled = true
  doctorRejectedDialogVisible.value = false

  await showConfirmDialog({
    message: t('assistant.aideVideo.consultation.completedMessage'),
    confirmText: t('common.confirm'),
    showCancel: false
  })

  const patientId = takeOptionalText(event.patientId) || takeOptionalText(consultationPatientId.value)
  const caseId = takeOptionalText(event.caseId) || currentCaseId

  clearAssistantConsultationSseContext()
  broadcastConsultationEnded({
    patientId,
    caseId
  })


  await router.replace({
    path: '/assistant/case-result',
    query: {
      caseId
    }
  })
}

const buildRejectedContext = () => {
  return {
    patientId: rejectedEventContext.value?.patientId || consultationPatientId.value,
    caseId: rejectedEventContext.value?.caseId || consultationCaseId.value,
    doctorName: rejectedEventContext.value?.doctorName || consultationDoctorName.value || doctorTitle.value
  }
}

const handleResendRequest = async () => {
  if (resendRequestLoading.value || resendRequestUsed.value) {
    return
  }

  const context = buildRejectedContext()
  const doctorId = takeOptionalText(consultationDoctorId.value)
  if (!context.patientId || !context.caseId || !doctorId) {
    ElMessage.error(t('assistant.aideVideo.consultation.resendRequestFailed'))
    return
  }

  resendRequestLoading.value = true
  resendRequestUsed.value = true

  try {
    const roomId = await createAideVideoRoom({
      patientId: context.patientId,
      caseId: context.caseId,
      doctorId,
      consultationLang: consultationLang.value
    })

    await cleanupConsultationRoom()
    roomCleanedUp = false
    doctorRejectedDialogVisible.value = false

    await navigateToAideConsultationRoom(router, {
      patientId: context.patientId,
      doctorId,
      doctorName: context.doctorName,
      goodAt: consultationDoctorGoodAt.value,
      roomId,
      caseId: context.caseId,
      consultationLang: consultationLang.value
    }, {
      replace: true
    })

    pageError.value = ''
    await bootstrapConsultation()
    doctorRejectedHandled = false
    rejectedEventContext.value = null
    ElMessage.success(t('assistant.aideVideo.consultation.resendRequestSuccess'))
  } catch (error) {
    resendRequestUsed.value = false
    console.warn('Failed to resend aide consultation request.', error)
    ElMessage.error(t('assistant.aideVideo.consultation.resendRequestFailed'))
  } finally {
    resendRequestLoading.value = false
  }
}

const handleRejectLater = async () => {
  const context = buildRejectedContext()
  broadcastConsultationRejected({
    patientId: context.patientId,
    caseId: context.caseId
  })
  doctorRejectedDialogVisible.value = false
  await cleanupConsultationRoom()
  await goBackToPreviousRoute()
}

onMounted(async () => {
  stopPatientChannelListening = listenPatientChannelMessages((message) => {
    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlState) {
      handlePatientMediaState(message.payload)
    }
  })
  stopRejectedListening = listenAssistantConsultationRejected((event) => {
    void handleDoctorRejected(event)
  })
  stopCompletedListening = listenAssistantConsultationCompleted((event) => {
    void handleConsultationCompleted(event)
  })
  await bootstrapConsultation()
})

onBeforeUnmount(async () => {
  sideScannerHistoryRequestId += 1
  sideScannerHistoryLoading.value = false
  stopInspectionPolling()
  stopRejectedListening?.()
  stopRejectedListening = null
  stopCompletedListening?.()
  stopCompletedListening = null
  stopPatientChannelListening?.()
  stopPatientChannelListening = null
  stopConsultationDuration()
  await cleanupConsultationRoom()
})
</script>

<style scoped lang="scss">
.patient-consultation-page {
  height: 100%;
  min-height: 0;
  flex: 1;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(240, 245, 251, 0.84) 0%, rgba(250, 252, 255, 0.98) 100%);
}

.consultation-layout {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.subtitle-column {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(77, 103, 154, 0.08);
}

.video-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 8px;
  overflow: hidden;
}

.featured-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1.5px solid rgba(53, 118, 242, 0.94);
  border-radius: 10px;
  padding: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 6px 20px rgba(80, 104, 150, 0.08);
}

.stage-pill {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #24416e;
  font-size: 19px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(53, 83, 132, 0.14);
}

.stage-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #18b47b;
  box-shadow: 0 0 0 4px rgba(24, 180, 123, 0.14);
}

.connection-banner {
  position: absolute;
  top: 48px;
  left: 12px;
  right: 12px;
  z-index: 7;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 241, 229, 0.96);
  color: #a24a12;
  font-size: 19px;
  font-weight: 700;
}

.preview-row {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 6;
  display: grid;
  grid-template-columns: minmax(226px, 270px);
  gap: 6px;
  width: min(270px, calc(100% - 314px));
}

.preview-row :deep(.consult-participant-card) {
  width: 100%;
  cursor: pointer;
}

.featured-card {
  height: 100%;
}

.consultation-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 16px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(80, 104, 150, 0.08);
}

.doctor-panel {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  gap: 8px;
}

.doctor-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3576f2, #53b7ff);
  color: #ffffff;
  font-size: 23px;
  font-weight: 800;
}

.doctor-copy {
  min-width: 0;
  overflow: hidden;
}

.doctor-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 5px;
}

.doctor-heading strong {
  min-width: 0;
  overflow: hidden;
  color: #22395f;
  font-size: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-status {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(24, 180, 123, 0.12);
  color: #139565;
  font-size: 18px;
  font-weight: 700;
}

.doctor-good-at {
  display: flex;
  align-items: baseline;
  min-width: 0;
  margin: 2px 0 0;
  overflow: hidden;
  color: #6d7d96;
  font-size: 20px;
  line-height: 1.5;
  white-space: nowrap;
}

.doctor-good-at__label {
  flex: 0 0 auto;
  color: #415678;
  font-weight: 700;
}

.doctor-good-at__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consultation-controls {
  justify-self: end;
  width: max-content;
}

.consultation-controls :deep(.consult-room-controls) {
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.consultation-controls :deep(.control-button) {
  flex: 0 0 auto;
}

.consultation-controls :deep(.label) {
  white-space: nowrap;
}

.consultation-error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.error-card {
  width: min(420px, 92vw);
  padding: 24px 20px;
  border-radius: 12px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 8px 24px rgba(71, 93, 134, 0.14);
}

.error-icon {
  color: #e45d5d;
  font-size: 45px;
}

.error-card h2 {
  margin: 10px 0 6px;
  font-size: 27px;
  color: #233d66;
}

.error-card p {
  margin: 0 0 16px;
  color: #71819b;
  font-size: 21px;
}

.error-card :deep(.el-button) {
  font-size: 21px;
}

.rejected-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.62);
}

.rejected-dialog {
  width: min(534px, calc(100vw - 32px));
  height: min(390px, calc(100vh - 28px));
  min-height: 300px;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #14a4ea;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: none;
}

.rejected-dialog-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: #ff9f1c;
}

.rejected-call-icon {
  width: 80px;
  height: 80px;
  color: #000000;
}

.rejected-call-icon line {
  stroke: #2f72ff;
  stroke-width: 0.3;
  stroke-linecap: round;
}

.rejected-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(100% - 120px);
  padding: 46px 28px 26px;
  box-sizing: border-box;
  background: #ffffff;
  text-align: center;
}

.rejected-dialog-title {
  margin: 0;
  color: #2b2f36;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0;
}

.rejected-dialog-message {
  margin: 12px 0 0;
  color: #2b2f36;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0;
}

.rejected-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 21px;
  width: min(325px, 100%);
  margin-top: 19px;
}

.rejected-action {
  width: 100%;
  border: none;
  background: transparent;
  color: #2b2f36;
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.rejected-action:not(:disabled):hover {
  transform: translateY(-0.5px);
}

.rejected-action--primary {
  height: 50px;
  border-radius: 3px;
  background: #269fdb;
  color: #ffffff;
}

.rejected-action--ghost {
  width: auto;
  height: auto;
  padding: 0;
  color: #2b2f36;
}

.rejected-action:disabled {
  cursor: not-allowed;
  opacity: 0.64;
  transform: none;
  box-shadow: none;
}

@media (max-width: 1100px) {
  .consultation-layout {
    grid-template-columns: minmax(0, 1fr);
    overflow: auto;
  }

  .patient-consultation-page {
    overflow: auto;
  }

  .subtitle-column {
    min-height: 360px;
  }

  .featured-stage {
    min-height: 420px;
  }

  .preview-row {
    position: static;
    width: 100%;
    margin-top: 44px;
    margin-bottom: 8px;
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .patient-consultation-page {
    padding: 6px;
  }

  .consultation-footer {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .consultation-controls {
    justify-self: stretch;
    width: 100%;
  }

  .consultation-controls :deep(.consult-room-controls) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .rejected-dialog {
    width: min(534px, calc(100vw - 24px));
    height: auto;
    min-height: 0;
  }

  .rejected-dialog-hero {
    height: 90px;
  }

  .rejected-call-icon {
    width: 64px;
    height: 64px;
  }

  .rejected-dialog-body {
    height: auto;
    padding: 29px 12px 22px;
  }

  .rejected-dialog-title {
    font-size: 21px;
  }

  .rejected-dialog-message {
    margin-top: 10px;
    font-size: 14px;
  }

  .rejected-actions {
    gap: 17px;
    margin-top: 17px;
  }

  .rejected-action--primary {
    height: 41px;
    font-size: 16px;
  }

  .rejected-action--ghost {
    font-size: 16px;
  }
}
</style>
