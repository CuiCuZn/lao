import request from '@/utils/request'
import type { OssStsResponse } from './types'

export function getOssSts(): Promise<OssStsResponse> {
  return request.get('/oss/sts')
}
