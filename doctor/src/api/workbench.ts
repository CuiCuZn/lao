import request from '@/utils/request'
import type { CurrentReceptionListResponse, DiagnosisStatsResponse } from './types'

export function switchWorkbenchOnlineStatus() {
  return request.post('/system/user/switch')
}

export function getDepartmentList() {
  return request.get('/department/list')
}

export function getDiagnosisStats(): Promise<DiagnosisStatsResponse> {
  return request.get('/case/diagnosisStats')
}

export function getCurrentReceptionList(): Promise<CurrentReceptionListResponse> {
  return request.get('/case/currentReceptionList')
}
