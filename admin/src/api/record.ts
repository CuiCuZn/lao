import request from '@/utils/request'
import type { DiagnosisRecordQuery, DiagnosisRecordVO, ResponseData } from './types'

/**
 * 查询就诊记录列表
 * 适配：GET /case/diagnosisList
 */
export function listDiagnosisRecord(query: DiagnosisRecordQuery): Promise<ResponseData<DiagnosisRecordVO[]>> {
  return request.get('/case/diagnosisList', query)
}

/**
 * 查询就诊详情
 * @param caseId 
 */
export function getCaseDetail(caseId: string | number): Promise<ResponseData<any>> {
  return request.get(`/case/detail/${caseId}`)
}
