import request from '@/utils/request'
import type {
  DepartmentTranslateParams,
  DepartmentTranslateResponse,
  PatientDetailResponse,
  PatientSaveParams,
  PatientSaveResponse,
  PatientWsTokenResponse,
  PatientVerifyParams,
  PatientVerifyResponse,
  WrittenAddParams,
  WrittenAddResponse
} from './types'

export function verifyPatient(params: PatientVerifyParams): Promise<PatientVerifyResponse> {
  return request.get('/patient/verify', params)
}

export function savePatient(data: PatientSaveParams): Promise<PatientSaveResponse> {
  return request.post('/patient/save', data)
}

export function getPatientDetail(patientId: number | string): Promise<PatientDetailResponse> {
  return request.get(`/patient/detail/${patientId}`)
}

export function getPatientWsToken(patientId: string | number): Promise<PatientWsTokenResponse> {
  return request.get('/patient/token', { patientId }, {
    headers: {
      silentError: true
    }
  })
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
