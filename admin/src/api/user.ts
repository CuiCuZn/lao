import request from '@/utils/request'
import { UserQuery, UserForm, UserVO, ResponseData } from './types'

/**
 * 查询用户列表 (医生管理适配)
 * @param query 
 */
export function listUser(query: UserQuery): Promise<ResponseData<UserVO[]>> {
  return request.get('/system/user/list', query)
}

/**
 * 查询用户详细信息 (带可选 ID，不传 ID 获取新增用户所需元数据)
 * @param userId 
 */
export function getUser(userId?: string | number): Promise<ResponseData<any>> {
  return request.get(userId ? `/system/user/${userId}` : '/system/user/')
}

/**
 * 新增用户
 * @param data 
 */
export function addUser(data: UserForm): Promise<ResponseData<any>> {
  return request.post('/system/user', data)
}

/**
 * 修改用户
 * @param data 
 */
export function updateUser(data: UserForm): Promise<ResponseData<any>> {
  return request.request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

/**
 * 删除用户
 * @param userId 
 */
export function delUser(userId: string | number | (string | number)[]): Promise<ResponseData<any>> {
  return request.request({
    url: `/system/user/${userId}`,
    method: 'delete'
  })
}

/**
 * 修改用户状态
 * @param userId 
 * @param status 
 */
export function changeUserStatus(userId: string | number, status: string): Promise<ResponseData<any>> {
  const data = {
    userId,
    status
  }
  return request.request({
    url: '/system/user/changeStatus',
    method: 'put',
    data: data
  })
}

/**
 * 重置密码
 * @param userId 
 * @param password 
 */
export function resetUserPwd(userId: string | number, password: string): Promise<ResponseData<any>> {
  const data = {
    userId,
    password
  }
  return request.request({
    url: '/system/user/resetPwd',
    method: 'put',
    data: data
  })
}
