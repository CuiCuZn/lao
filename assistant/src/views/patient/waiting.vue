<template>
  <patient-page-shell>
    <section class="patient-waiting-page">
      <div class="waiting-panel">
        <section class="waiting-stage">
          <p class="waiting-stage__tip">{{ t('assistant.patientVideo.waiting.tip') }}</p>

          <div class="waiting-stage__visual" aria-hidden="true">
            <span class="pulse-ring pulse-ring--lg" />
            <span class="pulse-ring pulse-ring--md" />
            <span class="pulse-ring pulse-ring--sm" />

            <div class="pulse-core">
              <el-icon><video-camera-filled /></el-icon>
            </div>
          </div>
        </section>
      </div>
    </section>
  </patient-page-shell>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { VideoCameraFilled } from '@element-plus/icons-vue'
import PatientPageShell from '@/components/patient/PatientPageShell.vue'
import { usePatientSessionStore } from '@/stores/patient-session'
import { PATIENT_CHANNEL_MESSAGE_TYPES } from '@/constants/patient'
import { listenPatientChannelMessages } from '@/utils/patient-channel'
import { getVideoId, getVideoToken } from '@/api/video'

const { t } = useI18n()
const router = useRouter()
const sessionStore = usePatientSessionStore()

let stopListening: (() => void) | null = null

const toOptionalText = (value: string | number | undefined) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

onMounted(() => {
  stopListening = listenPatientChannelMessages(async (message) => {
    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.contextSync) {
      await sessionStore.syncPatientById(message.payload.patientId)
      return
    }

    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated) {
      if (!message.payload.roomId) {
        return
      }

      const caseId = toOptionalText(message.payload.caseId)
      sessionStore.setVideoRoomContext({
        patientId: message.payload.patientId,
        doctorId: message.payload.doctorId,
        roomId: message.payload.roomId,
        ...(caseId ? { caseId } : {})
      })

      try {
        const primaryChannelId = `${message.payload.roomId}_lo`
        const secondaryChannelId = `${message.payload.roomId}_cn`
        const videoIdPromise = caseId
          ? getVideoId(caseId)
              .then((response) => {
                if (response?.data === null || response?.data === undefined) {
                  return ''
                }

                return String(response.data).trim()
              })
              .catch((error) => {
                console.warn('Failed to get patient consultation videoId before entering the room.', error)
                return ''
              })
          : Promise.resolve('')
        const [primaryResponse, secondaryResponse, videoId] = await Promise.all([
          getVideoToken({
            channelId: primaryChannelId,
            userId: message.payload.patientId
          }),
          getVideoToken({
            channelId: secondaryChannelId,
            userId: message.payload.patientId
          }),
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

        sessionStore.setVideoRoomContext({
          patientId: message.payload.patientId,
          doctorId: message.payload.doctorId,
          roomId: message.payload.roomId,
          ...(caseId ? { caseId } : {}),
          ...(videoId ? { videoId } : {})
        })

        await router.push({
          path: '/assistant/patient/consultation',
          query: {
            token,
            secondaryToken,
            channelId: message.payload.roomId,
            userId: message.payload.patientId,
            ...(caseId ? { caseId } : {}),
            ...(videoId ? { videoId } : {})
          }
        })
      } catch {
        return
      }
    }
  })
})

onBeforeUnmount(() => {
  stopListening?.()
  stopListening = null
})
</script>

<style scoped lang="scss">
.patient-waiting-page {
  flex: 1;
  min-height: 100%;
}

.waiting-panel {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(180deg, rgba(236, 242, 250, 0.78) 0%, rgba(248, 250, 253, 0.58) 100%);
}

.waiting-stage__tip {
  margin: 0;
}

.waiting-stage {
  min-height: calc(100vh - 182px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 34px;
}

.waiting-stage__tip {
  color: #7888a2;
  font-size: 30px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

.waiting-stage__visual {
  position: relative;
  width: 232px;
  height: 232px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(74, 136, 255, 0.12);
  animation: pulse-wave 2.8s ease-out infinite;
}

.pulse-ring--lg {
  width: 176px;
  height: 176px;
}

.pulse-ring--md {
  width: 146px;
  height: 146px;
  animation-delay: 0.35s;
}

.pulse-ring--sm {
  width: 116px;
  height: 116px;
  animation-delay: 0.7s;
}

.pulse-core {
  position: relative;
  z-index: 1;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(180deg, #4a8cff 0%, #3774ef 100%);
  color: #ffffff;
  font-size: 28px;
  box-shadow:
    0 16px 30px rgba(62, 119, 239, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
  animation: core-breathe 2.4s ease-in-out infinite;
}

@keyframes pulse-wave {
  0% {
    transform: scale(0.9);
    opacity: 0.78;
  }

  70% {
    opacity: 0.22;
  }

  100% {
    transform: scale(1.08);
    opacity: 0;
  }
}

@keyframes core-breathe {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

@media (max-width: 1200px) {
  .waiting-stage__tip {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .patient-waiting-page {
    padding: 12px;
  }

  .waiting-panel {
    min-height: auto;
    padding: 14px;
  }

  .waiting-stage {
    min-height: 420px;
    gap: 24px;
    padding: 36px 0 24px;
  }

  .waiting-stage__tip {
    font-size: 18px;
  }

  .waiting-stage__visual {
    width: 184px;
    height: 184px;
  }

  .pulse-ring--lg {
    width: 150px;
    height: 150px;
  }

  .pulse-ring--md {
    width: 122px;
    height: 122px;
  }

  .pulse-ring--sm {
    width: 96px;
    height: 96px;
  }
}
</style>
