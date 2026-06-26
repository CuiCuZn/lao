import request from '@/utils/request'
import { OperLogQuery, OperLogVO, ResponseData } from './types'

/**
 * 查询操作日志列表 (适配：GET /monitor/operlog/list)
 * @param query
 */
export function listOperlog(query: OperLogQuery): Promise<ResponseData<OperLogVO[]>> {
  return request.get('/monitor/operlog/list', query)
}
