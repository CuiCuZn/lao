import request from '@/utils/request'
import type {
  ResponseData,
  PatientPageQuery,
  PatientPageVO,
  PatientProfileForm,
  PatientProfileVO,
  PatientManageDetailVO,
  PatientVisitDetailVO
} from './types'

/**
 * 患者管理分页列表 (适配 GET /patient/list)
 * 后端 @ParameterObject 接收扁平 query 参数
 */
export function listPatient(query: PatientPageQuery): Promise<ResponseData<PatientPageVO[]>> {
  return request.get('/patient/list', query)
}

/**
 * 查询患者管理新增/修改弹窗回显数据 (适配 GET /patient/profile/{patientId})
 */
export function getPatientProfile(patientId: string | number): Promise<ResponseData<PatientProfileVO>> {
  return request.get(`/patient/profile/${patientId}`)
}

/**
 * 患者管理新增/修改患者基础资料 (适配 POST /patient/profile/save)
 */
export function savePatientProfile(data: PatientProfileForm): Promise<ResponseData<any>> {
  return request.post('/patient/profile/save', data)
}

/**
 * 查询患者管理查看详情弹窗数据 (适配 GET /patient/manage/detail/{patientId})
 */
export function getPatientManageDetail(patientId: string | number): Promise<ResponseData<PatientManageDetailVO>> {
  return request.get(`/patient/manage/detail/${patientId}`)
}

/**
 * 查询患者管理历史就诊记录查看弹窗数据 (适配 GET /patient/manage/visit/detail/{caseId})
 */
export function getPatientVisitDetail(caseId: string | number): Promise<ResponseData<PatientVisitDetailVO>> {
  return request.get(`/patient/manage/visit/detail/${caseId}`)
}

/**
 * 删除患者 (适配 POST /patient/delete/{patientId})
 */
export function deletePatient(patientId: string | number): Promise<ResponseData<any>> {
  return request.post(`/patient/delete/${patientId}`)
}
