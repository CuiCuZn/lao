import request from '@/utils/request'

/**
 * 查询就诊详情
 * @param caseId 
 */
export function getCaseDetail(caseId: string | number) {
  return request.get(`/case/detail/${caseId}`)
}
