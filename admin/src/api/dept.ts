import request from '@/utils/request'
import { DeptQuery, DeptForm, DeptVO, ResponseData } from './types'

/**
 * 查询科室列表 (适配：GET /department/list)
 * @param query 
 */
export function listDept(query: DeptQuery): Promise<ResponseData<DeptVO[]>> {
  return request.get('/department/list', query)
}

/**
 * 通过主键查询单条数据 (适配：GET /department/selectOne/{departmentId})
 * @param departmentId 
 */
export function getDept(departmentId: string | number): Promise<ResponseData<DeptForm>> {
  return request.get(`/department/selectOne/${departmentId}`)
}

/**
 * 新增数据 (适配：POST /department/add)
 * @param data 
 */
export function addDept(data: DeptForm): Promise<ResponseData<any>> {
  return request.post('/department/add', data)
}

/**
 * 修改数据 (适配：POST /department/edit)
 * @param data 
 */
export function updateDept(data: DeptForm): Promise<ResponseData<any>> {
  return request.post('/department/edit', data)
}

/**
 * 停用科室 (适配：POST /department/delete/{departmentId})
 * @param departmentId 
 */
export function delDept(departmentId: string | number): Promise<ResponseData<any>> {
  return request.post(`/department/delete/${departmentId}`)
}

/**
 * 删除科室 (适配：DELETE /department/remove/{departmentId})
 * @param departmentId 
 */
export function removeDept(departmentId: string | number): Promise<ResponseData<any>> {
  return request.request({
    url: `/department/remove/${departmentId}`,
    method: 'post'
  })
}

/**
 * 切换科室状态 (适配后端业务：通常通过 edit 或 delete 接口控制状态)
 * 如果后端没有显式的 changeStatus，则复用 updateDept (edit)
 * @param data 
 */
export function changeDeptStatus(data: Partial<DeptForm>): Promise<ResponseData<any>> {
  return request.post('/department/edit', data)
}
