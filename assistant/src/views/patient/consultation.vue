<template>
  <patient-page-shell>
    <section class="patient-consultation-page">
      <div v-if="pageError" class="consultation-error-state">
        <div class="error-card">
          <el-icon class="error-icon"><warning-filled /></el-icon>
          <h2>{{ t('assistant.patientVideo.consultation.errorTitle') }}</h2>
          <p>{{ pageError }}</p>
          <el-button type="primary" @click="goBackToWaiting">
            {{ t('assistant.patientVideo.consultation.backToWaiting') }}
          </el-button>
        </div>
      </div>

      <div v-else class="consultation-layout">
        <consult-subtitle-timeline
          class="subtitle-column"
          :items="timeline.items.value"
          :loading="session.subtitleLoading.value"
          :error="session.subtitleError.value"
          :on-retry="retrySubtitle"
          :update-scroll-state="timeline.updateScrollState"
          :scroll-to-latest-if-needed="timeline.scrollToLatestIfNeeded"
          :scroll-version="timeline.scrollVersion.value"
          :chat-draft="chatDraft"
          :chat-sending="chatSending"
          :chat-input-disabled="chatInputDisabled"
          :chat-send-disabled="chatSendDisabled"
          :chat-status-text="chatStatusText"
          :show-chat-composer="false"
          :translation-enabled="translationEnabled"
          :primary-language="consultationLang"
          :on-chat-input="handleChatInput"
          :on-chat-send="handleChatSend"
        />

        <section class="video-column">
          <div class="featured-stage">
            <div class="stage-pill">
              <span class="stage-dot" />
              <span>{{ t('assistant.patientVideo.consultation.inCall') }}</span>
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
                :mirror="previewParticipantRole === 'patient'"
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
              :mirror="featuredParticipantRole === 'patient'"
            :show-status="false"
          />
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
import { addWrittenRecord, getPatientDetail, translateConsultationText } from '@/api/patient'
import { getVideoConversation, getVideoId, getVideoTime, getVideoToken, saveSubtitle } from '@/api/video'
import { PATIENT_CHANNEL_MESSAGE_TYPES } from '@/constants/patient'
import { usePatientSessionStore } from '@/stores/patient-session'
import { broadcastPatientMediaControlState, listenPatientChannelMessages } from '@/utils/patient-channel'
import ConsultParticipantCard from '@/views/patient/consultation/components/ConsultParticipantCard.vue'
import ConsultSubtitleTimeline from '@/views/patient/consultation/components/ConsultSubtitleTimeline.vue'
import { usePatientConsultationSession } from '@/views/patient/consultation/composables/usePatientConsultationSession'
import { usePatientSubtitleTimeline } from '@/views/patient/consultation/composables/usePatientSubtitleTimeline'
import { createPatientConsultationChatService } from '@/views/patient/consultation/services/consultation-chat'
import { normalizeConversationHistory, type ConsultationHistoryItem } from '@/views/patient/consultation/services/consultation-history'
import type { ConsultationChatPayload, SubtitleTimelineItem } from '@/views/patient/consultation/types'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sessionStore = usePatientSessionStore()
const session = usePatientConsultationSession()
const savedSubtitleKeys = new Set<string>()
let stopListening: (() => void) | null = null
let leavingInProgress = false

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

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

const isCurrentConsultationContext = (payload: { patientId: string; caseId?: string | number }) => {
  if (payload.patientId && userId.value && payload.patientId !== userId.value) {
    return false
  }

  const currentCaseId = takeOptionalText(consultationCaseId.value)
  const payloadCaseId = takeOptionalText(payload.caseId)
  if (payloadCaseId && currentCaseId && payloadCaseId !== currentCaseId) {
    return false
  }

  return true
}

