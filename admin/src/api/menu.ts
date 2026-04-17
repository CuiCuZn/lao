import request from '@/utils/request'

/**
 * 获取路由数据
 * @returns {Promise<any>}
 */
export const getRouters = () => {
  return request.get('/system/menu/getRouters')
}
