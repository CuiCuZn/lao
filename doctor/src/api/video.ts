import request from '@/utils/request'
import type {
  CaseListResponse,
  GenerateMedicalRecordResponse,
  VideoCloseSubtitleParams,
  VideoCloseSubtitleResponse,
  VideoConversationHistoryResponse,
  VideoGetChannelIdResponse,
  VideoGetVideoIdResponse,
  VideoGetTokenParams,
  VideoGetTokenResponse,
  VideoOpenSubtitleParams,
  VideoOpenSubtitleResponse,
  VideoSaveSubtitleParams,
  VideoSaveSubtitleResponse
} from './types'

export function getBasicInfo(caseId: string | number) {
  return request.get(`/video/getBasicInfo/${caseId}`)
}

export function getVideoChannelId(caseId: string | number): Promise<VideoGetChannelIdResponse> {
  return request.get(`/video/getChannelId/${caseId}`)
}

export function getVideoId(caseId: string | number): Promise<VideoGetVideoIdResponse> {
  return request.get(`/video/getVideoId/${caseId}`, undefined, {
    headers: {
      silentError: true
    }
  })
}

export function getVideoConversation(videoId: string | number): Promise<VideoConversationHistoryResponse> {
  return request.get(`/video/conversation/${videoId}`, undefined, {
    headers: {
      silentError: true
    }
  })
}

export function getCaseList(patientId: string | number, caseId: string | number): Promise<CaseListResponse> {
  return request.get(`/case/list/${patientId}/${caseId}`, undefined, {
    headers: {
      silentError: true
    }
  })
}

export function generateMedicalRecord(caseId: string | number): Promise<GenerateMedicalRecordResponse> {
  return request.post(`/case/generateMedicalRecord/${caseId}`, undefined, {
    headers: {
      silentError: true,
      successCodes: '0,200'
    }
  })
}

export function getVideoToken(data: VideoGetTokenParams): Promise<VideoGetTokenResponse> {
  return request.get('/video/getToken', data)
}

export function openVideoSubtitle(data: VideoOpenSubtitleParams): Promise<VideoOpenSubtitleResponse> {
  return request.post('/video/openSubtitle', data)
}

export function closeVideoSubtitle(data: VideoCloseSubtitleParams): Promise<VideoCloseSubtitleResponse> {
  return request.post('/video/closeSubtitle', data)
}

export function saveSubtitle(data: VideoSaveSubtitleParams): Promise<VideoSaveSubtitleResponse> {
  return request.post('/videoRecord/saveSubtitle', data, {
    headers: {
      silentError: true
    }
  })
}

export interface SubmitDiagnosisParams {
  caseId: number
  doctorAideId?: string
  diseaseNameCn: string
  syndromeTypeCn: string
  therapyCn: string
  adviceCn: string
  mainSuitCn: string
  historyIllnessCn: string
  previousHistoryCn: string
  allergichistoryCn: string
  familyhistoryCn: string
}

export function submitDiagnosis(data: SubmitDiagnosisParams) {
  return request.post('/video/submitDiagnosis', data)
}
