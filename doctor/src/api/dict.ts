import request from '@/utils/request'
import type { DictDataListResponse } from './types'

export function listDictData(query: { dictType: string }): Promise<DictDataListResponse> {
  return request.get('/system/dict/data/list', query)
}
