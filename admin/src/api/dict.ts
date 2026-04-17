import request from '@/utils/request'
import { DictDataVO, ResponseData } from './types'

/**
 * 根据字典类型查询字典数据
 * @param query 
 */
export function listDictData(query: { dictType: string }): Promise<ResponseData<DictDataVO[]>> {
  return request.get('/system/dict/data/list', query)
}
