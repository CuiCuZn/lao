import type { ConsultationMode } from '@/api/types'
import type ASR from 'dingrtc-asr'
import type { ASRMessage } from 'dingrtc-asr'
import type {
  CameraVideoTrack,
  DingRTCClient,
  LocalTrack,
  LocalVideoTrack,
  MicrophoneAudioTrack,
  RemoteAudioTrack,
  RemoteUser,
  RemoteVideoTrack
} from 'dingrtc'

export type ConsultationLanguage = 'cn' | 'lo'
export type ConsultationMessageType = 'subtitle' | 'manual'
export type ConsultationChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

export interface PatientConsultationJoinParams {
  appId: string
  appKey: string
  userId: string
  channelName: string
  userName: string
  token: string
  secondaryToken?: string
  language: ConsultationLanguage
  gslb?: string
}

export interface RtcChannelTokenResult {
  token: string
  gslb?: string[]
}

export interface ConsultationJoinRoomResult {
  primaryChannelId: string
  secondaryChannelId: string
  secondaryLanguage: ConsultationLanguage
  primaryTokenResult: RtcChannelTokenResult
  secondaryTokenResult: RtcChannelTokenResult
  primaryResult: Awaited<ReturnType<DingRTCClient['join']>>
  secondaryResult: Awaited<ReturnType<DingRTCClient['join']>>
}

export interface ConsultationTrackStats {
  mic?: boolean
  camera?: boolean
  screen?: boolean
  hasCamera?: boolean
  hasScreen?: boolean
  subscribedCamera?: boolean
  subscribedScreen?: boolean
}

export interface ConsultationParticipantView {
  userId: string
  userName: string
  track: CameraVideoTrack | LocalVideoTrack | RemoteVideoTrack | null
  muted: boolean
  speaking: boolean
  placeholderBadge: string
}

export interface ConsultationSubtitleBinding {
  asr: ASR | null
  sourceLanguage: ConsultationLanguage
  targetLanguage: ConsultationLanguage
}

export interface ConsultationRtcClients {
  primaryClient: DingRTCClient
  secondaryClient: DingRTCClient
}

export interface ConsultationStreamSubscriptionOptions {
  primaryResult: Awaited<ReturnType<DingRTCClient['join']>>
  secondaryResult: Awaited<ReturnType<DingRTCClient['join']>>
  onPrimaryAudioTrack: (track: RemoteAudioTrack) => void
  onSecondaryAudioTrack: (track: RemoteAudioTrack) => void
  onPrimaryRemoteUsersChanged: (users: RemoteUser[]) => void
  onSecondaryRemoteUsersChanged: (users: RemoteUser[]) => void
  onPrimaryTrackStatsNeeded: (uid: string) => void
  onSecondaryTrackStatsNeeded: (uid: string) => void
}

export interface ConsultationAsrRegistrationResult {
  primaryAsr: ASR
  secondaryAsr: ASR
  bindings: ConsultationSubtitleBinding[]
}

export interface ConsultationChannelContext {
  appId: string
  appKey: string
  userId: string
  userName: string
  baseChannelName: string
  primaryChannelId: string
  secondaryChannelId: string
  language: ConsultationLanguage
  secondaryLanguage: ConsultationLanguage
  token: string
}

export interface ConsultationLeaveOptions {
  keepConnectionError?: boolean
}

export interface DoctorRtcContext {
  patientName?: string
  age?: string | number
  sexText?: string
  complaint?: string
  historyIllness?: string
  previousHistory?: string
  allergichistory?: string
  familyhistory?: string
  occupation?: string
  marriage?: string
  caseId?: string | number
  videoId?: string | number
  patientId?: string | number
  doctorAideId?: string
  roomId?: string | number
  consultationMode?: ConsultationMode
}

export interface SubtitleTimelineItem {
  id: string
  speakerId: string
  speakerName: string
  side: 'self' | 'remote'
  messageType: ConsultationMessageType
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
  anchorTimestamp: number
  beginTime: number
  endTime: number
  sentenceIndex: number
  sequence: number
  speakerSequence: number
  sourceFinal: boolean
  translatedFinal: boolean
  isFinal: boolean
}

export interface ManualTimelineMessageParams {
  speakerId: string
  speakerName: string
  side: 'self' | 'remote'
  messageType?: ConsultationMessageType
  sourceText: string
  translatedText: string
  sourceLanguage?: string
  targetLanguage?: string
  timestamp?: number
}

export interface SubtitleTimelineMessageContext {
  message: ASRMessage
  sourceLanguage: string
  targetLanguage: string
}

export interface SubtitleTimelineStreamBinding {
  asr: ASR | null
  sourceLanguage: string
  targetLanguage: string
}

export interface SubtitleTimelineOptions {
  getCurrentUserId: () => string
  getCurrentUserName: () => string
  getRemoteUsers: () => RemoteUser[]
  onFinalizedItem?: (item: SubtitleTimelineItem) => void | Promise<void>
}

export interface ConsultationChatPayload {
  contentCn: string
  contentLo: string
}

export interface ConsultationChatSendParams extends ConsultationChatPayload {
  patientId: string
}

export interface ConsultationChatIncomingMessage extends ConsultationChatPayload {
  senderKey?: string
  sessionKeys?: string[]
  rawEnvelope?: unknown
}

export type ConsultationTrack = LocalTrack | CameraVideoTrack | MicrophoneAudioTrack
