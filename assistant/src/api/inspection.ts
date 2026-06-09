import request from '@/utils/request'
import type {
  InspectionBatchConfirmUploadResponse,
  InspectionBatchListByBatchIdResponse,
  InspectionBatchSubmitParams,
  InspectionBatchSubmitResponse,
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
