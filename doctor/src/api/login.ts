import request from '@/utils/request'
import type { AxiosPromise } from 'axios'
import type { LoginData, LoginResult, TenantInfo, VerifyCodeResult, UserInfoResult } from './types'

const clientId = import.meta.env.VITE_APP_CLIENT_ID

export function login(data: LoginData): AxiosPromise<LoginResult> {
  const params = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: data.grantType || 'password'
  }

  return request.post('/auth/login', params, {
    headers: {
      isEncrypt: true,
      isToken: false
    }
  })
}

export function logout() {
  return request.post('/auth/logout')
}

export function getCodeImg(): AxiosPromise<VerifyCodeResult> {
  return request.get('/auth/code')
}

export function getInfo(): AxiosPromise<UserInfoResult> {
  return request.get('/system/user/getInfo')
}

export function getTenantList(isToken: boolean): AxiosPromise<TenantInfo> {
  return request.get('/auth/tenant/list', { isToken })
}
