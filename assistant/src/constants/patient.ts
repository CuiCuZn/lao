export const INTAKE_PATIENT_VERIFY_DATA_KEY = 'assistant_patient_verify_data'
export const PATIENT_VIDEO_CHANNEL_NAME = 'assistant-patient-video-v1'

export const PATIENT_CHANNEL_MESSAGE_TYPES = {
  contextSync: 'PATIENT_CONTEXT_SYNC',
  videoRoomCreated: 'VIDEO_ROOM_CREATED',
  languageChanged: 'LANGUAGE_CHANGED',
  reconnectFailed: 'RECONNECT_FAILED',
  consultationEnded: 'CONSULTATION_ENDED',
  consultationRejected: 'CONSULTATION_REJECTED',
  patientMediaControlCommand: 'PATIENT_MEDIA_CONTROL_COMMAND',
  patientMediaControlState: 'PATIENT_MEDIA_CONTROL_STATE'
} as const
