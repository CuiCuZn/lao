import request from '@/utils/request'
import type { ResponseData, OssStsData } from './types'

/**
 * 获取 OSS 上传临时凭证 (适配 GET /oss/sts)
 */
export function getOssSts(): Promise<ResponseData<OssStsData>> {
  return request.get('/oss/sts')
}
