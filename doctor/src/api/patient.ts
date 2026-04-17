import request from '@/utils/request'
import type {
  DepartmentTranslateParams,
  DepartmentTranslateResponse,
  WrittenAddParams,
  WrittenAddResponse
} from './types'

export function getPatientDetail(patientId: string | number) {
  return request.get(`/patient/detail/${patientId}`)
}

export function translateConsultationText(
  params: DepartmentTranslateParams
): Promise<DepartmentTranslateResponse> {
  return request.get('/department/translate', params, {
    headers: {
      silentError: true
    }
  })
}

export function addWrittenRecord(data: WrittenAddParams): Promise<WrittenAddResponse> {
  return request.post('/written/add', data, {
    headers: {
      silentError: true
    }
  })
}
