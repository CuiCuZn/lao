import type { Router } from 'vue-router'
import { getVideoId, getVideoToken } from '@/api/video'
import { usePatientSessionStore } from '@/stores/patient-session'
import { useUserStore } from '@/stores/user'

interface AideConsultationNavigationPayload {
  patientId: string
  caseId?: string | number
  doctorId: string
  doctorName: string
  goodAt?: string
  roomId: string
}

const takeOptionalText = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const resolveUserStoreId = () => {
  const userStore = useUserStore()
  return (
    takeOptionalText(userStore.profile?.userId) ||
    takeOptionalText(userStore.profile?.userName) ||
    takeOptionalText(userStore.name)
  )
}

const resolveCurrentAideUserId = async () => {
  const userStore = useUserStore()
  const currentUserId = resolveUserStoreId()
  if (currentUserId) {
    return currentUserId
  }

  await userStore.getInfo().catch(() => undefined)
  return resolveUserStoreId()
}

export async function navigateToAideConsultationRoom(
  router: Router,
  payload: AideConsultationNavigationPayload,
  options: { replace?: boolean } = {}
) {
  const aideUserId = await resolveCurrentAideUserId()
  const roomId = takeOptionalText(payload.roomId)
  const patientId = takeOptionalText(payload.patientId)
  const doctorId = takeOptionalText(payload.doctorId)
  const doctorName = takeOptionalText(payload.doctorName)
  const caseId = takeOptionalText(payload.caseId)
  const goodAt = takeOptionalText(payload.goodAt)

  if (!aideUserId || !roomId || !patientId || !doctorId) {
    throw new Error('missingParams')
  }

  const primaryChannelId = `${roomId}_lo`
  const secondaryChannelId = `${roomId}_cn`
  const videoIdPromise = caseId
    ? getVideoId(caseId)
        .then((response) => takeOptionalText(response?.data))
        .catch((error) => {
          console.warn('Failed to get aide consultation videoId before entering the room.', error)
          return ''
        })
    : Promise.resolve('')

  const [primaryResponse, secondaryResponse, videoId] = await Promise.all([
    getVideoToken({
      channelId: primaryChannelId,
      userId: aideUserId
    }),
    getVideoToken({
      channelId: secondaryChannelId,
      userId: aideUserId
    }),
    videoIdPromise
  ])

  const token = takeOptionalText(primaryResponse?.data)
  const secondaryToken = takeOptionalText(secondaryResponse?.data)

  if (!token || !secondaryToken) {
    throw new Error('missingParams')
  }

  const sessionStore = usePatientSessionStore()
  sessionStore.setVideoRoomContext({
    patientId,
    doctorId,
    doctorName,
    goodAt,
    roomId,
    ...(caseId ? { caseId } : {}),
    ...(videoId ? { videoId } : {})
  })

  const routeTarget = {
    path: '/assistant/aide/consultation',
    query: {
      token,
      secondaryToken,
      channelId: roomId,
      userId: aideUserId,
      patientId,
      doctorId,
      doctorName,
      ...(goodAt ? { goodAt } : {}),
      ...(caseId ? { caseId } : {}),
      ...(videoId ? { videoId } : {})
    }
  }

  if (options.replace) {
    await router.replace(routeTarget)
    return
  }

  await router.push(routeTarget)
}
