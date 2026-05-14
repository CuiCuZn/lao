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
    doctorName: string
    goodAt?: string
    roomId: string
  }
}

export type PatientLanguageChangedMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.languageChanged
  payload: {
    lang: string
  }
}

export type ReconnectFailedMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.reconnectFailed
  payload: {
    patientId: string
    caseId: string
    message?: string
  }
}

export type ConsultationEndedMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.consultationEnded
  payload: {
    patientId: string
    caseId: string
  }
}

export type ConsultationRejectedMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.consultationRejected
  payload: {
    patientId: string
    caseId: string
  }
}

export type PatientMediaControlAction =
  | 'set-camera-enabled'
  | 'set-mic-enabled'
  | 'switch-camera'
  | 'request-state'

export interface PatientMediaControlDevice {
  deviceId: string
  label: string
  groupId?: string
  kind?: string
}

export type PatientMediaControlCommandMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlCommand
  payload: {
    patientId: string
    caseId?: string | number
    commandId: string
    action: PatientMediaControlAction
    enabled?: boolean
    deviceId?: string
  }
}

export type PatientMediaControlStateMessage = {
  type: typeof PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlState
  payload: {
    patientId: string
    caseId?: string | number
    cameraEnabled: boolean
    micEnabled: boolean
    cameraSwitching: boolean
    selectedCameraId: string
    cameraDevices: PatientMediaControlDevice[]
    error?: string
  }
}

export type PatientChannelMessage =
  | PatientContextSyncMessage
  | VideoRoomCreatedMessage
  | PatientLanguageChangedMessage
  | ReconnectFailedMessage
  | ConsultationEndedMessage
  | ConsultationRejectedMessage
  | PatientMediaControlCommandMessage
  | PatientMediaControlStateMessage

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

const isPatientMediaControlAction = (value: unknown): value is PatientMediaControlAction => {
  return (
    value === 'set-camera-enabled' ||
    value === 'set-mic-enabled' ||
    value === 'switch-camera' ||
    value === 'request-state'
  )
}

const isPatientMediaControlDevice = (value: unknown): value is PatientMediaControlDevice => {
  return (
    isObjectRecord(value) &&
    typeof value.deviceId === 'string' &&
    typeof value.label === 'string' &&
    (value.groupId === undefined || typeof value.groupId === 'string') &&
    (value.kind === undefined || typeof value.kind === 'string')
  )
}

const isPatientChannelMessage = (value: unknown): value is PatientChannelMessage => {
  if (!isObjectRecord(value) || typeof value.type !== 'string' || !isObjectRecord(value.payload)) {
    return false
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.contextSync) {
    return typeof value.payload.patientId === 'string'
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.videoRoomCreated) {
    return (
      typeof value.payload.patientId === 'string' &&
      typeof value.payload.doctorId === 'string' &&
      typeof value.payload.doctorName === 'string' &&
      (value.payload.goodAt === undefined || typeof value.payload.goodAt === 'string') &&
      typeof value.payload.roomId === 'string'
    )
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.languageChanged) {
    return typeof value.payload.lang === 'string'
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.reconnectFailed) {
    return (
      typeof value.payload.patientId === 'string' &&
      typeof value.payload.caseId === 'string' &&
      (value.payload.message === undefined || typeof value.payload.message === 'string')
    )
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.consultationEnded) {
    return typeof value.payload.patientId === 'string' && typeof value.payload.caseId === 'string'
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.consultationRejected) {
    return typeof value.payload.patientId === 'string' && typeof value.payload.caseId === 'string'
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlCommand) {
    return (
      typeof value.payload.patientId === 'string' &&
      (value.payload.caseId === undefined ||
        typeof value.payload.caseId === 'string' ||
        typeof value.payload.caseId === 'number') &&
      typeof value.payload.commandId === 'string' &&
      isPatientMediaControlAction(value.payload.action) &&
      (value.payload.enabled === undefined || typeof value.payload.enabled === 'boolean') &&
      (value.payload.deviceId === undefined || typeof value.payload.deviceId === 'string')
    )
  }

  if (value.type === PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlState) {
    return (
      typeof value.payload.patientId === 'string' &&
      (value.payload.caseId === undefined ||
        typeof value.payload.caseId === 'string' ||
        typeof value.payload.caseId === 'number') &&
      typeof value.payload.cameraEnabled === 'boolean' &&
      typeof value.payload.micEnabled === 'boolean' &&
      typeof value.payload.cameraSwitching === 'boolean' &&
      typeof value.payload.selectedCameraId === 'string' &&
      Array.isArray(value.payload.cameraDevices) &&
      value.payload.cameraDevices.every(isPatientMediaControlDevice) &&
      (value.payload.error === undefined || typeof value.payload.error === 'string')
    )
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

export const broadcastPatientLanguageChanged = (payload: PatientLanguageChangedMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.languageChanged,
    payload
  })
}

export const broadcastReconnectFailed = (payload: ReconnectFailedMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.reconnectFailed,
    payload
  })
}

export const broadcastConsultationEnded = (payload: ConsultationEndedMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.consultationEnded,
    payload
  })
}

export const broadcastConsultationRejected = (payload: ConsultationRejectedMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.consultationRejected,
    payload
  })
}

export const broadcastPatientMediaControlCommand = (payload: PatientMediaControlCommandMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlCommand,
    payload
  })
}

export const broadcastPatientMediaControlState = (payload: PatientMediaControlStateMessage['payload']) => {
  postPatientChannelMessage({
    type: PATIENT_CHANNEL_MESSAGE_TYPES.patientMediaControlState,
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
