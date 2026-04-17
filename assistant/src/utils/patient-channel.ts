import { PATIENT_CHANNEL_MESSAGE_TYPES, PATIENT_VIDEO_CHANNEL_NAME } from '@/constants/patient'

export type PatientContextSyncMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.contextSync
  payload: {
    patientId: string
  }
}

export type VideoRoomCreatedMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated
  payload: {
    patientId: string
    caseId?: string | number
    doctorId: string
    roomId: string
  }
}

export type PatientChannelMessage = PatientContextSyncMessage | VideoRoomCreatedMessage

const isBroadcastChannelSupported = () => {
  return typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined'
}

const createPatientBroadcastChannel = () => {
  if (!isBroadcastChannelSupported()) {
    return null
  }

  return new BroadcastChannel(PATIENT_VIDEO_CHANNEL_NAME)
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isPatientChannelMessage = (value: unknown): value is PatientChannelMessage => {
  if (!isObjectRecord(value) || typeof value.type !== 'string' || !isObjectRecord(value.payload)) {
    return false
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.contextSync) {
    return typeof value.payload.patientId === 'string'
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated) {
    return typeof value.payload.patientId === 'string' && typeof value.payload.doctorId === 'string' && typeof value.payload.roomId === 'string'
  }

  return false
}

const postPatientChannelMessage = (message: PatientChannelMessage) => {
  const channel = createPatientBroadcastChannel()
  if (!channel) {
    return
  }

  channel.postMessage(message)
  channel.close()
}

export const broadcastPatientContextSync = (payload: PatientContextSyncMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.contextSync,
    payload
  })
}

export const broadcastVideoRoomCreated = (payload: VideoRoomCreatedMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated,
    payload
  })
}

export const listenPatientChannelMessages = (handler: (message: PatientChannelMessage) => void) => {
  const channel = createPatientBroadcastChannel()
  if (!channel) {
    return () => undefined
  }

  const onMessage = (event: MessageEvent<unknown>) => {
    if (isPatientChannelMessage(event.data)) {
      handler(event.data)
    }
  }

  channel.addEventListener('message', onMessage)

  return () => {
    channel.removeEventListener('message', onMessage)
    channel.close()
  }
}
