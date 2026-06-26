import request from '@/utils/request'
import { RoleQuery, RoleVO, ResponseData } from './types'

/**
 * 新增 / 修改角色请求参数（适配 RuoYi /system/role 接口）
 */
export interface RoleFormPayload {
  roleId?: string | number
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  remark?: string
  /** 1-全部数据权限 2-自定 3-本部门 4-本部门及以下 5-仅本人 */
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  menuIds?: Array<string | number>
  deptIds?: Array<string | number>
}

/**
 * 查询角色列表
 * @param query
 */
export function listRole(query: RoleQuery): Promise<ResponseData<RoleVO[]>> {
  return request.get('/system/role/list', query)
}

/**
 * 获取角色详情
 * GET /system/role/{roleId}
 * @param roleId 角色ID
 */
export function getRoleDetail(roleId: string | number): Promise<ResponseData<RoleVO>> {
  return request.get(`/system/role/${roleId}`)
}

/**
 * 修改角色状态（启用/停用）
 * @param roleId 角色ID
 * @param status 状态：0 正常 / 1 停用
 */
export function changeRoleStatus(roleId: string | number, status: string): Promise<ResponseData<any>> {
  return request.request({
    url: '/system/role/changeStatus',
    method: 'put',
    data: { roleId, status }
  })
}

/**
 * 新增角色
 * POST /system/role
 */
export function addRole(data: RoleFormPayload): Promise<ResponseData<any>> {
  return request.post('/system/role', data)
}

/**
 * 修改角色
 * PUT /system/role
 */
export function updateRole(data: RoleFormPayload): Promise<ResponseData<any>> {
  return request.request({
    url: '/system/role',
    method: 'put',
    data
  })
}

/**
 * 删除角色
 * DELETE /system/role/{roleIds}
 * @param roleIds 角色ID，多个用逗号分隔
 */
export function delRole(roleIds: string | number): Promise<ResponseData<any>> {
  return request.request({
    url: `/system/role/${roleIds}`,
    method: 'delete'
  })
}
