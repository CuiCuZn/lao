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
          :on-chat-input="handleChatInput"
          :on-chat-send="handleChatSend"
        />

        <section class="video-column">
          <div class="featured-stage">
            <div class="stage-pill">
              <span class="stage-dot" />
              <span>{{ t('assistant.patientVideo.consultation.inCall') }}</span>
              <span>{{ currentDate }}</span>
            </div>

            <div v-if="session.connectionError.value" class="connection-banner">
              {{ session.connectionError.value }}
            </div>

            <consult-participant-card
              :user-name="session.featuredParticipant.value.userName"
              :track="session.featuredParticipant.value.track"
              :muted="session.featuredParticipant.value.muted"
              :speaking="session.featuredParticipant.value.speaking"
              :badge="session.featuredParticipant.value.track ? '' : session.featuredParticipant.value.placeholderBadge"
            />

            <div class="local-preview">
              <consult-participant-card
                :user-name="patientName"
                :track="session.localPreviewTrack.value"
                :muted="!session.micEnabled.value"
                :badge="t('assistant.patientVideo.consultation.selfBadge')"
                compact
                mirror
              />
            </div>
          </div>

          <div v-if="session.extraParticipants.value.length" class="participant-strip">
            <consult-participant-card
              v-for="participant in session.extraParticipants.value"
              :key="participant.userId"
              :user-name="participant.userName"
              :track="participant.track"
              :muted="participant.muted"
              :speaking="participant.speaking"
              :badge="participant.track ? '' : participant.placeholderBadge"
              compact
            />
          </div>

          <footer class="consultation-footer">
            <div class="doctor-panel">
              <div class="doctor-avatar">{{ doctorAvatarText }}</div>

              <div class="doctor-copy">
                <div class="doctor-heading">
                  <strong>{{ doctorTitle }}</strong>
                  <span v-if="session.joined.value" class="doctor-status">
                    {{ t('assistant.patientVideo.consultation.connected') }}
                  </span>
                </div>

                <p>{{ t('assistant.patientVideo.consultation.footerSubtitle') }}</p>

                <div class="doctor-meta">
                  <span>{{ t('assistant.patientVideo.consultation.doctorId') }}: {{ sessionStore.doctorId || '--' }}</span>
                  <span>{{ t('assistant.patientVideo.consultation.caseId') }}: {{ consultationCaseId || '--' }}</span>
                  <span>{{ t('assistant.patientVideo.consultation.channelId') }}: {{ channelId || '--' }}</span>
                </div>
              </div>
            </div>

            <consult-room-controls
              :camera-enabled="session.cameraEnabled.value"
              :mic-enabled="session.micEnabled.value"
              :on-toggle-camera="session.toggleCamera"
              :on-toggle-mic="session.toggleMic"
              :on-leave="handleLeave"
            />
          </footer>
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
import { saveSubtitle } from '@/api/video'
import { usePatientSessionStore } from '@/stores/patient-session'
import ConsultParticipantCard from '@/views/patient/consultation/components/ConsultParticipantCard.vue'
import ConsultRoomControls from '@/views/patient/consultation/components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from '@/views/patient/consultation/components/ConsultSubtitleTimeline.vue'
import { usePatientConsultationSession } from '@/views/patient/consultation/composables/usePatientConsultationSession'
import { usePatientSubtitleTimeline } from '@/views/patient/consultation/composables/usePatientSubtitleTimeline'
import { createPatientConsultationChatService } from '@/views/patient/consultation/services/consultation-chat'
import type { ConsultationChatPayload, SubtitleTimelineItem } from '@/views/patient/consultation/types'

const RTC_APP_ID = 'bkbbxxzy'
const RTC_APP_KEY = 'da88a821450548b6a5758f0d442d59d9'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sessionStore = usePatientSessionStore()
const session = usePatientConsultationSession()
const savedSubtitleKeys = new Set<string>()

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
const pageError = ref('')
const currentDate = ref('')
const chatDraft = ref('')
const chatSending = ref(false)
let dateTimer = 0

const patientName = computed(() => {
  return takeText(sessionStore.patientDetail, ['patientName', 'name']) || userId.value || t('common.notAvailable')
})

const doctorTitle = computed(() => {
  return sessionStore.doctorId
    ? `${t('assistant.patientVideo.consultation.doctorPrefix')}${sessionStore.doctorId}`
    : t('assistant.patientVideo.consultation.waitingDoctor')
})

const doctorAvatarText = computed(() => {
  return doctorTitle.value.slice(0, 1) || '医'
})

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
  onFinalizedItem: handleSubtitleFinalized
})

