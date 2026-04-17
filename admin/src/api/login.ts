import request from '@/utils/request'
import { AxiosPromise } from 'axios'
import { LoginData, LoginResult, VerifyCodeResult, TenantInfo } from './types'

// pc端默认客户端授权id
const clientId = import.meta.env.VITE_APP_CLIENT_ID

/**
 * 用户登录
 * 特别要求：
 * 1. 添加 isEncrypt: true 以触发加密流程。
 * 2. 添加 isLogin: true 以在拦截器中使用写死的 encrypt-key 请求头。
 * 3. 接口传参将被加密为一串密文字符串。
 */
export function login(data: LoginData): AxiosPromise<LoginResult> {
  const params = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: data.grantType || 'password'
  }
  return request.post('/auth/login', params, {
    headers: {
      isEncrypt: true, // 开启加密标志
      isToken: false
    }
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request.post('/auth/logout')
}

/**
 * 获取验证码
 */
export function getCodeImg(): AxiosPromise<VerifyCodeResult> {
  return request.get('/auth/code')
}

/**
 * 获取用户信息
 */
export function getInfo(): AxiosPromise<any> {
  return request.get('/system/user/getInfo')
}

/**
 * 获取租户列表
 */
export function getTenantList(isToken: boolean): AxiosPromise<TenantInfo> {
  return request.get('/auth/tenant/list', { isToken })
}
