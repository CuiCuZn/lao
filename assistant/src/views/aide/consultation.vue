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
              <span>{{ t('assistant.aideVideo.consultation.inCall') }}</span>
              <span>{{ currentDate }}</span>
            </div>

            <div v-if="session.connectionError.value" class="connection-banner">
              {{ session.connectionError.value }}
            </div>

            <div class="preview-row">
              <consult-participant-card
                :user-name="patientPreviewParticipant.userName"
                :track="patientPreviewParticipant.track"
                :muted="patientPreviewParticipant.muted"
                :speaking="patientPreviewParticipant.speaking"
                :badge="patientPreviewParticipant.track ? '' : patientPreviewParticipant.placeholderBadge"
                compact
              />
              <consult-participant-card
                :user-name="aideName"
                :track="session.localPreviewTrack.value"
                muted
                :badge="t('assistant.patientVideo.consultation.selfBadge')"
                :show-status="false"
                compact
              />
            </div>

            <consult-participant-card
              class="featured-card"
              :user-name="doctorStageParticipant.userName"
              :track="doctorStageParticipant.track"
              :muted="doctorStageParticipant.muted"
              :speaking="doctorStageParticipant.speaking"
              :badge="doctorStageParticipant.track ? '' : doctorStageParticipant.placeholderBadge"
            />
          </div>

          <footer class="consultation-footer">
            <div class="doctor-panel">
              <div class="doctor-avatar">{{ doctorAvatarText }}</div>

              <div class="doctor-copy">
                <div class="doctor-heading">
                  <strong>{{ doctorTitle }}</strong>
                  <span v-if="session.joined.value" class="doctor-status">
                    {{ t('assistant.aideVideo.consultation.connected') }}
                  </span>
                </div>

                <p v-if="consultationDoctorGoodAt" class="doctor-good-at">
                  <span>{{ t('assistant.patientVideo.consultation.goodAt') }}:</span>
                  {{ consultationDoctorGoodAt }}
                </p>
                <p class="doctor-good-at">
                  <span>{{ t('assistant.pendingRecords.patientInfo') }}:</span>
                  {{ patientName }}
                </p>
              </div>
            </div>

            <consult-room-controls
              :camera-enabled="false"
              :mic-enabled="false"
              :on-toggle-camera="noop"
              :on-toggle-mic="noop"
              :on-leave="handleLeave"
              :show-camera="false"
              :show-mic="false"
            />
          </footer>
        </section>
      </div>

      <div v-if="doctorRejectedDialogVisible" class="rejected-dialog-mask">
        <section class="rejected-dialog" role="dialog" aria-modal="true">
          <div class="rejected-icon" aria-hidden="true">
            <svg viewBox="0 0 96 96" focusable="false">
              <circle cx="48" cy="48" r="46" />
              <path
                d="M30.5 28.2c-3.7 1.4-7.4 4.3-10.7 8.2-2.5 3-2.7 7.3-.6 10.5l7.3 11.1c1.8 2.8 5.3 4 8.5 3l7.4-2.4c3.3 3.8 7.1 6.9 11.4 9.5l-1.9 7.6c-.8 3.2.8 6.5 3.8 8l11.9 6c3.5 1.8 7.8 1.1 10.4-1.9 3.6-4 6.1-8.1 7.2-12.1.7-2.4-.4-5-2.6-6.3l-10.2-6.1c-2.2-1.3-5-.9-6.7.9l-4.6 4.9c-13.5-5.3-23.2-14.6-29.2-27.8l4.7-4.9c1.8-1.9 2-4.7.5-6.9l-6.8-9.5c-1.5-2-4.1-2.8-6.4-1.9Z"
              />
              <path d="M25 72 72 25" />
            </svg>
          </div>

          <h2>{{ t('assistant.aideVideo.consultation.rejectedTitle') }}</h2>
          <p>{{ t('assistant.aideVideo.consultation.rejectedDescription', { doctorName: rejectedDoctorName }) }}</p>

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
import { createVideoRoom } from '@/api/video'
import { usePatientSessionStore } from '@/stores/patient-session'
import { useUserStore } from '@/stores/user'
import { navigateToAideConsultationRoom } from '@/utils/aide-consultation'
import { listenAssistantConsultationRejected, startAssistantConsultationSse, stopAssistantConsultationSse } from '@/utils/assistant-consultation-sse'
import { broadcastConsultationRejected, broadcastVideoRoomCreated } from '@/utils/patient-channel'
import ConsultParticipantCard from '@/views/patient/consultation/components/ConsultParticipantCard.vue'
import ConsultRoomControls from '@/views/patient/consultation/components/ConsultRoomControls.vue'
import ConsultSubtitleTimeline from '@/views/patient/consultation/components/ConsultSubtitleTimeline.vue'
import { usePatientConsultationSession } from '@/views/patient/consultation/composables/usePatientConsultationSession'
import { usePatientSubtitleTimeline } from '@/views/patient/consultation/composables/usePatientSubtitleTimeline'
import { createPatientConsultationChatService } from '@/views/patient/consultation/services/consultation-chat'
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
let dateTimer = 0
let roomCleanedUp = false
let doctorRejectedHandled = false
let stopRejectedListening: (() => void) | null = null