const chat = createPatientConsultationChatService({
  onMessage: ({ contentLo, contentCn }) => {
    const doctorId = takeOptionalText(sessionStore.doctorId) || 'doctor'
    timeline.appendManualMessage({
      speakerId: `doctor:${doctorId}`,
      speakerName: doctorTitle.value,
      side: 'remote',
      sourceText: contentLo,
      translatedText: contentCn
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
    !takeOptionalText(sessionStore.doctorId) ||
    !takeOptionalText(consultationCaseId.value) ||
    chat.connectionStatus.value !== 'connected'
  )
})

const chatStatusText = computed(() => {
  if (!takeOptionalText(sessionStore.doctorId)) {
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

const handleChatInput = (value: string) => {
  chatDraft.value = value
}

const appendLocalManualMessage = (payload: ConsultationChatPayload) => {
  const currentUserId = session.channelContext.value?.userId || userId.value || 'patient'
  timeline.appendManualMessage({
    speakerId: currentUserId,
    speakerName: patientName.value,
    side: 'self',
    sourceText: payload.contentLo,
    translatedText: payload.contentCn
  })
}

const handleChatSend = async () => {
  const normalizedText = chatDraft.value.trim()

  if (!normalizedText) {
    ElMessage.warning(t('assistant.patientVideo.consultation.chatInputRequired'))
    return
  }

  const doctorId = takeOptionalText(sessionStore.doctorId)
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
    const translationResponse = await translateConsultationText({
      source: 'lo',
      to: 'cn',
      text: normalizedText
    })
    const contentCn = resolveTranslationText(translationResponse?.data)
    const payload = {
      contentLo: normalizedText,
      contentCn
    }

    appendLocalManualMessage(payload)
    chatDraft.value = ''

    const [sendResult, saveResult] = await Promise.allSettled([
      chat.sendTranslatedMessage({
        doctorId,
        ...payload
      }),
      addWrittenRecord({
        caseId,
        isDoctor: 1,
        contentCn,
        contentLo: normalizedText
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

const syncCurrentDate = () => {
  currentDate.value = new Date().toLocaleDateString('zh-CN')
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

  // 关键修复：趁着上一级页面的跳转产生的 User Gesture Token 尚未过期，
  // 提前进行媒体设备预加载，这一步会提前同步创建 DingRTC 的 AudioContext，
  // 避免等到异步 API 请结束后再进入房间出现 audioContext suspended 导致的警告
  await session.prepareLocalTracks()

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
      language: 'lo'
    })

    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle()
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
  await session.bootstrapSubtitle()
}

const handleLeave = async () => {
  savedSubtitleKeys.clear()
  chatDraft.value = ''
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom()
  await goBackToWaiting()
}

onMounted(async () => {
  syncCurrentDate()
  dateTimer = window.setInterval(syncCurrentDate, 60_000)
  await bootstrapConsultation()
})

onBeforeUnmount(async () => {
  window.clearInterval(dateTimer)
  savedSubtitleKeys.clear()
  chatDraft.value = ''
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom()
})
</script>

<style scoped lang="scss">
.patient-consultation-page {
  height: 100%;
  min-height: 0;
  flex: 1;
  padding: 18px;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(240, 245, 251, 0.84) 0%, rgba(250, 252, 255, 0.98) 100%);
}

.consultation-layout {
  display: grid;
  grid-template-columns: 470px minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.subtitle-column {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 14px 36px rgba(77, 103, 154, 0.08);
}

.video-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}

.featured-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 2px solid rgba(53, 118, 242, 0.94);
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 14px 36px rgba(80, 104, 150, 0.08);
}

.stage-pill {
  position: absolute;
  top: 16px;
  left: 18px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.96);
  color: #233a64;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(76, 100, 145, 0.12);
}

.stage-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2fca68;
  box-shadow: 0 0 0 4px rgba(47, 202, 104, 0.14);
}

.connection-banner {
  position: absolute;
  top: 18px;
  right: 194px;
  z-index: 6;
  max-width: calc(100% - 280px);
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255, 241, 241, 0.96);
  color: #c54949;
  font-size: 12px;
  font-weight: 700;
}

.local-preview {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 170px;
  max-width: 28%;
  z-index: 6;
}

.participant-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.consultation-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #d7e4f7;
  border-radius: 16px;
  padding: 14px 18px;
  background: linear-gradient(180deg, #edf4ff 0%, #eef6ff 100%);
}

.doctor-panel {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.doctor-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(180deg, #2f6aec 0%, #2257c7 100%);
  color: #ffffff;
  font-size: 24px;
  font-weight: 800;
}

.doctor-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.doctor-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.doctor-heading strong {
  color: #22365d;
  font-size: 16px;
  font-weight: 800;
}

.doctor-status {
  color: #24a35c;
  font-size: 12px;
  font-weight: 700;
}

.doctor-copy p {
  margin: 0;
  color: #5f7697;
  font-size: 13px;
}

.doctor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.doctor-meta span {
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(61, 117, 226, 0.1);
  color: #3a63b8;
  font-size: 12px;
  font-weight: 700;
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
  gap: 14px;
  padding: 36px 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(233, 214, 214, 0.98);
  box-shadow: 0 18px 48px rgba(60, 86, 117, 0.08);
  text-align: center;
}

.error-icon {
  font-size: 42px;
  color: #de5a56;
}

.error-card h2 {
  margin: 0;
  color: #213659;
  font-size: 24px;
}

.error-card p {
  margin: 0;
  color: #647b9f;
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .consultation-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(280px, 36%) minmax(0, 1fr);
  }

  .subtitle-column {
    min-height: 0;
  }
}

@media (max-width: 900px) {
  .patient-consultation-page {
    padding: 12px;
  }

  .consultation-layout {
    grid-template-rows: minmax(240px, 34%) minmax(0, 1fr);
  }

  .featured-stage {
    min-height: 0;
    padding: 12px;
  }

  .local-preview {
    position: static;
    width: 100%;
    max-width: none;
    margin-top: 12px;
  }

  .connection-banner {
    position: static;
    max-width: none;
    margin: 50px 0 12px;
  }

  .consultation-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
