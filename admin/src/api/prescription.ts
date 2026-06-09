import request from '@/utils/request'
import type { DrugPrescriptionForm, DrugPrescriptionQuery, DrugPrescriptionVO, ResponseData } from './types'

/**
 * 查询处方列表
 * 适配：GET /drugPrescription/list
 */
export function listDrugPrescription(query: DrugPrescriptionQuery): Promise<ResponseData<DrugPrescriptionVO[]>> {
  return request.get('/drugPrescription/list', query)
}

/**
 * 查询处方详情
 * 适配：GET /drugPrescription/selectOne/{drugId}
 */
export function getDrugPrescription(drugId: string | number): Promise<ResponseData<DrugPrescriptionVO>> {
  return request.get(`/drugPrescription/selectOne/${drugId}`)
}

/**
 * 新增/编辑处方
 * 适配：POST /drugPrescription/save
 */
export function saveDrugPrescription(data: DrugPrescriptionForm): Promise<ResponseData<any>> {
  return request.post('/drugPrescription/save', data)
}

/**
 * 删除处方
 * 适配：POST /drugPrescription/remove/{drugId}
 */
export function removeDrugPrescription(drugId: string | number): Promise<ResponseData<any>> {
  return request.post(`/drugPrescription/remove/${drugId}`)
}
