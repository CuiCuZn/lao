import request from '@/utils/request'
import type {
  VideoCloseSubtitleParams,
  VideoCloseSubtitleResponse,
  VideoCreateRoomParams,
  VideoCreateRoomResponse,
  VideoGetVideoIdResponse,
  VideoOpenSubtitleParams,
  VideoOpenSubtitleResponse,
  VideoSaveSubtitleParams,
  VideoSaveSubtitleResponse,
  VideoGetTokenParams,
  VideoGetTokenResponse
} from './types'

export function createVideoRoom(data: VideoCreateRoomParams): Promise<VideoCreateRoomResponse> {
  return request.post('/video/createRoom', data)
}

export function getVideoToken(data: VideoGetTokenParams): Promise<VideoGetTokenResponse> {
  return request.get('/video/getToken', data)
}

export function getVideoId(caseId: string | number): Promise<VideoGetVideoIdResponse> {
  return request.get(`/video/getVideoId/${caseId}`, undefined, {
    headers: {
      silentError: true
    }
  })
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
