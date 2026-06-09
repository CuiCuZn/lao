import request from '@/utils/request'
import type {
  CaseDrugDetailSaveParams,
  CaseDrugDetailSaveResponse,
  DrugPrescriptionListResponse,
  DrugPrescriptionQuery,
  DrugPrescriptionResponse
} from './types'

export function listDrugPrescription(query: DrugPrescriptionQuery): Promise<DrugPrescriptionListResponse> {
  return request.get('/drugPrescription/list', query, {
    headers: {
      silentError: true
    }
  })
}

export function getDrugPrescription(drugId: string | number): Promise<DrugPrescriptionResponse> {
  return request.get(`/drugPrescription/selectOne/${drugId}`, undefined, {
    headers: {
      silentError: true
    }
  })
}

export function saveCaseDrugDetail(data: CaseDrugDetailSaveParams): Promise<CaseDrugDetailSaveResponse> {
  return request.post('/caseDrugDetail/save', data)
}