const queryValue = (key: string) => {
  const value = route.query[key]
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

const token = computed(() => queryValue('token'))
const secondaryToken = computed(() => queryValue('secondaryToken'))
const channelId = computed(() => queryValue('channelId'))
const userId = computed(() => queryValue('userId'))
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
const pageError = ref('')
const consultationDuration = ref('00:00:00')
const chatDraft = ref('')
const chatSending = ref(false)
const featuredParticipantRole = ref<'doctor' | 'patient'>('doctor')
let durationTimer = 0
let durationStartedAt = 0
let durationRequestId = 0

const patientName = computed(() => {
  return takeText(sessionStore.patientDetail, ['patientName', 'name']) || userId.value || t('common.notAvailable')
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

const patientSelfParticipant = computed(() => ({
  userId: session.channelContext.value?.userId || userId.value || 'patient',
  userName: patientName.value,
  track: session.localPreviewTrack.value,
  muted: !session.micEnabled.value,
  speaking: false,
  placeholderBadge: t('assistant.patientVideo.consultation.selfBadge')
}))

const featuredParticipant = computed(() => {
  return featuredParticipantRole.value === 'doctor' ? doctorStageParticipant.value : patientSelfParticipant.value
})

const previewParticipantRole = computed<'doctor' | 'patient'>(() => {
  return featuredParticipantRole.value === 'doctor' ? 'patient' : 'doctor'
})

const previewParticipant = computed(() => {
  return previewParticipantRole.value === 'doctor' ? doctorStageParticipant.value : patientSelfParticipant.value
})

const featuredPlaceholderMode = computed<'waiting' | 'avatar' | 'avatar-name'>(() => {
  return featuredParticipantRole.value === 'doctor' ? doctorPlaceholderMode.value : 'avatar-name'
})

const toggleFeaturedParticipant = () => {
  featuredParticipantRole.value = previewParticipantRole.value
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

function handleSubtitleFinalized(item: SubtitleTimelineItem) {
  const videoId = consultationVideoId.value
  const currentUserId = session.channelContext.value?.userId || userId.value
  const payload = resolveSubtitleSavePayload(item)

  if (!videoId || !payload || !currentUserId || item.speakerId !== currentUserId) {
    return
  }

  const saveKey = buildSubtitleSaveKey(item)
  if (savedSubtitleKeys.has(saveKey)) {
    return
  }

  savedSubtitleKeys.add(saveKey)
  void saveSubtitle({
    videoId,
    isDoctor: 1,
    ...payload
  }).catch((error) => {
    console.warn('Failed to save patient subtitle record.', error)
  })
}

const timeline = usePatientSubtitleTimeline({
  getCurrentUserId: () => session.channelContext.value?.userId || userId.value,
  getCurrentUserName: () => patientName.value,
  getRemoteUsers: () => session.allUsers.value.filter((item) => item.userId !== userId.value),
  getTranslationEnabled: () => translationEnabled.value,
  onFinalizedItem: handleSubtitleFinalized
})

const resolveHistorySpeaker = (item: ConsultationHistoryItem) => {
  if (item.isDoctor === 1) {
    return {
      speakerId: session.channelContext.value?.userId || userId.value || 'patient',
      speakerName: patientName.value,
      side: 'self' as const
    }
  }

  if (item.isDoctor === 2) {
    return {
      speakerId: 'aide',
      speakerName: t('assistant.aideVideo.consultation.aideFallbackName'),
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
    console.warn('Failed to load patient consultation conversation history.', error)
  }
}

const chat = createPatientConsultationChatService({
  onMessage: ({ contentLo, contentCn, role }) => {
    const doctorId = takeOptionalText(consultationDoctorId.value) || 'doctor'
    const sender =
      role === 1
        ? {
            speakerId: session.channelContext.value?.userId || userId.value || 'patient',
            speakerName: patientName.value,
            side: 'self' as const
          }
        : role === 2
          ? {
              speakerId: 'aide',
              speakerName: t('assistant.aideVideo.consultation.aideFallbackName'),
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
    console.warn('Patient consultation chat websocket error.', error)
  }
})

const chatInputDisabled = computed(() => chatSending.value)
const chatSendDisabled = computed(() => {
  return (
    chatSending.value ||
    !chatDraft.value.trim() ||
    !takeOptionalText(consultationDoctorId.value) ||
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
    console.info('[patient-consultation-page] start chat connect', {
      patientId: userId.value
    })
    await chat.connect(userId.value)
  } catch (error) {
    console.warn('Failed to connect patient consultation chat websocket.', error)
    ElMessage.warning(t('assistant.patientVideo.consultation.chatConnectFailed'))
  }
}

const serializeCameraDevices = () => {
  return session.cameraDevices.value.map((device) => ({
    deviceId: device.deviceId || '',
    label: device.label || '',
    groupId: device.groupId || '',
    kind: device.kind || 'videoinput'
  }))
}

const broadcastMediaControlState = (error = '') => {
  const patientId = takeOptionalText(userId.value)
  if (!patientId) {
    return
  }

  broadcastPatientMediaControlState({
    patientId,
    caseId: takeOptionalText(consultationCaseId.value),
    cameraEnabled: session.cameraEnabled.value,
    micEnabled: session.micEnabled.value,
    cameraSwitching: session.cameraSwitching.value,
    selectedCameraId: session.selectedCameraId.value,
    cameraDevices: serializeCameraDevices(),
    ...(error ? { error } : {})
  })
}

const refreshCameraDevices = async () => {
  try {
    await session.loadCameraDevices()
  } catch (error) {
    console.warn('Failed to load patient camera devices.', error)
    ElMessage.warning(t('assistant.patientVideo.consultation.cameraLoadFailed'))
  } finally {
    broadcastMediaControlState()
  }
}

const requestInitialCameraSelection = async () => {
  await refreshCameraDevices()

  return session.selectedCameraId.value
}

const handleChatInput = (value: string) => {
  chatDraft.value = value
}

const appendLocalManualMessage = (payload: ConsultationChatPayload) => {
  const currentUserId = session.channelContext.value?.userId || userId.value || 'patient'
  timeline.appendManualMessage({
    speakerId: currentUserId,
    speakerName: patientName.value,
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
    chatDraft.value = ''

    const [sendResult, saveResult] = await Promise.allSettled([
      chat.sendTranslatedMessage({
        doctorId,
        patientId: userId.value,
        role: 1,
        ...payload
      }),
      addWrittenRecord({
        caseId,
        isDoctor: 1,
        contentCn,
        contentLo: translationEnabled.value ? normalizedText : ''
      })
    ])

    if (sendResult.status === 'rejected') {
      console.warn('Failed to send patient consultation chat websocket message.', sendResult.reason)
      ElMessage.warning(t('assistant.patientVideo.consultation.chatSendFailed'))
    }

    if (saveResult.status === 'rejected') {
      console.warn('Failed to save patient consultation manual chat record.', saveResult.reason)
      ElMessage.warning(t('assistant.patientVideo.consultation.chatSaveFailed'))
    }
  } catch (error) {
    console.warn('Failed to translate patient consultation chat message.', error)
    ElMessage.warning(t('assistant.patientVideo.consultation.chatTranslateFailed'))
  } finally {
    chatSending.value = false
  }
}

const goBackToWaiting = async () => {
  await router.replace('/assistant/patient/waiting')
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
    console.warn('Failed to load patient consultation video duration.', error)
  }
}

const ensurePatientProfile = async () => {
  if (!userId.value) {
    return ''
  }

  const existingName = takeText(sessionStore.patientDetail, ['patientName', 'name'])
  if (existingName) {
    return existingName
  }

  try {
    const response = await getPatientDetail(userId.value)
    const detail = (response?.data || null) as Record<string, unknown> | null
    sessionStore.setPatientDetail(userId.value, detail)
    return takeText(detail, ['patientName', 'name']) || userId.value
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    sessionStore.setPatientDetailError(message, userId.value)
    return userId.value
  }
}

const bootstrapConsultation = async () => {
  if (!token.value || !channelId.value || !userId.value) {
    pageError.value = t('assistant.patientVideo.consultation.missingParams')
    return
  }

  if (consultationDoctorId.value || consultationDoctorName.value) {
    sessionStore.setDoctorInfo({
      doctorId: consultationDoctorId.value,
      doctorName: consultationDoctorName.value,
      goodAt: consultationDoctorGoodAt.value
    })
  }

  // 关键修复：趁着上一级页面的跳转产生的 User Gesture Token 尚未过期，
  // 提前进行媒体设备预加载，这一步会提前同步创建 DingRTC 的 AudioContext，
  // 避免等到异步 API 请结束后再进入房间出现 audioContext suspended 导致的警告
  const initialCameraId = await requestInitialCameraSelection()
  await session.prepareLocalTracks(initialCameraId)

  try {
    const userName = await ensurePatientProfile()

    await session.enterConsultationRoom({
      appId: RTC_APP_ID,
      appKey: RTC_APP_KEY,
      userId: userId.value,
      channelName: channelId.value,
      userName,
      token: token.value,
      secondaryToken: secondaryToken.value,
      language: consultationLang.value,
      translationEnabled: translationEnabled.value
    })
    void startConsultationDuration(consultationVideoId.value)

    await loadConversationHistory(consultationVideoId.value)
    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle({ taskPolicy: 'skip' })
    broadcastMediaControlState()
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : t('assistant.patientVideo.consultation.joinFailed')
  }
}

const retrySubtitle = async () => {
  await session.cleanupSubtitle()
  timeline.bindAsrStreams(session.subtitleBindings.value)
  await session.bootstrapSubtitle({ taskPolicy: 'skip' })
}

const handlePatientMediaControlCommand = async (payload: {
  patientId: string
  caseId?: string | number
  action: string
  enabled?: boolean
  deviceId?: string
}) => {
  if (!isCurrentConsultationContext(payload)) {
    return
  }

  if (payload.action === 'request-state') {
    broadcastMediaControlState()
    return
  }

  try {
    if (payload.action === 'set-camera-enabled') {
      if (typeof payload.enabled === 'boolean' && session.cameraEnabled.value !== payload.enabled) {
        await session.toggleCamera()
      }
      broadcastMediaControlState()
      return
    }

    if (payload.action === 'set-mic-enabled') {
      if (typeof payload.enabled === 'boolean' && session.micEnabled.value !== payload.enabled) {
        await session.toggleMic()
      }
      broadcastMediaControlState()
      return
    }

    if (payload.action === 'switch-camera') {
      const deviceId = takeOptionalText(payload.deviceId)
      if (deviceId) {
        await session.switchCamera(deviceId)
      }
      broadcastMediaControlState()
    }
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : t('assistant.patientVideo.consultation.cameraSwitchFailed')
    console.warn('Failed to apply patient media control command.', error)
    broadcastMediaControlState(message)
  }
}

const handleVideoRoomCreated = async (payload: {
  patientId: string
  caseId?: string | number
  doctorId: string
  doctorName: string
  goodAt?: string
  roomId: string
  consultationLang?: string
}) => {
  const caseId = takeOptionalText(payload.caseId)
  if (!payload.roomId || payload.roomId === channelId.value || !isCurrentConsultationContext({ patientId: payload.patientId, caseId })) {
    return
  }

  try {
    const nextConsultationLang = payload.consultationLang === 'cn' ? 'cn' : 'lo'
    const primaryChannelId = nextConsultationLang === 'cn' ? `${payload.roomId}_cn` : `${payload.roomId}_lo`
    const secondaryChannelId = `${payload.roomId}_cn`
    const videoIdPromise = caseId
      ? getVideoId(caseId)
          .then((response) => takeOptionalText(response?.data))
          .catch((error) => {
            console.warn('Failed to get patient consultation videoId before switching room.', error)
            return ''
          })
      : Promise.resolve('')
    const [primaryResponse, secondaryResponse, nextVideoId] = await Promise.all([
      getVideoToken({
        channelId: primaryChannelId,
        userId: payload.patientId
      }),
      nextConsultationLang === 'lo'
        ? getVideoToken({
            channelId: secondaryChannelId,
            userId: payload.patientId
          })
        : Promise.resolve(null),
      videoIdPromise
    ])
    const nextToken = takeOptionalText(primaryResponse?.data)
    const nextSecondaryToken = takeOptionalText(secondaryResponse?.data)
    if (!nextToken || (nextConsultationLang === 'lo' && !nextSecondaryToken)) {
      return
    }

    savedSubtitleKeys.clear()
    stopConsultationDuration()
    chatDraft.value = ''
    chat.disconnect()
    timeline.clearTimeline()
    await session.leaveConsultationRoom({ taskPolicy: 'skip' })
    sessionStore.setVideoRoomContext({
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      doctorName: payload.doctorName,
      goodAt: takeOptionalText(payload.goodAt),
      roomId: payload.roomId,
      consultationLang: nextConsultationLang,
      ...(caseId ? { caseId } : {}),
      ...(nextVideoId ? { videoId: nextVideoId } : {})
    })

    await router.replace({
      path: '/assistant/patient/consultation',
      query: {
        token: nextToken,
        ...(nextSecondaryToken ? { secondaryToken: nextSecondaryToken } : {}),
        channelId: payload.roomId,
        userId: payload.patientId,
        doctorId: payload.doctorId,
        doctorName: payload.doctorName,
        consultationLang: nextConsultationLang,
        ...(payload.goodAt ? { goodAt: payload.goodAt } : {}),
        ...(caseId ? { caseId } : {}),
        ...(nextVideoId ? { videoId: nextVideoId } : {})
      }
    })

    pageError.value = ''
    await bootstrapConsultation()
  } catch (error) {
    console.warn('Failed to switch patient consultation room after resend request.', error)
  }
}

const handleLeave = async () => {
  if (leavingInProgress) {
    return
  }

  leavingInProgress = true
  savedSubtitleKeys.clear()
  stopConsultationDuration()
  chatDraft.value = ''
  chat.disconnect()
  timeline.clearTimeline()
  try {
    await session.leaveConsultationRoom({ taskPolicy: 'skip' })
    await goBackToWaiting()
  } finally {
    leavingInProgress = false
  }
}

watch(
  () => [
    session.cameraEnabled.value,
    session.micEnabled.value,
    session.cameraSwitching.value,
    session.selectedCameraId.value,
    session.cameraDevices.value.length
  ],
  () => {
    broadcastMediaControlState()
  }
)

onMounted(async () => {
  stopListening = listenPatientChannelMessages(async (message) => {
    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated) {
      await handleVideoRoomCreated(message.payload)
      return
    }

    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlCommand) {
      await handlePatientMediaControlCommand(message.payload)
      return
    }

    if (
      message.type !== PATIENT_CHANNEL_MESSAGE_TYPES.consultationEnded &&
      message.type !== PATIENT_CHANNEL_MESSAGE_TYPES.consultationRejected
    ) {
      return
    }

    if (!isCurrentConsultationContext(message.payload)) {
      return
    }

    await handleLeave()
  })
  await bootstrapConsultation()
})

onBeforeUnmount(async () => {
  stopListening?.()
  stopListening = null
  stopConsultationDuration()
  savedSubtitleKeys.clear()
  chatDraft.value = ''
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom({ taskPolicy: 'skip' })
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
  gap: 6px;
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.96);
  color: #233a64;
  font-size: 19px;
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
  right: 288px;
  z-index: 6;
  max-width: calc(100% - 374px);
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(255, 241, 241, 0.96);
  color: #c54949;
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

.consultation-error-state {
  min-height: calc(100vh - 170px);
  display: grid;
  place-items: center;
}

.error-card {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(233, 214, 214, 0.98);
  box-shadow: 0 8px 24px rgba(60, 86, 117, 0.08);
  text-align: center;
}

.error-icon {
  font-size: 45px;
  color: #de5a56;
}

.error-card h2 {
  margin: 0;
  color: #213659;
  font-size: 27px;
}

.error-card p {
  margin: 0;
  color: #647b9f;
  font-size: 21px;
  line-height: 1.7;
}

.error-card :deep(.el-button) {
  font-size: 21px;
}

@media (max-width: 1180px) {
  .consultation-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(280px, 36%) minmax(0, 1fr);
    gap: 8px;
  }

  .subtitle-column {
    min-height: 0;
  }
}

@media (max-width: 900px) {
  .patient-consultation-page {
    padding: 6px;
  }

  .consultation-layout {
    gap: 6px;
    grid-template-rows: minmax(240px, 34%) minmax(0, 1fr);
  }

  .featured-stage {
    min-height: 0;
    padding: 10px;
  }

  .preview-row {
    position: static;
    width: 100%;
    margin-top: 8px;
    grid-template-columns: minmax(0, 1fr);
  }

  .connection-banner {
    position: static;
    max-width: none;
    margin: 40px 0 8px;
  }

}
</style>