const pageError = ref('')
const currentDate = ref('')
const chatDraft = ref('')
const chatSending = ref(false)
const doctorRejectedDialogVisible = ref(false)
const rejectedDoctorName = ref('')
const resendRequestLoading = ref(false)
const resendRequestUsed = ref(false)
const rejectedEventContext = ref<{ patientId: string; caseId: string; doctorName: string } | null>(null)

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
const consultationPatientId = computed(() => queryValue('patientId') || takeOptionalText(sessionStore.patientId))
const consultationCaseId = computed(() => takeOptionalText(sessionStore.caseId) || queryValue('caseId'))
const consultationDoctorId = computed(() => queryValue('doctorId') || takeOptionalText(sessionStore.doctorId))
const consultationDoctorName = computed(() => queryValue('doctorName') || takeOptionalText(sessionStore.doctorName))
const consultationDoctorGoodAt = computed(() => queryValue('goodAt') || takeOptionalText(sessionStore.doctorGoodAt))

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

const doctorStageParticipant = computed(() => {
  const doctorId = takeOptionalText(consultationDoctorId.value)
  return (
    findRemoteParticipant(doctorId) ||
    (!doctorId ? session.remoteParticipants.value.find((participant) => participant.track) : null) ||
    buildPlaceholderParticipant(
      doctorId || 'doctor-placeholder',
      doctorTitle.value,
      t('assistant.patientVideo.consultation.waitingDoctorJoin')
    )
  )
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
  getRemoteUsers: () => session.allUsers.value.filter((item) => item.userId !== userId.value)
})

const chat = createPatientConsultationChatService({
  onMessage: ({ contentLo, contentCn }) => {
    const doctorId = takeOptionalText(consultationDoctorId.value) || 'doctor'
    timeline.appendManualMessage({
      speakerId: `doctor:${doctorId}`,
      speakerName: doctorTitle.value,
      side: 'remote',
      sourceText: contentLo,
      translatedText: contentCn
    })
  },
  onError: (error) => {
    console.warn('Aide consultation chat websocket error.', error)
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
        isDoctor: 2,
        contentCn,
        contentLo: normalizedText
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
  if (!token.value || !secondaryToken.value || !channelId.value || !userId.value || !consultationPatientId.value) {
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
      language: 'lo',
      publishLocalMedia: false
    })

    await connectConsultationChat()
    timeline.bindAsrStreams(session.subtitleBindings.value)
    await session.bootstrapSubtitle()
  } catch (error) {
    pageError.value =
      error instanceof Error && error.message
        ? error.message
        : t('assistant.aideVideo.consultation.joinFailed')
  }
}

const retrySubtitle = async () => {
  await session.cleanupSubtitle()
  timeline.bindAsrStreams(session.subtitleBindings.value)
  await session.bootstrapSubtitle()
}

const syncCurrentDate = () => {
  currentDate.value = new Date().toLocaleDateString('zh-CN')
}

const goBackToWorkbench = async () => {
  await router.replace('/assistant/workbench')
}

