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
          :translation-enabled="translationEnabled"
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
                  <span>{{ t('assistant.patientVideo.consultation.goodAt') }}:</span>
                  {{ consultationDoctorGoodAt || t('common.notAvailable') }}
                </p>
              </div>
            </div>

            <consult-room-controls
              :camera-enabled="patientMediaState.cameraEnabled"
              :mic-enabled="patientMediaState.micEnabled"
              :on-toggle-camera="handleTogglePatientCamera"
              :on-switch-camera="openPatientCameraDialog"
              :on-toggle-mic="handleTogglePatientMic"
              :on-leave="handleLeave"
              :camera-switching="patientMediaState.cameraSwitching"
              :controls-disabled="patientMediaControlsDisabled"
              show-camera
            />
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PatientPageShell from '@/components/patient/PatientPageShell.vue'
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
import ConsultCameraSelectDialog from '@/views/patient/consultation/components/ConsultCameraSelectDialog.vue'
import ConsultParticipantCard from '@/views/patient/consultation/components/ConsultParticipantCard.vue'
import ConsultRoomControls from '@/views/patient/consultation/components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from '@/views/patient/consultation/components/ConsultSubtitleTimeline.vue'
import { usePatientConsultationSession } from '@/views/patient/consultation/composables/usePatientConsultationSession'
import { usePatientSubtitleTimeline } from '@/views/patient/consultation/composables/usePatientSubtitleTimeline'
import { createPatientConsultationChatService } from '@/views/patient/consultation/services/consultation-chat'
import { normalizeConversationHistory, type ConsultationHistoryItem } from '@/views/patient/consultation/services/consultation-history'
import type { ConsultationChatPayload } from '@/views/patient/consultation/types'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'

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

const pageError = ref('')
const consultationDuration = ref('00:00:00')
const chatDraft = ref('')
const chatSending = ref(false)
const patientCameraDialogVisible = ref(false)
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

const aideCameraDeviceLabelKeys: Record<string, string> = {
  f85077a229286adbac6903ac768f68354ec19b8cdb294944bf969f0ff8a91aee: 'assistant.aideVideo.consultation.cameraLabels.sideScanner',
  f5f2c0457a05f0af8d7d6e9aa9a434d04367c040f529cbc7e06a7925b5d9417c: 'assistant.aideVideo.consultation.cameraLabels.patientCamera',
  '36d678e2e8dc5761d04198cdddb80df5244dc3dedff300a077c9e1c1cd0577ef': 'assistant.aideVideo.consultation.cameraLabels.doctorCamera'
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
const consultationLang = computed<'lo' | 'cn'>(() => {
  const rawLang = queryValue('consultationLang') || sessionStore.consultationLang
  return rawLang === 'cn' || rawLang === 'zh-cn' ? 'cn' : 'lo'
})
const translationEnabled = computed(() => consultationLang.value === 'lo')

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

const patientCameraDevices = computed(() => {
  return patientMediaState.value.cameraDevices.map((device) => ({
    ...device,
    label: aideCameraDeviceLabelKeys[device.deviceId] ? t(aideCameraDeviceLabelKeys[device.deviceId]) : device.label
  })) as unknown as MediaDeviceInfo[]
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
  getTranslationEnabled: () => translationEnabled.value
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
    timeline.appendHistoryMessage({
      ...speaker,
      messageType: item.messageType,
      sourceText,
      translatedText: translationEnabled.value ? item.contentCn : '',
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? 'cn' : 'cn',
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
      translatedText: translationEnabled.value ? contentCn : '',
      sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
      targetLanguage: translationEnabled.value ? 'cn' : 'cn'
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
    translatedText: translationEnabled.value ? payload.contentCn : '',
    sourceLanguage: translationEnabled.value ? 'lo' : 'cn',
    targetLanguage: translationEnabled.value ? 'cn' : 'cn'
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
    const payload = {
      contentLo: translationEnabled.value ? normalizedText : '',
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
        contentLo: translationEnabled.value ? normalizedText : ''
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(80, 104, 150, 0.08);
}

.doctor-panel {
  display: flex;
  align-items: center;
  min-width: 0;
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
}

.doctor-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.doctor-heading strong {
  color: #22395f;
  font-size: 22px;
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
  margin: 2px 0 0;
  color: #6d7d96;
  font-size: 20px;
  line-height: 1.5;
}

.doctor-good-at span {
  color: #415678;
  font-weight: 700;
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
    align-items: flex-start;
    flex-direction: column;
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
