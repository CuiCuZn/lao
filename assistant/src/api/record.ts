import request from '@/utils/request'
import type { CaseDetailResponse, CaseRecordListParams, CaseRecordListResponse } from './types'

const buildCaseRecordQueryConfig = () => ({
  headers: {
    silentError: true,
    successCodes: '0,200'
  },
  paramsSerializer: {
    serialize: (params: any) => {
      const searchParams = new URLSearchParams()
      searchParams.set('searchInfo', String(params?.searchInfo ?? ''))
      searchParams.set('checkInfo', String(params?.checkInfo ?? -1))
      searchParams.set('pageSize', String(params?.pageSize ?? 20))
      searchParams.set('pageNum', String(params?.pageNum ?? 1))
      return searchParams.toString()
    }
  }
})

export function getCaseRecordList(data: CaseRecordListParams): Promise<CaseRecordListResponse> {
  return request.get('/case/case/record', data, buildCaseRecordQueryConfig())
}

export function getUndoneCaseList(data: CaseRecordListParams): Promise<CaseRecordListResponse> {
  return request.get('/case/case/undone/list', data, buildCaseRecordQueryConfig())
}

export function getCaseDetail(caseId: string | number): Promise<CaseDetailResponse> {
  return request.get(`/case/detail/${caseId}`, undefined, {
    headers: {
      silentError: true,
      successCodes: '0,200'
    }
  })
}
