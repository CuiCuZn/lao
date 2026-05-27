<template>
  <patient-page-shell>
    <section class="patient-waiting-page">
      <div class="waiting-panel">
        <section class="waiting-stage">
          <div class="waiting-stage__copy" :class="{ 'is-error': Boolean(reconnectFailedMessage) }">
            <p class="waiting-stage__tip">
              {{ reconnectFailedMessage || t('assistant.patientVideo.waiting.tip') }}
            </p>
            <p v-if="reconnectFailedMessage" class="waiting-stage__description">
              {{ t('assistant.patientVideo.waiting.reconnectFailedDescription') }}
            </p>
          </div>

          <div class="waiting-stage__visual" aria-hidden="true">
            <loading-lottie />
          </div>
        </section>
      </div>
    </section>
  </patient-page-shell>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LoadingLottie from '@/components/LoadingLottie.vue'
import PatientPageShell from '@/components/patient/PatientPageShell.vue'
import { usePatientSessionStore } from '@/stores/patient-session'
import { PATIENT_CHANNEL_MESSAGE_TYPES } from '@/constants/patient'
import { listenPatientChannelMessages } from '@/utils/patient-channel'
import { getVideoId, getVideoToken } from '@/api/video'

const { t, locale } = useI18n()
const router = useRouter()
const sessionStore = usePatientSessionStore()
const reconnectFailedMessage = ref('')

let stopListening: (() => void) | null = null

const toOptionalText = (value: string | number | undefined) => {
  if (value === null || value === undefined) {
    return ''
  }

  const normalizedValue = String(value).trim()
  return normalizedValue || ''
}

const supportedLocales = ['zh-cn', 'lo'] as const

const syncLanguage = (lang: string) => {
  if (!supportedLocales.includes(lang as (typeof supportedLocales)[number])) {
    return
  }

  locale.value = lang
  localStorage.setItem('lang', lang)
}

const resolveConsultationLang = (value?: string) => {
  if (value === 'cn' || value === 'zh-cn') {
    return 'cn' as const
  }

  if (value === 'lo') {
    return 'lo' as const
  }

  return localStorage.getItem('lang') === 'zh-cn' ? 'cn' : 'lo'
}

onMounted(() => {
  stopListening = listenPatientChannelMessages(async (message) => {
    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.contextSync) {
      reconnectFailedMessage.value = ''
      await sessionStore.syncPatientById(message.payload.patientId)
      return
    }

    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.languageChanged) {
      syncLanguage(message.payload.lang)
      return
    }

    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated) {
      if (!message.payload.roomId) {
        return
      }

      reconnectFailedMessage.value = ''
      const caseId = toOptionalText(message.payload.caseId)
      const goodAt = toOptionalText(message.payload.goodAt)
      const consultationLang = resolveConsultationLang(message.payload.consultationLang)
      sessionStore.setVideoRoomContext({
        patientId: message.payload.patientId,
        doctorId: message.payload.doctorId,
        doctorName: message.payload.doctorName,
        goodAt,
        roomId: message.payload.roomId,
        consultationLang,
        ...(caseId ? { caseId } : {})
      })

      try {
        const primaryChannelId = consultationLang === 'cn' ? `${message.payload.roomId}_cn` : `${message.payload.roomId}_lo`
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
          consultationLang === 'lo'
            ? getVideoToken({
                channelId: secondaryChannelId,
                userId: message.payload.patientId
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

        sessionStore.setVideoRoomContext({
          patientId: message.payload.patientId,
          doctorId: message.payload.doctorId,
          doctorName: message.payload.doctorName,
          goodAt,
          roomId: message.payload.roomId,
          consultationLang,
          ...(caseId ? { caseId } : {}),
          ...(videoId ? { videoId } : {})
        })

        await router.push({
          path: '/assistant/patient/consultation',
          query: {
            token,
            ...(secondaryToken ? { secondaryToken } : {}),
            channelId: message.payload.roomId,
            userId: message.payload.patientId,
            doctorId: message.payload.doctorId,
            doctorName: message.payload.doctorName,
            consultationLang,
            ...(goodAt ? { goodAt } : {}),
            ...(caseId ? { caseId } : {}),
            ...(videoId ? { videoId } : {})
          }
        })
      } catch {
        return
      }
    }

    if (message.type === PATIENT_CHANNEL_MESSAGE_TYPES.reconnectFailed) {
      if (message.payload.patientId && sessionStore.patientId !== message.payload.patientId) {
        await sessionStore.syncPatientById(message.payload.patientId)
      }

      reconnectFailedMessage.value =
        toOptionalText(message.payload.message) || t('assistant.patientVideo.waiting.reconnectFailedTitle')
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

.waiting-stage__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waiting-stage__copy.is-error .waiting-stage__tip {
  color: #d14343;
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
  font-size: 35px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
}

.waiting-stage__description {
  margin: 0;
  color: #7f8ea5;
  font-size: 23px;
  line-height: 1.6;
  text-align: center;
}

.waiting-stage__visual {
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .waiting-stage__tip {
    font-size: 29px;
  }

  .waiting-stage__description {
    font-size: 21px;
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
    font-size: 23px;
  }

  .waiting-stage__description {
    font-size: 19px;
  }

  .waiting-stage__visual {
    width: 200px;
    height: 200px;
  }
}
</style>
