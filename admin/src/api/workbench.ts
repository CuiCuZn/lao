import request from '@/utils/request'
import type {
  ResponseData,
  WorkbenchOverviewVO,
  WorkbenchTrendVO,
  WorkbenchDeptDistributionVO,
  WorkbenchDoctorRankingVO,
  WorkbenchRecentVisitVO
} from './types'

/**
 * 工作台顶部总览数据 (适配 GET /workbench/overview)
 */
export function getWorkbenchOverview(): Promise<ResponseData<WorkbenchOverviewVO>> {
  return request.get('/workbench/overview')
}

/**
 * 工作台近 7 天接诊趋势 (适配 GET /workbench/reception-trend)
 */
export function getWorkbenchTrend(): Promise<ResponseData<WorkbenchTrendVO[]>> {
  return request.get('/workbench/reception-trend')
}

/**
 * 工作台今日科室分布 (适配 GET /workbench/department-distribution)
 */
export function getWorkbenchDeptDistribution(): Promise<ResponseData<WorkbenchDeptDistributionVO[]>> {
  return request.get('/workbench/department-distribution')
}

/**
 * 工作台今日医生排行 TOP5 (适配 GET /workbench/doctor-ranking)
 */
export function getWorkbenchDoctorRanking(): Promise<ResponseData<WorkbenchDoctorRankingVO[]>> {
  return request.get('/workbench/doctor-ranking')
}

/**
 * 工作台最近就诊列表 (适配 GET /workbench/recent-visits)
 */
export function getWorkbenchRecentVisits(): Promise<ResponseData<WorkbenchRecentVisitVO[]>> {
  return request.get('/workbench/recent-visits')
}
