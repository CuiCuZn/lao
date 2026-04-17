import request from '@/utils/request'
import type {
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
  caseId: string | number
  diseaseNameCn: string
  syndromeTypeCn: string
  therapyCn: string
  adviceCn: string
}

export function submitDiagnosis(data: SubmitDiagnosisParams) {
  return request.post('/video/submitDiagnosis', data)
}
