import request from '@/utils/request'
import type {
  InspectionBatchConfirmUploadResponse,
  InspectionBatchListByBatchIdResponse,
  InspectionBatchListByCaseIdResponse,
  InspectionBatchSubmitParams,
  InspectionBatchSubmitResponse,
  InspectionReportDeleteResponse,
  InspectionReportSaveItemsParams,
  InspectionReportSaveItemsResponse
} from './types'

const buildInspectionRequestConfig = (params?: Record<string, unknown>) => ({
  headers: {
    silentError: true,
    successCodes: '0,200'
  },
  ...(params ? { params } : {})
})

export function submitInspectionBatch(data: InspectionBatchSubmitParams): Promise<InspectionBatchSubmitResponse> {
  return request.post('/inspection/batch/submit', data, buildInspectionRequestConfig())
}

export function getInspectionBatchByBatchId(batchId: string | number): Promise<InspectionBatchListByBatchIdResponse> {
  return request.get('/inspection/batch/listByBatchId', { batchId }, buildInspectionRequestConfig())
}

export function getInspectionBatchByCaseId(caseId: string | number): Promise<InspectionBatchListByCaseIdResponse> {
  return request.get('/inspection/batch/listByCaseId', { caseId }, buildInspectionRequestConfig())
}

export function retryInspectionBatch(batchId: string | number): Promise<InspectionBatchSubmitResponse> {
  return request.post('/inspection/batch/retry', undefined, buildInspectionRequestConfig({ batchId }))
}

export function confirmInspectionBatchUpload(batchId: string | number): Promise<InspectionBatchConfirmUploadResponse> {
  return request.post('/inspection/batch/confirmUpload', undefined, buildInspectionRequestConfig({ batchId }))
}

export function saveInspectionReportItems(
  data: InspectionReportSaveItemsParams
): Promise<InspectionReportSaveItemsResponse> {
  return request.post('/inspection/report/saveItems', data, buildInspectionRequestConfig())
}

export function deleteInspectionReport(reportId: string | number): Promise<InspectionReportDeleteResponse> {
  return request.post('/inspection/report/delete', undefined, buildInspectionRequestConfig({ reportId }))
}
