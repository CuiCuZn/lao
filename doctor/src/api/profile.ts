import request from '@/utils/request'
import type { UserPasswordUpdateParams, UserProfileUpdateParams } from './types'

export function updateUserProfile(data: UserProfileUpdateParams) {
  return request.put('/system/user/profile', data)
}

export function updateUserPassword(data: UserPasswordUpdateParams) {
  return request.put('/system/user/profile/updatePwd', data)
}
