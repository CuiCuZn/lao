import request from '@/utils/request'
import { LoginLogQuery, LoginLogVO, ResponseData } from './types'

/**
 * 查询登录日志列表 (适配：GET /monitor/logininfor/list)
 * @param query
 */
export function listLogininfor(query: LoginLogQuery): Promise<ResponseData<LoginLogVO[]>> {
  return request.get('/monitor/logininfor/list', query)
}