const goBackToPreviousRoute = async () => {
  if (window.history.length > 1) {
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
  chatDraft.value = ''
  chat.disconnect()
  timeline.clearTimeline()
  await session.leaveConsultationRoom()
}

const handleLeave = async () => {
  if (leavingInProgress) {
    return
  }

  leavingInProgress = true
  try {
    await cleanupConsultationRoom()
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
    await startAssistantConsultationSse({
      patientId: context.patientId,
      caseId: context.caseId,
      doctorName: context.doctorName
    }, router)

    const response = await createVideoRoom({
      patientId: context.patientId,
      userId: doctorId,
      caseId: context.caseId
    })
    const roomId = takeOptionalText(response?.data)
    if (!roomId) {
      throw new Error('missingRoomId')
    }

    await cleanupConsultationRoom()
    roomCleanedUp = false
    doctorRejectedDialogVisible.value = false

    await navigateToAideConsultationRoom(router, {
      patientId: context.patientId,
      doctorId,
      doctorName: context.doctorName,
      goodAt: consultationDoctorGoodAt.value,
      roomId,
      caseId: context.caseId
    })

    pageError.value = ''
    await bootstrapConsultation()
    broadcastVideoRoomCreated({
      patientId: context.patientId,
      doctorId,
      doctorName: context.doctorName,
      goodAt: consultationDoctorGoodAt.value,
      caseId: context.caseId,
      roomId
    })
    doctorRejectedHandled = false
    rejectedEventContext.value = null
    ElMessage.success(t('assistant.aideVideo.consultation.resendRequestSuccess'))
  } catch (error) {
    stopAssistantConsultationSse()
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

const noop = () => undefined

onMounted(async () => {
  stopRejectedListening = listenAssistantConsultationRejected((event) => {
    void handleDoctorRejected(event)
  })
  syncCurrentDate()
  dateTimer = window.setInterval(syncCurrentDate, 60_000)
  await bootstrapConsultation()
})

onBeforeUnmount(async () => {
  stopRejectedListening?.()
  stopRejectedListening = null
  window.clearInterval(dateTimer)
  await cleanupConsultationRoom()
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
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #24416e;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(53, 83, 132, 0.14);
}

.stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #18b47b;
  box-shadow: 0 0 0 6px rgba(24, 180, 123, 0.14);
}

.connection-banner {
  position: absolute;
  top: 58px;
  left: 18px;
  right: 18px;
  z-index: 7;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 241, 229, 0.96);
  color: #a24a12;
  font-size: 13px;
  font-weight: 700;
}

.preview-row {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 6;
  display: grid;
  grid-template-columns: repeat(2, minmax(132px, 170px));
  gap: 12px;
  width: min(360px, calc(100% - 220px));
}

.preview-row :deep(.consult-participant-card) {
  width: 100%;
}

.featured-card {
  height: 100%;
}

.consultation-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(80, 104, 150, 0.08);
}

.doctor-panel {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.doctor-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3576f2, #53b7ff);
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
}

.doctor-copy {
  min-width: 0;
}

.doctor-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.doctor-heading strong {
  color: #22395f;
  font-size: 17px;
}

.doctor-status {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(24, 180, 123, 0.12);
  color: #139565;
  font-size: 12px;
  font-weight: 700;
}

.doctor-good-at {
  margin: 5px 0 0;
  color: #6d7d96;
  font-size: 13px;
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
  width: min(440px, 92vw);
  padding: 30px;
  border-radius: 20px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 18px 45px rgba(71, 93, 134, 0.14);
}

.error-icon {
  color: #e45d5d;
  font-size: 44px;
}

.error-card h2 {
  margin: 14px 0 8px;
  color: #233d66;
}

.error-card p {
  margin: 0 0 20px;
  color: #71819b;
}

.rejected-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 32, 54, 0.48);
  backdrop-filter: blur(4px);
}

.rejected-dialog {
  width: min(420px, 100%);
  border-radius: 18px;
  padding: 30px 28px 24px;
  box-sizing: border-box;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 24px 60px rgba(25, 40, 70, 0.2);
}

.rejected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(180deg, #fff1f1 0%, #ffe3e3 100%);
}

.rejected-icon svg {
  width: 62px;
  height: 62px;
}

.rejected-icon circle {
  fill: #fff7f7;
  stroke: #ff5b5b;
  stroke-width: 3;
}

.rejected-icon path {
  fill: none;
  stroke: #ef3f3f;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5;
}

.rejected-dialog h2 {
  margin: 0;
  color: #17253f;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
}

.rejected-dialog p {
  margin: 10px 0 0;
  color: #6e7d94;
  font-size: 14px;
  line-height: 1.7;
}

.rejected-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.rejected-action {
  min-height: 42px;
  border-radius: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.rejected-action:not(:disabled):hover {
  transform: translateY(-1px);
}

.rejected-action--primary {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.22);
}

.rejected-action--ghost {
  border-color: #d6e0ef;
  background: #ffffff;
  color: #34445e;
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
    margin-top: 54px;
    margin-bottom: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .patient-consultation-page {
    padding: 10px;
  }

  .consultation-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .rejected-dialog {
    padding: 26px 20px 20px;
  }

  .rejected-actions {
    grid-template-columns: 1fr;
  }
}
</style>
