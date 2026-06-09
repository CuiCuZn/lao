import request from '@/utils/request'
import type {
  CaseDrugDetailResponse,
  InspectionBatchListByBatchIdResponse,
  InspectionBatchListByCaseIdResponse
} from './types'

/**
 * 查询就诊详情
 * @param caseId 
 */
export function getCaseDetail(caseId: string | number) {
  return request.get(`/case/detail/${caseId}`)
}

/**
 * 查询就诊处方详情
 * @param caseId
 */
export function getCaseDrugDetail(caseId: string | number): Promise<CaseDrugDetailResponse> {
  return request.get(`/caseDrugDetail/${caseId}`, undefined, {
    headers: {
      silentError: true,
      successCodes: '0,200'
    }
  })
}

/**
 * 查询病例检查报告列表
 * @param caseId
 */
export function getInspectionBatchByCaseId(caseId: string | number): Promise<InspectionBatchListByCaseIdResponse> {
  return request.get('/inspection/batch/listByCaseId', { caseId }, {
    headers: {
      silentError: true,
      successCodes: '0,200'
    }
  })
}

/**
 * 查询检查报告批次结果
 * @param batchId
 */
export function getInspectionBatchByBatchId(batchId: string | number): Promise<InspectionBatchListByBatchIdResponse> {
  return request.get('/inspection/batch/listByBatchId', { batchId }, {
    headers: {
      silentError: true,
      successCodes: '0,200'
    }
  })
}
